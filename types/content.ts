export type ContentKind = "posts" | "projects" | "photography" | "places";

export interface ArticleImage {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  decorative?: boolean;
}

export type ArticleBlock =
  | { id?: string; type: "paragraph"; text: string }
  | { id?: string; type: "heading" | "subheading"; text: string }
  | { id?: string; type: "image"; image: ArticleImage; fullWidth?: boolean }
  | { id?: string; type: "text-image"; text: string; image: ArticleImage; imagePosition?: "left" | "right"; emphasis?: "balanced" | "image" | "text" }
  | { id?: string; type: "gallery"; images: ArticleImage[]; layout?: "grid" | "two-columns" | "editorial-strip" | "full-width" }
  | { id?: string; type: "blockquote" | "pullquote"; text: string; source?: string; variant?: "inline" | "card" | "overlay"; image?: ArticleImage }
  | { id?: string; type: "ordered-list" | "unordered-list"; items: string[] }
  | { id?: string; type: "divider" }
  | { id?: string; type: "video"; url: string; title?: string }
  | { id?: string; type: "callout"; title?: string; text: string };

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
  featuredImageCaption?: string;
  featuredImageWidth?: number;
  featuredImageHeight?: number;
  featuredImageDecorative?: boolean;
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
  authorImageAlt?: string;
  authorImageCaption?: string;
  authorImageWidth?: number;
  authorImageHeight?: number;
  authorImageDecorative?: boolean;
  readingTime?: number;
  modifiedAt?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageCaption?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageDecorative?: boolean;
  technologies?: string[];
  projectUrl?: string;
  repositoryUrl?: string;
  year?: number;
  order?: number;
  deletedAt?: string | null;
  version?: number;
}

export type ContentCollection = "posts" | "projects" | "photography" | "places";

export interface AdminContentRow {
  _id: string;
  collection: ContentCollection;
  contentType: string;
  title: string;
  slug: string;
  status: string;
  isFeatured?: boolean;
  featuredImage?: string;
  imageAlt?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  publishedAt?: string | null;
  scheduledAt?: string | null;
  country?: string;
  location?: string;
  technologies?: string[];
  year?: number;
  order?: number;
  capturedAt?: string | null;
  authorName?: string;
  version?: number;
  updatedAt?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export type ContentListStatus = "all" | "published" | "draft" | "scheduled" | "trash";

export interface ContentPagination {
  page: number;
  limit: number;
  total: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ContentStatusCounts {
  all: number;
  published: number;
  draft: number;
  scheduled: number;
  trash: number;
  featured: number;
}

export interface ContentFilterOptions {
  categories: string[];
  tags: string[];
  countries?: string[];
  locations?: string[];
  technologies?: string[];
  years?: number[];
  authors?: string[];
}

export interface PaginatedContentResponse {
  items: AdminContentRow[];
  pagination: ContentPagination;
  statusCounts: ContentStatusCounts;
  filterOptions: ContentFilterOptions;
}

export type ContentBulkAction =
  | "publish"
  | "draft"
  | "schedule"
  | "feature"
  | "unfeature"
  | "trash"
  | "restore"
  | "delete"
  | "category"
  | "addTags"
  | "removeTags";

export interface ContentBulkResult {
  affected: number;
  failed: Array<{ id: string; title?: string; message: string }>;
}

export interface SiteSettingsData {
  siteTitle: string;
  tagline: string;
  biography: string;
  profileImage: string;
  email: string;
  socialLinks: Record<string, string>;
}
