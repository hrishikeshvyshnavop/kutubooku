import type { Metadata } from "next";
import { questions } from "../_data/questions";
import { Questionnaire } from "./Questionnaire";
import { Preloader } from "../_components/Preloader";
import { Header } from "../_components/Header";
import { PageTransition } from "../_components/PageTransition";

export const metadata: Metadata = {
  title: "Tell us about your child — KutuBooku",
  description: "A few quick questions so we can curate books for your child.",
  alternates: { canonical: "/reading-preferences" },
};

export default function ReadingPreferencesPage() {
  return (
    <PageTransition>
      <div
        className={`flex min-h-dvh flex-1 flex-col bg-[#FDDAA6] font-[family-name:var(--font-q-sans)] text-[#1d2838]`}
      >
        <Preloader />
        <Header />
        <Questionnaire questions={questions} />
      </div>
    </PageTransition>
  );
}
