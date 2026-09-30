import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  if (!await getServerSession(authOptions)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return NextResponse.json({ message: "Choose an image under 8 MB." }, { status: 400 });
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  if (!process.env.CLOUDINARY_CLOUD_NAME) return NextResponse.json({ message: "Cloudinary is not configured." }, { status: 503 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => cloudinary.uploader.upload_stream({ folder: "nahidestes", resource_type: "image" }, (error, upload) => error || !upload ? reject(error) : resolve(upload)).end(buffer));
  return NextResponse.json({ url: result.secure_url });
}
