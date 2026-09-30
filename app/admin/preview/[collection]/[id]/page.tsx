import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArticleDetailPage } from "@/components/sections/article-detail-page";
import { DetailPage } from "@/components/sections/detail-page";
import { isContentCollection, isValidObjectId } from "@/lib/admin/api";
import { authOptions } from "@/lib/auth";
import { normalizeContentItem } from "@/lib/data";
import { connectDB } from "@/lib/db";
import { ArticleRevision } from "@/models/ArticleRevision";
import { PlaceStory } from "@/models/PlaceStory";
import { Post } from "@/models/Post";
import { Project } from "@/models/Project";
import { PhotographyGallery } from "@/models/PhotographyGallery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Secure article preview", robots: { index: false, follow: false, nocache: true } };

export default async function PreviewPage({ params, searchParams }: { params: Promise<{ collection: string; id: string }>; searchParams: Promise<{ revision?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");
  const { collection, id } = await params;
  const { revision: revisionId } = await searchParams;
  if (!isContentCollection(collection) || !isValidObjectId(id) || (revisionId && !isValidObjectId(revisionId))) notFound();
  if (!await connectDB()) notFound();
  const model = collection === "posts" ? Post : collection === "places" ? PlaceStory : collection === "projects" ? Project : PhotographyGallery;
  const current = await model.findOne({ _id: id, deletedAt: null }).lean();
  if (!current) notFound();
  let source = current as Record<string, unknown>;
  if (revisionId) {
    if (collection !== "posts" && collection !== "places") notFound();
    const revision = await ArticleRevision.findOne({ _id: revisionId, articleId: id, contentCollection: collection }).lean();
    if (!revision) notFound();
    source = { ...source, ...(revision.snapshot as Record<string, unknown>), _id: id };
  }
  const item = normalizeContentItem(source);
  if (collection === "posts" || collection === "places") return <ArticleDetailPage kind={collection} slug={item.slug} previewItem={item}/>;
  return <DetailPage kind={collection} slug={item.slug} previewItem={item}/>;
}
