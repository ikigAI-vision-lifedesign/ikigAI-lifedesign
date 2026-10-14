// src/pages/IntroPage.tsx
// パスコード入力後に表示する導入ページ（What / Why / Outcome）。
// 流れ：ログイン → このページ → 入力Step1
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n/configs";
import "../styles.css";
import topBanner from "../assets/header.png";
import bottomBanner from "../assets/footer.png";
import ScrollingBanner from "../components/ScrollingBanner";
import leafBottom from "../assets/leaf-bottom.webp";
import { theme } from "../theme";

const BulbIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
  </svg>
);
const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7.5-4.6-10-9.1C.2 8.3 2 4.8 5.3 4.8c2 0 3.3 1.2 4.1 2.4l.1.2.1-.2c.8-1.2 2.1-2.4 4.1-2.4 3.3 0 5.1 3.5 3.3 7.1C19.5 16.4 12 21 12 21z" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="4" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);
const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="none">
    <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.5 9.3l6.6-.9L12 2.5z" />
  </svg>
);
// ブランドロゴ「ikigAI」。serif＋広い字間、2つ目の i の点だけ赤（点なしの ı に赤丸を重ねる）。
const Logo = () => (
  <svg viewBox="0 0 142 42" height="34" role="img" aria-label="ikigAI" style={{ display: "block", margin: "0 auto" }}>
    <g fontFamily='Georgia, "Times New Roman", "Noto Serif JP", serif' fontSize="31" fill="#2b2b2b" textAnchor="middle">
      <text x="13" y="31">i</text>
      <text x="35" y="31">k</text>
      <text x="57" y="31">&#x131;</text>
      <text x="81" y="31">g</text>
      <text x="107" y="31">A</text>
      <text x="131" y="31">I</text>
    </g>
    <circle cx="57" cy="9" r="3.1" fill="#A52544" />
  </svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: "2px" }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type CardProps = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  label: string;
  titleColor: string;
  cardBg: string;
  border: string;
  delay: number;
  children: React.ReactNode;
};
const Card: React.FC<CardProps> = ({ icon, iconBg, title, label, titleColor, cardBg, border, delay, children }) => (
  <div
    className="intro-fade"
    style={{
      display: "flex",
      gap: "14px",
      alignItems: "flex-start",
      background: cardBg,
      border: `1.5px solid ${border}`,
      borderRadius: "18px",
      padding: "16px 16px",
      textAlign: "left",
      animationDelay: `${delay}s`,
    }}
  >
    <div
      style={{
        flex: "none",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: "2px 0 8px" }}>
        <span style={{ color: titleColor, fontWeight: 800, fontSize: "1.05rem" }}>{title}</span>
        <span style={{ color: theme.subText, fontSize: "0.85rem", marginLeft: "6px" }}>{label}</span>
      </p>
      <div style={{ color: theme.text, fontSize: "0.92rem", lineHeight: 1.7 }}>{children}</div>
    </div>
  </div>
);

const IntroPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem("selectedLanguage") || "ja";
    i18n.changeLanguage(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
  }, [i18n]);

  const COL = { teal: "#1f8a7a", pink: "#e85d78", amber: "#d98f1f" };
  const outcomeItems = t("intro.outcome.items", { returnObjects: true }) as string[];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        display: "flex",
        flexDirection: "column",
        fontFamily:
          '"Hiragino Maru Gothic ProN", "Hiragino Maru Gothic Pro", "ヒラギノ丸ゴ ProN W4", "Zen Maru Gothic", sans-serif',
      }}
    >
      <ScrollingBanner src={topBanner} direction="left" />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={leafBottom}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: "min(100%, 560px)",
            height: "auto",
            opacity: 0.92,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ margin: "0 0 18px" }}>
            <Logo />
          </div>

          <h1 style={{ color: theme.text, fontSize: "1.6rem", fontWeight: 800, margin: "0 0 10px" }}>
            {t("intro.title")}
          </h1>
          <p style={{ color: theme.subText, fontWeight: 700, lineHeight: 1.7, margin: "0 0 22px" }}>
            {t("intro.subtitle")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "26px" }}>
            <Card icon={<BulbIcon />} iconBg={COL.teal} title="What" label={t("intro.what.q")} titleColor={COL.teal} cardBg="rgba(255,255,255,0.82)" border={theme.border} delay={0.3}>
              {t("intro.what.body")}
            </Card>

            <Card icon={<HeartIcon />} iconBg={COL.pink} title="Why" label={t("intro.why.q")} titleColor={COL.pink} cardBg="rgba(253,238,242,0.82)" border="#f6d4de" delay={1.3}>
              {t("intro.why.body")}
            </Card>

            <Card icon={<StarIcon />} iconBg={COL.amber} title="Outcome" label={t("intro.outcome.q")} titleColor={COL.amber} cardBg="rgba(252,246,228,0.82)" border="#f0e3bf" delay={2.3}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
                {outcomeItems.map((item) => (
                  <li key={item} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <CheckIcon color={COL.amber} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <button
            type="button"
            className="intro-fade"
            onClick={() => navigate("/form/step1")}
            style={{
              animationDelay: "3.3s",
              width: "100%",
              padding: "16px 22px",
              borderRadius: "999px",
              border: "none",
              background:
                "linear-gradient(135deg, rgba(31,138,122,0.90) 0%, rgba(56,170,150,0.86) 55%, rgba(110,182,232,0.82) 100%)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: "1.1rem",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 8px 20px rgba(31, 138, 122, 0.22)",
            }}
          >
            {t("intro.button")} <ArrowIcon />
          </button>
        </div>
      </div>

      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default IntroPage;
