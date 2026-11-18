import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "../../_components/Header";
import { PageTransition } from "../../_components/PageTransition";
import { HERO_PEACH } from "../../_data/theme";
import { GiftOrderView } from "./GiftOrderView";

export const metadata: Metadata = {
  title: "Your gift order — KutuBooku",
  description: "Your gift order and its delivery status.",
  robots: { index: false },
};

export default function GiftOrderPage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <Header />
        <Suspense fallback={<div className="flex-1" />}>
          <GiftOrderView />
        </Suspense>
      </div>
    </PageTransition>
  );
}
