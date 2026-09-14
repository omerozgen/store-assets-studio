import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="page">
      <Header />
      <section className="final-cta">
        <h1>{t("notFound.title")}</h1>
        <p>{t("notFound.body")}</p>
        <Link to="/" className="btn-primary">
          {t("notFound.cta")}
        </Link>
      </section>
      <Footer />
    </div>
  );
}
