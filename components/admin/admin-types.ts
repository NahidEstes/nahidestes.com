import type { AdminContentRow, ContentCollection } from "@/types/content";

export type AdminRole = "admin" | "editor";
export type AdminRow = AdminContentRow & { name?: string; email?: string; subject?: string };
export type ApiError = { code: string; message: string; fieldErrors?: Record<string, string[]> };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export const editableCollections: ContentCollection[] = ["posts", "projects", "photography", "places"];
export const contentLabels: Record<ContentCollection, string> = {
  posts: "Post",
  projects: "Project",
  photography: "Photography",
  places: "Place story",
};
export const publicBases: Record<ContentCollection, string> = {
  posts: "/journal",
  projects: "/work",
  photography: "/photography",
  places: "/places-culture",
};

export async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(input, init);
    const payload = await response.json() as ApiResult<T>;
    if (!response.ok) {
      if (!payload || payload.ok !== false) return { ok: false, error: { code: "REQUEST_FAILED", message: "The request could not be completed." } };
      return payload;
    }
    return payload;
  } catch {
    return { ok: false, error: { code: "NETWORK_ERROR", message: "Network error. Check your connection and try again." } };
  }
}
