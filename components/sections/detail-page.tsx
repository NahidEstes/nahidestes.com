import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { PublicShell } from "@/components/layout/public-shell";
import { ContentCard } from "@/components/ui/content-card";
import { getItem, getItems } from "@/lib/data";
import type { ContentItem, ContentKind } from "@/types/content";

const paths = { posts:"/journal", projects:"/work", photography:"/photography", places:"/places-culture" };

export async function DetailPage({ kind, slug, previewItem }: { kind: ContentKind; slug: string; previewItem?: ContentItem }) {
  const item=previewItem||await getItem(kind,slug); if(!item)notFound(); const related=(await getItems(kind,{category:item.category,limit:4})).filter((entry)=>entry.slug!==item.slug).slice(0,3); const path=paths[kind];
  const url=`https://nahidestes.com${path}/${item.slug}`; const schema={"@context":"https://schema.org","@type":kind==="projects"?"CreativeWork":"BlogPosting",headline:item.title,description:item.excerpt,image:item.featuredImage,datePublished:item.publishedAt,author:{"@type":"Person",name:"Nahid Estes"},mainEntityOfPage:url};
  return <>{previewItem&&<div className="admin-preview-banner"><strong>Secure draft preview</strong><span>This page is visible only to signed-in editors and is not indexed.</span><Link href={`/admin/${kind}/${item._id}/edit`}>Return to editor</Link></div>}<PublicShell><article><header className="article-hero"><Image src={item.featuredImage} alt={item.imageAlt} fill priority sizes="100vw"/><div className="container article-hero-content"><div className="eyebrow">{item.country||item.category}</div><h1 className="display">{item.title}</h1><p>{item.excerpt}</p></div></header><div className="article-body"><div dangerouslySetInnerHTML={{__html:sanitizeHtml(item.content,{allowedTags:["p","h2","h3","blockquote","ul","ol","li","strong","em","a"],allowedAttributes:{a:["href","target","rel"]}})}}/><div className="share-row"><Link className="text-link" href={path}>Back to all</Link><div><a className="text-link" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}>Share</a></div></div></div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/></article>{related.length>0&&<section className="editorial-section" style={{background:"var(--paper)"}}><div className="container"><div className="eyebrow">Continue Exploring</div><h2 className="display section-title">Related stories</h2><div className="archive-grid">{related.map((entry)=><ContentCard key={entry.slug} item={entry} basePath={path}/>)}</div></div></section>}</PublicShell></>;
}
