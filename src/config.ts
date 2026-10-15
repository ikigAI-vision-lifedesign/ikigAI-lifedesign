// ============================================================
// 新バックエンド（会社アカウントのGAS Webアプリ）の窓口URL
// ------------------------------------------------------------
// ※ コードを直してデプロイし直すときは、必ず
//   「デプロイ → デプロイを管理 → 既存のデプロイを編集 → 新バージョン」
//   で更新すること。URLが変わらず、このファイルを直さずに済む。
//   「新しいデプロイ」を押すとURLが変わり、ここも直す必要が出る。
// ============================================================
export const GAS_EXEC_URL =
  "https://script.google.com/macros/s/AKfycbyaNilLqpdQsaH-mUzV-8UYCsnEHoTJbaHOLo8QLYvAh9IYoXLgxMA3oUi9PO_gRJjm/exec";

// ============================================================
// ログイントークン（認証の合言葉）の保管
// ------------------------------------------------------------
// ログイン時にパスコードが正しければ、GASが使い捨てのトークンを発行する。
// 以降の画像生成・フィードバック送信では、このトークンを自動で添えて送る。
// → UIを触る人はパスコードを「最初の1回」入れるだけでよい。
// ============================================================
const TOKEN_KEY = "vb_token";

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn("token save skipped:", e);
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    /* noop */
  }
}

// ============================================================
// 生成ID（genId）＝1回の生成を一意に識別する合言葉
// ------------------------------------------------------------
// Step5の「生成する」で新しいIDを発行し、ローディング中はこのIDで生成を依頼する。
// 通信が途中で切れて再試行しても、同じIDならサーバーは「すでに作った画像」を返す
// （＝再生成・再メールしない）。ブラウザバックでの二重生成も防ぐ。
// ============================================================
const GEN_ID_KEY = "vb_gen_id";

export function newGenId(): string {
  let id = "";
  try {
    id =
      typeof crypto !== "undefined" && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : "gid-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    localStorage.setItem(GEN_ID_KEY, id);
  } catch (e) {
    /* noop */
  }
  return id;
}

export function getGenId(): string {
  try {
    return localStorage.getItem(GEN_ID_KEY) || "";
  } catch (e) {
    return "";
  }
}

// GAS へ POST する。CORSのプリフライトを避けるため Content-Type は text/plain。
// 保管しているトークンがあれば自動で添える（payload側で明示指定があればそちらを優先）。
export async function postToGas(payload: Record<string, any>): Promise<any> {
  const token = getToken();
  const body = token ? { token, ...payload } : payload;
  const res = await fetch(GAS_EXEC_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ============================================================
// Xシェア用：Cloudflare Worker のシェアページ ベースURL
// ------------------------------------------------------------
// Worker を設置したら、ここにそのURLを入れる。
//   例) "https://ikigai-share.xxxx.workers.dev"   （無料の *.workers.dev でOK）
//   例) "https://share.ikigai-vision.com"          （独自ドメインを付けた場合）
// 空のあいだは従来どおり Drive リンクでシェアする（挙動は変わらない）。
// ============================================================
export const SHARE_BASE_URL = "";

// drivePageUrl（https://drive.google.com/file/d/FILEID/view...）から FILEID を取り出す
export function extractDriveFileId(driveUrl: string): string {
  const m = (driveUrl || "").match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : "";
}

// Xシェアに使うURL：Worker設定時は OGP付きシェアページ、未設定時は Drive リンク
export function buildShareUrl(drivePageUrl: string): string {
  const id = extractDriveFileId(drivePageUrl);
  if (SHARE_BASE_URL && id) return SHARE_BASE_URL + "/s?id=" + id;
  return drivePageUrl || "";
}
