import Link from "next/link";
import { FooterMascot } from "./_components/FooterMascot";
import { GlobalFooter, REVEAL_ABOVE } from "./_components/GlobalFooter";
import { GlobalHeader } from "./_components/GlobalHeader";
import { PageTransition } from "./_components/PageTransition";

// Handwritten footer label.

export default function NotFound() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-col bg-[#FDDAA6] text-[#1d2838]`}>
        <GlobalHeader />
        <main className={`flex flex-1 flex-col items-center bg-[#FDDAA6] px-page pt-8 sm:pt-12 ${REVEAL_ABOVE}`}>
          <div className="my-auto w-full max-w-[720px] py-8 text-center">
            <div className="rounded-[36px] bg-[#fffdf8] px-6 py-12 shadow-[0_24px_70px_rgba(29,40,56,0.12)] sm:rounded-[56px] sm:px-12 sm:py-16">
              <p className="type-label text-[#1d2838]/60">404 · Lost in the library</p>
              <h1 className="mt-4 type-display">That page has wandered off.</h1>
              <p className="mx-auto mt-5 max-w-[520px] type-body-lg text-[#1d2838]/70">
                We couldn&apos;t find that page, but there are plenty more stories waiting to be discovered.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] bg-[#f9a220] px-7 type-button text-black transition-[background-color,border-radius,scale] duration-300 hover:rounded-[28px] hover:bg-[#e8900c] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
                >
                  Back to home
                </Link>
                <Link
                  href="/reading-preferences"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] border-2 border-[#1d2838]/20 px-7 type-button transition-[background-color,border-color,border-radius,scale] duration-300 hover:rounded-[28px] hover:border-[#1d2838] hover:bg-[#1d2838]/5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
                >
                  Find books for my child
                </Link>
              </div>
            </div>
          </div>
          {/* last in main: the mascot peeks over the footer */}
          <FooterMascot className="mt-10 w-full" />
        </main>
        <GlobalFooter />
      </div>
    </PageTransition>
  );
}
