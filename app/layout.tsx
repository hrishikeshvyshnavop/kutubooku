import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "KutuBooku — New books for every young reader, every month",
  description:
    "Monthly book Editions for children aged 0–17. Get a curation made for your child and add it to your Amazon cart in one click.",
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
