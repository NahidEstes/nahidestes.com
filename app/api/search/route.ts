import { NextResponse } from "next/server";
import { getItems } from "@/lib/data";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 120) || "";
  if (!q) return NextResponse.json([]);
  const [posts, projects, photography, places] = await Promise.all([getItems("posts", { query: q }), getItems("projects", { query: q }), getItems("photography", { query: q }), getItems("places", { query: q })]);
  return NextResponse.json([...posts.map((item) => ({ ...item, kind: "journal" })), ...projects.map((item) => ({ ...item, kind: "work" })), ...photography.map((item) => ({ ...item, kind: "photography" })), ...places.map((item) => ({ ...item, kind: "places-culture" }))]);
}
