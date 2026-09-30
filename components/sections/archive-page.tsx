import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { ContentCard } from "@/components/ui/content-card";
import { getItems } from "@/lib/data";
import type { ContentKind } from "@/types/content";

const copy = {
  projects: { eyebrow:"Selected Work", title:"Digital work with purpose", intro:"A collection of product, design and development work made to be useful, thoughtful and enduring.", path:"/work" },
  photography: { eyebrow:"Photography", title:"Stories held in a frame", intro:"Food, architecture, landscapes and quiet street scenes gathered from near and far.", path:"/photography" },
  posts: { eyebrow:"The Journal", title:"Notes on making and noticing", intro:"Field notes on travel, photography, culture, food and the work of building thoughtful digital experiences.", path:"/journal" },
  places: { eyebrow:"Places & Culture", title:"People, place and tradition", intro:"Longer stories about the rituals, craft, food and history that give a place its character.", path:"/places-culture" },
};

export async function ArchivePage({ kind, searchParams }: { kind: ContentKind; searchParams: Promise<{ category?: string; tag?: string; page?: string }> }) {
  const params=await searchParams; const all=await getItems(kind,{category:params.category,tag:params.tag,page:Number(params.page)||1,limit:12}); const base=copy[kind];
  const categories=["All",...new Set((await getItems(kind,{limit:100})).map((item)=>item.category))];
  const filterQuery=params.tag?`tag=${encodeURIComponent(params.tag)}`:params.category?`category=${encodeURIComponent(params.category)}`:"";
  const pageHref=(page:number)=>`${base.path}?${filterQuery ? `${filterQuery}&` : ""}page=${page}`;
  return <PublicShell><section className="inner-hero"><div className="container"><div className="eyebrow">{base.eyebrow}</div><h1 className="display">{base.title}</h1><p>{base.intro}</p></div></section><section className="archive"><div className="container"><nav className="filter-row" aria-label="Filter by category">{categories.map((category)=><Link className="filter" key={category} href={category==="All"?base.path:`${base.path}?category=${encodeURIComponent(category)}`}>{category}</Link>)}</nav>{params.tag&&<p className="eyebrow" style={{marginBottom:"1.5rem"}}>Stories tagged “{params.tag}”</p>}{all.length?<div className="archive-grid">{all.map((item,index)=><ContentCard key={item.slug} item={item} basePath={base.path} index={index}/>)}</div>:<div className="empty">No published stories match this filter yet.</div>}<div className="filter-row" style={{justifyContent:"center",marginTop:"3rem"}}><Link className="filter" href={pageHref(Math.max(1,(Number(params.page)||1)-1))}>← Previous</Link><Link className="filter" href={pageHref((Number(params.page)||1)+1)}>Next →</Link></div></div></section></PublicShell>;
}
