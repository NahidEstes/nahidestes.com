"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Check, Copy, Link2, Share2 } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

export type TocItem = { id: string; number: string; title: string };
export type RelatedStory = { title: string; href: string; image: string; imageAlt: string; label: string };

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const article = document.querySelector("[data-article-body]");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = Math.max(1, article.scrollHeight - window.innerHeight);
      setProgress(Math.min(100, Math.max(0, ((-rect.top + 92) / total) * 100)));
    };
    update(); window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return <div className="reading-progress" aria-hidden="true"><span style={{ width: `${progress}%` }}/></div>;
}

export function HeroArticleActions({ articleId, title, url }: { articleId: string; title: string; url: string }) {
  const [message, setMessage] = useState("");
  const saved = useSyncExternalStore(
    (onStoreChange) => { window.addEventListener("storage", onStoreChange); window.addEventListener("nahid-bookmarks", onStoreChange); return () => { window.removeEventListener("storage", onStoreChange); window.removeEventListener("nahid-bookmarks", onStoreChange); }; },
    () => (JSON.parse(localStorage.getItem("nahid-bookmarks") || "[]") as string[]).includes(articleId),
    () => false,
  );
  const bookmark = () => { const ids = JSON.parse(localStorage.getItem("nahid-bookmarks") || "[]") as string[]; const next = saved ? ids.filter(id => id !== articleId) : [...new Set([...ids, articleId])]; localStorage.setItem("nahid-bookmarks", JSON.stringify(next)); window.dispatchEvent(new Event("nahid-bookmarks")); setMessage(saved ? "Removed from saved stories" : "Saved for later"); };
  const share = async () => { if (navigator.share) { await navigator.share({ title, url }); return; } await navigator.clipboard.writeText(url); setMessage("Link copied"); };
  return <div className="hero-article-actions"><button type="button" onClick={bookmark} aria-pressed={saved}><Bookmark size={17} fill={saved ? "currentColor" : "none"}/>{saved ? "Saved" : "Save"}</button><button type="button" onClick={share}><Share2 size={17}/>Share</button><span className="sr-only" role="status">{message}</span></div>;
}

export function ArticleSidebarTools({ toc, relatedStories, tags, basePath, url, title }: { toc: TocItem[]; relatedStories: RelatedStory[]; tags: string[]; basePath: string; url: string; title: string }) {
  const [active, setActive] = useState(toc[0]?.id || ""); const [copied, setCopied] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { const visible = entries.filter(entry => entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0]; if (visible) setActive(visible.target.id); }, { rootMargin: "-90px 0px -68% 0px" });
    toc.forEach(item => { const element = document.getElementById(item.id); if (element) observer.observe(element); }); return () => observer.disconnect();
  }, [toc]);
  const encoded = useMemo(() => ({ url: encodeURIComponent(url), title: encodeURIComponent(title) }), [url, title]);
  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const tocList = <ol>{toc.map(item => <li key={item.id} className={active === item.id ? "active" : ""}><a href={`#${item.id}`}><span>{item.number}</span>{item.title}</a></li>)}</ol>;
  return <>
    <section className="article-side-card toc-card"><h2>Table of contents</h2><div className="desktop-toc">{tocList}</div><details className="mobile-toc"><summary>Explore this article</summary>{tocList}</details></section>
    {relatedStories.length > 0 && <section className="article-side-card related-stories-card"><h2>Related Stories</h2><div className="sidebar-related-list">{relatedStories.map(story => <Link key={story.href} href={story.href} className="sidebar-related-story"><span className="sidebar-related-thumb"><Image src={story.image} alt={story.imageAlt} fill sizes="96px"/></span><span><small>{story.label}</small><strong>{story.title}</strong></span></Link>)}</div></section>}
    <section className="article-side-card"><h2>Tags</h2><div className="article-tags">{tags.map(tag => <a key={tag} href={`${basePath}?tag=${encodeURIComponent(tag)}`}>{tag}</a>)}</div></section>
    <section className="article-side-card"><h2>Share this article</h2><div className="article-share-icons"><a aria-label="Share on X" href={`https://twitter.com/intent/tweet?url=${encoded.url}&text=${encoded.title}`}>X</a><a aria-label="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encoded.url}`}>f</a><a aria-label="Share on Pinterest" href={`https://pinterest.com/pin/create/button/?url=${encoded.url}&description=${encoded.title}`}>P</a><a aria-label="Share on LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url}`}>in</a><button type="button" aria-label="Copy article link" onClick={copy}>{copied ? <Check size={17}/> : <Link2 size={17}/>}</button></div><div className="copy-toast" role="status" aria-live="polite">{copied ? <><Copy size={14}/> Link copied</> : ""}</div></section>
  </>;
}
