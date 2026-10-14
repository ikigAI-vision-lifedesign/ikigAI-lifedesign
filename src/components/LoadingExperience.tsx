import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../theme";
import ikigaiLogo from "../assets/ikigai-logo.png";
import "../styles.css";

type Props = {
  // 開発プレビュー：ランダム速度で約20秒で100%まで進める
  preview?: boolean;
};

type Tip = { title: string; body: string };

// 各Tipの見た目（アイコン・配色）。文言は i18n から取得。
const TIP_VISUALS = [
  { emoji: "📅", bg: "#EEF6FF", border: "#CFE4F7", color: "#3E8FD0" },
  { emoji: "🧠", bg: "#FDF0F5", border: "#F6D4E0", color: "#D85E86" },
  { emoji: "🤝", bg: "#FFF8EC", border: "#F0E3BF", color: "#CC9227" },
];

const ExternalLinkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const LoadingExperience: React.FC<Props> = ({ preview = false }) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(6);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = (t("loadingPage.tips", { returnObjects: true }) as Tip[]) || [];

  // 進捗バー
  useEffect(() => {
    // プレビューは時間ベース（約17〜23秒で100%）。二重実行されても同じ値になる作り。
    const start = Date.now();
    const duration = 17000 + Math.random() * 6000;
    const id = setInterval(() => {
      setProgress((prev) => {
        if (preview) {
          const elapsed = Date.now() - start;
          const pct = Math.min(100, (elapsed / duration) * 100);
          return Math.max(prev, pct);
        }
        // 本番：実際の生成完了までは95%付近で待機
        return prev < 95 ? prev + Math.max(0.4, (95 - prev) * 0.035) : prev;
      });
    }, 350);
    return () => clearInterval(id);
  }, [preview]);

  // Tipカードの入れ替え
  useEffect(() => {
    if (tips.length === 0) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 3800);
    return () => clearInterval(id);
  }, [tips.length]);

  const visual = TIP_VISUALS[tipIndex % TIP_VISUALS.length];
  const tip = tips[tipIndex] || { title: "", body: "" };

  return (
    <div style={{ width: "100%", maxWidth: "440px", margin: "0 auto", padding: "8px 4px" }}>
      {/* 状態 */}
      <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: theme.text, margin: "0 0 6px", textAlign: "center" }}>
        {t("loadingPage.generatingTitle")}
      </h2>
      <p style={{ color: theme.subText, fontWeight: 700, textAlign: "center", margin: "0 0 18px" }}>
        {t("loadingPage.generatingWait")}
      </p>

      {/* 進捗バー */}
      <div style={{ width: "100%", height: "10px", backgroundColor: "#DDF4EF", borderRadius: "999px", overflow: "hidden", marginBottom: "6px" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(135deg, #6EB6E8 0%, #47D3B1 100%)",
            borderRadius: "999px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <p style={{ textAlign: "right", color: theme.subText, fontSize: "0.8rem", margin: "0 0 28px" }}>
        {Math.round(progress)}%
      </p>

      {/* Tips 見出し */}
      <p style={{ textAlign: "center", color: theme.text, fontWeight: 800, fontSize: "1.1rem", margin: "0 0 2px" }}>
        {t("loadingPage.tipsHeader")} 🌱
      </p>
      <p style={{ textAlign: "center", color: theme.subText, fontSize: "0.9rem", margin: "0 0 14px" }}>
        {t("loadingPage.tipsSubtitle")}
      </p>

      {/* 入れ替わる Tip カード */}
      <div
        key={tipIndex}
        className="intro-fade"
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
          background: visual.bg,
          border: `1.5px solid ${visual.border}`,
          borderRadius: "18px",
          padding: "18px 16px",
          textAlign: "left",
          minHeight: "92px",
        }}
      >
        <div
          style={{
            flex: "none",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#fff",
            border: `1.5px solid ${visual.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}
        >
          {visual.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "2px 0 6px", color: visual.color, fontWeight: 800, fontSize: "1.05rem" }}>{tip.title}</p>
          <p style={{ margin: 0, color: theme.text, fontSize: "0.92rem", lineHeight: 1.7 }}>{tip.body}</p>
        </div>
      </div>

      {/* インジケータ */}
      <div style={{ display: "flex", justifyContent: "center", gap: "7px", marginTop: "14px" }}>
        {tips.map((_, i) => (
          <span
            key={i}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: i === tipIndex ? theme.primaryDark : theme.border,
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* 公式サイトへのバナー（別タブ） */}
      <a
        href="https://ikigai96.studio.site/"
        target="_blank"
        rel="noreferrer"
        aria-label={t("loadingPage.visitSite")}
        style={{ display: "block", textDecoration: "none", marginTop: "24px" }}
      >
        <div
          className="loading-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            background: "#ffffff",
            border: `1.5px solid ${theme.border}`,
            borderRadius: "14px",
            padding: "12px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <img src={ikigaiLogo} alt="ikigAI" style={{ height: "42px", width: "auto", display: "block" }} />
          <span
            style={{
              color: theme.primaryDark,
              fontWeight: 800,
              fontSize: "0.92rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {t("loadingPage.visitSite")}
            <ExternalLinkIcon />
          </span>
        </div>
      </a>
    </div>
  );
};

export default LoadingExperience;
