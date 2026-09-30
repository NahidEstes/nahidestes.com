import { Types, type Model } from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Post } from "@/models/Post";
import { Project } from "@/models/Project";
import { PhotographyGallery } from "@/models/PhotographyGallery";
import { PlaceStory } from "@/models/PlaceStory";
import { Category } from "@/models/Category";
import { Subscriber } from "@/models/Subscriber";
import { ContactMessage } from "@/models/ContactMessage";
import { SiteSettings } from "@/models/SiteSettings";

export const collectionNames = ["posts", "projects", "photography", "places", "categories", "subscribers", "messages", "settings"] as const;
export const contentCollections = ["posts", "projects", "photography", "places"] as const;
export type AdminCollection = (typeof collectionNames)[number];
export type ContentCollection = (typeof contentCollections)[number];
export type AdminRole = "admin" | "editor";

const modelMap = { posts: Post, projects: Project, photography: PhotographyGallery, places: PlaceStory, categories: Category, subscribers: Subscriber, messages: ContactMessage, settings: SiteSettings };

export function isAdminCollection(value: string): value is AdminCollection {
  return collectionNames.includes(value as AdminCollection);
}

export function isContentCollection(value: string): value is ContentCollection {
  return contentCollections.includes(value as ContentCollection);
}

export function getAdminModel(collection: AdminCollection) {
  return modelMap[collection] as unknown as Model<Record<string, unknown>>;
}

export function isValidObjectId(id: string) {
  return Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;
}

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ ok: false, error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } }, { status });
}

export async function requireAdminActor(roles: AdminRole[] = ["admin", "editor"]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: apiError(401, "UNAUTHORIZED", "Please sign in to continue.") } as const;
  const role = session.user.role as AdminRole;
  if (!roles.includes(role)) return { response: apiError(403, "FORBIDDEN", "You do not have permission to perform this action.") } as const;
  return { actor: { id: session.user.id, name: session.user.name || session.user.email || "Unknown editor", role } } as const;
}

export function collectionLabel(collection: ContentCollection) {
  return ({ posts: "Post", projects: "Project", photography: "Photography", places: "Place story" } as const)[collection];
}

export function publicPath(collection: ContentCollection, slug: string) {
  const base = { posts: "/journal", projects: "/work", photography: "/photography", places: "/places-culture" }[collection];
  return `${base}/${slug}`;
}

export function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.reduce<Record<string, string[]>>((result, issue) => {
    const key = issue.path.join(".") || "form";
    result[key] = [...(result[key] || []), issue.message];
    return result;
  }, {});
}

export function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}
