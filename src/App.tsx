import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LanguageSelectPage from "./pages/LanguageSelectPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import FormStep1Page from "./pages/FormStep1Page";
import FormStep2Page from "./pages/FormStep2Page";
import FormStep3Page from "./pages/FormStep3Page";
import FormStep4Page from "./pages/FormStep4Page";
import FormStep5Page from "./pages/FormStep5Page";
import LoadingPage from "./pages/LoadingPage";
import ResultPage from "./pages/ResultPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 🔥 最初はホーム */}
        <Route path="/" element={<HomePage />} />

        {/* 言語選択 */}
        <Route path="/language" element={<LanguageSelectPage />} />

        {/* ログイン */}
        <Route path="/login" element={<LoginPage />} />

        {/* フォーム */}
        <Route path="/form/step1" element={<FormStep1Page />} />
        <Route path="/form/step2" element={<FormStep2Page />} />
        <Route path="/form/step3" element={<FormStep3Page />} />
        <Route path="/form/step4" element={<FormStep4Page />} />
        <Route path="/form/step5" element={<FormStep5Page />} />

        {/* 処理 */}
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
};

export default App;
