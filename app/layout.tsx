import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./_lib/site";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { BookSheetHost } from "./_components/BookSheetHost";
import { SmoothScroll } from "./_components/SmoothScroll";

// One typeface for the whole site, loaded once here (it used to be declared on
// every page, and Fraunces / Nunito Sans / Anton / Caveat were preloaded on every
// page too). Variable font: one file covers every weight.
// Caveat is loaded only by the book page; the parked /editions page loads its own fonts.
const grotesk = Inter_Tight({ variable: "--font-q-sans", subsets: ["latin"] });

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
    <html lang="en-IN" className={`${grotesk.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <SmoothScroll />
        {children}
        {/* Book page as a slide-up sheet over any screen (?book=<id>). Suspense: it reads the URL. */}
        <Suspense fallback={null}>
          <BookSheetHost />
        </Suspense>
      </body>
    </html>
  );
}
