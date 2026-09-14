import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/index.tsx";
import { LangSwitcher } from "./LangSwitcher.tsx";
import { Logo } from "./Logo.tsx";

/** Public sayfaların üst çubuğu (landing + legal). Editörün kendi başlığı ayrıdır. */
export function Header() {
  const { t, lp } = useI18n();
  const onEditor = useLocation().pathname.replace(/^\/en/, "").startsWith("/editor");
  return (
    <header className="site-header">
      <Link to={lp("/")} className="brand-link" aria-label="Vitrinshot">
        <Logo />
        <span>{t("brand")}</span>
      </Link>
      <nav className="site-nav">
        <Link to={lp("/blog")} className="nav-link">{t("nav.blog")}</Link>
        <LangSwitcher />
        {!onEditor && (
          <Link to={lp("/editor")} className="btn-primary sm">
            {t("nav.openEditor")}
          </Link>
        )}
      </nav>
    </header>
  );
}
