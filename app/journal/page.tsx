import type { Metadata } from "next";
import { ArchivePage } from "@/components/sections/archive-page";
export const metadata:Metadata={title:"Journal",description:"Stories about travel, food, photography and digital craft.",alternates:{canonical:"/journal"}};
export default function Page({searchParams}:{searchParams:Promise<{category?:string;tag?:string;page?:string}>}){return <ArchivePage kind="posts" searchParams={searchParams}/>;}
