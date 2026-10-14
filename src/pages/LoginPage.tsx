// src/pages/LoginPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import { theme } from "../theme";
import { postToGas, setToken } from "../config";

const STORAGE_KEY = "visionBoardFormData";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";
    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
  }, [i18n]);

  const handleLogin = async () => {
    const code = passcode.trim();
    if (!code) {
      alert(t("login.errors.wrongPasscode"));
      return;
    }

    // パスコードはサーバー側(GAS)で照合する。正解はスプレッドシートにあり、フロントには持たない。
    try {
      const data = await postToGas({ action: "verifyPasscode", code });
      if (!data || !data.valid) {
        alert(t("login.errors.wrongPasscode"));
        return;
      }
      // 認証成功。以降の通信で使う使い捨てトークンを保存しておく（パスコード再入力は不要になる）。
      if (data.token) setToken(data.token);
    } catch (e) {
      alert(t("login.errors.wrongPasscode"));
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

          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
            placeholder={t("login.passwordPlaceholder")}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "15px 16px",
              borderRadius: "14px",
              border: `1.5px solid ${theme.border}`,
              fontSize: "1rem",
              outlineColor: theme.primary,
            }}
          />

          <button
            type="button"
            onClick={handleLogin}
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
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(52, 150, 135, 0.22)",
            }}
          >
            {t("login.continue")}
          </button>
        </div>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default LoginPage;
