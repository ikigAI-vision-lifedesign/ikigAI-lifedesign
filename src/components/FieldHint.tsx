// src/components/FieldHint.tsx
// 質問ラベルの横に置く「？」アイコン。タップでその質問のヒントをポップ表示。
// text が無ければ何も表示しない（ヒントのある質問にだけ出る）。
// ポップは position:fixed ＋ 画面内クランプで、端でも見切れない。
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../theme";

const FieldHint: React.FC<{ text?: string }> = ({ text }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 260 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = Math.min(260, Math.round(window.innerWidth * 0.82));
    const margin = 10;
    let left = r.left;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
    if (left < margin) left = margin;
    setPos({ top: r.bottom + 6, left: left, width: width });
  };

  const toggle = () => {
    if (!open) place();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (popRef.current && popRef.current.contains(target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (!text || !text.trim()) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={t("common.hint")}
        aria-expanded={open}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: `1.5px solid ${theme.primary}`,
          background: open ? theme.primary : "#ffffff",
          color: open ? "#ffffff" : theme.primaryDark,
          fontSize: "0.74rem",
          fontWeight: 900,
          lineHeight: 1,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          marginLeft: "7px",
          verticalAlign: "middle",
          flex: "none",
        }}
      >
        ?
      </button>

      {open && (
        <div
          ref={popRef}
          role="tooltip"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 1000,
            background: "#ffffff",
            border: `1.5px solid ${theme.primary}`,
            borderRadius: "12px",
            padding: "11px 13px",
            boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
            color: theme.text,
            fontSize: "0.85rem",
            fontWeight: 600,
            lineHeight: 1.7,
            whiteSpace: "pre-line",
            textAlign: "left",
          }}
        >
          {text}
        </div>
      )}
    </>
  );
};

export default FieldHint;
