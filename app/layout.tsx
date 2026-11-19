import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./_lib/site";
import { Cal_Sans, Caveat, Figtree } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { BookSheetHost } from "./_components/book/BookSheetHost";
import { SmoothScroll } from "./_components/layout/SmoothScroll";
import { SplashOrigin } from "./_components/layout/SplashOrigin";
import { ScrollThumb } from "./_components/ui/ScrollThumb";

const grotesk = Figtree({ variable: "--font-q-sans", subsets: ["latin"] });
const calSans = Cal_Sans({ variable: "--font-cal", weight: "400", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], preload: false });

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
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${grotesk.variable} ${calSans.variable} ${caveat.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <SmoothScroll />
        {children}
        <Suspense fallback={null}>
          <BookSheetHost />
        </Suspense>
        <SplashOrigin />
        <ScrollThumb scroller="page" className="fixed inset-y-0 right-0.5 z-[60]" />
      </body>
    </html>
  );
}
