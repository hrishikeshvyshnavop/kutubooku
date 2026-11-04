import type { Metadata } from "next";
import { GlobalHeader } from "../_components/GlobalHeader";
import { PageTransition } from "../_components/PageTransition";
import { ChildPicker } from "./ChildPicker";

export const metadata: Metadata = {
  title: "Who's choosing books today? — KutuBooku",
  description: "Pick a reader to see their books, add another child, or change a child's answers.",
};

export default function ChildrenPage() {
  return (
    <PageTransition>
      <div className="flex min-h-dvh flex-1 flex-col bg-[#FDDAA6] font-[family-name:var(--font-q-sans)] text-[#1d2838]">
        <GlobalHeader />
        <ChildPicker />
      </div>
    </PageTransition>
  );
}
