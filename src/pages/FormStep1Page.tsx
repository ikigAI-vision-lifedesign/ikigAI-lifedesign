// src/pages/FormStep1Page.tsx
// STEP1：画像スタイル選択。PC=画像カードのグリッド、スマホ=大プレビュー＋横スクロールのサムネ。
import React, { useEffect, useRef, useState } from "react";
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

import styleWatercolor from "../assets/styles/style-watercolor.webp";
import styleGraphic from "../assets/styles/style-graphic.jpg";
import styleRealistic from "../assets/styles/style-realistic.webp";
import styleArtistic from "../assets/styles/style-artistic.webp";
import styleComic from "../assets/styles/style-comic.webp";
import styleAnime from "../assets/styles/style-anime.webp";

const STORAGE_KEY = "visionBoardFormData";

const imageStyleOptions = [
  { value: "水彩画風", labelKey: "form.step1.imageStyleOptions.watercolor", img: styleWatercolor, recommended: true },
  { value: "グラレコ風", labelKey: "form.step1.imageStyleOptions.graphicRecording", img: styleGraphic, recommended: false },
  { value: "リアル風", labelKey: "form.step1.imageStyleOptions.realistic", img: styleRealistic, recommended: false },
  { value: "アート風", labelKey: "form.step1.imageStyleOptions.artistic", img: styleArtistic, recommended: false },
  { value: "漫画風", labelKey: "form.step1.imageStyleOptions.comic", img: styleComic, recommended: false },
  { value: "アニメ風", labelKey: "form.step1.imageStyleOptions.anime", img: styleAnime, recommended: false },
];

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

  const [imageStyle, setImageStyle] = useState("");
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
      if (typeof parsed.imageStyle === "string") setImageStyle(parsed.imageStyle);
    } catch (error) {
      console.error("Failed to parse saved form data:", error);
    }
  }, []);

  useEffect(() => {
    setIsDisabled(imageStyle.trim() === "");
  }, [imageStyle]);

  const persist = (value: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prev = saved ? JSON.parse(saved) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, imageStyle: value }));
  };

  const select = (value: string) => {
    setImageStyle(value);
    persist(value);
  };

  const stripRef = useRef<HTMLDivElement>(null);
  const scrollStrip = (dir: number) => {
    stripRef.current?.scrollBy({ left: dir * 196, behavior: "smooth" });
  };

  const displayOption =
    imageStyleOptions.find((o) => o.value === imageStyle) || imageStyleOptions[0];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    persist(imageStyle);
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

      <div style={{ width: "100%", maxWidth: "720px", padding: "24px 16px 48px", boxSizing: "border-box" }}>
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <p style={{ color: theme.primaryDark, fontWeight: 700, marginBottom: "8px" }}>
            {t("form.step1.stepLabel")}
          </p>
          <h1 style={{ fontSize: "2rem", color: theme.text, marginBottom: "12px" }}>
            {t("form.step1.title")}
          </h1>
          <p style={{ color: theme.subText, lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>
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
          <div style={{ width: "17%", height: "100%", background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)" }} />
        </div>

        <form onSubmit={handleNext}>
          <label style={labelStyle}>
            {t("form.step1.imageStyle")}
            <RequiredBadge />
          </label>

          {/* PC：画像カードのグリッド（全スタイルを一覧して比較） */}
          <div className="style-grid">
            {imageStyleOptions.map((option) => {
              const selected = imageStyle === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  className={selected ? "style-card selected" : "style-card"}
                  onClick={() => select(option.value)}
                >
                  {option.recommended && <span className="reco">{t("form.step1.recommended")}</span>}
                  {selected && <span className="check">✓</span>}
                  <img src={option.img} alt={t(option.labelKey)} />
                  <span className="cap">{t(option.labelKey)}</span>
                </button>
              );
            })}
          </div>

          {/* スマホ：大プレビュー＋横スクロールのサムネ */}
          <div className="style-mobile">
            <div className="style-preview">
              {displayOption.recommended && imageStyle === displayOption.value && (
                <span className="reco">{t("form.step1.recommended")}</span>
              )}
              <img src={displayOption.img} alt={t(displayOption.labelKey)} />
              {!imageStyle && <span className="style-hint">{t("form.step1.choosePrompt")}</span>}
            </div>
            <div className="style-cap-row">{t(displayOption.labelKey)}</div>
            <div className="style-strip-wrap">
              <button type="button" className="style-strip-arrow left" aria-hidden="true" tabIndex={-1} onClick={() => scrollStrip(-1)}>
                ‹
              </button>
              <div className="style-strip" ref={stripRef}>
                {imageStyleOptions.map((option) => {
                  const selected = imageStyle === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={selected ? "sthumb selected" : "sthumb"}
                      onClick={() => select(option.value)}
                      aria-label={t(option.labelKey)}
                    >
                      {selected && <span className="check">✓</span>}
                      <img src={option.img} alt={t(option.labelKey)} />
                    </button>
                  );
                })}
              </div>
              <button type="button" className="style-strip-arrow right" aria-hidden="true" tabIndex={-1} onClick={() => scrollStrip(1)}>
                ›
              </button>
            </div>
          </div>

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
