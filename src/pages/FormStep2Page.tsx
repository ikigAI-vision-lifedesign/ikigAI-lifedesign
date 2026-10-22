// src/pages/FormStep2Page.tsx
// STEP2：あなたについて。基本情報＋プロフィール（プロフィールブック風の別セクション）。
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
  charmPoints: string;
  personality: string;
  praisedFor: string;
  photo: string; // 画像データURL（任意）
  favoriteFood: string;
  mostWanted: string;
};

const defaultData: PersonalData = {
  fullName: "",
  email: "",
  age: "",
  gender: "",
  favoriteColors: "",
  charmPoints: "",
  personality: "",
  praisedFor: "",
  photo: "",
  favoriteFood: "",
  mostWanted: "",
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

// 写真を送信前に縮小（長辺768px・JPEG）してデータURLで返す
const resizeImage = (file: File, maxSize = 768, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width >= height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const FormStep2Page: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState<PersonalData>(defaultData);
  const [isDisabled, setIsDisabled] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // 写真は任意。それ以外のテキスト項目は必須。
  useEffect(() => {
    const required = [
      formData.fullName,
      formData.email,
      formData.age,
      formData.gender,
      formData.favoriteColors,
      formData.charmPoints,
      formData.personality,
      formData.praisedFor,
      formData.favoriteFood,
      formData.mostWanted,
    ];
    setIsDisabled(required.some((v) => v.trim() === ""));
  }, [formData]);

  const saveFormData = (data: PersonalData) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const prev = saved ? JSON.parse(saved) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...data }));
    } catch (e) {
      console.warn("save skipped:", e);
    }
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

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setFormData((prev) => {
        const next = { ...prev, photo: dataUrl };
        saveFormData(next);
        return next;
      });
    } catch (err) {
      console.error("photo error:", err);
      alert(t("form.step2.photoError", "写真の読み込みに失敗しました。別の画像をお試しください。"));
    }
  };

  const clearPhoto = () => {
    setFormData((prev) => {
      const next = { ...prev, photo: "" };
      saveFormData(next);
      return next;
    });
    if (fileRef.current) fileRef.current.value = "";
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

  const btnGhost: React.CSSProperties = {
    border: `2px solid ${theme.primary}`,
    background: "#fff",
    color: theme.primaryDark,
    fontWeight: 800,
    borderRadius: "999px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "0.95rem",
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
          <p style={{ color: theme.subText, lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>
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
          <div style={{ width: "40%", height: "100%", background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)" }} />
        </div>

        <form onSubmit={handleNext}>
          {/* 基本情報 */}
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

          {/* プロフィール（別セクション・プロフィールブック風） */}
          <div
            style={{
              marginTop: "34px",
              padding: "6px 18px 22px",
              background: "#ffffff",
              border: `1.5px solid ${theme.border}`,
              borderRadius: "22px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <p style={{ margin: "20px 0 4px", fontWeight: 900, color: theme.primaryDark, fontSize: "1.2rem", textAlign: "left" }}>
              {t("form.step2.profileTitle")}
            </p>
            <p style={{ margin: 0, color: theme.subText, fontSize: "0.9rem", textAlign: "left", lineHeight: 1.6 }}>
              {t("form.step2.profileNote")}
            </p>

            <label style={labelStyle}>
              {t("form.step2.favoriteColors")}
              <RequiredBadge />
            </label>
            <input type="text" name="favoriteColors" value={formData.favoriteColors} onChange={handleInputChange} required placeholder={t("form.step2.favoriteColorsPlaceholder")} />

            <label style={labelStyle}>
              {t("form.step2.charmPoints")}
              <RequiredBadge />
            </label>
            <input type="text" name="charmPoints" value={formData.charmPoints} onChange={handleInputChange} required placeholder={t("form.step2.charmPointsPlaceholder")} />

            <label style={labelStyle}>
              {t("form.step2.personality")}
              <RequiredBadge />
            </label>
            <input type="text" name="personality" value={formData.personality} onChange={handleInputChange} required placeholder={t("form.step2.personalityPlaceholder")} />

            <label style={labelStyle}>
              {t("form.step2.praisedFor")}
              <RequiredBadge />
            </label>
            <input type="text" name="praisedFor" value={formData.praisedFor} onChange={handleInputChange} required placeholder={t("form.step2.praisedForPlaceholder")} />

            {/* お気に入りの写真（任意） */}
            <label style={labelStyle}>
              {t("form.step2.photo")}
              <span style={{ marginLeft: "8px", fontSize: "0.78rem", fontWeight: 800, color: theme.subText, background: "#eef4f1", borderRadius: "6px", padding: "2px 8px" }}>
                {t("common.optional")}
              </span>
            </label>
            <p style={{ margin: "0 0 12px", color: theme.subText, fontSize: "0.85rem", textAlign: "left", lineHeight: 1.6 }}>
              {t("form.step2.photoNote")}
            </p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            {formData.photo ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px" }}>
                <img
                  src={formData.photo}
                  alt={t("form.step2.photo")}
                  style={{ width: "160px", height: "160px", objectFit: "cover", borderRadius: "16px", border: `1.5px solid ${theme.border}` }}
                />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => fileRef.current?.click()} style={btnGhost}>
                    {t("form.step2.photoChange")}
                  </button>
                  <button type="button" onClick={clearPhoto} style={{ ...btnGhost, border: `2px solid ${theme.border}`, color: theme.subText }}>
                    {t("form.step2.photoRemove")}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} style={{ ...btnGhost, width: "100%", padding: "14px 18px", fontSize: "1rem" }}>
                {t("form.step2.photoSelect")}
              </button>
            )}

            <label style={labelStyle}>
              {t("form.step2.favoriteFood")}
              <RequiredBadge />
            </label>
            <input type="text" name="favoriteFood" value={formData.favoriteFood} onChange={handleInputChange} required placeholder={t("form.step2.favoriteFoodPlaceholder")} />

            <label style={labelStyle}>
              {t("form.step2.mostWanted")}
              <RequiredBadge />
            </label>
            <input type="text" name="mostWanted" value={formData.mostWanted} onChange={handleInputChange} required placeholder={t("form.step2.mostWantedPlaceholder")} />
          </div>

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
