import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { Clock3 } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ArticleSections, prepareArticle } from "@/components/article/article-blocks";
import { ArticleSidebarTools, HeroArticleActions, ReadingProgress } from "@/components/article/article-tools";
import { ImageLightboxProvider, LightboxImage } from "@/components/ui/image-lightbox";
import { getItem, getItems, getSettings } from "@/lib/data";
import type { ContentItem } from "@/types/content";

const paths: Record<"posts"|"places",string> = { posts:"/journal", places:"/places-culture" };
const labels: Record<"posts"|"places",string> = { posts:"Journal", places:"Places & Culture" };

function calculateReadingTime(item: ContentItem) {
  if (item.readingTime) return item.readingTime;
  const sectionText = item.sections?.flatMap(section => section.blocks.map(block => "text" in block ? block.text : "items" in block ? block.items.join(" ") : "")).join(" ") || "";
  const words = sanitizeHtml(`${item.content} ${sectionText}`, { allowedTags: [], allowedAttributes: {} }).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month:"short", day:"numeric", year:"numeric" }).format(new Date(value)); }

function AdjacentArticle({ item, direction, path }: { item: ContentItem; direction: "Previous"|"Next"; path: string }) {
  return <Link className={`adjacent-article ${direction.toLowerCase()}`} href={`${path}/${item.slug}`}><span className="adjacent-arrow">{direction === "Previous" ? "←" : "→"}</span><div className="adjacent-thumb"><Image src={item.featuredImage} alt="" fill sizes="100px"/></div><div><small>{direction} Article</small><strong>{item.title}</strong></div></Link>;
}

export async function ArticleDetailPage({ kind, slug }: { kind: "posts"|"places"; slug: string }) {
  const otherKind = kind === "posts" ? "places" : "posts"; const otherPath = paths[otherKind];
  const [item, settings, all, otherItems] = await Promise.all([getItem(kind,slug), getSettings(), getItems(kind,{limit:100}), getItems(otherKind,{limit:100})]);
  if (!item || item.status !== "published") notFound();
  const path = paths[kind]; const canonical = `https://nahidestes.com${path}/${item.slug}`; const prepared = prepareArticle(item); const gallery = item.gallery || [];
  const toc = prepared.sections.map((section,index) => ({ id:section.id || `section-${index+1}`, number:section.number || String(index+1).padStart(2,"0"), title:section.heading }));
  const currentIndex = all.findIndex(entry => entry.slug === item.slug); const previous = currentIndex >= 0 ? all[currentIndex+1] : undefined; const next = currentIndex > 0 ? all[currentIndex-1] : undefined;
  const score=(entry:ContentItem)=>entry.tags.filter(tag=>item.tags.includes(tag)).length*10+(entry.category===item.category?4:0);
  const related = [...all.filter(entry => entry.slug !== item.slug).map(entry=>({entry,path})),...otherItems.map(entry=>({entry,path:otherPath}))].sort((a,b) => score(b.entry)-score(a.entry)||new Date(b.entry.publishedAt).getTime()-new Date(a.entry.publishedAt).getTime()).slice(0,3);
  const author = { name:item.authorName || settings.siteTitle, title:item.authorTitle || settings.tagline, bio:item.authorBio || settings.biography, image:item.authorImage || settings.profileImage };
  const readingTime = calculateReadingTime(item);
  const breadcrumbSchema = { "@type":"BreadcrumbList", itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:"https://nahidestes.com"},{"@type":"ListItem",position:2,name:labels[kind],item:`https://nahidestes.com${path}`},{"@type":"ListItem",position:3,name:item.title,item:canonical}] };
  const schema = { "@context":"https://schema.org", "@graph":[{ "@type":kind==="posts"?"BlogPosting":"Article", "@id":`${canonical}#article`, headline:item.title, description:item.seoDescription||item.excerpt, image:item.ogImage||item.featuredImage, datePublished:item.publishedAt, dateModified:item.modifiedAt||item.publishedAt, mainEntityOfPage:canonical, author:{"@id":"https://nahidestes.com/#person"}, publisher:{"@id":"https://nahidestes.com/#person"}, keywords:item.tags.join(", ") },{ "@type":"Person", "@id":"https://nahidestes.com/#person", name:author.name, description:author.bio, image:author.image, url:"https://nahidestes.com/about", jobTitle:author.title },breadcrumbSchema] };
  return <ImageLightboxProvider><PublicShell inner={false}><ReadingProgress/><article className="article-detail">
    <header className="article-detail-hero"><LightboxImage src={item.featuredImage} alt={item.imageAlt} width={2000} height={1400} priority sizes="100vw" className="hero-lightbox-trigger"/><div className="container article-detail-hero-content"><div className="eyebrow">{item.country || item.category}</div><h1 className="display">{item.title}</h1><p>{item.excerpt}</p><div className="article-hero-bottom"><div className="article-author-meta"><span className="author-avatar"><Image src={author.image} alt={author.name} fill sizes="44px"/></span><span>By {author.name}</span><i/><time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time><i/><span><Clock3 size={15}/>{readingTime} min read</span></div><HeroArticleActions articleId={item._id || `${kind}:${item.slug}`} title={item.title} url={canonical}/></div></div></header>
    <nav className="article-breadcrumbs" aria-label="Breadcrumb"><div className="container"><ol><li><Link href="/">Home</Link></li><li><Link href={path}>{labels[kind]}</Link></li><li aria-current="page">{item.title}</li></ol></div></nav>
    <div className="container article-layout" data-article-body><main className="article-main"><section className={`article-introduction ${gallery[0]?"with-image":""}`}><div className="article-intro-copy" dangerouslySetInnerHTML={{__html:prepared.introduction}}/>{gallery[0]&&<figure><div><LightboxImage src={gallery[0].url} alt={gallery[0].alt} caption={gallery[0].caption} width={gallery[0].width} height={gallery[0].height} sizes="(max-width:900px) 100vw, 36vw"/></div>{gallery[0].caption&&<figcaption>{gallery[0].caption}</figcaption>}</figure>}</section><ArticleSections sections={prepared.sections} gallery={gallery.slice(1)}/><nav className="article-adjacent" aria-label="Previous and next articles">{previous&&<AdjacentArticle item={previous} direction="Previous" path={path}/>} {next&&<AdjacentArticle item={next} direction="Next" path={path}/>}</nav></main>
      <aside className="article-sidebar"><section className="article-side-card author-card"><h2>About the author</h2><div className="author-card-head"><span><Image src={author.image} alt={author.name} fill sizes="62px"/></span><div><strong>{author.name}</strong><small>{author.title}</small></div></div><p>{author.bio}</p><Link className="text-link" href="/about">More About Me</Link></section><ArticleSidebarTools toc={toc} tags={item.tags} basePath={path} url={canonical} title={item.title}/></aside>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
  </article>{related.length>0&&<section className="article-related"><div className="container"><h2 className="display">Related Stories</h2><div className="article-related-grid">{related.map(({entry,path:relatedPath})=><article key={`${relatedPath}-${entry.slug}`}><Link className="related-thumb" href={`${relatedPath}/${entry.slug}`}><Image src={entry.featuredImage} alt={entry.imageAlt} fill sizes="(max-width:700px) 100vw, 33vw"/></Link><div><span>{entry.country||entry.category}</span><h3><Link href={`${relatedPath}/${entry.slug}`}>{entry.title}</Link></h3><p>{entry.excerpt}</p><Link className="text-link" href={`${relatedPath}/${entry.slug}`}>Read More</Link></div></article>)}</div></div></section>}</PublicShell></ImageLightboxProvider>;
}
