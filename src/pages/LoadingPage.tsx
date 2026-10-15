import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import LoadingExperience from "../components/LoadingExperience";
import { postToGas, clearToken, getGenId } from "../config";

const STORAGE_KEY = "visionBoardFormData";
const RESULT_IMAGE_KEY = "visionBoardGeneratedImageUrl";
const RESULT_DRIVE_URL_KEY = "visionBoardDrivePageUrl";
const RESULT_GEN_ID_KEY = "visionBoardResultGenId";

type AnyObject = Record<string, any>;

const removeEmptyFields = (obj: AnyObject): AnyObject => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );
};

// 画面の状態。loading=生成中 / error=失敗（再試行ボタンを出す）
type ViewState = "loading" | "error";

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  // 開発用：#/loading?preview=1 で生成処理を走らせずローディング画面だけ表示
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [view, setView] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const isRunningRef = useRef(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";

    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
  }, [i18n]);

  // 画像生成の本体。成功したら結果画面へ、失敗したらエラー表示（再試行ボタン）へ。
  // 入力は Step1〜4 のデータなので、失敗しても Step に戻さず、ここからやり直せる。
  const generate = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setView("loading");

    const saved = localStorage.getItem(STORAGE_KEY);
    const selectedLanguage = localStorage.getItem("selectedLanguage") || "ja";

    if (!saved) {
      alert(t("loadingPage.errors.missingData"));
      navigate("/form/step1");
      return;
    }

    try {
      const formData = JSON.parse(saved);

      // 回答データをそのまま新バックエンド(GAS)へ送る。
      // 指示文の組み立て・Drive保存・スプレッドシート記録はすべてGAS側で行う。
      // トークンは config.postToGas が自動で添える。
      const payload = removeEmptyFields({
        ...formData,
        lang: selectedLanguage,
        genId: getGenId(), // 同じIDの再試行はサーバーが作成済み画像を返す（二重生成防止）
      });

      const data = await postToGas(payload);

      // 認証切れ：パスコードから入り直してもらう。
      if (data && data.code === "auth") {
        clearToken();
        alert(t("loadingPage.errors.sessionExpired", "認証の有効期限が切れました。もう一度パスコードを入力してください。"));
        navigate("/");
        return;
      }

      if (data.status !== "success" || !data.imageUrl) {
        throw new Error(
          data.message || t("loadingPage.errors.imageGenerationFailed")
        );
      }

      const imageUrl = data.imageUrl;
      const driveUrl = data.drivePageUrl ?? "";

      try {
        localStorage.setItem(RESULT_IMAGE_KEY, imageUrl);
        localStorage.setItem(RESULT_DRIVE_URL_KEY, driveUrl);
        // この生成IDの結果が完了したことを記録（戻る対策）
        localStorage.setItem(RESULT_GEN_ID_KEY, getGenId());
      } catch (e) {
        console.warn("localStorage save skipped:", e);
      }

      navigate("/result");
    } catch (error) {
      console.error(error);
      isRunningRef.current = false;
      setErrorMessage(t("loadingPage.errors.generationFailed"));
      setView("error");
    }
  };

  // 再試行ボタン。入力はそのままなので、もう一度だけ生成を走らせる。
  const handleRetry = () => {
    isRunningRef.current = false;
    generate();
  };

  useEffect(() => {
    if (isPreview) return; // 開発用プレビュー：生成を実行しない

    // ブラウザバック等で戻ってきたとき：この生成IDの結果が既に完成していれば
    // 再生成せずに結果画面へ。
    try {
      const gid = getGenId();
      const doneGid = localStorage.getItem(RESULT_GEN_ID_KEY);
      const hasResult = !!localStorage.getItem(RESULT_IMAGE_KEY);
      if (gid && hasResult && doneGid === gid) {
        navigate("/result");
        return;
      }
    } catch (e) {
      /* noop */
    }

    generate();
    // 初回のみ実行（generateは都度生成されるため依存に入れない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // スマホでリンク等により一時停止→復帰したとき、失敗状態なら自動で再試行する。
  // サーバーは同じ genId なら作成済み画像を返すので、二重生成にはならない。
  useEffect(() => {
    if (isPreview) return;
    const onVisible = () => {
      if (document.visibilityState === "visible" && view === "error") {
        handleRetry();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isPreview]);

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <ScrollingBanner src={topBanner} direction="left" />

      {/* 上下バナーの間を埋めて縦中央に配置（下バナー下の余白を防ぐ） */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          padding: "24px 16px",
        }}
      >
      {view === "loading" ? (
        <LoadingExperience preview={isPreview} />
      ) : (
        <div
          style={{
            maxWidth: "520px",
            margin: "40px auto",
            padding: "0 20px",
          }}
        >
          <p style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "24px" }}>
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            style={{
              width: "100%",
              maxWidth: "300px",
              padding: "15px 18px",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(135deg, #6eb6e8 0%, #47d3b1 100%)",
              color: "#ffffff",
              fontSize: "1.05rem",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(52, 150, 135, 0.22)",
            }}
          >
            {t("loadingPage.retry", "もう一度ためす")}
          </button>
        </div>
      )}
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default LoadingPage;
