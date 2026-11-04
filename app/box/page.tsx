import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { GlobalHeader } from "../_components/GlobalHeader";
import { PageTransition } from "../_components/PageTransition";
import { Box } from "./Box";

// Handwritten labels ("your box").
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Your box — KutuBooku",
  description: "Your family's books, ready to send to your Amazon.in cart.",
  robots: { index: false },
};

export default function BoxPage() {
  return (
    <PageTransition>
      <div className={`${caveat.variable} flex min-h-dvh flex-col bg-[#FDDAA6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <GlobalHeader />
        {/* No footer here: the box is a focused task screen. Fills the screen; pb on phones leaves
            room for the fixed total + Amazon bar. The Amazon Associate line sits in the box's total. */}
        <main className="flex flex-1 flex-col bg-[#FDDAA6] pb-24 lg:pb-0">
          <Box />
        </main>
      </div>
    </PageTransition>
  );
}
