import type { Metadata } from "next";
import { Curation } from "./Curation";
import { Header } from "../_components/layout/Header";
import { PageTransition } from "../_components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Your child's books — KutuBooku",
  description: "Books curated for your child, ready to add to your box and send to Amazon.",
  robots: { index: false, follow: true },
};

export default function CurationPage() {
  return (
    <PageTransition>
      <div
        className={`flex min-h-dvh flex-1 flex-col bg-[#f4efe6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}
      >
        <Header background="bg-[#f4efe6]" />
        <Curation />
      </div>
    </PageTransition>
  );
}
