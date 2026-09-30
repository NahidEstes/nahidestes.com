import Image from "next/image";
import Link from "next/link";
import type { ContentItem } from "@/types/content";

export function ContentCard({ item, basePath, index }: { item: ContentItem; basePath: string; index?: number }) {
  return <article className="card story-card"><Link href={`${basePath}/${item.slug}`} aria-label={item.title}><div className="card-image"><Image src={item.featuredImage} alt={item.imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"/></div></Link><div className="card-meta"><div>{typeof index==="number"&&<div className="card-number">{String(index+1).padStart(2,"0")}</div>}<div className="meta">{item.country || item.category}</div><h3><Link href={`${basePath}/${item.slug}`}>{item.title}</Link></h3><div className="tags">{item.tags.join(" · ")}</div>{item.excerpt&&<p>{item.excerpt}</p>}<Link className="text-link" href={`${basePath}/${item.slug}`}>Read More</Link></div>{basePath==="/work"&&<Link className="round-arrow" aria-label={`View ${item.title}`} href={`${basePath}/${item.slug}`}>→</Link>}</div></article>;
}
