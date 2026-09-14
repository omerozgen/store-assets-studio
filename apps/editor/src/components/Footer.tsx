import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.tsx";
import { Logo } from "./Logo.tsx";

export function Footer() {
  const { t, lp } = useI18n();
  return (
    <footer className="site-footer">
      <div className="foot-brand">
        <Link to={lp("/")} className="brand-link">
          <Logo size={22} />
          <span>{t("brand")}</span>
        </Link>
        <p>{t("footer.tagline")}</p>
      </div>
      <div className="foot-cols">
        <div>
          <h4>{t("footer.product")}</h4>
          <Link to={lp("/editor")}>{t("nav.editor")}</Link>
          <Link to={lp("/blog")}>{t("nav.blog")}</Link>
          <Link to={lp("/")}>{t("nav.home")}</Link>
        </div>
        <div>
          <h4>{t("footer.legal")}</h4>
          <Link to={lp("/privacy")}>{t("nav.privacy")}</Link>
          <Link to={lp("/terms")}>{t("nav.terms")}</Link>
        </div>
      </div>
      <div className="foot-rights">{t("footer.rights", { year: 2026 })}</div>
    </footer>
  );
}
