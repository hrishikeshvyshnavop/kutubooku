import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./_lib/site";
import { Cal_Sans, Caveat, Figtree } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { BookSheetHost } from "./_components/BookSheetHost";
import { SmoothScroll } from "./_components/SmoothScroll";
import { SplashOrigin } from "./_components/SplashOrigin";

// The site's two typefaces, loaded once here. Which text gets which (and every size) is set in
// globals.css, "Typography": swap a face there or here, not per page.
// Figtree: body, labels, captions (2026-11-05, replaced Inter Tight: a friendlier, rounder sans that
// pairs with Cal Sans). Variable font: one file covers every weight. Keeps the --font-q-sans
// variable name, which pages and the type tokens already point at.
const grotesk = Figtree({ variable: "--font-q-sans", subsets: ["latin"] });
// Cal Sans: headings, titles, big numbers, buttons. One weight (400) only.
const calSans = Cal_Sans({ variable: "--font-cal", weight: "400", subsets: ["latin"] });
// The handwritten eyebrow labels ("our whole shelf", "what happens"…). Declared once here so it
// reaches everything, including the book sheet and footer, which sit outside a page's own wrapper
// (per-page declarations missed those). Not preloaded: the browser fetches it only on pages that
// show an eyebrow. The parked /editions page loads its own fonts.
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], preload: false });

// Site-wide SEO defaults. Pages set their own title, description and canonical address;
// share cards fall back to app/opengraph-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "KutuBooku — Books picked for your child",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#FDDAA6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${grotesk.variable} ${calSans.variable} ${caveat.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <SmoothScroll />
        {children}
        {/* Book page as a slide-up sheet over any screen (?book=<id>). Suspense: it reads the URL. */}
        <Suspense fallback={null}>
          <BookSheetHost />
        </Suspense>
        {/* Where you clicked, for the page-to-page splash (globals.css) */}
        <SplashOrigin />
      </body>
    </html>
  );
}
