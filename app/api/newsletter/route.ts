import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Subscriber } from "@/models/Subscriber";
import { newsletterSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`newsletter:${ip}`, 5, 60_000)) return NextResponse.json({ message: "Please try again in a moment." }, { status: 429 });
  const parsed = newsletterSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  if (!await connectDB()) return NextResponse.json({ message: "Thanks — the demo form is ready for your database connection." });
  await Subscriber.findOneAndUpdate({ email: parsed.data.email }, { status: "active", subscribedAt: new Date() }, { upsert: true });
  return NextResponse.json({ message: "Welcome to the journey." });
}
