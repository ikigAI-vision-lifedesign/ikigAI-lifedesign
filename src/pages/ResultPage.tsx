import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import ikigaiLogo from "../assets/ikigai-logo.png";
import { theme } from "../theme";
import { postToGas, extractDriveFileId } from "../config";

// 画像を読み込む（CORS許可時は crossOrigin anonymous で canvas 汚染を防ぐ）
const loadImage = (src: string, crossOrigin = false) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// 画像の右下に会社ロゴ（ウォーターマーク）を合成した Blob を返す。
// CORSで読めない/汚染される場合は例外（呼び出し側でロゴ無し保存にフォールバック）。
const buildWatermarkedBlob = async (imageUrl: string): Promise<Blob> => {
  const baseImg = await loadImage(imageUrl, true);
  const canvas = document.createElement("canvas");
  canvas.width = baseImg.naturalWidth || baseImg.width;
  canvas.height = baseImg.naturalHeight || baseImg.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

  // ロゴを右下に小さく（アプリ表示には出さず、保存画像のみ）
  const logo = await loadImage(ikigaiLogo, false);
  const logoW = Math.round(canvas.width * 0.22);
  const logoH = Math.round(logoW * (logo.naturalHeight / logo.naturalWidth));
  const margin = Math.round(canvas.width * 0.035);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = "rgba(255,255,255,0.85)";
  ctx.shadowBlur = Math.max(2, Math.round(canvas.width * 0.005));
  ctx.drawImage(logo, canvas.width - logoW - margin, canvas.height - logoH - margin, logoW, logoH);
  ctx.restore();

  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("toBlob failed");
  return blob;
};

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const RESULT_IMAGE_KEY = "visionBoardGeneratedImageUrl";
const RESULT_DRIVE_URL_KEY = "visionBoardDrivePageUrl";
const FORM_DATA_KEY = "visionBoardFormData";

const surveyOptions = [
  { value: 5, face: "😊", labelKey: "result.feedback.options.verySatisfied" },
  { value: 4, face: "🙂", labelKey: "result.feedback.options.satisfied" },
  { value: 3, face: "😐", labelKey: "result.feedback.options.neutral" },
  { value: 2, face: "🙁", labelKey: "result.feedback.options.unsatisfied" },
  { value: 1, face: "😔", labelKey: "result.feedback.options.veryUnsatisfied" },
];

// アンケート送信後に出す「次の1歩」カードの見た目
const nextStepVisuals = [
  { emoji: "📅", bg: "#EEF6FF", border: "#CFE4F7", color: "#3E8FD0" },
  { emoji: "🧠", bg: "#FDF0F5", border: "#F6D4E0", color: "#D85E86" },
  { emoji: "🤝", bg: "#FFF8EC", border: "#F0E3BF", color: "#CC9227" },
];

type StoredFormData = {
  fullName?: string;
  email?: string;
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
    <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.4L2.8 2h6.4l4.4 5.9L18.9 2Zm-1.1 17.9h1.7L8.3 4H6.5l11.3 15.9Z" />
  </svg>
);

// 丸ボタン内で使う白アイコン
const InstagramWhiteIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1.3" fill="#fff" stroke="none" />
  </svg>
);

const LineBubbleIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" aria-hidden="true">
    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.44 4.76 3.69 6.22-.12 .9-.5 2.08-1.06 2.98-.18 .29 .06 .66 .4 .58 1.86-.42 3.22-1.2 4.02-1.77 .94 .17 1.93 .26 2.95 .26 5.52 0 10-3.58 10-8S17.52 3 12 3Z" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ResultPage: React.FC = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [satisfactionReason, setSatisfactionReason] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [drivePageUrl, setDrivePageUrl] = useState("");
  const [formData, setFormData] = useState<StoredFormData>({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<Record<string, string>>({});
  const [activeSnsTab, setActiveSnsTab] = useState<"line" | "instagram" | "x">("line");

  useEffect(() => {
  const savedLanguage = localStorage.getItem("selectedLanguage") || "ja";

  i18n.changeLanguage(savedLanguage);
  document.documentElement.lang = savedLanguage;
  document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
  }, [i18n]);

  useEffect(() => {
    setGeneratedImageUrl(localStorage.getItem(RESULT_IMAGE_KEY) || "");
    setDrivePageUrl(localStorage.getItem(RESULT_DRIVE_URL_KEY) || "");

    const savedFormData = localStorage.getItem(FORM_DATA_KEY);
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        setFormData(parsed);
        setReviewData(parsed);
      } catch (error) {
        console.error("Form data parse error:", error);
      }
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hasImage = generatedImageUrl !== "";

  const handleDownloadImage = async () => {
    if (!generatedImageUrl) return;

    // ① 右下に会社ロゴを合成して保存（CORSで画像を読める場合）
    try {
      const blob = await buildWatermarkedBlob(generatedImageUrl);
      triggerBlobDownload(blob, "AI_VisionBoard.png");
      return;
    } catch (e) {
      console.warn("watermark download failed, falling back:", e);
    }

    // ② 合成できない場合：元画像をそのまま保存（ロゴ無し）
    try {
      const response = await fetch(generatedImageUrl);
      if (!response.ok) throw new Error("fetch not ok");
      const blob = await response.blob();
      triggerBlobDownload(blob, "AI_VisionBoard.png");
      return;
    } catch (error) {
      // ③ それも不可：Driveのダウンロードを開く（ロゴ無し）
      const id = extractDriveFileId(drivePageUrl);
      const dl = id
        ? `https://drive.google.com/uc?export=download&id=${id}`
        : generatedImageUrl;
      window.open(dl, "_blank", "noopener,noreferrer");
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(t("result.post.copied"));
    } catch (error) {
      console.error("Copy error:", error);
      alert(t("result.share.copyFailed"));
    }
  };


  const handleSubmitFeedback = async () => {
    if (isSubmitting || isFeedbackSubmitted) return;

    if (selectedRating === null) {
      alert(t("result.feedback.selectRatingAlert"));
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await postToGas({
        action: "feedback",
        rating: Number(selectedRating),
        reason: satisfactionReason.trim(),
        lang: localStorage.getItem("selectedLanguage") || "ja",
        email: formData.email ?? "",
        drivePageUrl: drivePageUrl || generatedImageUrl || "",
      });

      if (data.status !== "success") {
        console.error("Feedback save error:", data.message);
        alert(t("result.feedback.submitFailed", { message: data.message || "" }));
        return;
      }

      setIsFeedbackSubmitted(true);
    } catch (error) {
      console.error("Unexpected submit error:", error);

      const message = error instanceof Error ? error.message : "Unknown error";
      alert(t("result.feedback.submitFailed", { message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // SNSタブ（LINE / Instagram / X）。各タブ：公式アカウントへのリンク＋投稿文コピペ。
  const snsTabs: {
    key: "line" | "instagram" | "x";
    label: string;
    url: string;
    ctaKey: string;
    icon: React.ReactNode;
    btnBg: string;
    postText: string;
  }[] = [
    {
      key: "line",
      label: "LINE",
      url: "https://lin.ee/YdPbIrO",
      ctaKey: "result.lineCta",
      icon: <LineBubbleIcon />,
      btnBg: "#06C755",
      postText: t("result.post.textLine"),
    },
    {
      key: "instagram",
      label: "Instagram",
      url: "https://www.instagram.com/ikig_ai_official",
      ctaKey: "result.instaCta",
      icon: <InstagramWhiteIcon />,
      btnBg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 42%, #d6249f 60%, #285AEB 90%)",
      postText: t("result.post.text").replace("{{HANDLE}}", "@ikig_ai_official"),
    },
    {
      key: "x",
      label: "X",
      url: "https://x.com/ikig_ai_vb",
      ctaKey: "result.xCta",
      icon: <XIcon />,
      btnBg: "#000000",
      postText: t("result.post.text").replace("{{HANDLE}}", "@ikig_ai_vb"),
    },
  ];
  const activeSns = snsTabs.find((s) => s.key === activeSnsTab) || snsTabs[0];

  // 画像を保存ボタン（PCでは画像の下、スマホでは共有セクション内に表示）
  const saveButton = (
    <button
      type="button"
      onClick={handleDownloadImage}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        border: "none",
        borderRadius: "999px",
        padding: "16px 18px",
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
        color: "#fff",
        fontWeight: 900,
        fontSize: "1.1rem",
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(52,150,135,0.25)",
      }}
    >
      <DownloadIcon />
      {t("result.actions.save")}
    </button>
  );

  // 回答見直し（STEP5の構成に合わせる）
  const reviewSections: { title: string; items: string[] }[] = [
    { title: t("form.step5.sections.basic"), items: ["fullName", "email", "age", "gender", "favoriteColors", "hairAppearance", "charmPoints"] },
    { title: t("form.step5.sections.style"), items: ["imageStyle"] },
    { title: t("form.step5.sections.vision"), items: ["selfExpression", "strengths", "happyMoment", "idealVision", "nextAction"] },
    { title: t("form.step5.sections.lifeDesign"), items: ["learnWant", "learnReason", "learnWhenWhere", "workStyle", "workValues", "workIdealIncomePlace", "residencePlace", "residenceEnvironment", "marriageIdealRelation", "marriageThoughts", "childThoughts", "childValues", "oldAgeIdeal", "oldAgePreparation"] },
  ];

  return (
    <>
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ScrollingBanner src={topBanner} direction="left" />

        <div
          className="result-content"
          style={{
            padding: "24px 16px 48px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: theme.primaryDark,
              fontWeight: 800,
              marginBottom: "8px",
              letterSpacing: "0.08em",
            }}
          >
            {t("result.label")}
          </p>

          <h1 style={{ color: theme.text }}>{t("result.title")}</h1>

          {hasImage ? (
            <>
            <div className="result-grid">
              {/* 左：生成画像（PCでは大きめ・固定表示） */}
              <div className="result-left">
                <img
                  src={generatedImageUrl}
                  alt={t("result.generatedImageAlt")}
                  onClick={() => setIsImageModalOpen(true)}
                  className="result-img"
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    objectFit: "contain",
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto",
                    cursor: "zoom-in",
                    borderRadius: "18px",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                    backgroundColor: "#fff",
                  }}
                />
                {/* PCのみ：画像の下に保存ボタン */}
                <div className="save-desktop-wrap" style={{ marginTop: "16px" }}>
                  {saveButton}
                </div>
              </div>

              {/* 右：アンケート → 共有 → 見直し */}
              <div className="result-right">
              {/* ③ 共有セクション */}
              <div style={{ order: 4, marginTop: "28px", textAlign: "left" }}>
                {/* 画像を保存（スマホのみ：共有セクション内。PCでは画像の下に表示） */}
                <div className="save-mobile-wrap">
                  {saveButton}
                </div>

                {/* SNSシェア（タブ：LINE / Instagram / X） */}
                <div
                  style={{
                    marginTop: "20px",
                    background: "#ffffff",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "18px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                  }}
                >
                  {/* タブヘッダー */}
                  <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}` }}>
                    {snsTabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveSnsTab(tab.key)}
                        className={`sns-tab${activeSnsTab === tab.key ? " active" : ""}`}
                        style={{
                          background: "transparent",
                          cursor: "pointer",
                          padding: "14px 6px",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* タブ内容 */}
                  <div style={{ padding: "18px 16px" }}>
                    {/* 公式アカウントに飛ぶボタン */}
                    <a
                      href={activeSns.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        background: activeSns.btnBg,
                        color: "#ffffff",
                        textDecoration: "none",
                        fontWeight: 800,
                        fontSize: "1.02rem",
                        padding: "14px 18px",
                        borderRadius: "999px",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.14)",
                      }}
                    >
                      {activeSns.icon}
                      {t(activeSns.ctaKey)}
                    </a>

                    {/* コピペボード */}
                    <p style={{ margin: "18px 0 10px", fontWeight: 800, color: theme.text, fontSize: "0.95rem" }}>
                      {t("result.post.header")}
                    </p>
                    <div
                      style={{
                        whiteSpace: "pre-line",
                        color: theme.text,
                        lineHeight: 1.9,
                        fontSize: "0.95rem",
                        background: "#f7faf9",
                        border: `1px solid ${theme.border}`,
                        borderRadius: "14px",
                        padding: "14px 16px",
                      }}
                    >
                      {activeSns.postText}
                    </div>
                    <div style={{ textAlign: "right", marginTop: "12px" }}>
                      <button
                        type="button"
                        onClick={() => copyText(activeSns.postText)}
                        style={{
                          border: "none",
                          borderRadius: "999px",
                          padding: "10px 22px",
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                          color: "#fff",
                          fontWeight: 800,
                          cursor: "pointer",
                          boxShadow: "0 6px 16px rgba(52,150,135,0.25)",
                        }}
                      >
                        {t("result.post.copy")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ① アンケート（最優先・画像の次） */}
              <div
                className="survey-card"
                style={{
                  order: 2,
                  padding: "28px 18px",
                  backgroundColor: "#ffffff",
                  borderRadius: "22px",
                  border: `1.5px solid ${theme.border}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                {isFeedbackSubmitted ? (
                  <>
                    <p
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 900,
                        color: theme.text,
                        marginBottom: "10px",
                      }}
                    >
                      {t("result.feedback.thankYou")}
                    </p>

                    <p
                      style={{
                        color: theme.subText,
                        lineHeight: 1.8,
                        marginBottom: 0,
                      }}
                    >
                      {t("result.feedback.saved")}
                    </p>

                    {/* 次の1歩カード（ローディングから移設） */}
                    <div style={{ marginTop: "28px", textAlign: "center" }}>
                      <p style={{ margin: "0 0 2px", color: theme.text, fontWeight: 800, fontSize: "1.1rem" }}>
                        {t("result.nextSteps.header")} 🌱
                      </p>
                      <p style={{ margin: "0 0 14px", color: theme.subText, fontSize: "0.9rem" }}>
                        {t("result.nextSteps.subtitle")}
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(t("result.nextSteps.items", { returnObjects: true }) as { title: string; body: string }[]).map((item, i) => {
                          const v = nextStepVisuals[i % nextStepVisuals.length];
                          return (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                gap: "14px",
                                alignItems: "center",
                                background: v.bg,
                                border: `1.5px solid ${v.border}`,
                                borderRadius: "18px",
                                padding: "16px",
                                textAlign: "left",
                              }}
                            >
                              <div
                                style={{
                                  flex: "none",
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "50%",
                                  background: "#fff",
                                  border: `1.5px solid ${v.border}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "24px",
                                }}
                              >
                                {v.emoji}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 5px", color: v.color, fontWeight: 800, fontSize: "1.02rem" }}>{item.title}</p>
                                <p style={{ margin: 0, color: theme.text, fontSize: "0.9rem", lineHeight: 1.6 }}>{item.body}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        color: theme.text,
                        marginBottom: "22px",
                      }}
                    >
                      {t("result.feedback.satisfaction")}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: isMobile ? "4px" : "10px",
                        justifyItems: "center",
                        marginBottom: "24px",
                      }}
                    >
                      {surveyOptions.map((option) => {
                        const isSelected = selectedRating === option.value;
                        const isHovered = hoveredRating === option.value;
                        const showLabel = isMobile || isHovered || isSelected;

                        return (
                          <div
                            key={option.value}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedRating(option.value)}
                              onMouseEnter={() => setHoveredRating(option.value)}
                              onMouseLeave={() => setHoveredRating(null)}
                              style={{
                                width: "100%",
                                maxWidth: isMobile ? "56px" : "64px",
                                aspectRatio: "1 / 1",
                                borderRadius: "50%",
                                border: `3px solid ${theme.primary}`,
                                backgroundColor: isSelected
                                  ? theme.primary
                                  : "#ffffff",
                                color: isSelected ? "#ffffff" : theme.primaryDark,
                                fontSize: isMobile ? "1.25rem" : "1.85rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "0.2s ease",
                                transform:
                                  !isMobile && isHovered
                                    ? "scale(1.12)"
                                    : "scale(1)",
                              }}
                            >
                              {option.face}
                            </button>

                            <div
                              style={{
                                marginTop: "8px",
                                minHeight: "34px",
                                fontSize: isMobile ? "0.62rem" : "0.86rem",
                                fontWeight: 800,
                                color: theme.primaryDark,
                                opacity: showLabel ? 1 : 0,
                                transition: "opacity 0.2s ease",
                                lineHeight: 1.3,
                                textAlign: "center",
                              }}
                            >
                              {t(option.labelKey)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <label
                      style={{
                        display: "block",
                        textAlign: "left",
                        color: theme.text,
                        fontWeight: 800,
                        marginBottom: "8px",
                      }}
                    >
                      {t("result.feedback.reasonLabel")}
                    </label>

                    <textarea
                      value={satisfactionReason}
                      onChange={(e) => setSatisfactionReason(e.target.value)}
                      placeholder={t("result.feedback.reasonPlaceholder")}
                      style={{
                        width: "100%",
                        minHeight: "120px",
                        boxSizing: "border-box",
                        borderRadius: "16px",
                        border: `1.5px solid ${theme.border}`,
                        padding: "14px 16px",
                        fontSize: "1rem",
                        lineHeight: 1.7,
                        resize: "vertical",
                        outlineColor: theme.primary,
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting}
                      style={{
                        width: "100%",
                        marginTop: "22px",
                        padding: "15px 18px",
                        borderRadius: "999px",
                        border: "none",
                        background: isSubmitting
                          ? "#aacfc7"
                          : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
                        color: "#ffffff",
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        boxShadow: "0 8px 20px rgba(52, 150, 135, 0.22)",
                      }}
                    >
                      {isSubmitting
                        ? t("result.feedback.submitting")
                        : t("result.feedback.submit")}
                    </button>
                  </>
                )}
              </div>
              </div>
            </div>

            {/* 回答の見直し（プルダウン・PCでは2カラム全幅） */}
            <div
              style={{
                marginTop: "24px",
                background: "#ffffff",
                border: `1.5px solid ${theme.border}`,
                borderRadius: "22px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setReviewOpen((v) => !v)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  color: theme.text,
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  textAlign: "left",
                }}
              >
                <span>{t("result.review.title")}</span>
                <span
                  aria-hidden="true"
                  style={{
                    color: theme.primaryDark,
                    display: "inline-block",
                    transition: "transform 0.3s ease",
                    transform: reviewOpen ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ▸
                </span>
              </button>

              {/* ぴろーんと下に伸びる開閉アニメ */}
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: reviewOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.38s ease",
                }}
              >
                <div style={{ overflow: "hidden", minHeight: 0 }}>
                  <div style={{ padding: "0 20px 20px", textAlign: "left", borderTop: `1px solid ${theme.border}` }}>
                    {reviewSections.map((sec) => (
                      <div key={sec.title} style={{ marginTop: "16px" }}>
                        <p style={{ margin: "0 0 8px", color: theme.primaryDark, fontWeight: 900, fontSize: "1rem" }}>
                          {sec.title}
                        </p>
                        {sec.items.map((k) => (
                          <p key={k} style={{ margin: "6px 0", color: theme.text, lineHeight: 1.8, wordBreak: "break-word", fontSize: "0.95rem" }}>
                            <strong>{t(`form.step5.items.${k}`)}：</strong>
                            {reviewData[k] && String(reviewData[k]).trim() !== "" ? reviewData[k] : "—"}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* もう一度ビジョンボードを作成する（最初の質問へ。言語選択・導入はスキップ） */}
            <button
              type="button"
              onClick={() => navigate("/form/step1")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                marginTop: "18px",
                padding: "14px 18px",
                borderRadius: "999px",
                border: `2px solid ${theme.primary}`,
                background: "#ffffff",
                color: theme.primaryDark,
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {t("result.createAgain", "もう一度ビジョンボードを作成する")}
            </button>
            </>
          ) : (
            <p style={{ color: theme.subText, marginTop: "24px" }}>
              {t("result.noImage")}
            </p>
          )}
        </div>

        <ScrollingBanner src={bottomBanner} direction="right" />
      </div>

      {isImageModalOpen && hasImage && (
        <div
          onClick={() => setIsImageModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.72)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "fit-content",
              maxWidth: "min(520px, 100%)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              aria-label={t("result.closeModal")}
              style={{
                position: "absolute",
                top: "-12px",
                right: "-4px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: "#fff",
                color: "#222",
                fontSize: "1.4rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <img
              src={generatedImageUrl}
              alt={t("result.expandedImageAlt")}
              style={{
                display: "block",
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "14px",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ResultPage;
