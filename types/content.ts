export type ContentKind = "posts" | "projects" | "photography" | "places";

export interface ArticleImage {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading" | "subheading"; text: string }
  | { type: "image"; image: ArticleImage; fullWidth?: boolean }
  | { type: "text-image"; text: string; image: ArticleImage; imagePosition?: "left" | "right" }
  | { type: "gallery"; images: ArticleImage[] }
  | { type: "blockquote" | "pullquote"; text: string; source?: string; variant?: "inline" | "overlay"; image?: ArticleImage }
  | { type: "ordered-list" | "unordered-list"; items: string[] }
  | { type: "divider" }
  | { type: "video"; url: string; title?: string }
  | { type: "callout"; title?: string; text: string };

export interface ArticleSection {
  id?: string;
  number?: string;
  heading: string;
  blocks: ArticleBlock[];
}

export interface ContentItem {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  imageAlt: string;
  category: string;
  tags: string[];
  location?: string;
  country?: string;
  status: "draft" | "published" | "scheduled";
  publishedAt: string;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  gallery?: ArticleImage[];
  sections?: ArticleSection[];
  authorName?: string;
  authorTitle?: string;
  authorBio?: string;
  authorImage?: string;
  readingTime?: number;
  modifiedAt?: string;
  ogImage?: string;
  technologies?: string[];
  projectUrl?: string;
  repositoryUrl?: string;
  year?: number;
}

export interface SiteSettingsData {
  siteTitle: string;
  tagline: string;
  biography: string;
  profileImage: string;
  email: string;
  socialLinks: Record<string, string>;
}
