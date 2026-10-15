import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import { theme } from "../theme";
import { postToGas } from "../config";

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

    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "AI_VisionBoard.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download error:", error);
      alert(t("result.share.downloadFailed"));
    }
  };

  const handleCopyPost = async () => {
    try {
      await navigator.clipboard.writeText(t("result.post.text"));
      alert(t("result.post.copied"));
    } catch (error) {
      console.error("Copy post error:", error);
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

  // 丸いアイコンボタン（画像を保存＋SNSアカウントリンク）
  const circleButtonStyle = (bg: string): React.CSSProperties => ({
    width: isMobile ? "62px" : "70px",
    height: isMobile ? "62px" : "70px",
    borderRadius: "50%",
    border: "none",
    background: bg,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
  });

  // save はアクション（ダウンロード）、SNSは実リンク（<a>）。
  // スマホで window.open だと空白タブが残るため、SNSは本物のリンクで開く。
  const circleItems: {
    key: string;
    label: string;
    icon: React.ReactNode;
    bg: string;
    href?: string;
    onClick?: () => void;
  }[] = [
    { key: "save", label: t("result.actions.save"), icon: <DownloadIcon />, bg: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`, onClick: handleDownloadImage },
    { key: "instagram", label: "Instagram", icon: <InstagramWhiteIcon />, bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 42%, #d6249f 60%, #285AEB 90%)", href: "https://www.instagram.com/" },
    { key: "x", label: "X", icon: <XIcon />, bg: "#000000", href: "https://x.com/" },
    { key: "line", label: "LINE", icon: <LineBubbleIcon />, bg: "#06C755", href: "https://lin.ee/YdPbIrO" },
  ];

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
          style={{
            width: "100%",
            maxWidth: "720px",
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
              <img
                src={generatedImageUrl}
                alt={t("result.generatedImageAlt")}
                onClick={() => setIsImageModalOpen(true)}
                style={{
                  width: "100%",
                  maxWidth: "280px",
                  maxHeight: "500px",
                  objectFit: "contain",
                  display: "block",
                  margin: "20px auto 0",
                  cursor: "zoom-in",
                  borderRadius: "18px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                  backgroundColor: "#fff",
                }}
              />

              {/* 共有セクション */}
              <div style={{ marginTop: "28px", textAlign: "left" }}>
                {/* 画像を保存＋SNSアカウント（丸アイコン） */}
                <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? "14px" : "22px", flexWrap: "wrap" }}>
                  {circleItems.map((item) => (
                    <div
                      key={item.key}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: isMobile ? "62px" : "76px" }}
                    >
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={item.label}
                          style={{ ...circleButtonStyle(item.bg), textDecoration: "none" }}
                        >
                          {item.icon}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={item.onClick}
                          aria-label={item.label}
                          style={circleButtonStyle(item.bg)}
                        >
                          {item.icon}
                        </button>
                      )}
                      <div style={{ marginTop: "9px", fontSize: isMobile ? "0.78rem" : "0.88rem", color: theme.text, fontWeight: 800 }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* おすすめの投稿文 */}
                <div
                  style={{
                    marginTop: "16px",
                    background: "#ffffff",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "16px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    padding: "18px 16px",
                  }}
                >
                  <p style={{ margin: "0 0 12px", fontWeight: 800, color: theme.text, fontSize: "0.98rem" }}>
                    {t("result.post.header")}
                  </p>
                  <div style={{ whiteSpace: "pre-line", color: theme.text, lineHeight: 1.9, fontSize: "0.95rem" }}>
                    {t("result.post.text")}
                  </div>
                  <div style={{ textAlign: "right", marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={handleCopyPost}
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

              <div
                style={{
                  marginTop: "42px",
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

              {/* 回答の見直し（プルダウン） */}
              <div
                style={{
                  marginTop: "18px",
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
              width: "100%",
              maxWidth: "520px",
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
                width: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "14px",
                backgroundColor: "#fff",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ResultPage;
