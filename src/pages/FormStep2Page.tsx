// src/pages/FormStep2Page.tsx
// STEP2：あなたについて（基本情報）。性別の下に「好きな色」を配置。
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

const genderOptions = [
  { value: "", labelKey: "form.step2.genderOptions.select" },
  { value: "男性", labelKey: "form.step2.genderOptions.male" },
  { value: "女性", labelKey: "form.step2.genderOptions.female" },
  { value: "ノンバイナリー", labelKey: "form.step2.genderOptions.nonBinary" },
  { value: "回答しない", labelKey: "form.step2.genderOptions.preferNotToSay" },
];

type PersonalData = {
  fullName: string;
  email: string;
  age: string;
  gender: string;
  favoriteColors: string;
  hairAppearance: string;
  charmPoints: string;
};

const defaultData: PersonalData = {
  fullName: "",
  email: "",
  age: "",
  gender: "",
  favoriteColors: "",
  hairAppearance: "",
  charmPoints: "",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flexWrap: "wrap",
  textAlign: "left",
  fontWeight: 800,
  color: theme.text,
  marginBottom: "8px",
  marginTop: "22px",
  fontSize: "1.15rem",
  gap: "0",
};

const FormStep2Page: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState<PersonalData>(defaultData);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";
    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
  }, [i18n]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setFormData((prev) => ({ ...prev, ...parsed }));
    } catch (error) {
      console.error("Failed to parse saved form data:", error);
    }
  }, []);

  useEffect(() => {
    const isComplete =
      formData.fullName.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.age.trim() !== "" &&
      formData.gender.trim() !== "" &&
      formData.favoriteColors.trim() !== "" &&
      formData.hairAppearance.trim() !== "" &&
      formData.charmPoints.trim() !== "";
    setIsDisabled(!isComplete);
  }, [formData]);

  const saveFormData = (data: PersonalData) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prev = saved ? JSON.parse(saved) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...data }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      saveFormData(next);
      return next;
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    saveFormData(formData);
    navigate("/form/step3");
  };

  const handleBack = () => {
    saveFormData(formData);
    navigate("/form/step1");
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
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <p style={{ color: theme.primaryDark, fontWeight: 700, marginBottom: "8px" }}>
            {t("form.step2.stepLabel")}
          </p>
          <h1 style={{ fontSize: "2rem", color: theme.text, marginBottom: "12px" }}>
            {t("form.step2.title")}
          </h1>
          <p style={{ color: theme.subText, lineHeight: 1.8, margin: 0 }}>
            {t("form.step2.description")}
          </p>
        </div>

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
          <div style={{ width: "50%", height: "100%", background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)" }} />
        </div>

        <form onSubmit={handleNext}>
          <label style={labelStyle}>
            {t("form.step2.fullName")}
            <RequiredBadge />
          </label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder={t("form.step2.fullNamePlaceholder")} />

          <label style={labelStyle}>
            {t("form.step2.email")}
            <RequiredBadge />
          </label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder={t("form.step2.emailPlaceholder")} />

          <label style={labelStyle}>
            {t("form.step2.age")}
            <RequiredBadge />
          </label>
          <input type="text" name="age" value={formData.age} onChange={handleInputChange} required placeholder={t("form.step2.agePlaceholder")} />

          <label style={labelStyle}>
            {t("form.step2.gender")}
            <RequiredBadge />
          </label>
          <select name="gender" value={formData.gender} onChange={handleInputChange} required>
            {genderOptions.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>

          <label style={labelStyle}>
            {t("form.step2.favoriteColors")}
            <RequiredBadge />
          </label>
          <input type="text" name="favoriteColors" value={formData.favoriteColors} onChange={handleInputChange} required placeholder={t("form.step2.favoriteColorsPlaceholder")} />

          <label style={labelStyle}>
            {t("form.step2.hairAppearance")}
            <RequiredBadge />
          </label>
          <input type="text" name="hairAppearance" value={formData.hairAppearance} onChange={handleInputChange} required placeholder={t("form.step2.hairAppearancePlaceholder")} />

          <label style={labelStyle}>
            {t("form.step2.charmPoints")}
            <RequiredBadge />
          </label>
          <input type="text" name="charmPoints" value={formData.charmPoints} onChange={handleInputChange} required placeholder={t("form.step2.charmPointsPlaceholder")} />

          <StepNavigation
            backLabel={t("common.back")}
            nextLabel={t("common.next")}
            onBack={handleBack}
            nextDisabled={isDisabled}
          />
        </form>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default FormStep2Page;
