import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App.tsx";
import { I18nProvider } from "./i18n/index.tsx";
import { Seo } from "./components/Seo.tsx";
import { Landing } from "./routes/Landing.tsx";
import { Legal } from "./routes/Legal.tsx";
import { Blog } from "./routes/Blog.tsx";
import { BlogPost } from "./routes/BlogPost.tsx";
import { NotFound } from "./routes/NotFound.tsx";
import { CookieConsent } from "./components/CookieConsent.tsx";
import "./styles.css";

/** İç rota ağacı — hem kök (TR) hem /en (EN) altında aynı sayfalar (nested, göreli yollar). */
function Tree() {
  return (
    <Routes>
      <Route path="" element={<Landing />} />
      <Route path="editor" element={<App />} />
      <Route path="blog" element={<Blog />} />
      <Route path="blog/:slug" element={<BlogPost />} />
      <Route path="privacy" element={<Legal kind="privacy" />} />
      <Route path="terms" element={<Legal kind="terms" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <Seo />
        <Routes>
          {/* /en/* daha spesifik → önce eşleşir; /* TR kökü yakalar */}
          <Route path="/en/*" element={<Tree />} />
          <Route path="/*" element={<Tree />} />
        </Routes>
        <CookieConsent />
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
