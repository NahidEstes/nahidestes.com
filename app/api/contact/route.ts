import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { contactSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`contact:${ip}`, 4, 60_000)) return NextResponse.json({ message: "Please wait before sending another message." }, { status: 429 });
  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Please check the form fields." }, { status: 400 });
  if (!await connectDB()) return NextResponse.json({ message: "Your note is valid. Connect MongoDB to store messages." });
  await ContactMessage.create(parsed.data);
  return NextResponse.json({ message: "Thank you. I’ll be in touch soon." });
}
