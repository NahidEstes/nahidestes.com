import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ContactForm } from "@/components/ui/contact-form";
export const metadata:Metadata={title:"Contact",description:"Contact Nahid Estes about a digital project, photography assignment or editorial collaboration.",alternates:{canonical:"/contact"}};
export default function Page(){return <PublicShell><section className="inner-hero"><div className="container"><div className="eyebrow">Contact</div><h1 className="display">Let’s make something<br/>meaningful.</h1><p>Have a digital project, photography assignment or story in mind? Tell me a little about it.</p></div></section><section className="form-shell"><div className="field-grid" style={{marginBottom:"3rem"}}><div><Mail size={20}/><p><strong>Write</strong><br/><a href="mailto:hello@nahidestes.com">hello@nahidestes.com</a></p></div><div><MapPin size={20}/><p><strong>Based in</strong><br/>Available worldwide</p></div></div><ContactForm/></section></PublicShell>}
