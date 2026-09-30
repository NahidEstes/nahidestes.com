import { redirect } from "next/navigation";import { getServerSession } from "next-auth";import { authOptions } from "@/lib/auth";import { AdminApp } from "@/components/admin/admin-app";
export const metadata={title:"Content Studio",robots:{index:false,follow:false}};export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{section?:string[]}>}){if(!await getServerSession(authOptions))redirect("/admin/login");return <AdminApp segments={(await params).section||[]}/>}
