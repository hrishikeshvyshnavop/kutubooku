import type { Metadata } from "next";
import { Header } from "../_components/layout/Header";
import { PageTransition } from "../_components/layout/PageTransition";
import { Box } from "./Box";

export const metadata: Metadata = {
  title: "Your box — KutuBooku",
  description: "Your family's books, ready to send to your Amazon.in cart.",
  robots: { index: false, follow: true },
};

export default function BoxPage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-col bg-[#FDDAA6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <Header />
        <main className="flex flex-1 flex-col bg-[#FDDAA6] pb-24 lg:pb-0">
          <Box />
        </main>
      </div>
    </PageTransition>
  );
}
