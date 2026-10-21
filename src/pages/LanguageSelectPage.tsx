// src/pages/LanguageSelectPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../theme";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "ja", label: "日本語", flag: "https://flagcdn.com/w40/jp.png" },
  { code: "ja-hira", label: "日本語（ひらがな）", flag: "https://flagcdn.com/w40/jp.png" },
  { code: "en", label: "English", flag: "https://flagcdn.com/w40/us.png" },
  { code: "fr", label: "Français", flag: "https://flagcdn.com/w40/fr.png" },
  { code: "de", label: "Deutsch", flag: "https://flagcdn.com/w40/de.png" },
  { code: "hi", label: "हिंदी", flag: "https://flagcdn.com/w40/in.png" },
  { code: "id", label: "Bahasa Indonesia", flag: "https://flagcdn.com/w40/id.png" },
  { code: "it", label: "Italiano", flag: "https://flagcdn.com/w40/it.png" },
  { code: "ko", label: "한국어", flag: "https://flagcdn.com/w40/kr.png" },
  { code: "pt-BR", label: "Português", flag: "https://flagcdn.com/w40/br.png" },
  { code: "es-419", label: "Español (Latinoamérica)", flag: "https://flagcdn.com/w40/mx.png" },
  { code: "es", label: "Español (España)", flag: "https://flagcdn.com/w40/es.png" },
  { code: "zh-CN", label: "简体中文", flag: "https://flagcdn.com/w40/cn.png" },
  { code: "zh-TW", label: "繁體中文", flag: "https://flagcdn.com/w40/tw.png" },
  { code: "ar", label: "العربية", flag: "https://flagcdn.com/w40/sa.png" },
];

const LanguageSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const resolveLanguage = (langCode: string) => {
    if (langCode === "ja-hira") return "hiragana";
    return langCode;
  };

  const applyDocumentDirection = (langCode: string) => {
    document.documentElement.lang = langCode;
    document.documentElement.dir = langCode === "ar" ? "rtl" : "ltr";
  };

  const handleSelect = async (langCode: string) => {
    const actualLanguage = resolveLanguage(langCode);

    localStorage.setItem("selectedLanguage", actualLanguage);
    localStorage.setItem("selectedLanguageOriginal", langCode);

    applyDocumentDirection(actualLanguage);
    await i18n.changeLanguage(actualLanguage);

    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.background,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: theme.white,
          border: `8px solid ${theme.accentBlue ?? "#6EB6E8"}`,
          borderRadius: "38px",
          padding: "30px 22px 28px",
          boxSizing: "border-box",
          boxShadow: "0 10px 26px rgba(73, 211, 178, 0.12)",
        }}
      >
        <h1
          style={{
            margin: 0,
            textAlign: "center",
            color: theme.text,
            fontSize: "2rem",
            fontWeight: 800,
          }}
        >
          AI VisionBoard
        </h1>

        <p
          style={{
            marginTop: "12px",
            marginBottom: "24px",
            textAlign: "center",
            color: theme.subText,
            fontSize: "1rem",
            lineHeight: 1.7,
            fontWeight: 700,
          }}
        >
          言語を選択してください
          <br />
          Please select your language
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                backgroundColor: theme.white,
                color: theme.text,
                border: `2px solid ${theme.primary}`,
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 700,
                textAlign: "left",
              }}
            >
              <img
                src={lang.flag}
                alt={lang.label}
                style={{
                  width: "26px",
                  height: "18px",
                  objectFit: "cover",
                  borderRadius: "3px",
                  border: "1px solid #d9d9d9",
                }}
              />
              <span style={{ flex: 1 }}>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectPage;
