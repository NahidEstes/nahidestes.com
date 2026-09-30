import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { Project } from "@/models/Project";
import { PhotographyGallery } from "@/models/PhotographyGallery";
import { PlaceStory } from "@/models/PlaceStory";
import { Category } from "@/models/Category";
import { Subscriber } from "@/models/Subscriber";
import { ContactMessage } from "@/models/ContactMessage";

const models = { posts: Post, projects: Project, photography: PhotographyGallery, places: PlaceStory, categories: Category, subscribers: Subscriber, messages: ContactMessage };
const getModel = (name: string) => models[name as keyof typeof models];

async function context(params: Promise<{ collection: string; id: string }>) { const value = await params; return { ...value, model: getModel(value.collection) }; }
export async function PATCH(request: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  if (!await getServerSession(authOptions)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!await connectDB()) return NextResponse.json({ message: "MongoDB is not configured" }, { status: 503 });
  const { id, model } = await context(params); if (!model) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const body = await request.json(); delete body.passwordHash;
  const doc = await model.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  return NextResponse.json(doc);
}
export async function DELETE(_: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  if (!await getServerSession(authOptions)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!await connectDB()) return NextResponse.json({ message: "MongoDB is not configured" }, { status: 503 });
  const { id, model } = await context(params); if (!model) return NextResponse.json({ message: "Not found" }, { status: 404 });
  await model.findByIdAndDelete(id); return NextResponse.json({ ok: true });
}
