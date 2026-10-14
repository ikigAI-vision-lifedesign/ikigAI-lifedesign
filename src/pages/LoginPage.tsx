// src/pages/LoginPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import { theme } from "../theme";
import { postToGas, setToken } from "../config";

const STORAGE_KEY = "visionBoardFormData";

// 目アイコン（表示）
const EyeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
// 目アイコン（非表示＝斜線入り）
const EyeOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [passcode, setPasscode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";
    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
  }, [i18n]);

  // 誤入力時：赤表示＋カードを一度だけ揺らす
  const triggerError = () => {
    setError(true);
    setShake(true);
  };

  const handleLogin = async () => {
    const code = passcode.trim();
    if (!code) {
      triggerError();
      return;
    }

    setSubmitting(true);
    // パスコードはサーバー側(GAS)で照合する。正解はスプレッドシートにあり、フロントには持たない。
    try {
      const data = await postToGas({ action: "verifyPasscode", code });
      if (!data || !data.valid) {
        triggerError();
        setSubmitting(false);
        return;
      }
      // 認証成功。以降の通信で使う使い捨てトークンを保存しておく（パスコード再入力は不要になる）。
      if (data.token) setToken(data.token);
    } catch (e) {
      triggerError();
      setSubmitting(false);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    const formData = saved ? JSON.parse(saved) : {};

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...formData,
        loginMethod: "passcode",
      })
    );

    navigate("/intro");
  };

  const borderColor = error ? "#e5484d" : theme.border;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: theme.background,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollingBanner src={topBanner} direction="left" />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 16px 56px",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            color: theme.primaryDark,
            fontWeight: 800,
            letterSpacing: "0.08em",
            marginBottom: "8px",
          }}
        >
          {t("login.label")}
        </p>

        <h1
          style={{
            color: theme.text,
            fontSize: "2rem",
            marginBottom: "12px",
          }}
        >
          {t("login.title")}
        </h1>

        <p
          style={{
            color: theme.subText,
            lineHeight: 1.8,
            marginBottom: "28px",
          }}
        >
          {t("login.description")}
        </p>

        <div
          className={shake ? "login-shake" : undefined}
          onAnimationEnd={() => setShake(false)}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "22px",
            border: `1.5px solid ${theme.border}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            padding: "24px 18px",
          }}
        >
          <label
            style={{
              display: "block",
              textAlign: "left",
              color: theme.text,
              fontWeight: 800,
              marginBottom: "8px",
            }}
          >
            {t("login.passwordLabel")}
          </label>

          {/* 入力欄＋表示切替（目）ボタン */}
          <div style={{ position: "relative" }}>
            <input
              type={showCode ? "text" : "password"}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(false); // 入力し直したらエラー解除
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
              placeholder={t("login.passwordPlaceholder")}
              aria-invalid={error}
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px 52px 15px 16px",
                borderRadius: "14px",
                border: `1.5px solid ${borderColor}`,
                fontSize: "1rem",
                outlineColor: error ? "#e5484d" : theme.primary,
                marginBottom: 0,
              }}
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              aria-label={showCode ? t("login.hidePasscode") : t("login.showPasscode")}
              title={showCode ? t("login.hidePasscode") : t("login.showPasscode")}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                padding: "6px",
                lineHeight: 0,
                color: theme.subText,
                cursor: "pointer",
              }}
            >
              {showCode ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* 誤入力時のインライン・エラー表示 */}
          {error && (
            <p
              role="alert"
              style={{
                textAlign: "left",
                color: "#e5484d",
                fontSize: "0.9rem",
                fontWeight: 700,
                margin: "10px 2px 0",
              }}
            >
              {t("login.errors.wrongPasscode")}
            </p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: "22px",
              padding: "15px 18px",
              borderRadius: "999px",
              border: "none",
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
              color: "#ffffff",
              fontSize: "1.05rem",
              fontWeight: 900,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(52, 150, 135, 0.22)",
            }}
          >
            {t("login.continue")}
          </button>
        </div>

        {/* 枠外・文字のみの「言語選択に戻る」リンク（カードの下） */}
        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <button
            type="button"
            onClick={() => navigate("/language")}
            style={{
              background: "none",
              border: "none",
              padding: "4px 2px",
              color: theme.subText,
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span aria-hidden="true">←</span> {t("login.backToLanguage")}
          </button>
        </div>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default LoginPage;
