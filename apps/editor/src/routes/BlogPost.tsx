import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useI18n } from "../i18n/index.tsx";
import { Header } from "../components/Header.tsx";
import { Footer } from "../components/Footer.tsx";
import { getPost } from "../content/posts.ts";
import { AdSlot } from "../components/AdSlot.tsx";
import { AD_SLOTS } from "../config.ts";
import { NotFound } from "./NotFound.tsx";

export function BlogPost() {
  const { slug } = useParams();
  const { t, lang, lp } = useI18n();
  const post = slug ? getPost(slug) : undefined;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  if (!post) return <NotFound />;
  return (
    <div className="page">
      <Header />
      <article className="post">
        <Link to={lp("/blog")} className="post-back">← {t("blog.title")}</Link>
        <h1>{post.title[lang]}</h1>
        <p className="post-date">{post.date}</p>
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml[lang] }} />
        <AdSlot slot={AD_SLOTS.blog} />
      </article>
      <Footer />
    </div>
  );
}
