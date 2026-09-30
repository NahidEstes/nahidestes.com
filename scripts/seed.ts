import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { posts, projects, photography, places, defaultSettings } from "@/lib/sample-data";
import { Post } from "@/models/Post";
import { Project } from "@/models/Project";
import { PhotographyGallery } from "@/models/PhotographyGallery";
import { PlaceStory } from "@/models/PlaceStory";
import { SiteSettings } from "@/models/SiteSettings";
import { Category } from "@/models/Category";

async function seed(){if(!process.env.MONGODB_URI)throw new Error("MONGODB_URI is required");await connectDB();await Promise.all(posts.map(item=>Post.findOneAndUpdate({slug:item.slug},item,{upsert:true})));await Promise.all(projects.map(item=>Project.findOneAndUpdate({slug:item.slug},{...item,description:item.excerpt,coverImage:item.featuredImage,categories:[item.category]},{upsert:true})));await Promise.all(photography.map(item=>PhotographyGallery.findOneAndUpdate({slug:item.slug},{...item,description:item.excerpt,coverImage:item.featuredImage},{upsert:true})));await Promise.all(places.map(item=>PlaceStory.findOneAndUpdate({slug:item.slug},item,{upsert:true})));await SiteSettings.findOneAndUpdate({key:"primary"},{key:"primary",...defaultSettings},{upsert:true});const categories=[...new Set([...posts,...projects,...photography,...places].map(item=>item.category))];await Promise.all(categories.map(name=>Category.findOneAndUpdate({slug:name.toLowerCase().replace(/[^a-z0-9]+/g,"-")},{name,slug:name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),type:"post"},{upsert:true})));console.log("Seeded content successfully.");await mongoose.disconnect();}
seed().catch(error=>{console.error(error);process.exit(1)});
