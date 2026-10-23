// src/components/StepHint.tsx
// 各STEP上部に置く、開閉式の「ヒント」ボックス。text が無ければ何も表示しない。
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../theme";

const BulbIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
  </svg>
);

const StepHint: React.FC<{ text?: string }> = ({ text }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!text || !text.trim()) return null;

  return (
    <div
      style={{
        margin: "0 0 22px",
        border: `1.5px solid ${theme.border}`,
        borderRadius: "14px",
        background: "#fffdf3",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          background: "transparent",
          border: "none",
          padding: "13px 16px",
          cursor: "pointer",
          color: theme.primaryDark,
          fontWeight: 800,
          fontSize: "0.98rem",
          textAlign: "left",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <BulbIcon color={theme.primaryDark} />
          {t("common.hint")}
        </span>
        <span aria-hidden="true" style={{ transition: "transform 0.25s ease", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div
            style={{
              padding: "0 16px 14px",
              color: theme.text,
              fontSize: "0.9rem",
              lineHeight: 1.8,
              whiteSpace: "pre-line",
              textAlign: "left",
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepHint;
