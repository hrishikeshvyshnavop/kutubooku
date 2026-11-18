import type { Metadata } from "next";
import { SignIn } from "./SignIn";
import { Header } from "../_components/Header";
import { PageTransition } from "../_components/PageTransition";

export const metadata: Metadata = {
  title: "Sign in — KutuBooku",
  description: "Sign in with Google to see the books we've curated for your child.",
  // Personal page: kept out of search.
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <PageTransition>
      <div
        className={`flex min-h-dvh flex-1 flex-col bg-[#f4efe6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}
      >
        <Header background="bg-[#f4efe6]" />
        <SignIn />
      </div>
    </PageTransition>
  );
}
