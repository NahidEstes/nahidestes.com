import type { Metadata } from "next";
import { ArchivePage } from "@/components/sections/archive-page";
export const metadata:Metadata={title:"Work",description:"Selected web development and product design projects by Nahid Estes.",alternates:{canonical:"/work"}};
export default function Page({searchParams}:{searchParams:Promise<{category?:string;page?:string}>}){return <ArchivePage kind="projects" searchParams={searchParams}/>;}
