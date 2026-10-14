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
  marginTop: "18px",
  fontSize: "1.05rem",
  gap: "0",
};

const helperTextStyle: React.CSSProperties = {
  marginTop: "-2px",
  marginBottom: "10px",
  color: theme.subText,
  fontSize: "0.92rem",
  lineHeight: 1.7,
  textAlign: "left",
};

const FormStep3Page: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState<VisionBoardFormData>(defaultFormData);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";

 　 i18n.changeLanguage(savedLanguage);
 　 document.documentElement.lang = savedLanguage;
 　 document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch (error) {
        console.error(error);
      }
    }
  }, [i18n]);

  useEffect(() => {
    const complete =
      formData.selfExpression.trim() !== "" &&
      formData.idealVision.trim() !== "" &&
      formData.happyMoment.trim() !== "" &&
      formData.strengths.trim() !== "" &&
      formData.nextAction.trim() !== "";

    setIsDisabled(!complete);
  }, [formData]);

  const saveMergedFormData = (nextData: VisionBoardFormData) => {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...existing,
        ...nextData,
      })
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      saveMergedFormData(next);
      return next;
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;

    saveMergedFormData(formData);
    navigate("/form/step4");
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
        <p style={{ color: theme.primaryDark, fontWeight: 700 }}>
          {t("form.step3.stepLabel")}
        </p>

        <h1 style={{ fontSize: "2rem", color: theme.text }}>
          {t("form.step3.title")}
        </h1>

        <p
          className="desc-pc"
          style={{
            color: theme.subText,
            lineHeight: 1.8,
            marginBottom: "18px",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {t("form.step3.description")}
        </p>
        <p
          className="desc-sp"
          style={{
            color: theme.subText,
            lineHeight: 1.8,
            marginBottom: "18px",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {t("form.step3.descriptionSp")}
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
          <div
            style={{
              width: "60%",
              height: "100%",
              background:
                "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)",
            }}
          />
        </div>

        <form onSubmit={handleNext}>
          {/* 1. あなたらしさ */}
          <label style={labelStyle}>
            {t("form.step3.selfExpression")}
            <RequiredBadge />
          </label>

          <p style={helperTextStyle}>
            {t("form.step3.selfExpressionHelper")}
          </p>

          <textarea
            name="selfExpression"
            value={formData.selfExpression}
            onChange={handleChange}
            placeholder={t("form.step3.selfExpressionPlaceholder")}
            required
          />

          {/* 2. あなたの強み */}
          <label style={labelStyle}>
            {t("form.step4.identity.strengths")}
            <RequiredBadge />
          </label>
          <textarea
            name="strengths"
            value={formData.strengths}
            onChange={handleChange}
            placeholder={t("form.step4.identity.strengthsPlaceholder")}
            required
          />

          {/* 3. 最近幸せだった瞬間 */}
          <label style={labelStyle}>
            {t("form.step4.identity.happyMoment")}
            <RequiredBadge />
          </label>
          <textarea
            name="happyMoment"
            value={formData.happyMoment}
            onChange={handleChange}
            placeholder={t("form.step4.identity.happyMomentPlaceholder")}
            required
          />

          {/* 4. これから叶えたい未来 */}
          <label style={labelStyle}>
            {t("form.step3.idealVision")}
            <RequiredBadge />
          </label>
          <textarea
            name="idealVision"
            value={formData.idealVision}
            onChange={handleChange}
            placeholder={t("form.step3.idealVisionPlaceholder")}
            required
          />

          {/* 5. 今月中にできる小さな一歩は？ */}
          <label style={labelStyle}>
            {t("form.step4.nextAction.action")}
            <RequiredBadge />
          </label>
          <textarea
            name="nextAction"
            value={formData.nextAction}
            onChange={handleChange}
            placeholder={t("form.step4.nextAction.actionPlaceholder")}
            required
          />

          <StepNavigation
            backLabel={t("common.back")}
            nextLabel={t("common.next")}
            onBack={() => navigate("/form/step2")}
            nextDisabled={isDisabled}
          />
        </form>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default FormStep3Page;
