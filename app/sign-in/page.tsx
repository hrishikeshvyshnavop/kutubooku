import type { Metadata } from "next";
import { SignIn } from "./SignIn";
import { GlobalHeader } from "../_components/GlobalHeader";
import { PageTransition } from "../_components/PageTransition";

export const metadata: Metadata = {
  title: "Sign in — KutuBooku",
  description: "Sign in with Google to see the books we've curated for your child.",
};

export default function SignInPage() {
  return (
    <PageTransition>
      <div
        className={`flex min-h-dvh flex-1 flex-col bg-[#f4efe6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}
      >
        <GlobalHeader background="bg-[#f4efe6]" />
        <SignIn />
      </div>
    </PageTransition>
  );
}
