// src/pages/FormStep5Page.tsx
// STEP5：ネクストアクション（旧STEP3の「今月中にできる小さな一歩」を独立）。
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import RequiredBadge from "../components/RequiredBadge";
import StepNavigation from "../components/StepNavigation";
import { theme } from "../theme";

const STORAGE_KEY = "visionBoardFormData";

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flexWrap: "wrap",
  textAlign: "left",
  fontWeight: 800,
  color: theme.text,
  marginBottom: "8px",
  marginTop: "18px",
  fontSize: "1.1rem",
  gap: "0",
};

const FormStep5Page: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [nextAction, setNextAction] = useState("");
  const isDisabled = nextAction.trim() === "";

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";
    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.nextAction === "string") setNextAction(parsed.nextAction);
      } catch (error) {
        console.error(error);
      }
    }
  }, [i18n]);

  const save = (value: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, nextAction: value }));
    } catch (e) {
      console.warn("save skipped:", e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNextAction(value);
    save(value);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    save(nextAction);
    navigate("/form/step6");
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: theme.background,
      }}
    >
      <ScrollingBanner src={topBanner} direction="left" />

      <div style={{ width: "100%", maxWidth: "720px", padding: "24px 16px 48px", boxSizing: "border-box" }}>
        <p style={{ color: theme.primaryDark, fontWeight: 700 }}>
          {t("form.nextActionStep.stepLabel")}
        </p>

        <h1 style={{ fontSize: "2rem", color: theme.text }}>
          {t("form.nextActionStep.title")}
        </h1>

        <p
          style={{
            color: theme.subText,
            lineHeight: 1.8,
            marginBottom: "18px",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {t("form.nextActionStep.description")}
        </p>

        <div
          style={{
            width: "100%",
            height: "10px",
            backgroundColor: "#DDF4EF",
            borderRadius: "999px",
            overflow: "hidden",
            marginBottom: "28px",
          }}
        >
          <div style={{ width: "83%", height: "100%", background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)" }} />
        </div>

        <form onSubmit={handleNext}>
          <label style={labelStyle}>
            {t("form.nextActionStep.question")}
            <RequiredBadge />
          </label>
          <textarea
            name="nextAction"
            value={nextAction}
            onChange={handleChange}
            placeholder={t("form.nextActionStep.placeholder")}
            required
          />

          <StepNavigation
            backLabel={t("common.back")}
            nextLabel={t("common.next")}
            onBack={() => navigate("/form/step4")}
            nextDisabled={isDisabled}
          />
        </form>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default FormStep5Page;
