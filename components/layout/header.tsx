"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [["Home","/"],["Work","/work"],["Photography","/photography"],["Journal","/journal"],["Places & Culture","/places-culture"],["About","/about"],["Contact","/contact"]];

export function Header({ inner = false }: { inner?: boolean }) {
  const path = usePathname(); const [scrolled,setScrolled]=useState(false); const [open,setOpen]=useState(false);
  useEffect(() => { const onScroll=()=>setScrolled(window.scrollY>24); onScroll(); window.addEventListener("scroll",onScroll); return()=>window.removeEventListener("scroll",onScroll); },[]);
  return <header className={`site-header ${inner?"inner":""} ${scrolled?"scrolled":""}`}>
    <div className="container nav-row"><Link href="/" className="brand">NAHID ESTES</Link>
      <nav aria-label="Primary navigation" className={`main-nav ${open?"open":""}`}>{links.map(([label,href])=><Link key={href} className={path===href?"active":""} onClick={()=>setOpen(false)} href={href}>{label}</Link>)}</nav>
      <div className="header-actions"><Link aria-label="Search" className="icon-btn" href="/search"><Search size={19}/></Link><ThemeToggle/><Link className="header-cta" href="/contact">Let&apos;s Connect&nbsp; →</Link><button className="menu-btn" aria-label={open?"Close menu":"Open menu"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
    </div>
  </header>;
}
