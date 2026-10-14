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
  { value: "", labelKey: "form.step1.genderOptions.select" },
  { value: "男性", labelKey: "form.step1.genderOptions.male" },
  { value: "女性", labelKey: "form.step1.genderOptions.female" },
  { value: "ノンバイナリー", labelKey: "form.step1.genderOptions.nonBinary" },
  { value: "回答しない", labelKey: "form.step1.genderOptions.preferNotToSay" },
];

type VisionBoardFormData = {
  fullName: string;
  email: string;
  age: string;
  gender: string;
  hairAppearance: string;
  charmPoints: string;
  favoriteColors: string;
  imageStyle: string;
  selfExpression: string;
  happyMoment: string;
  strengths: string;
  idealVision: string;
  learnWant: string;
  learnReason: string;
  learnWhenWhere: string;
  workStyle: string;
  workValues: string;
  workIdealIncomePlace: string;
  residencePlace: string;
  residenceEnvironment: string;
  marriageIdealRelation: string;
  marriageThoughts: string;
  childThoughts: string;
  childValues: string;
  oldAgeIdeal: string;
  oldAgePreparation: string;
  nextAction: string;
};

const defaultFormData: VisionBoardFormData = {
  fullName: "",
  email: "",
  age: "",
  gender: "",
  hairAppearance: "",
  charmPoints: "",
  favoriteColors: "",
  imageStyle: "",
  selfExpression: "",
  happyMoment: "",
  strengths: "",
  idealVision: "",
  learnWant: "",
  learnReason: "",
  learnWhenWhere: "",
  workStyle: "",
  workValues: "",
  workIdealIncomePlace: "",
  residencePlace: "",
  residenceEnvironment: "",
  marriageIdealRelation: "",
  marriageThoughts: "",
  childThoughts: "",
  childValues: "",
  oldAgeIdeal: "",
  oldAgePreparation: "",
  nextAction: "",
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

const FormStep1Page: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState<VisionBoardFormData>(defaultFormData);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";
    i18n.changeLanguage(savedLanguage);
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
    i18n.changeLanguage(savedLanguage);
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
      formData.hairAppearance.trim() !== "" &&
      formData.charmPoints.trim() !== "";

    setIsDisabled(!isComplete);
  }, [formData]);

  const saveFormData = (data: VisionBoardFormData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    navigate("/form/step2");
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

      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          padding: "24px 16px 48px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: theme.primaryDark,
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            {t("form.step1.stepLabel")}
          </p>

          <h1
            style={{
              fontSize: "2rem",
              color: theme.text,
              marginBottom: "12px",
            }}
          >
            {t("form.step1.title")}
          </h1>

          <p
            style={{
              color: theme.subText,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {t("form.step1.description")}
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
          <div
            style={{
              width: "25%",
              height: "100%",
              background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)",
            }}
          />
        </div>

        <form onSubmit={handleNext}>
          <label style={labelStyle}>
            {t("form.step1.fullName")}
            <RequiredBadge />
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            placeholder={t("form.step1.fullNamePlaceholder")}
          />

          <label style={labelStyle}>
            {t("form.step1.email")}
            <RequiredBadge />
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder={t("form.step1.emailPlaceholder")}
          />

          <label style={labelStyle}>
            {t("form.step1.age")}
            <RequiredBadge />
          </label>
          <input
            type="text"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            required
            placeholder={t("form.step1.agePlaceholder")}
          />

          <label style={labelStyle}>
            {t("form.step1.gender")}
            <RequiredBadge />
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
          >
            {genderOptions.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>

          <label style={labelStyle}>
            {t("form.step1.hairAppearance")}
            <RequiredBadge />
          </label>
          <input
            type="text"
            name="hairAppearance"
            value={formData.hairAppearance}
            onChange={handleInputChange}
            required
            placeholder={t("form.step1.hairAppearancePlaceholder")}
          />

          <label style={labelStyle}>
            {t("form.step1.charmPoints")}
            <RequiredBadge />
          </label>
          <input
            type="text"
            name="charmPoints"
            value={formData.charmPoints}
            onChange={handleInputChange}
            required
            placeholder={t("form.step1.charmPointsPlaceholder")}
          />

          <StepNavigation
            backLabel={t("common.back")}
            nextLabel={t("common.next")}
            onBack={() => navigate("/intro")}
            nextDisabled={isDisabled}
          />
        </form>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default FormStep1Page;
