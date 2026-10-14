// src/pages/FormStep1Page.tsx
// STEP1：画像スタイル選択（参考画像つき）。STEP2「あなたについて」より前に選ぶ。
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

import styleWatercolor from "../assets/styles/style-watercolor.webp";
import styleGraphic from "../assets/styles/style-graphic.webp";
import styleRealistic from "../assets/styles/style-realistic.webp";
import styleArtistic from "../assets/styles/style-artistic.webp";
import styleComic from "../assets/styles/style-comic.webp";
import styleAnime from "../assets/styles/style-anime.webp";

const STORAGE_KEY = "visionBoardFormData";

const imageStyleOptions = [
  { value: "水彩画風", labelKey: "form.step1.imageStyleOptions.watercolor", img: styleWatercolor },
  { value: "グラレコ風", labelKey: "form.step1.imageStyleOptions.graphicRecording", img: styleGraphic },
  { value: "リアル風", labelKey: "form.step1.imageStyleOptions.realistic", img: styleRealistic },
  { value: "アート風", labelKey: "form.step1.imageStyleOptions.artistic", img: styleArtistic },
  { value: "漫画風", labelKey: "form.step1.imageStyleOptions.comic", img: styleComic },
  { value: "アニメ風", labelKey: "form.step1.imageStyleOptions.anime", img: styleAnime },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setImageStyle(value);
    persist(value);
  };

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
          <p style={{ color: theme.subText, lineHeight: 1.8, margin: 0 }}>
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
          <div style={{ width: "25%", height: "100%", background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)" }} />
        </div>

        <form onSubmit={handleNext}>
          <label style={labelStyle}>
            {t("form.step1.imageStyle")}
            <RequiredBadge />
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {imageStyleOptions.map((option) => (
              <label
                key={option.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  cursor: "pointer",
                  border: `1.5px solid ${imageStyle === option.value ? theme.primary : theme.border}`,
                  borderRadius: "14px",
                  padding: "14px 16px",
                  backgroundColor: imageStyle === option.value ? theme.primaryLight : theme.white,
                  marginTop: 0,
                  marginBottom: 0,
                  fontWeight: 700,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
                  <input
                    type="radio"
                    name="imageStyle"
                    value={option.value}
                    checked={imageStyle === option.value}
                    onChange={handleChange}
                    required
                    style={{ marginRight: "10px", width: "18px", height: "18px", minHeight: "18px", marginBottom: 0, flexShrink: 0 }}
                  />
                  <span>{t(option.labelKey)}</span>
                </div>

                {option.value === "水彩画風" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                      padding: "7px 12px",
                      borderRadius: "999px",
                      background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)",
                      color: "#fff",
                      fontSize: "0.86rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    {t("form.step1.recommended")}
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* 参考画像（各スタイルの仕上がりイメージ） */}
          <p style={{ textAlign: "left", color: theme.subText, fontWeight: 700, fontSize: "0.9rem", margin: "0 0 10px" }}>
            {t("form.step1.referenceLabel")}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
              gap: "10px",
              marginBottom: "26px",
            }}
          >
            {imageStyleOptions.map((option) => {
              const selected = imageStyle === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleChange({ target: { value: option.value } } as React.ChangeEvent<HTMLInputElement>)}
                  style={{
                    background: "none",
                    border: `2px solid ${selected ? theme.primary : "transparent"}`,
                    borderRadius: "12px",
                    padding: "3px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <img
                    src={option.img}
                    alt={t(option.labelKey)}
                    style={{ width: "100%", borderRadius: "9px", display: "block", aspectRatio: "170 / 319", objectFit: "cover" }}
                  />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: selected ? theme.primaryDark : theme.subText }}>
                    {t(option.labelKey)}
                  </span>
                </button>
              );
            })}
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
