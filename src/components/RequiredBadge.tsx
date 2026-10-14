import React from "react";
import { useTranslation } from "react-i18next";

const RequiredBadge: React.FC = () => {
  const { t } = useTranslation();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: "22px",
        padding: "0 8px",
        marginLeft: "8px",
        borderRadius: "999px",
        background: "linear-gradient(135deg, #67B9E8 0%, #49D3B2 100%)",
        color: "#fff",
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        lineHeight: 1,
        verticalAlign: "middle",
        boxSizing: "border-box",
        whiteSpace: "nowrap",
      }}
    >
      {t("common.required")}
    </span>
  );
};

export default RequiredBadge;
