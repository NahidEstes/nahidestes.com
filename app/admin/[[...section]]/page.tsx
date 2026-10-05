import { redirect } from "next/navigation";import { getServerSession } from "next-auth";import { authOptions } from "@/lib/auth";import { AdminApp } from "@/components/admin/admin-app";
import { getSettings } from "@/lib/data";
export const metadata={title:"Content Studio",robots:{index:false,follow:false}};export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const session=await getServerSession(authOptions);if(!session?.user)redirect("/admin/login");const settings=await getSettings();return <AdminApp segments={(await params).section||[]} role={session.user.role==="editor"?"editor":"admin"} defaultAuthor={{name:settings.siteTitle,title:settings.tagline,biography:settings.biography,image:settings.profileImage}}/>}
