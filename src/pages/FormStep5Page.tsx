import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import StepNavigation from "../components/StepNavigation";
import { theme } from "../theme";
import { newGenId } from "../config";

import styleWatercolor from "../assets/styles/style-watercolor.webp";
import styleGraphic from "../assets/styles/style-graphic.jpg";
import styleRealistic from "../assets/styles/style-realistic.webp";
import styleArtistic from "../assets/styles/style-artistic.webp";
import styleComic from "../assets/styles/style-comic.webp";
import styleAnime from "../assets/styles/style-anime.webp";

const STORAGE_KEY = "visionBoardFormData";

// 選択された画風 → サンプル画像（保存値は日本語の固定キー）
const STYLE_IMAGES: Record<string, string> = {
  "水彩画風": styleWatercolor,
  "グラレコ風": styleGraphic,
  "リアル風": styleRealistic,
  "アート風": styleArtistic,
  "漫画風": styleComic,
  "アニメ風": styleAnime,
};

/** ★ 実URL */
const TERMS_URL = "https://ikigai96.studio.site/serAgreement";
const PRIVACY_URL = "https://ikigai96.studio.site/privacy-policy";

type FormDataType = {
  fullName?: string;
  email?: string;
  age?: string;
  gender?: string;
  charmPoints?: string;
  favoriteColors?: string;
  personality?: string;
  praisedFor?: string;
  photo?: string;
  favoriteFood?: string;
  mostWanted?: string;
  imageStyle?: string;
  selfExpression?: string;
  happyMoment?: string;
  strengths?: string;
  idealVision?: string;
  learnWant?: string;
  learnReason?: string;
  learnWhenWhere?: string;
  workStyle?: string;
  workValues?: string;
  workIdealIncomePlace?: string;
  residencePlace?: string;
  residenceEnvironment?: string;
  marriageIdealRelation?: string;
  marriageThoughts?: string;
  childThoughts?: string;
  childValues?: string;
  oldAgeIdeal?: string;
  oldAgePreparation?: string;
  nextAction?: string;
};

const FormStep5Page: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({});

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";

 　 i18n.changeLanguage(savedLanguage);
  　document.documentElement.lang = savedLanguage;
 　 document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (error) {
        console.error(error);
      }
    }
  }, [i18n]);

  const handleGenerate = () => {
    if (!privacyAccepted) return;
    // 新しい生成ID（1回の生成を識別）。前回の結果はクリアしておく。
    newGenId();
    try {
      localStorage.removeItem("visionBoardGeneratedImageUrl");
      localStorage.removeItem("visionBoardDrivePageUrl");
      localStorage.removeItem("visionBoardResultGenId");
    } catch (e) {
      /* noop */
    }
    navigate("/loading");
  };

  const renderText = (value?: string) => {
    return value && value.trim() !== "" ? value : "—";
  };

  const summaryCardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: "20px",
    padding: "24px",
    border: `1.5px solid ${theme.border}`,
    lineHeight: 1.9,
    color: theme.text,
    marginBottom: "18px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "1.08rem",
    fontWeight: 900,
    color: theme.primaryDark,
  };

  const itemStyle: React.CSSProperties = {
    margin: "6px 0",
    wordBreak: "break-word",
  };

  const linkStyle: React.CSSProperties = {
    color: theme.primaryDark,
    textDecoration: "underline",
    fontWeight: 700,
  };

  const SummaryItem = ({
    label,
    value,
  }: {
    label: string;
    value?: string;
  }) => (
    <p style={itemStyle}>
      <strong>{label}：</strong>
      {renderText(value)}
    </p>
  );

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
          {t("form.step5.stepLabel")}
        </p>

        <h1 style={{ fontSize: "2rem", color: theme.text }}>
          {t("form.step5.title")}
        </h1>

        <p
          style={{
            color: theme.subText,
            lineHeight: 1.8,
            marginBottom: "18px",
            textAlign: "center",
          }}
        >
          {t("form.step5.description")}
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
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)",
            }}
          />
        </div>

        {/* あなたについて（STEP2）：好きな色もここ（性別の下） */}
        <div style={summaryCardStyle}>
          <h3 style={sectionTitleStyle}>{t("form.step5.sections.basic")}</h3>
          <SummaryItem label={t("form.step5.items.fullName")} value={formData.fullName} />
          <SummaryItem label={t("form.step5.items.email")} value={formData.email} />
          <SummaryItem label={t("form.step5.items.age")} value={formData.age} />
          <SummaryItem label={t("form.step5.items.gender")} value={formData.gender} />
          <SummaryItem label={t("form.step5.items.favoriteColors")} value={formData.favoriteColors} />
          <SummaryItem label={t("form.step5.items.charmPoints")} value={formData.charmPoints} />
          <SummaryItem label={t("form.step5.items.personality")} value={formData.personality} />
          <SummaryItem label={t("form.step5.items.praisedFor")} value={formData.praisedFor} />
          {formData.photo && formData.photo.startsWith("data:") && (
            <p style={itemStyle}>
              <strong>{t("form.step5.items.photo")}：</strong>
              <img src={formData.photo} alt="" style={{ height: "48px", width: "48px", objectFit: "cover", borderRadius: "8px", verticalAlign: "middle" }} />
            </p>
          )}
          <SummaryItem label={t("form.step5.items.favoriteFood")} value={formData.favoriteFood} />
          <SummaryItem label={t("form.step5.items.mostWanted")} value={formData.mostWanted} />
        </div>

        {/* 画風（STEP1）：テキスト＋サンプル画像 */}
        <div style={summaryCardStyle}>
          <h3 style={sectionTitleStyle}>{t("form.step5.sections.style")}</h3>
          <SummaryItem label={t("form.step5.items.imageStyle")} value={formData.imageStyle} />
          {formData.imageStyle && STYLE_IMAGES[formData.imageStyle] && (
            <img
              src={STYLE_IMAGES[formData.imageStyle]}
              alt={formData.imageStyle}
              style={{
                width: "150px",
                maxWidth: "48%",
                borderRadius: "12px",
                display: "block",
                marginTop: "10px",
                border: `1px solid ${theme.border}`,
              }}
            />
          )}
        </div>

        {/* あなたらしさと未来（STEP3）：強み・幸せな瞬間・次の一歩もここ */}
        <div style={summaryCardStyle}>
          <h3 style={sectionTitleStyle}>{t("form.step5.sections.vision")}</h3>
          <SummaryItem label={t("form.step5.items.selfExpression")} value={formData.selfExpression} />
          <SummaryItem label={t("form.step5.items.strengths")} value={formData.strengths} />
          <SummaryItem label={t("form.step5.items.happyMoment")} value={formData.happyMoment} />
          <SummaryItem label={t("form.step5.items.idealVision")} value={formData.idealVision} />
          <SummaryItem label={t("form.step5.items.nextAction")} value={formData.nextAction} />
        </div>

        {/* ライフデザイン（STEP4） */}
        <div style={summaryCardStyle}>
          <h3 style={sectionTitleStyle}>{t("form.step5.sections.lifeDesign")}</h3>
          <SummaryItem label={t("form.step5.items.learnWant")} value={formData.learnWant} />
          <SummaryItem label={t("form.step5.items.learnReason")} value={formData.learnReason} />
          <SummaryItem label={t("form.step5.items.learnWhenWhere")} value={formData.learnWhenWhere} />
          <SummaryItem label={t("form.step5.items.workStyle")} value={formData.workStyle} />
          <SummaryItem label={t("form.step5.items.workValues")} value={formData.workValues} />
          <SummaryItem label={t("form.step5.items.workIdealIncomePlace")} value={formData.workIdealIncomePlace} />
          <SummaryItem label={t("form.step5.items.residencePlace")} value={formData.residencePlace} />
          <SummaryItem label={t("form.step5.items.residenceEnvironment")} value={formData.residenceEnvironment} />
          <SummaryItem label={t("form.step5.items.marriageIdealRelation")} value={formData.marriageIdealRelation} />
          <SummaryItem label={t("form.step5.items.marriageThoughts")} value={formData.marriageThoughts} />
          <SummaryItem label={t("form.step5.items.childThoughts")} value={formData.childThoughts} />
          <SummaryItem label={t("form.step5.items.childValues")} value={formData.childValues} />
          <SummaryItem label={t("form.step5.items.oldAgeIdeal")} value={formData.oldAgeIdeal} />
          <SummaryItem label={t("form.step5.items.oldAgePreparation")} value={formData.oldAgePreparation} />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginTop: "28px",
            fontSize: "0.95rem",
            color: theme.text,
            lineHeight: 1.8,
            fontWeight: 700,
          }}
        >
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              marginTop: "4px",
              accentColor: theme.primaryDark,
            }}
          />

          <span>
            <a href={TERMS_URL} target="_blank" rel="noreferrer" style={linkStyle}>
              {t("form.step5.terms")}
            </a>
            {t("form.step5.and")}
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noreferrer"
              style={{ ...linkStyle, marginLeft: "4px" }}
            >
              {t("form.step5.privacy")}
            </a>
            {t("form.step5.agreeSuffix")}
          </span>
        </label>

        <StepNavigation
          backLabel={t("common.back")}
          nextLabel={t("form.step5.generate")}
          onBack={() => navigate("/form/step4")}
          nextDisabled={!privacyAccepted}
          nextType="button"
          onNextClick={handleGenerate}
        />
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default FormStep5Page;
