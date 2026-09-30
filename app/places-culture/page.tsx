import type { Metadata } from "next";
import { ArchivePage } from "@/components/sections/archive-page";
export const metadata:Metadata={title:"Places & Culture",description:"Travel stories exploring people, food, craft and tradition.",alternates:{canonical:"/places-culture"}};
export default function Page({searchParams}:{searchParams:Promise<{category?:string;tag?:string;page?:string}>}){return <ArchivePage kind="places" searchParams={searchParams}/>;}
