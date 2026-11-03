// ON HOLD (2026-11-02): the /editions route is removed for now.
// To restore, move this file back to app/editions/page.tsx.
import { Anton, Fraunces, Nunito_Sans } from "next/font/google";
import Link from "next/link";
import { Shelf } from "../_components/Shelf";
import { SiteHeader } from "../_components/SiteHeader";
import { editions } from "../_data/editions";

// Fonts only the Editions shelf and covers use (moved out of the root layout so other pages do not preload them).
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });
const anton = Anton({ variable: "--font-anton-src", weight: "400", subsets: ["latin"] });

export default function EditionsPage() {
  return (
    <div className={`${fraunces.variable} ${nunito.variable} ${anton.variable} relative flex min-h-dvh flex-1 flex-col bg-[radial-gradient(ellipse_at_50%_35%,#ffffff_0%,#efefed_55%,#e2e2df_100%)] font-[family-name:var(--font-nunito)] text-ink`}>
      <SiteHeader />

      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4 sm:px-[18px]">
        <h1 className="text-sm leading-snug text-ink-soft sm:text-base">
          <span className="sr-only">KutuBooku — </span>
          New books for every young reader.
          <br />
          Every month.
        </h1>
        <Link
          href="/reading-preferences"
          className="text-sm font-semibold underline decoration-marigold decoration-2 underline-offset-4 hover:text-marigold-deep sm:text-base"
        >
          Find books for my child →
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-10">
        <h2 className="sr-only">Monthly Editions</h2>
        <Shelf editions={editions} />
      </main>

      <footer className="px-4 pb-5 text-center text-[11px] leading-relaxed text-ink-soft/80 sm:px-10">
        As an Amazon Associate, KutuBooku earns from qualifying purchases. · © 2026 KutuBooku LLP
      </footer>
    </div>
  );
}
