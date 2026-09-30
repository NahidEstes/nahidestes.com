import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ThemeController } from "@/components/theme/theme-toggle";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nahidestes.com"),
  title: { default: "Nahid Estes — Developer, Photographer & Visual Storyteller", template: "%s | Nahid Estes" },
  description: "Digital experiences and visual stories exploring travel, food, architecture and culture.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Nahid Estes", title: "Nahid Estes", description: "Code, culture, camera and creativity.", images: [{ url: "/opengraph-image" }] },
  twitter: { card: "summary_large_image", title: "Nahid Estes", description: "Code, culture, camera and creativity.", images: ["/opengraph-image"] },
};

const themeScript = `(function(){try{var stored=localStorage.getItem('nahid-theme');var theme=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var root=document.documentElement;root.dataset.theme=theme;root.style.colorScheme=theme;}catch(error){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }}/></head>
      <body><ThemeController/>{children}</body>
    </html>
  );
}
