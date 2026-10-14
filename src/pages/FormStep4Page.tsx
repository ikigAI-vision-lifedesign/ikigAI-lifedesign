import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import StepNavigation from "../components/StepNavigation";
import lifeDesignMap from "../assets/lifedesign-map.webp";
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
  display: "block",
  textAlign: "left",
  fontWeight: 800,
  color: theme.text,
  marginBottom: "8px",
  marginTop: "18px",
  fontSize: "1.05rem",
};

type SectionStyle = {
  bg: string;
  border: string;
  text: string;
};

const lifeDesignStyles: Record<string, SectionStyle> = {
  learn: {
    bg: "#FFF2F7",
    border: "#F3A8C8",
    text: "#C75A8A",
  },
  work: {
    bg: "#F5F0FF",
    border: "#B89AF5",
    text: "#7B5CD6",
  },
  residence: {
    bg: "#EEF8FF",
    border: "#8FD0F7",
    text: "#3E97C9",
  },
  marriage: {
    bg: "#FFF5E9",
    border: "#F2C37E",
    text: "#C9821E",
  },
  child: {
    bg: "#F2FFF1",
    border: "#96D890",
    text: "#4E9F46",
  },
  oldAge: {
    bg: "#FFF7E8",
    border: "#E6C477",
    text: "#A37A18",
  },
};

const optionalBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "36px",
  minWidth: "72px",
  padding: "0 14px",
  borderRadius: "999px",
  background: theme.primaryDark,
  color: "#ffffff",
  fontSize: "0.95rem",
  fontWeight: 800,
  lineHeight: 1,
  boxSizing: "border-box",
  boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
};

const iconWrapStyle = (color: string): React.CSSProperties => ({
  width: "26px",
  height: "26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color,
  flexShrink: 0,
  marginRight: "10px",
});

const LearnIcon = ({ color }: { color: string }) => (
  <span style={iconWrapStyle(color)}>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 2 8l10 5 8-4v6h2V8L12 3Zm-6 8.8V15c0 2.7 3.4 4.8 6 4.8s6-2.1 6-4.8v-3.2l-6 3-6-3Z" />
    </svg>
  </span>
);

const WorkIcon = ({ color }: { color: string }) => (
  <span style={iconWrapStyle(color)}>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M9 4h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v3h-7v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1H2v-3a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2Zm1 4h4V6h-4v2Zm12 7v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3h7v1a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1h7Z" />
    </svg>
  </span>
);

const ResidenceIcon = ({ color }: { color: string }) => (
  <span style={iconWrapStyle(color)}>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M12 4 3 11h2v8h5v-5h4v5h5v-8h2L12 4Z" />
    </svg>
  </span>
);

const MarriageIcon = ({ color }: { color: string }) => (
  <span style={iconWrapStyle(color)}>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7-4.6-7-10.1C5 7.6 7.2 6 9.6 6c1.5 0 2.7.8 3.4 2 0-.1.1-.1.1-.2.7-1.1 1.9-1.8 3.3-1.8C18.8 6 21 7.6 21 10.9 21 16.4 12 21 12 21Z" />
    </svg>
  </span>
);

const ChildIcon = ({ color }: { color: string }) => (
  <span style={iconWrapStyle(color)}>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7ZM7 21v-5.3c0-2.6 2.2-4.7 5-4.7s5 2.1 5 4.7V21h-2.2l-.6-3.2-2.2-1-2.2 1L9.2 21H7Z" />
    </svg>
  </span>
);

const OldAgeIcon = ({ color }: { color: string }) => (
  <span style={iconWrapStyle(color)}>
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M15.8 3.5c-2.3 0-4.2 1.7-4.7 4H9.8L4 20.5h2.6l2.1-4.8h3.4L10 20.5h2.6L15 9.8h.8c2.5 0 4.5 2 4.5 4.5 0 1.8-1 3.4-2.6 4.1l1 2c2.3-1.1 3.8-3.5 3.8-6.1 0-3.8-3-6.8-6.7-6.8h-.2c.4-1 .9-1.8 1.8-1.8.7 0 1.2.4 1.5.7l1.4-1.6c-.7-.8-1.9-1.3-3.5-1.3Z" />
    </svg>
  </span>
);

const FormStep4Page: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState<VisionBoardFormData>(defaultFormData);
  const [lifeDesignOpen, setLifeDesignOpen] = useState({
    learn: false,
    work: false,
    residence: false,
    marriage: false,
    child: false,
    oldAge: false,
  });

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

  const toggleLifeDesign = (key: keyof typeof lifeDesignOpen) => {
    setLifeDesignOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    saveMergedFormData(formData);
    navigate("/form/step5");
  };

  const cardStyle = (style: SectionStyle): React.CSSProperties => ({
    marginTop: "18px",
    borderRadius: "18px",
    backgroundColor: style.bg,
    border: `2px solid ${style.border}`,
    overflow: "hidden",
  });

  const cardHeaderStyle = (style: SectionStyle): React.CSSProperties => ({
    width: "100%",
    background: "transparent",
    border: "none",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    color: style.text,
    fontWeight: 800,
    fontSize: "1.05rem",
    textAlign: "left",
  });

  const cardBodyStyle: React.CSSProperties = {
    padding: "0 18px 18px",
    backgroundColor: "#ffffff",
    borderTop: "1px solid rgba(0,0,0,0.06)",
  };

  const helperTextStyle: React.CSSProperties = {
    margin: "0 0 10px",
    color: theme.subText,
    fontSize: "0.92rem",
    lineHeight: 1.7,
    textAlign: "left",
  };

  const groupCardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: `1.5px solid ${theme.border}`,
    borderRadius: "24px",
    padding: "18px 18px 22px",
    boxSizing: "border-box",
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
          {t("form.step4.stepLabel")}
        </p>

        <h1 style={{ fontSize: "2rem", color: theme.text }}>
          {t("form.step4.title")}
        </h1>

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
              width: "80%",
              height: "100%",
              background:
                "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)",
            }}
          />
        </div>

        <form onSubmit={handleNext}>
          <div style={groupCardStyle}>
            <h2
              style={{
                textAlign: "center",
                fontSize: "1.6rem",
                fontWeight: 900,
                color: theme.text,
                margin: "0 0 12px",
              }}
            >
              {t("form.step4.lifeDesignTitle")}
            </h2>

            <img
              src={lifeDesignMap}
              alt={t("form.step4.lifeDesignTitle")}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "14px",
                display: "block",
                margin: "0 0 14px",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <p
                style={{
                  color: theme.subText,
                  lineHeight: 1.8,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {t("form.step4.description")}
              </p>

              <span style={optionalBadgeStyle}>{t("common.optional")}</span>
            </div>

            <div style={cardStyle(lifeDesignStyles.learn)}>
              <button
                type="button"
                onClick={() => toggleLifeDesign("learn")}
                style={cardHeaderStyle(lifeDesignStyles.learn)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <LearnIcon color={lifeDesignStyles.learn.text} />
                  {t("form.step4.learn.title")}
                </span>
                <span>{lifeDesignOpen.learn ? "▾" : "▸"}</span>
              </button>

              {lifeDesignOpen.learn && (
                <div style={cardBodyStyle}>
                  <p style={helperTextStyle}>{t("form.step4.learn.helper")}</p>

                  <label style={labelStyle}>{t("form.step4.learn.want")}</label>
                  <textarea
                    name="learnWant"
                    value={formData.learnWant}
                    onChange={handleChange}
                    placeholder={t("form.step4.learn.wantPlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.learn.reason")}</label>
                  <textarea
                    name="learnReason"
                    value={formData.learnReason}
                    onChange={handleChange}
                    placeholder={t("form.step4.learn.reasonPlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.learn.whenWhere")}</label>
                  <textarea
                    name="learnWhenWhere"
                    value={formData.learnWhenWhere}
                    onChange={handleChange}
                    placeholder={t("form.step4.learn.whenWherePlaceholder")}
                  />
                </div>
              )}
            </div>

            <div style={cardStyle(lifeDesignStyles.work)}>
              <button
                type="button"
                onClick={() => toggleLifeDesign("work")}
                style={cardHeaderStyle(lifeDesignStyles.work)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <WorkIcon color={lifeDesignStyles.work.text} />
                  {t("form.step4.work.title")}
                </span>
                <span>{lifeDesignOpen.work ? "▾" : "▸"}</span>
              </button>

              {lifeDesignOpen.work && (
                <div style={cardBodyStyle}>
                  <p style={helperTextStyle}>{t("form.step4.work.helper")}</p>

                  <label style={labelStyle}>{t("form.step4.work.style")}</label>
                  <textarea
                    name="workStyle"
                    value={formData.workStyle}
                    onChange={handleChange}
                    placeholder={t("form.step4.work.stylePlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.work.values")}</label>
                  <textarea
                    name="workValues"
                    value={formData.workValues}
                    onChange={handleChange}
                    placeholder={t("form.step4.work.valuesPlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.work.incomePlace")}</label>
                  <textarea
                    name="workIdealIncomePlace"
                    value={formData.workIdealIncomePlace}
                    onChange={handleChange}
                    placeholder={t("form.step4.work.incomePlacePlaceholder")}
                  />
                </div>
              )}
            </div>

            <div style={cardStyle(lifeDesignStyles.residence)}>
              <button
                type="button"
                onClick={() => toggleLifeDesign("residence")}
                style={cardHeaderStyle(lifeDesignStyles.residence)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <ResidenceIcon color={lifeDesignStyles.residence.text} />
                  {t("form.step4.residence.title")}
                </span>
                <span>{lifeDesignOpen.residence ? "▾" : "▸"}</span>
              </button>

              {lifeDesignOpen.residence && (
                <div style={cardBodyStyle}>
                  <p style={helperTextStyle}>{t("form.step4.residence.helper")}</p>

                  <label style={labelStyle}>{t("form.step4.residence.place")}</label>
                  <textarea
                    name="residencePlace"
                    value={formData.residencePlace}
                    onChange={handleChange}
                    placeholder={t("form.step4.residence.placePlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.residence.environment")}</label>
                  <textarea
                    name="residenceEnvironment"
                    value={formData.residenceEnvironment}
                    onChange={handleChange}
                    placeholder={t("form.step4.residence.environmentPlaceholder")}
                  />
                </div>
              )}
            </div>

            <div style={cardStyle(lifeDesignStyles.marriage)}>
              <button
                type="button"
                onClick={() => toggleLifeDesign("marriage")}
                style={cardHeaderStyle(lifeDesignStyles.marriage)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <MarriageIcon color={lifeDesignStyles.marriage.text} />
                  {t("form.step4.marriage.title")}
                </span>
                <span>{lifeDesignOpen.marriage ? "▾" : "▸"}</span>
              </button>

              {lifeDesignOpen.marriage && (
                <div style={cardBodyStyle}>
                  <p style={helperTextStyle}>{t("form.step4.marriage.helper")}</p>

                  <label style={labelStyle}>{t("form.step4.marriage.idealRelation")}</label>
                  <textarea
                    name="marriageIdealRelation"
                    value={formData.marriageIdealRelation}
                    onChange={handleChange}
                    placeholder={t("form.step4.marriage.idealRelationPlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.marriage.thoughts")}</label>
                  <textarea
                    name="marriageThoughts"
                    value={formData.marriageThoughts}
                    onChange={handleChange}
                    placeholder={t("form.step4.marriage.thoughtsPlaceholder")}
                  />
                </div>
              )}
            </div>

            <div style={cardStyle(lifeDesignStyles.child)}>
              <button
                type="button"
                onClick={() => toggleLifeDesign("child")}
                style={cardHeaderStyle(lifeDesignStyles.child)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <ChildIcon color={lifeDesignStyles.child.text} />
                  {t("form.step4.child.title")}
                </span>
                <span>{lifeDesignOpen.child ? "▾" : "▸"}</span>
              </button>

              {lifeDesignOpen.child && (
                <div style={cardBodyStyle}>
                  <p style={helperTextStyle}>{t("form.step4.child.helper")}</p>

                  <label style={labelStyle}>{t("form.step4.child.thoughts")}</label>
                  <textarea
                    name="childThoughts"
                    value={formData.childThoughts}
                    onChange={handleChange}
                    placeholder={t("form.step4.child.thoughtsPlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.child.values")}</label>
                  <textarea
                    name="childValues"
                    value={formData.childValues}
                    onChange={handleChange}
                    placeholder={t("form.step4.child.valuesPlaceholder")}
                  />
                </div>
              )}
            </div>

            <div style={cardStyle(lifeDesignStyles.oldAge)}>
              <button
                type="button"
                onClick={() => toggleLifeDesign("oldAge")}
                style={cardHeaderStyle(lifeDesignStyles.oldAge)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <OldAgeIcon color={lifeDesignStyles.oldAge.text} />
                  {t("form.step4.oldAge.title")}
                </span>
                <span>{lifeDesignOpen.oldAge ? "▾" : "▸"}</span>
              </button>

              {lifeDesignOpen.oldAge && (
                <div style={cardBodyStyle}>
                  <p style={helperTextStyle}>{t("form.step4.oldAge.helper")}</p>

                  <label style={labelStyle}>{t("form.step4.oldAge.ideal")}</label>
                  <textarea
                    name="oldAgeIdeal"
                    value={formData.oldAgeIdeal}
                    onChange={handleChange}
                    placeholder={t("form.step4.oldAge.idealPlaceholder")}
                  />

                  <label style={labelStyle}>{t("form.step4.oldAge.preparation")}</label>
                  <textarea
                    name="oldAgePreparation"
                    value={formData.oldAgePreparation}
                    onChange={handleChange}
                    placeholder={t("form.step4.oldAge.preparationPlaceholder")}
                  />
                </div>
              )}
            </div>

          </div>

          <StepNavigation
            backLabel={t("common.back")}
            nextLabel={t("common.next")}
            onBack={() => navigate("/form/step3")}
          />
        </form>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default FormStep4Page;
