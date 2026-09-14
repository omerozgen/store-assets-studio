import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { POSTS } from "../content/posts.ts";

export function Blog() {
  const { t, lang, lp } = useI18n();
  return (
    <div className="page">
      <Header />
      <section className="blog-list">
        <h1>{t("blog.title")}</h1>
        <p className="blog-sub">{t("blog.sub")}</p>
        <div className="post-grid">
          {POSTS.map((p) => (
            <Link key={p.slug} to={lp(`/blog/${p.slug}`)} className="post-card">
              <h2>{p.title[lang]}</h2>
              <p>{p.description[lang]}</p>
              <span className="post-date">{p.date}</span>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
