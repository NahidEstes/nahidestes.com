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
import { SiteSettings } from "@/models/SiteSettings";
import { contentSchema } from "@/lib/validation";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const models = { posts: Post, projects: Project, photography: PhotographyGallery, places: PlaceStory, categories: Category, subscribers: Subscriber, messages: ContactMessage, settings: SiteSettings };
const getModel = (name: string) => models[name as keyof typeof models];
const categorySchema=z.object({name:z.string().trim().min(2).max(80),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),type:z.enum(["post","project","photography","place"])});
const settingsSchema=z.object({siteTitle:z.string().min(2).max(100),tagline:z.string().max(180),biography:z.string().min(20).max(3000),profileImage:z.url(),email:z.email(),socialLinks:z.record(z.string(),z.string())});

export async function GET(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  if (!await getServerSession(authOptions)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!await connectDB()) return NextResponse.json([]);
  const model = getModel((await params).collection);
  if (!model) return NextResponse.json({ message: "Unknown collection" }, { status: 404 });
  const q = new URL(request.url).searchParams.get("q");
  const searchField=(await params).collection==="subscribers"?"email":(await params).collection==="messages"?"subject":"title";
  const docs = await model.find(q ? { [searchField]: { $regex: q, $options: "i" } } : {}).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json(docs);
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  if (!await getServerSession(authOptions)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!await connectDB()) return NextResponse.json({ message: "MongoDB is not configured" }, { status: 503 });
  const collection=(await params).collection; const model = getModel(collection);
  if (!model) return NextResponse.json({ message: "Unknown collection" }, { status: 404 });
  const body = await request.json(); delete body.passwordHash;
  let payload:Record<string,unknown>=body;
  if (["posts","projects","photography","places"].includes(collection)) { const parsed=contentSchema.safeParse(body); if(!parsed.success)return NextResponse.json({message:parsed.error.issues[0]?.message||"Invalid content"},{status:400}); payload={...parsed.data,content:sanitizeHtml(parsed.data.content)}; }
  if(collection==="categories"){const parsed=categorySchema.safeParse(body);if(!parsed.success)return NextResponse.json({message:parsed.error.issues[0]?.message||"Invalid category"},{status:400});payload=parsed.data;}
  if(collection==="settings"){const parsed=settingsSchema.safeParse(body);if(!parsed.success)return NextResponse.json({message:parsed.error.issues[0]?.message||"Invalid settings"},{status:400});const doc=await SiteSettings.findOneAndUpdate({key:"primary"},{key:"primary",...parsed.data},{new:true,upsert:true});return NextResponse.json(doc);}
  const doc = await model.create(payload);
  return NextResponse.json(doc, { status: 201 });
}
