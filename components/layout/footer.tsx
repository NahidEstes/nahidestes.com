import Link from "next/link";
import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/ui/newsletter-form";

export function Footer() { return <footer className="site-footer"><div className="container">
  <div className="footer-top"><div className="footer-brand"><div className="brand">NAHID ESTES</div><p>Developer · Photographer · Visual Storyteller</p></div>
    <NewsletterForm/><div className="socials"><a href="#" aria-label="Instagram">IG</a><a href="#" aria-label="Facebook">FB</a><a href="#" aria-label="YouTube">YT</a><a href="#" aria-label="LinkedIn">IN</a><a href="mailto:hello@nahidestes.com" aria-label="Email"><Mail size={17}/></a></div></div>
  <div className="footer-bottom"><span>© {new Date().getFullYear()} Nahid Estes. All rights reserved.</span><nav className="footer-nav" aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/work">Work</Link><Link href="/photography">Photography</Link><Link href="/journal">Journal</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav></div>
  </div></footer>; }
