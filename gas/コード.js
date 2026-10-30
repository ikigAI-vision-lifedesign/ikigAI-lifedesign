/**
 * ikigAI 新バックエンド（Gemini版）  会社アカウント用
 * ============================================================
 * 学生版の高品質な指示文ロジックをそのまま引き継ぎ、
 * ・Geminiキーは「APIキー台帳スプレッドシートの gemini タブ」から複数本対応
 * ・パスコードは「settings タブ」から読み、サーバー側で照合（再デプロイ不要で変更可）
 * ・死んだキーは自動スキップ＆自動復活
 * を追加したもの。Vercel / Supabase には依存しない。
 *
 * ■ スクリプトプロパティ
 *   SPREADSHEET_ID       … 記録用スプレッドシートID（vision_boards / feedbacks / prompt_settings）
 *   DRIVE_FOLDER_ID      … 生成画像の保存先DriveフォルダID
 *   KEYS_SPREADSHEET_ID  … APIキー台帳スプレッドシートID（gemini / settings タブを持つ）
 *   KEYS_SHEET_NAME      … キーのタブ名（省略時 "gemini"）
 *   SETTINGS_SHEET_NAME  … パスコード保管の隠しタブ名（省略時 "_secret"）
 *   SEND_EMAIL           … "true" のときだけ完成メールを送る（省略時は送らない）
 * ============================================================
 */

// デプロイ確認用バージョン。コードを更新してデプロイするたびに日付や番号を上げる。
// → ?action=health で現在デプロイ中の版が確認できる（例: 2026-10-17-1）。
var BACKEND_VERSION = "2026-10-23-1";

var GEMINI_MODEL = "gemini-3.1-flash-image-preview";
var GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent";

var MAX_RETRIES = 5;
var RETRY_WAIT_MS = 10000;
var SKIP_SECONDS_DEAD = 3600; // 無効キーを避ける時間
var SKIP_SECONDS_RATE = 300;  // レート制限キーを避ける時間
var GEN_STATS = {};           // 直近の生成の計測（Gemini試行回数・429待ち回数・使用可能キー数）

// ====== 入口 ======

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) { return createJsonResponse({ status: "ok" }); }

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "health";
  if (action === "health") {
    return createJsonResponse({ status: "ok", version: BACKEND_VERSION, message: "Vision Board Gemini backend (company) is running." });
  }
  return createJsonResponse({ status: "error", message: "Unknown action: " + action });
}

function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (parseErr) {
    return createJsonResponse({ status: "error", message: "リクエストのJSON解析に失敗しました" });
  }
  var action = data.action || "generate";
  try {
    if (action === "verifyPasscode") return handleVerifyPasscode(data);
    if (action === "feedback") return handleFeedback(data);
    return handleGenerate(data);
  } catch (error) {
    Logger.log("Error: " + error);
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// ====== パスコード（settings タブで管理・サーバー側照合） ======

function handleVerifyPasscode(data) {
  var correct = readSetting("passcode");
  var ok = correct !== "" && String(data.code || "") === String(correct);
  if (!ok) return createJsonResponse({ status: "success", valid: false });
  // 合格したら「使い捨てトークン」を発行。以降の生成はこのトークンが必要（パスコード再入力は不要）。
  return createJsonResponse({ status: "success", valid: true, token: mintToken() });
}

// ====== 認証トークン & レート制限（CacheServiceで管理） ======

var TOKEN_TTL_SEC = 21600; // トークン有効時間（6時間）

function mintToken() {
  var token = Utilities.getUuid();
  try { CacheService.getScriptCache().put("tok_" + token, "1", TOKEN_TTL_SEC); } catch (e) {}
  return token;
}
function isValidToken(token) {
  if (!token) return false;
  try { return CacheService.getScriptCache().get("tok_" + String(token)) === "1"; }
  catch (e) { return false; }
}
function getTokenCount(token) {
  try { return Number(CacheService.getScriptCache().get("cnt_" + String(token)) || 0); }
  catch (e) { return 0; }
}
function incrementTokenCount(token) {
  try { CacheService.getScriptCache().put("cnt_" + String(token), String(getTokenCount(token) + 1), TOKEN_TTL_SEC); } catch (e) {}
}
function maxPerToken() { return Number(getProp("MAX_PER_TOKEN") || 30); }

/** 全体の1分あたり試行数を予約。上限超過なら false（＝今は生成させない）。 */
function reserveOverallSlot() {
  try {
    var key = "all_" + Math.floor(Date.now() / 60000);
    var cache = CacheService.getScriptCache();
    var cur = Number(cache.get(key) || 0);
    if (cur >= Number(getProp("MAX_PER_MIN") || 50)) return false;
    cache.put(key, String(cur + 1), 120);
    return true;
  } catch (e) { return true; } // キャッシュ障害時は止めない
}

/** _secret タブ（A=項目, B=値）から値を読む（本物のパスコードはここに保管） */
function readSetting(key) {
  var ssId = getProp("KEYS_SPREADSHEET_ID");
  if (!ssId) return "";
  var name = getProp("SETTINGS_SHEET_NAME") || "_secret";
  var sh = SpreadsheetApp.openById(ssId).getSheetByName(name);
  if (!sh) return "";
  var values = sh.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === key) return String(values[i][1]).trim();
  }
  return "";
}

// ====== 生成（本体） ======

function handleGenerate(data) {
  // ① 認証：ログイン時に発行したトークンが必要（外部からの直接連打を防ぐ）
  if (!isValidToken(data.token)) {
    return createJsonResponse({ status: "error", code: "auth", message: "認証が切れました。最初からやり直してください。" });
  }

  // ★ 冪等化：同じ genId の再リクエストは「すでに作った画像」をそのまま返す。
  //   （通信切れでの再試行・ブラウザバックなどで二重生成・二重メールしないため。
  //    制限カウントもしないよう、上限チェックより前で返す）
  var genId = data.genId ? String(data.genId) : "";
  if (genId) {
    var cachedGen = getCachedGen(genId);
    if (cachedGen) {
      return createJsonResponse({
        status: "success",
        imageUrl: driveImageUrl(cachedGen.fileId),
        drivePageUrl: cachedGen.drivePageUrl,
        fileId: cachedGen.fileId,
        fileName: cachedGen.fileName,
        cached: true
      });
    }
  }

  // ② 1人(トークン)あたりの上限（成功数ベース）
  if (getTokenCount(data.token) >= maxPerToken()) {
    return createJsonResponse({ status: "error", code: "limit", message: "生成回数の上限に達しました。" });
  }
  // ② 全体の1分あたり上限（混雑・連打の歯止め）
  if (!reserveOverallSlot()) {
    return createJsonResponse({ status: "error", code: "busy", message: "ただいま混雑しています。少し待ってもう一度お試しください。" });
  }

  var spreadsheetId = getScriptPropertyOrThrow("SPREADSHEET_ID");
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName("vision_boards");
  if (!sheet) throw new Error("シート「vision_boards」が見つかりません。");

  // prompt_settings タブの運営ルールを上乗せ（空 or タブ無しなら土台だけ＝デフォルト品質）
  var overlay = readPromptSettingsOverlay(ss);
  var finalPrompt = buildVisionBoardPrompt(overlay, data);

  // お気に入りの写真（任意）：参照画像として本人に似せる
  var photoPart = buildPhotoPart(data.photo);
  if (photoPart) {
    finalPrompt += "\n\nReference photo:\n" +
      "- A reference photo of the person is provided as an additional image input.\n" +
      "- Make the central person clearly resemble that person: facial features, hairstyle, and overall body build / physique.\n" +
      "- Render them in the chosen illustration style (a stylized, flattering likeness, not a photorealistic copy or a traced photo).\n" +
      "- Use only the main person in the photo; ignore any background or other people.";
  }

  // --- 計測：各工程の所要時間を測る（原因切り分け用） ---
  var _t0 = Date.now();

  var _tg0 = Date.now();
  var geminiResponse = generateImageWithGemini(finalPrompt, photoPart);
  var _geminiMs = Date.now() - _tg0;

  var inlineData = extractImageInlineData(geminiResponse);
  var imageBlob = createBlobFromInlineData(inlineData);

  var _td0 = Date.now();
  var driveInfo = saveBlobToDrive(imageBlob);
  var _driveMs = Date.now() - _td0;

  if (getProp("SEND_EMAIL") === "true") {
    try { sendImageByEmailBlob(imageBlob, data.email, data.fullName, data.lang); }
    catch (mailErr) { Logger.log("メール送信エラー: " + mailErr); }
  }

  // ★ 冪等化キャッシュに保存（同じ genId の再試行はこれを返す＝再生成しない）
  if (genId) {
    try { putCachedGen(genId, driveInfo); } catch (cacheErr) { Logger.log("冪等キャッシュ保存エラー: " + cacheErr); }
  }

  // ★ ここまでで「画像生成・Drive保存（＋メール）」は完了＝実質“成功”。
  //   以降の記録（スプレッドシート記録・カウント・計測ログ）は、
  //   イベント混雑時のロック待ちなどで失敗することがあるが、
  //   それで「失敗」を返すと二重生成になるため、必ず握りつぶして成功を返す。
  var _sheetMs = 0;
  try {
    var _ts0 = Date.now();
    appendVisionBoardRow(sheet, data, driveInfo, finalPrompt);
    _sheetMs = Date.now() - _ts0;
  } catch (recErr) { Logger.log("記録エラー(vision_boards): " + recErr); }

  // 成功したときだけ、この人のカウントを+1（失敗はノーカウント）
  try { incrementTokenCount(data.token); } catch (cntErr) { Logger.log("カウントエラー: " + cntErr); }

  // 計測結果を gen_log タブに記録（無ければ自動作成）
  try {
    logGenTiming(ss, data, {
      geminiMs: _geminiMs, driveMs: _driveMs, sheetMs: _sheetMs, totalMs: Date.now() - _t0
    });
  } catch (logErr) { Logger.log("計測ログエラー: " + logErr); }

  return createJsonResponse({
    status: "success",
    imageUrl: driveImageUrl(driveInfo.fileId),  // base64ではなく軽いDrive画像URL（スマホ対策）
    drivePageUrl: driveInfo.drivePageUrl,
    fileId: driveInfo.fileId,
    fileName: driveInfo.fileName
  });
}

/** data:URL（例 data:image/jpeg;base64,xxx）を Gemini の画像パートに変換。不正なら null。 */
function buildPhotoPart(photo) {
  if (!photo || typeof photo !== "string") return null;
  var m = photo.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!m) return null;
  return { inline_data: { mime_type: m[1], data: m[2] } };
}

/** Gemini 呼び出し（gemini タブの複数キーを回す。429=待って再試行、無効キー=スキップ）
 *  photoPart があれば参照画像として一緒に送る（本人に似せるため）。 */
function generateImageWithGemini(prompt, photoPart) {
  var keys = getApiKeys();
  if (keys.length === 0) throw new Error("使用可能なGeminiキーがありません（gemini タブを確認）");
  GEN_STATS = { keys: keys.length, attempts: 0, waits429: 0 };

  var parts = [{ text: prompt }];
  if (photoPart) parts.push(photoPart);

  var payload = {
    contents: [{ parts: parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "9:16", imageSize: "1K" }
    }
  };

  var start = Math.floor(Math.random() * keys.length);
  var maxAttempts = Math.max(keys.length * 2, MAX_RETRIES);
  var lastError = "";

  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    var apiKey = keys[(start + attempt) % keys.length];
    GEN_STATS.attempts++;
    try {
      var response = UrlFetchApp.fetch(GEMINI_API_URL, {
        method: "post",
        contentType: "application/json",
        headers: { "x-goog-api-key": apiKey },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      var statusCode = response.getResponseCode();
      var responseText = response.getContentText();

      if (statusCode < 400) return JSON.parse(responseText);

      var parsed; try { parsed = JSON.parse(responseText); } catch (e) { parsed = {}; }
      var errStatus = parsed.error && parsed.error.status ? parsed.error.status : ("HTTP " + statusCode);
      lastError = errStatus;

      if (statusCode === 429 || errStatus === "RESOURCE_EXHAUSTED") {
        GEN_STATS.waits429++;
        skipKey(apiKey, SKIP_SECONDS_RATE); Utilities.sleep(RETRY_WAIT_MS); continue; // 混雑/上限 → 待って次へ
      }
      if (statusCode === 400 || statusCode === 403 ||
          errStatus === "PERMISSION_DENIED" || errStatus === "INVALID_ARGUMENT") {
        skipKey(apiKey, SKIP_SECONDS_DEAD); continue; // 無効キー等 → 長くスキップ、次へ
      }
      continue; // その他 → 次のキーで試す
    } catch (e) {
      lastError = String(e); Utilities.sleep(2000);
    }
  }
  throw new Error("Gemini画像生成に失敗しました（最後のエラー: " + lastError + "）");
}

/** Gemini レスポンスから画像の inlineData を取り出す */
function extractImageInlineData(geminiResponse) {
  var candidates = geminiResponse.candidates || [];
  for (var i = 0; i < candidates.length; i++) {
    var parts = (candidates[i] && candidates[i].content && candidates[i].content.parts) || [];
    for (var j = 0; j < parts.length; j++) {
      if (parts[j].inlineData && parts[j].inlineData.data) {
        return { mimeType: parts[j].inlineData.mimeType || "image/png", data: parts[j].inlineData.data };
      }
    }
  }
  throw new Error("Geminiのレスポンスに画像データが含まれていません。");
}

// ====== Blob / Drive / Mail ======

function createBlobFromInlineData(inlineData) {
  var extension = inlineData.mimeType === "image/jpeg" ? "jpg" : "png";
  var fileName = "AI_VisionBoard_" +
    Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMdd_HHmmss") + "." + extension;
  var bytes = Utilities.base64Decode(inlineData.data);
  return Utilities.newBlob(bytes, inlineData.mimeType, fileName);
}

function buildDataUrlFromInlineData(inlineData) {
  return "data:" + inlineData.mimeType + ";base64," + inlineData.data;
}

function saveBlobToDrive(blob) {
  var folder = DriveApp.getFolderById(getScriptPropertyOrThrow("DRIVE_FOLDER_ID"));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { fileId: file.getId(), drivePageUrl: file.getUrl(), fileName: file.getName() };
}

// ====== 冪等化（genIdごとに生成結果をキャッシュ） ======

function getCachedGen(genId) {
  try {
    var v = CacheService.getScriptCache().get("gen_" + genId);
    return v ? JSON.parse(v) : null;
  } catch (e) { return null; }
}
function putCachedGen(genId, driveInfo) {
  CacheService.getScriptCache().put(
    "gen_" + genId,
    JSON.stringify({ fileId: driveInfo.fileId, drivePageUrl: driveInfo.drivePageUrl, fileName: driveInfo.fileName }),
    21600 // 6時間
  );
}
// Driveのファイルから data: URL を作り直す（※現在は未使用。軽量URL方式に変更）
function buildDataUrlFromDriveFile(fileId) {
  var blob = DriveApp.getFileById(fileId).getBlob();
  return "data:" + (blob.getContentType() || "image/png") + ";base64," + Utilities.base64Encode(blob.getBytes());
}

// 画像表示用の“軽い”URL（公開済みDriveファイルを直接表示）。
// 数MBのbase64をレスポンスに載せるとスマホで受信失敗しやすいため、これを返す。
function driveImageUrl(fileId) {
  return "https://lh3.googleusercontent.com/d/" + fileId + "=w1600";
}

var MAIL_FROM = "info@ikigai-vision.com";   // 送付元（※下の注意参照：送信元エイリアス登録が必要）
var MAIL_SENDER_NAME = "ikigAI株式会社";    // 送信者の表示名

function sendImageByEmailBlob(imageBlob, recipient, recipientName, lang) {
  if (!recipient) { Logger.log("メールアドレスが空のためスキップ。"); return; }
  var c = buildEmailContent(recipientName, lang);

  // まず差出人を MAIL_FROM(info@) にして送信を試みる。
  // ※ GmailApp.getAliases() は Workspace の送信エイリアスを取りこぼすことがあるため、
  //   「一覧で確認してから付ける」方式をやめ、「直接 from を付けて送る → 失敗したら from 無しで再送」
  //   にする。送信エイリアスが（確認済みで）有効なら、一覧の結果に関係なく info@ で送れる。
  try {
    GmailApp.sendEmail(recipient, c.subject, c.body, {
      attachments: [imageBlob],
      name: MAIL_SENDER_NAME,
      from: MAIL_FROM
    });
    return;
  } catch (fromErr) {
    var eff = "";
    try { eff = Session.getEffectiveUser().getEmail(); } catch (e2) {}
    Logger.log("from=" + MAIL_FROM + " で送信できませんでした（実行アカウント " + eff + " のアドレスで送信します）: " + fromErr);
  }

  // フォールバック：info@ が send-as として使えない場合は、実行アカウントのアドレスで送信。
  GmailApp.sendEmail(recipient, c.subject, c.body, {
    attachments: [imageBlob],
    name: MAIL_SENDER_NAME
  });
}

// 【メール送信元の診断】GASエディタでこの関数を選んで「実行」→「実行ログ」を見る。
// 実行アカウントが送信できるエイリアス一覧と、MAIL_FROM が一致するかを表示する。
// ・実行アカウント が info@ を持つ本人か（＝Webアプリの『次のユーザーとして実行』と同じか）
// ・送信可能エイリアス に info@ikigai-vision.com が「完全一致」で含まれるか
// ここに info@ が出てこない＝from が付かず、オーナー個人アドレスで送られている原因。
function logAliases() {
  var me = "";
  try { me = Session.getActiveUser().getEmail(); } catch (e) { me = "(取得不可)"; }
  var aliases = [];
  try { aliases = GmailApp.getAliases(); } catch (e) { Logger.log("getAliases エラー: " + e); }
  Logger.log("実行アカウント: " + me);
  Logger.log("送信可能エイリアス: " + JSON.stringify(aliases));
  Logger.log("MAIL_FROM = " + MAIL_FROM);
  Logger.log("完全一致で含まれる? " + (aliases.indexOf(MAIL_FROM) !== -1));
}

// メール文面（15言語）。{NAME}=受信者名, {LINE}/{CONTACT}/{SITE}=各URL, {DIV}=区切り線 を差し込む。
var MAIL_I18N = {
  "ja": { fallbackName: "お客",
    subject: "【ikigAI】AIビジョンボードが完成しました",
    body: "{NAME}様\n\nこのたびはikigAIをご利用いただき、誠にありがとうございます。\nオリジナルの「AIビジョンボード」をお届けいたします。\n\n※画像を保存してご活用ください。\n\nこのビジョンを「見るだけ」で終わらせないために、\nLINEで実現のヒントをお届けしています。\n▷LINE登録：{LINE}\n\n{DIV}\n\n\n法人・団体でのお問い合わせはこちら：{CONTACT}\n\nikigAI株式会社\n次世代が自分らしく生きられる世界へ\n{SITE}\n\n{DIV}" },
  "hiragana": { fallbackName: "おきゃく",
    subject: "【ikigAI】AIびじょんぼーどが かんせいしました",
    body: "{NAME}さま\n\nこのたびは ikigAI を ごりよういただき、まことに ありがとうございます。\nあなただけの「AIびじょんぼーど」を おとどけします。\n\n※がぞうを ほぞんして ごかつようください。\n\nこの びじょんを「みるだけ」で おわらせないために、\nLINEで じつげんの ひんとを おとどけしています。\n▷LINEとうろく：{LINE}\n\n{DIV}\n\n\nほうじん・だんたいでの おといあわせは こちら：{CONTACT}\n\nikigAI かぶしきがいしゃ\nじせだいが じぶんらしく いきられる せかいへ\n{SITE}\n\n{DIV}" },
  "en": { fallbackName: "Customer",
    subject: "[ikigAI] Your AI Vision Board is ready",
    body: "Dear {NAME},\n\nThank you for using ikigAI.\nHere is your original \"AI Vision Board\".\n\n* Please save the image and make the most of it.\n\nTo turn this vision into reality (not just something to look at),\nwe share tips on LINE.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nFor business / group inquiries: {CONTACT}\n\nikigAI Inc.\nToward a world where the next generation can live as themselves\n{SITE}\n\n{DIV}" },
  "ko": { fallbackName: "고객",
    subject: "[ikigAI] AI 비전보드가 완성되었습니다",
    body: "{NAME}님\n\nikigAI를 이용해 주셔서 진심으로 감사합니다.\n나만의 'AI 비전보드'를 보내드립니다.\n\n※ 이미지를 저장하여 활용해 주세요.\n\n이 비전을 '보기만' 하고 끝내지 않도록,\nLINE에서 실현을 위한 힌트를 전해드리고 있습니다.\n▷ LINE 등록: {LINE}\n\n{DIV}\n\n\n법인·단체 문의는 이쪽으로: {CONTACT}\n\nikigAI 주식회사\n다음 세대가 자기답게 살아갈 수 있는 세상으로\n{SITE}\n\n{DIV}" },
  "zh-CN": { fallbackName: "贵宾",
    subject: "【ikigAI】您的AI愿景板已完成",
    body: "{NAME} 您好\n\n感谢您使用 ikigAI。\n现将您专属的「AI愿景板」送上。\n\n※ 请保存图片并加以运用。\n\n为了不让这份愿景仅仅停留在「观看」，\n我们在 LINE 上分享实现的小贴士。\n▷ LINE 注册：{LINE}\n\n{DIV}\n\n\n企业·团体咨询请点此：{CONTACT}\n\nikigAI 股份有限公司\n迈向让下一代活出自我的世界\n{SITE}\n\n{DIV}" },
  "zh-TW": { fallbackName: "貴賓",
    subject: "【ikigAI】您的AI願景板已完成",
    body: "{NAME} 您好\n\n感謝您使用 ikigAI。\n現將您專屬的「AI願景板」奉上。\n\n※ 請儲存圖片並加以運用。\n\n為了不讓這份願景僅止於「觀看」，\n我們在 LINE 上分享實現的小提示。\n▷ LINE 註冊：{LINE}\n\n{DIV}\n\n\n企業·團體洽詢請點此：{CONTACT}\n\nikigAI 股份有限公司\n邁向讓下一代活出自我的世界\n{SITE}\n\n{DIV}" },
  "es": { fallbackName: "cliente",
    subject: "[ikigAI] Tu tablero de visión con IA está listo",
    body: "Hola {NAME}:\n\nGracias por usar ikigAI.\nAquí tienes tu «Tablero de Visión con IA» original.\n\n* Guarda la imagen y aprovéchala.\n\nPara que esta visión no se quede solo en «mirar»,\ncompartimos consejos para hacerla realidad en LINE.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nConsultas para empresas o grupos: {CONTACT}\n\nikigAI Inc.\nHacia un mundo donde la próxima generación pueda vivir siendo ella misma\n{SITE}\n\n{DIV}" },
  "es-419": { fallbackName: "cliente",
    subject: "[ikigAI] Tu tablero de visión con IA ya está listo",
    body: "Hola {NAME}:\n\nGracias por usar ikigAI.\nAquí está tu «Tablero de Visión con IA» original.\n\n* Guarda la imagen y aprovéchala.\n\nPara que esta visión no se quede solo en «mirar»,\ncompartimos consejos para hacerla realidad en LINE.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nConsultas para empresas o grupos: {CONTACT}\n\nikigAI Inc.\nHacia un mundo donde las próximas generaciones puedan vivir siendo ellas mismas\n{SITE}\n\n{DIV}" },
  "fr": { fallbackName: "cher client",
    subject: "[ikigAI] Votre tableau de visualisation IA est prêt",
    body: "Bonjour {NAME},\n\nMerci d'utiliser ikigAI.\nVoici votre « tableau de visualisation IA » personnalisé.\n\n* Pensez à enregistrer l'image et à en profiter.\n\nPour que cette vision ne se limite pas à « regarder »,\nnous partageons des conseils pour la réaliser sur LINE.\n▷ LINE : {LINE}\n\n{DIV}\n\n\nPour les demandes d'entreprises ou de groupes : {CONTACT}\n\nikigAI Inc.\nVers un monde où la prochaine génération peut vivre en restant elle-même\n{SITE}\n\n{DIV}" },
  "de": { fallbackName: "Kundin/Kunde",
    subject: "[ikigAI] Dein KI-Visionboard ist fertig",
    body: "Hallo {NAME},\n\nvielen Dank, dass du ikigAI nutzt.\nHier ist dein persönliches „KI-Visionboard“.\n\n* Bitte speichere das Bild und nutze es.\n\nDamit diese Vision nicht nur beim „Ansehen“ bleibt,\nteilen wir auf LINE Tipps zur Umsetzung.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nAnfragen von Unternehmen oder Gruppen: {CONTACT}\n\nikigAI Inc.\nFür eine Welt, in der die nächste Generation sie selbst sein kann\n{SITE}\n\n{DIV}" },
  "it": { fallbackName: "cliente",
    subject: "[ikigAI] La tua vision board con IA è pronta",
    body: "Ciao {NAME},\n\ngrazie per aver usato ikigAI.\nEcco la tua «vision board con IA» originale.\n\n* Salva l'immagine e sfruttala al meglio.\n\nPerché questa visione non resti solo da «guardare»,\nsu LINE condividiamo consigli per realizzarla.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nPer richieste di aziende o gruppi: {CONTACT}\n\nikigAI Inc.\nVerso un mondo in cui le nuove generazioni possano vivere sé stesse\n{SITE}\n\n{DIV}" },
  "pt-BR": { fallbackName: "cliente",
    subject: "[ikigAI] Seu quadro de visão com IA está pronto",
    body: "Olá {NAME},\n\nobrigado por usar o ikigAI.\nAqui está o seu «Quadro de Visão com IA» original.\n\n* Salve a imagem e aproveite.\n\nPara que esta visão não fique apenas no «olhar»,\ncompartilhamos dicas para realizá-la no LINE.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nPara contatos de empresas ou grupos: {CONTACT}\n\nikigAI Inc.\nRumo a um mundo onde a próxima geração possa viver sendo ela mesma\n{SITE}\n\n{DIV}" },
  "id": { fallbackName: "Pelanggan",
    subject: "[ikigAI] Papan visi AI Anda telah selesai",
    body: "Halo {NAME},\n\nterima kasih telah menggunakan ikigAI.\nBerikut «Papan Visi AI» orisinal Anda.\n\n* Silakan simpan gambar dan manfaatkan.\n\nAgar visi ini tidak berhenti sekadar «dilihat»,\nkami membagikan tips untuk mewujudkannya di LINE.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nUntuk pertanyaan perusahaan atau kelompok: {CONTACT}\n\nikigAI Inc.\nMenuju dunia tempat generasi berikutnya dapat hidup menjadi dirinya sendiri\n{SITE}\n\n{DIV}" },
  "hi": { fallbackName: "ग्राहक",
    subject: "[ikigAI] आपका AI विज़न बोर्ड तैयार है",
    body: "प्रिय {NAME},\n\nikigAI का उपयोग करने के लिए धन्यवाद।\nयह रहा आपका अपना «AI विज़न बोर्ड»।\n\n* कृपया इमेज सेव करें और इसका उपयोग करें।\n\nइस विज़न को सिर्फ «देखने» तक सीमित न रखने के लिए,\nहम LINE पर इसे साकार करने के सुझाव साझा करते हैं।\n▷ LINE: {LINE}\n\n{DIV}\n\n\nकंपनी या समूह की पूछताछ के लिए: {CONTACT}\n\nikigAI Inc.\nएक ऐसी दुनिया की ओर जहाँ अगली पीढ़ी स्वयं बनकर जी सके\n{SITE}\n\n{DIV}" },
  "ar": { fallbackName: "عميلنا",
    subject: "[ikigAI] لوحة الرؤية بالذكاء الاصطناعي جاهزة",
    body: "عزيزي {NAME}،\n\nشكرًا لاستخدامك ikigAI.\nإليك «لوحة الرؤية بالذكاء الاصطناعي» الخاصة بك.\n\n* يُرجى حفظ الصورة والاستفادة منها.\n\nكي لا تبقى هذه الرؤية مجرد «مشاهدة»،\nنشارك نصائح لتحقيقها عبر LINE.\n▷ LINE: {LINE}\n\n{DIV}\n\n\nلاستفسارات الشركات أو المجموعات: {CONTACT}\n\nikigAI Inc.\nنحو عالم يستطيع فيه الجيل القادم أن يعيش على سجيّته\n{SITE}\n\n{DIV}" }
};

function buildEmailContent(recipientName, lang) {
  var site = "https://ikigai96.studio.site/";
  var contact = "https://ikigai96.studio.site/#contact";
  var line = "https://lin.ee/YdPbIrO";
  var div = "──────────────";
  var M = MAIL_I18N[lang] || MAIL_I18N["ja"];
  var name = (recipientName && String(recipientName).trim() !== "") ? recipientName : M.fallbackName;
  var body = M.body
    .replace(/\{NAME\}/g, name)
    .replace(/\{LINE\}/g, line)
    .replace(/\{CONTACT\}/g, contact)
    .replace(/\{SITE\}/g, site)
    .replace(/\{DIV\}/g, div);
  return { subject: M.subject, body: body };
}

// ====== 記録 ======

function appendVisionBoardRow(sheet, data, driveInfo, finalPrompt) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    sheet.appendRow([
      new Date(),
      data.fullName || "", data.email || "", data.age || "", data.gender || "",
      data.hairAppearance || "", data.charmPoints || "", data.favoriteColors || "",
      data.imageStyle || "", data.selfExpression || "", data.happyMoment || "",
      data.strengths || "", data.idealVision || "", data.learnWant || "",
      data.learnReason || "", data.learnWhenWhere || "", data.workStyle || "",
      data.workValues || "", data.workIdealIncomePlace || "", data.residencePlace || "",
      data.residenceEnvironment || "", data.marriageIdealRelation || "", data.marriageThoughts || "",
      data.childThoughts || "", data.childValues || "", data.oldAgeIdeal || "",
      data.oldAgePreparation || "", data.nextAction || "", data.lang || "",
      driveInfo.drivePageUrl, driveInfo.fileId, driveInfo.fileName, finalPrompt,
      // 追加項目（既存列の末尾に追記。写真は本体を保存せず有無のみ）
      data.personality || "", data.praisedFor || "", data.favoriteFood || "",
      data.mostWanted || "", data.mbti || "",
      data.marriageDaily || "", data.marriageValues || "", data.marriageRoles || "", data.marriageFuture || "",
      data.careStyle || "", data.careValues || "", data.careEnvironment || "",
      (data.photo ? "あり" : "")
    ]);
  } finally { try { lock.releaseLock(); } catch (e) {} }
}

/** 生成の計測ログを gen_log タブに記録（無ければ自動作成）。原因切り分け用。 */
function logGenTiming(ss, data, t) {
  try {
    var sh = ss.getSheetByName("gen_log");
    if (!sh) {
      sh = ss.insertSheet("gen_log");
      sh.appendRow([
        "日時", "メール", "言語",
        "Gemini(秒)", "Drive(秒)", "Sheet(秒)", "合計(秒)",
        "Gemini試行回数", "429待ち回数", "使用可能キー数"
      ]);
    }
    sh.appendRow([
      new Date(), data.email || "", data.lang || "",
      Math.round((t.geminiMs || 0) / 100) / 10,
      Math.round((t.driveMs || 0) / 100) / 10,
      Math.round((t.sheetMs || 0) / 100) / 10,
      Math.round((t.totalMs || 0) / 100) / 10,
      GEN_STATS.attempts || 0, GEN_STATS.waits429 || 0, GEN_STATS.keys || 0
    ]);
  } catch (e) {
    Logger.log("timing log error: " + e);
  }
  Logger.log("TIMING total=" + (t.totalMs || 0) + "ms gemini=" + (t.geminiMs || 0) +
    "ms drive=" + (t.driveMs || 0) + "ms sheet=" + (t.sheetMs || 0) +
    "ms attempts=" + (GEN_STATS.attempts || 0) + " waits429=" + (GEN_STATS.waits429 || 0) +
    " keys=" + (GEN_STATS.keys || 0));
}

function handleFeedback(data) {
  if (!isValidToken(data.token)) {
    return createJsonResponse({ status: "error", code: "auth", message: "認証が切れました。" });
  }
  var ss = SpreadsheetApp.openById(getScriptPropertyOrThrow("SPREADSHEET_ID"));
  var sheet = ss.getSheetByName("feedbacks");
  if (!sheet) throw new Error("シート「feedbacks」が見つかりません。");
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    sheet.appendRow([
      new Date(), data.rating || "", data.reason || "", data.lang || "",
      data.email || "", data.imageUrl || data.drivePageUrl || ""
    ]);
  } finally { try { lock.releaseLock(); } catch (e) {} }
  return createJsonResponse({ status: "success" });
}

// ====== APIキー管理（gemini タブ） ======

/** gemini タブからキー一覧（重複除去）。列位置に依存せず AIza / sk- で始まる値を拾う。 */
function getMasterKeys() {
  var ssId = getProp("KEYS_SPREADSHEET_ID");
  if (!ssId) return [];
  var name = getProp("KEYS_SHEET_NAME") || "gemini";
  var sh = SpreadsheetApp.openById(ssId).getSheetByName(name);
  if (!sh) throw new Error("キー用タブが見つかりません: " + name);
  var rows = sh.getDataRange().getValues();
  var keys = [];
  for (var r = 0; r < rows.length; r++) {
    var k = findKeyInRow(rows[r]);
    if (k) keys.push(k);
  }
  return dedupe(keys);
}

function getApiKeys() {
  var master = getMasterKeys();
  var usable = master.filter(function (k) { return !isSkipped(k); });
  return usable.length > 0 ? usable : master;
}

/** 1行から APIキーらしい値（AIza… または sk-…）を返す */
function findKeyInRow(rowValues) {
  for (var c = 0; c < rowValues.length; c++) {
    var v = String(rowValues[c]).trim();
    if (v.indexOf("AIza") === 0 || v.indexOf("sk-") === 0) return v;
  }
  return null;
}

function dedupe(list) {
  var seen = {}, out = [];
  for (var i = 0; i < list.length; i++) { if (!seen[list[i]]) { seen[list[i]] = true; out.push(list[i]); } }
  return out;
}

function skipKey(key, seconds) { try { CacheService.getScriptCache().put("skip_" + key.slice(-16), "1", seconds); } catch (e) {} }
function isSkipped(key) { try { return CacheService.getScriptCache().get("skip_" + key.slice(-16)) === "1"; } catch (e) { return false; } }

// ====== 指示文の組み立て（学生版から継承：精度の源） ======

/**
 * prompt_settings タブ（A=key, B=value）の運営ルールを読み、上乗せ用テキストにする。
 * 値の入った行だけを拾う。タブが無い／全部空のときは "" を返す
 * （＝土台の指示文だけで生成＝学生版と同等のデフォルト品質にフォールバック）。
 */
function readPromptSettingsOverlay(ss) {
  var sh = ss.getSheetByName("prompt_settings");
  if (!sh) return "";
  var values = sh.getDataRange().getValues();
  var parts = [];
  for (var i = 0; i < values.length; i++) {
    var key = String(values[i][0]).trim();
    var val = String(values[i][1]).trim();
    if (!key || !val) continue;
    if (key.toLowerCase().indexOf("key") === 0) continue; // 見出し行をスキップ
    parts.push("【" + key + "】\n" + val);
  }
  return parts.join("\n\n");
}

function joinExisting(items) {
  return items.filter(function (v) { return v && String(v).trim() !== ""; });
}

function normalizeStyleKey(style) {
  switch (style) {
    case "水彩画風": return "watercolor";
    case "グラレコ風": return "grareco";
    case "リアル風": return "real";
    case "アート風": return "art";
    case "漫画風": return "comic";
    case "アニメ風": return "anime";
    default: return "watercolor";
  }
}

function buildAgeAppearanceText(data) {
  var parts = [];
  if (data.gender === "男性") parts.push("a Japanese male-presenting person");
  else if (data.gender === "女性") parts.push("a Japanese female-presenting person");
  else parts.push("a Japanese person");
  if (data.age) parts.push("who appears around " + data.age + " years old");
  if (data.hairAppearance) parts.push("with visual traits such as " + data.hairAppearance);
  if (data.charmPoints) parts.push("and distinctive features like " + data.charmPoints);
  if (data.personality) parts.push("with a personality and demeanor described as " + data.personality);
  if (data.mbti) parts.push("(personality type " + data.mbti + ")");
  return parts.join(" ");
}

function buildPaletteText(favoriteColors) {
  if (!favoriteColors) {
    return "Use a harmonious palette with slightly richer saturation than pale pastels. " +
      "Let the colors softly but clearly spread across the full page atmosphere, not only the objects.";
  }
  return "Base the palette on these favorite colors: " + favoriteColors +
    ". Translate them into a cohesive, slightly richer, more visible palette rather than washed-out pale tones. " +
    "Let these colors tint the full-page atmosphere, background, decorative motifs, plants, objects, and connecting elements.";
}

function buildCompactSceneSummary(data) {
  var parts = [];
  var identity = joinExisting([data.selfExpression, data.strengths, data.happyMoment, data.idealVision, data.personality, data.praisedFor]);
  if (identity.length > 0) parts.push("identity and emotional tone inspired by: " + identity.join(", "));
  var favorites = joinExisting([data.favoriteFood, data.mostWanted]);
  if (favorites.length > 0) parts.push("personal favorite motifs (as small symbolic objects) inspired by: " + favorites.join(", "));
  var learning = joinExisting([data.learnWant, data.learnReason, data.learnWhenWhere]);
  if (learning.length > 0) parts.push("learning scenes inspired by: " + learning.join(", "));
  var work = joinExisting([data.workStyle, data.workValues, data.workIdealIncomePlace]);
  if (work.length > 0) parts.push("work scenes inspired by: " + work.join(", "));
  var home = joinExisting([data.residencePlace, data.residenceEnvironment]);
  if (home.length > 0) parts.push("living environment scenes inspired by: " + home.join(", "));
  var relationship = joinExisting([data.marriageIdealRelation, data.marriageThoughts, data.marriageDaily, data.marriageValues, data.marriageRoles, data.marriageFuture]);
  if (relationship.length > 0) parts.push("partnership and relationship scenes inspired by: " + relationship.join(", "));
  var family = joinExisting([data.childThoughts, data.childValues]);
  if (family.length > 0) parts.push("family or parenting scenes inspired by: " + family.join(", "));
  var care = joinExisting([data.careStyle, data.careValues, data.careEnvironment]);
  if (care.length > 0) parts.push("caregiving and family-support scenes inspired by: " + care.join(", "));
  var future = joinExisting([data.oldAgeIdeal, data.oldAgePreparation]);
  if (future.length > 0) parts.push("long-term future scenes inspired by: " + future.join(", "));
  if (data.nextAction) parts.push("a small actionable next-step scene inspired by: " + data.nextAction);
  if (parts.length === 0) parts.push("future growth, lifestyle, and hope");
  return parts.join(". ");
}

function buildKeywordHint(data) {
  var keywords = [];
  var sourceText = joinExisting([
    data.selfExpression, data.strengths, data.happyMoment, data.idealVision,
    data.learnWant, data.workValues, data.nextAction
  ]).join(" / ");
  if (sourceText.indexOf("自由") >= 0) keywords.push("自由");
  if (sourceText.indexOf("学") >= 0) keywords.push("学び");
  if (sourceText.indexOf("旅") >= 0 || sourceText.indexOf("海外") >= 0) keywords.push("旅");
  if (sourceText.indexOf("自然") >= 0 || sourceText.indexOf("森") >= 0) keywords.push("安心");
  if (sourceText.indexOf("挑戦") >= 0 || sourceText.indexOf("成長") >= 0) keywords.push("挑戦");
  if (sourceText.indexOf("創造") >= 0 || sourceText.indexOf("アイデア") >= 0) keywords.push("創造");
  if (sourceText.indexOf("希望") >= 0) keywords.push("希望");
  if (keywords.length === 0) keywords = ["成長", "希望", "自由"];
  keywords = keywords.filter(function (v, i, arr) { return arr.indexOf(v) === i; }).slice(0, 3);
  return keywords.join(", ");
}

function buildPoseDirection(data) {
  var sourceText = joinExisting([
    data.selfExpression, data.strengths, data.idealVision, data.happyMoment, data.workStyle, data.nextAction
  ]).join(" / ");
  var hints = [];
  if (sourceText.indexOf("活発") >= 0 || sourceText.indexOf("アウトドア") >= 0 ||
      sourceText.indexOf("行動") >= 0 || sourceText.indexOf("挑戦") >= 0 || sourceText.indexOf("前向き") >= 0) {
    hints.push("dynamic stepping pose, mid-motion, open stride, energetic body language");
  }
  if (sourceText.indexOf("創造") >= 0 || sourceText.indexOf("アイデア") >= 0 ||
      sourceText.indexOf("アート") >= 0 || sourceText.indexOf("想像力") >= 0) {
    hints.push("expressive artistic gesture, flowing arms, imaginative pose, lively hand movement");
  }
  if (sourceText.indexOf("自由") >= 0 || sourceText.indexOf("のびのび") >= 0 ||
      sourceText.indexOf("旅") >= 0 || sourceText.indexOf("海外") >= 0) {
    hints.push("open relaxed pose, arms slightly spread, wind in clothing, free and expansive posture");
  }
  if (sourceText.indexOf("落ち着") >= 0 || sourceText.indexOf("安心") >= 0 ||
      sourceText.indexOf("穏やか") >= 0 || sourceText.indexOf("丁寧") >= 0) {
    hints.push("calm grounded pose, gentle smile, stable posture, elegant relaxed presence");
  }
  if (sourceText.indexOf("裁量") >= 0 || sourceText.indexOf("リーダー") >= 0 ||
      sourceText.indexOf("自立") >= 0 || sourceText.indexOf("起業") >= 0) {
    hints.push("confident forward-facing pose, poised stance, self-assured expression, composed leadership energy");
  }
  if (sourceText.indexOf("学び") >= 0 || sourceText.indexOf("英語") >= 0 ||
      sourceText.indexOf("ドイツ語") >= 0 || sourceText.indexOf("研究") >= 0 || sourceText.indexOf("エンジニア") >= 0) {
    hints.push("curious intelligent pose, alert eyes, thoughtful but active posture, engaged gesture");
  }
  if (hints.length === 0) {
    return "The central figure must not stand stiffly upright in a generic neutral pose. " +
      "Give them a personality-driven pose with movement, gesture, direction, and emotional energy. " +
      "Prefer a naturally expressive pose over a formal straight standing pose.";
  }
  return "The central figure must not stand stiffly upright in a generic neutral pose. " +
    "Give them a personality-driven pose that reflects their character and aspirations. " +
    "Suggested pose qualities: " + hints.join("; ") + ". " +
    "Prefer expressive posture, meaningful gesture, and natural movement.";
}

function buildRichBackgroundDirection(data) {
  var cues = joinExisting([
    data.favoriteColors, data.selfExpression, data.idealVision, data.happyMoment,
    data.residenceEnvironment, data.workStyle
  ]);
  if (cues.length === 0) {
    return "Fill the full background with a rich connected atmosphere using theme colors, decorative patterns, leaves, flowers, light trails, sky textures, subtle waves, small objects, and poetic environmental details. " +
      "Avoid blank white areas.";
  }
  return "Fill the full background using visual cues inspired by: " + cues.join(", ") +
    ". Use theme-colored atmosphere, plants, flowers, decorative motifs, soft patterns, light trails, wind, waves, symbolic objects, and environmental details so that empty white areas disappear.";
}

function buildConnectionDirection(data) {
  var cues = joinExisting([data.selfExpression, data.idealVision, data.nextAction, data.favoriteColors]);
  if (cues.length === 0) {
    return "Connect scenes with flowing paths, color streams, wind lines, leaves, light ribbons, curved roads, waves, and decorative motion so the whole board feels unified.";
  }
  return "Use flowing connectors inspired by " + cues.join(", ") +
    " such as ribbons of color, curved roads, wind trails, light streams, leaves, contours, waves, and decorative motion to unify the board.";
}

function buildFillerDetailDirection(data) {
  var cues = joinExisting([
    data.favoriteColors, data.learnWant, data.workValues, data.residenceEnvironment,
    data.childValues, data.oldAgeIdeal
  ]);
  if (cues.length === 0) {
    return "In areas that would otherwise be empty, place subtle filler details such as plants, flowers, stars, leaves, desk items, books, fabric textures, windows, floor patterns, glow, clouds, or small symbolic objects.";
  }
  return "In areas that would otherwise be empty, fill space gracefully with decorative and symbolic details inspired by " +
    cues.join(", ") +
    ", such as plants, flowers, leaves, stars, books, tools, travel items, room details, textures, glow, and small meaningful objects.";
}

function getCommonPromptBase(data) {
  return "Create a vertically oriented personal vision board illustration.\n\n" +
    "One central person. Around them, express identity, dreams, learning, work, home, relationships, growth, and next steps through mini-scenes, objects, atmosphere, paths, light, leaves, sky, rooms, nature, tools, and environments.\n\n" +
    "Character:\n" + buildAgeAppearanceText(data) + ".\n\n" +
    "Pose and body language:\n" + buildPoseDirection(data) + "\n\n" +
    "Color:\n" + buildPaletteText(data.favoriteColors) + "\n\n" +
    "Background:\n" + buildRichBackgroundDirection(data) + "\n\n" +
    "Connection:\n" + buildConnectionDirection(data) + "\n\n" +
    "Filler details:\n" + buildFillerDetailDirection(data) + "\n\n" +
    "Scene direction:\n" + buildCompactSceneSummary(data) + "\n\n" +
    "Text policy:\n" +
    "- do not show the person's name\n- do not show age numbers\n- do not show gender words\n" +
    "- do not show headings such as vision board, questionnaire items, section titles, labels, or profile text\n" +
    "- do not copy form answers into long text blocks\n" +
    "- if text appears, keep it very sparse, tiny, handwritten-style, and emotional only\n" +
    "- allowed tiny mood keywords example: " + buildKeywordHint(data) + "\n\n" +
    "Layout policy:\n" +
    "- avoid plain white empty background at all costs\n- do not leave large white gaps\n" +
    "- fill the page with beautiful atmosphere, theme colors, patterns, plants, objects, and soft visual texture\n" +
    "- connect scenes into one unified world\n- prioritize illustration over typography\n" +
    "- use slightly richer and more visible colors instead of overly pale washed-out tones\n";
}

function getStyleSpecificPrompt(styleKey) {
  switch (styleKey) {
    case "watercolor":
      return "Style: soft watercolor vision board.\n- dreamy watercolor texture\n- gentle but visible pastel-to-mid-tone gradients\n- soft atmospheric background across the full page\n- flowing ribbons, mist, light, sky texture, leaves, flowers, and poetic movement connecting all scenes\n- elegant and emotional\n- rich but airy composition\n- background should be softly painted and filled, never plain white\n- a tiny amount of handwritten Japanese keywords may appear if subtle and beautiful\n";
    case "grareco":
      return "Style: Japanese graphic recording inspired illustration.\n- strong visual storytelling\n- clean hand-drawn lines\n- sketch-note energy\n- many small scenes and symbolic icons\n- organized but lively composition\n- use arrows, paths, waves, circles, framing shapes, small patterns, and connectors to unify the page\n- colored background wash with decorative filler details, not plain white\n- allow a few small handwritten Japanese keywords, but not too many\n";
    case "real":
      return "Style: semi-realistic cinematic vision board.\n- realistic human figure and environments\n- natural lighting\n- cinematic depth\n- realistic mini-scenes around the person\n- softly blended but noticeable atmospheric background using the palette colors\n- connected composition through light trails, roads, wind, plants, water, or landscape continuity\n- almost no text\n";
    case "art":
      return "Style: symbolic artistic vision board.\n- more conceptual and gallery-like\n- bold composition\n- elegant symbolic motifs\n- surreal but beautiful connected world\n- background should feel like a painted immersive canvas with abstract color fields, patterns, flora, and motion\n- minimal text, only a few poetic keywords if needed\n";
    case "comic":
      return "Style: manga-influenced illustrated vision board.\n- expressive character drawing\n- dynamic composition\n- manga-like clarity and emotion\n- surrounding scenes should feel like connected illustrated moments, not separate stickers\n- soft colored background plus motion curves, decorative fillers, and visual energy to avoid blank space\n- very little text\n";
    case "anime":
      return "Style: anime-inspired warm vision board.\n- polished anime character design\n- bright clean emotional visuals\n- beautiful scenic background\n- soft fantasy atmosphere\n- connected full-page composition with light, sky, petals, leaves, trails, water, decorative objects, and wind\n- minimal text, only subtle supportive keywords if needed\n";
    default:
      return "Style: soft watercolor vision board.\n- dreamy watercolor texture\n- gentle atmospheric connected background\n";
  }
}

function buildVisionBoardPrompt(overlay, data) {
  var styleKey = normalizeStyleKey(data.imageStyle);
  var prompt = getCommonPromptBase(data) + "\n" + getStyleSpecificPrompt(styleKey);
  if (overlay) {
    prompt += "\n【運営方針（運用側がスプレッドシートで調整）】\n" +
      "以下の方針も必ず反映してください。\n\n" + overlay + "\n";
  }
  return prompt;
}

// ====== 補助 ======

function getProp(name) { return PropertiesService.getScriptProperties().getProperty(name); }

function getScriptPropertyOrThrow(key) {
  var value = getProp(key);
  if (!value) throw new Error("Script Properties に " + key + " が設定されていません。");
  return value;
}
