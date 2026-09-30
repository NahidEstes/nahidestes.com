import sanitizeHtml from "sanitize-html";
import { LightboxImage } from "@/components/ui/image-lightbox";
import type { ArticleBlock, ArticleImage, ArticleSection, ContentItem } from "@/types/content";

const allowedTags = ["p","h2","h3","blockquote","ul","ol","li","strong","em","a","br"];
const clean = (value: string) => sanitizeHtml(value, { allowedTags, allowedAttributes: { a: ["href","target","rel"] } });
const strip = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
export const slugifyHeading = (value: string) => strip(value).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export function prepareArticle(item: ContentItem) {
  if (item.sections?.length) {
    const source = clean(item.content); const firstHeading = source.search(/<h[23][^>]*>/i);
    return { introduction: firstHeading >= 0 ? source.slice(0, firstHeading) : source, sections: item.sections.map((section,index) => ({ ...section, id: section.id || slugifyHeading(section.heading) || `section-${index+1}`, number: section.number || String(index+1).padStart(2,"0") })) };
  }
  const source = clean(item.content); const headingPattern = /<h2[^>]*>(.*?)<\/h2>/gi; const matches = [...source.matchAll(headingPattern)];
  if (!matches.length) return { introduction: source, sections: [] as ArticleSection[] };
  const introduction = source.slice(0, matches[0].index);
  const sections = matches.map((match,index) => { const start=(match.index||0)+match[0].length; const end=matches[index+1]?.index??source.length; const heading=strip(match[1]); return { id:slugifyHeading(heading)||`section-${index+1}`, number:String(index+1).padStart(2,"0"), heading, blocks:[{type:"paragraph" as const,text:source.slice(start,end)}] }; });
  return { introduction, sections };
}

function ArticlePicture({ image, className = "" }: { image: ArticleImage; className?: string }) {
  const ratio = `${image.width || 1600} / ${image.height || 1000}`;
  return <figure className={`article-picture ${className}`}><div className="article-picture-frame" style={{aspectRatio:ratio}}><LightboxImage src={image.url} alt={image.alt} caption={image.caption} width={image.width} height={image.height} sizes="(max-width: 900px) 100vw, 72vw"/></div>{image.caption && <figcaption>{image.caption}</figcaption>}</figure>;
}

export function ArticleBlockView({ block }: { block: ArticleBlock }) {
  if (block.type === "paragraph") return <div className="article-richtext" dangerouslySetInnerHTML={{__html:clean(block.text)}}/>;
  if (block.type === "heading") return <h3 className="article-subheading">{block.text}</h3>;
  if (block.type === "subheading") return <h4 className="article-minor-heading">{block.text}</h4>;
  if (block.type === "image") return <ArticlePicture image={block.image} className={block.fullWidth ? "full" : ""}/>;
  if (block.type === "text-image") return <div className={`article-split-block image-${block.imagePosition || "right"}`}><div className="article-richtext" dangerouslySetInnerHTML={{__html:clean(block.text)}}/><ArticlePicture image={block.image}/></div>;
  if (block.type === "gallery") return <div className="article-gallery">{block.images.map((image,index)=><ArticlePicture key={`${image.url}-${index}`} image={image}/>)}</div>;
  if (block.type === "blockquote" || (block.type === "pullquote" && block.variant !== "overlay")) return <blockquote className="article-pullquote"><span>“</span><p>{block.text}</p>{block.source&&<cite>— {block.source}</cite>}</blockquote>;
  if (block.type === "pullquote" && block.variant === "overlay" && block.image) return <div className="article-quote-image"><ArticlePicture image={block.image}/><blockquote><span>“</span><p>{block.text}</p>{block.source&&<cite>— {block.source}</cite>}</blockquote></div>;
  if (block.type === "ordered-list" || block.type === "unordered-list") { const Tag=block.type === "ordered-list" ? "ol" : "ul"; return <Tag className="article-list">{block.items.map(item=><li key={item}>{item}</li>)}</Tag>; }
  if (block.type === "divider") return <hr className="article-divider"/>;
  if (block.type === "video") return <div className="article-video"><iframe src={block.url} title={block.title || "Article video"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/></div>;
  if (block.type === "callout") return <aside className="article-callout">{block.title&&<h4>{block.title}</h4>}<p>{block.text}</p></aside>;
  return null;
}

export function ArticleSections({ sections, gallery = [] }: { sections: ArticleSection[]; gallery?: ArticleImage[] }) {
  return <>{sections.map((section,index) => {
    const image = gallery[index]; const blocks = [...section.blocks];
    if (image && !blocks.some(block => block.type === "image" || block.type === "text-image" || block.type === "gallery" || (block.type === "pullquote" && block.variant === "overlay"))) {
      const first = blocks.shift(); if (first?.type === "paragraph") blocks.unshift({ type:"text-image", text:first.text, image, imagePosition:index%2?"left":"right" }); else { if(first)blocks.unshift(first); blocks.push({type:"image",image,fullWidth:index%3===2}); }
    }
    return <section className="article-content-section" id={section.id} key={section.id}><header><span>{section.number}</span><i/><h2>{section.heading}</h2></header>{blocks.map((block,blockIndex)=><ArticleBlockView key={`${section.id}-${blockIndex}`} block={block}/>)}</section>;
  })}</>;
}
