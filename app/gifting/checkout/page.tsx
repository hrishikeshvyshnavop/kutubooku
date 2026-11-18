import type { Metadata } from "next";
import { Header } from "../../_components/layout/Header";
import { PageTransition } from "../../_components/layout/PageTransition";
import { HERO_PEACH } from "../../_data/theme";
import { GiftCheckout } from "./GiftCheckout";

export const metadata: Metadata = {
  title: "Gift checkout — KutuBooku",
  description: "Send your gift: delivery address, note, wrapping and payment.",
  robots: { index: false },
};

export default function GiftCheckoutPage() {
  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <Header />
        <GiftCheckout />
      </div>
    </PageTransition>
  );
}
