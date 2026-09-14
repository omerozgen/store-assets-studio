import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { AdSlot } from "../components/AdSlot.tsx";
import { AD_SLOTS } from "../config.ts";

const FEATURES = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
const STEPS = ["s1", "s2", "s3"] as const;

export function Landing() {
  const { t, lp } = useI18n();
  return (
    <div className="page">
      <Header />

      <section className="hero">
        <span className="hero-badge">{t("landing.badge")}</span>
        <h1>{t("landing.heroTitle")}</h1>
        <p className="hero-sub">{t("landing.heroSubtitle")}</p>
        <div className="hero-cta">
          <Link to={lp("/editor")} className="btn-primary">
            {t("landing.ctaPrimary")}
          </Link>
          <a href="#how" className="btn-ghost">
            {t("landing.ctaSecondary")}
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-phone" />
          <div className="hero-phone" />
          <div className="hero-phone" />
        </div>
      </section>

      <section className="features">
        <h2>{t("landing.featuresTitle")}</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f} className="feature">
              <h3>{t(`landing.${f}.title`)}</h3>
              <p>{t(`landing.${f}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="how">
        <h2>{t("landing.howTitle")}</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <span className="step-n">{i + 1}</span>
              <div>
                <h3>{t(`landing.${s}.title`)}</h3>
                <p>{t(`landing.${s}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <AdSlot slot={AD_SLOTS.landing} />

      <section className="final-cta">
        <h2>{t("landing.finalTitle")}</h2>
        <p>{t("landing.finalBody")}</p>
        <Link to="/editor" className="btn-primary">
          {t("landing.ctaPrimary")}
        </Link>
      </section>

      <Footer />
    </div>
  );
}
