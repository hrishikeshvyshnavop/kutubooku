import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "../../_components/layout/Header";
import { PageTransition } from "../../_components/layout/PageTransition";
import { HERO_PEACH } from "../../_data/theme";
import { GiftQuiz } from "./GiftQuiz";

export const metadata: Metadata = {
  title: "Find a gift — KutuBooku",
  description: "Five quick questions about the child, then books to gift, each with a reason.",
  alternates: { canonical: "/gifting/quiz" },
  robots: { index: false },
};

export default function GiftQuizPage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <Header />
        <Suspense fallback={<div className="flex-1" />}>
          <GiftQuiz />
        </Suspense>
      </div>
    </PageTransition>
  );
}
