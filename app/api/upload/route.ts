import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  if (!await getServerSession(authOptions)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    { message: "Image uploads are temporarily disabled. Use an existing HTTPS image URL." },
    { status: 503 },
  );
}
