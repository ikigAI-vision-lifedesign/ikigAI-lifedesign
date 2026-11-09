// src/components/SiteFooter.tsx
// 全ページ共通のコピーライト表記。ブランド名・年号なので多言語化はしない（各言語共通）。
import React from "react";
import { theme } from "../theme";

const SiteFooter: React.FC = () => {
  return (
    <footer
      style={{
        width: "100%",
        textAlign: "center",
        padding: "14px 16px calc(16px + env(safe-area-inset-bottom, 0px))",
        color: theme.subText,
        background: theme.background,
        fontSize: "0.72rem",
        letterSpacing: "0.02em",
      }}
    >
      © 2026 AIvisionboard from ikigAI
    </footer>
  );
};

export default SiteFooter;
