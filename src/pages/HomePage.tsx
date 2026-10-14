// src/pages/HomePage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import topBanner from "../assets/header.png";
import ScrollingBanner from "../components/ScrollingBanner";
import bottomBanner from "../assets/footer.png";
import ikigaiLogo from "../assets/ikigai-logo.png";
import { theme } from "../theme";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: theme.background,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Banner */}
      <ScrollingBanner src={topBanner} direction="left" />

      {/* Main Content（上下バナーの間を埋めて縦中央に配置） */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
          padding: "48px 16px",
        }}
      >
        {/* Title */}
        <h1
          style={{
            color: theme.text,
            fontFamily: '"Playfair Display", serif',
            fontSize: "2.2rem",
            fontWeight: 700,
            margin: "0 0 18px",
            letterSpacing: "0.01em",
          }}
        >
          Welcome to
        </h1>

        {/* Logo */}
        <img
          src={ikigaiLogo}
          alt="ikigAI"
          style={{ width: "100%", maxWidth: "340px", height: "auto", display: "block", margin: "0 auto" }}
        />

        {/* CTA Button */}
        <button
          type="button"
          onClick={() => navigate("/language")}
          style={{
            marginTop: "24px",
            padding: "16px 40px",
            borderRadius: "999px",
            border: "none",
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
            color: "#fff",
            fontSize: "1.1rem",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Start Vision Board
        </button>
      </div>

      {/* Bottom Banner */}
      <ScrollingBanner src={bottomBanner} direction="right" />
    </div>
  );
};

export default HomePage;
