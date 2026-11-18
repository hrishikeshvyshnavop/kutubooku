import type { Metadata } from "next";
import { Header } from "../../_components/layout/Header";
import { PageTransition } from "../../_components/layout/PageTransition";
import { HERO_PEACH } from "../../_data/theme";
import { GiftOrders } from "./GiftOrders";

export const metadata: Metadata = {
  title: "My gifts — KutuBooku",
  description: "Your gift orders and where each one is.",
  robots: { index: false },
};

export default function GiftOrdersPage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <Header />
        <GiftOrders />
      </div>
    </PageTransition>
  );
}
