// The slide-up book sheet's look, shared by the listing's sheet (app/curation/BookDetails.tsx)
// and the book page opened as a modal from any screen (app/_components/BookSheet.tsx).
// A full-width modal that leaves a 100px gap at the top so the page behind stays visible, dimmed.

export const SHEET_DIALOG =
  "fixed inset-x-0 bottom-0 top-auto m-0 h-[calc(100dvh-100px)] max-h-none w-full max-w-none overflow-y-auto overflow-x-clip overscroll-contain rounded-t-[32px] border-0 bg-white p-0 text-black shadow-[0_-24px_60px_-20px_rgba(29,40,56,0.45)] sm:rounded-t-[48px] lg:rounded-t-[64px] translate-y-full transition-[translate,display,overlay] transition-discrete duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] open:translate-y-0 starting:open:translate-y-full motion-reduce:transition-none backdrop:bg-transparent backdrop:transition-[background-color,display,overlay] backdrop:transition-discrete backdrop:duration-500 open:backdrop:bg-[#1d2838]/45 starting:open:backdrop:bg-transparent";

export const SHEET_CLOSE_BTN =
  "grid size-12 shrink-0 place-items-center rounded-[16px] bg-white/80 transition-[background-color,border-radius] duration-300 hover:rounded-[24px] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

/** Time the sheet takes to slide away (matches duration-500, a little shorter so it feels snappy). */
export const SHEET_CLOSE_MS = 380;
