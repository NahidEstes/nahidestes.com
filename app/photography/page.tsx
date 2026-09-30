import type { Metadata } from "next";
import { ArchivePage } from "@/components/sections/archive-page";
export const metadata:Metadata={title:"Photography",description:"Travel, food, architecture and street photography by Nahid Estes.",alternates:{canonical:"/photography"}};
export default function Page({searchParams}:{searchParams:Promise<{category?:string;page?:string}>}){return <ArchivePage kind="photography" searchParams={searchParams}/>;}
