import type { Metadata } from "next";
import { Footer } from "../_components/layout/Footer";
import { FooterMascot } from "../_components/layout/FooterMascot";
import { Header } from "../_components/layout/Header";
import { PageTransition } from "../_components/layout/PageTransition";
import { SECTION_TITLE } from "../_components/ui/SectionTitle";
import { sortedPosts } from "../_data/blog";
import { REVEAL_ABOVE } from "../_data/footer";
import { HERO_GLOW, HERO_PEACH } from "../_data/theme";
import { BlogGrid } from "./BlogGrid";
import { PostCard } from "./PostCard";

export const metadata: Metadata = {
  title: "Blog — KutuBooku",
  description: "Reading tips, book lists and ideas for raising a reader, from the KutuBooku team.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const [featured, ...rest] = sortedPosts();

  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <Header />
        <main className={`flex-1 ${HERO_PEACH} ${REVEAL_ABOVE}`}>
          <section aria-labelledby="blog-title" className="relative overflow-hidden">
            <div aria-hidden className={HERO_GLOW} />
            <div className="relative mx-auto w-full max-w-[1920px] px-page pb-12 pt-8 sm:pb-16 sm:pt-12">
              <p className="w-fit origin-bottom-left -rotate-3 font-[family-name:var(--font-caveat)] text-[28px] leading-none text-[#3b308f] sm:text-[36px]">
                the kutubooku blog
              </p>
              <h1 id="blog-title" className={`mt-3 max-w-[18ch] sm:mt-4 ${SECTION_TITLE}`}>
                Ideas for raising a <span className="text-[#a86f00]">happy reader</span>
              </h1>
              <p className="mt-6 max-w-[56ch] type-body-lg text-[#1d2838]/70">
                Reading tips, book lists and small habits that make books the best part of the day.
              </p>
              <div className="mt-10 sm:mt-14">
                <PostCard post={featured} featured />
              </div>
            </div>
          </section>

          <section aria-labelledby="blog-all-title" className="relative z-10 bg-[#fffdf8] px-page py-16 sm:py-24">
            <div className="mx-auto w-full max-w-[1920px]">
              <h2 id="blog-all-title" className="type-display-sm">
                More to read
              </h2>
              <div className="mt-6">
                <BlogGrid posts={rest} />
              </div>
            </div>
          </section>

          <FooterMascot className="relative z-10 bg-[#fffdf8]" />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
}
