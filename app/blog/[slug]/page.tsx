import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../_components/layout/Footer";
import { FooterMascot } from "../../_components/layout/FooterMascot";
import { Header } from "../../_components/layout/Header";
import { PageTransition } from "../../_components/layout/PageTransition";
import { Button } from "../../_components/ui/Button";
import { SectionTitle } from "../../_components/ui/SectionTitle";
import { BLOG_POSTS, postBySlug, relatedPosts, type BlogBlock, type BlogPost } from "../../_data/blog";
import { MOCK_BOOKS, type MockBook } from "../../_data/curation-mock";
import { REVEAL_ABOVE } from "../../_data/footer";
import { HERO_GLOW, HERO_PEACH } from "../../_data/theme";
import { SITE_NAME, abs, jsonLd } from "../../_lib/site";
import { PostArt } from "../PostArt";
import { PostBooks } from "../PostBooks";
import { PostCard, PostMeta, TopicPill } from "../PostCard";

type Props = { params: Promise<{ slug: string }> };

const BOOKS = new Map(MOCK_BOOKS.map((b) => [b.id, b]));

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  if (!post) return { title: "Post not found — KutuBooku", robots: { index: false } };
  const title = `${post.title} — KutuBooku`;
  return {
    title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", url: `/blog/${post.slug}`, title, description: post.excerpt, publishedTime: post.date, authors: [post.author] },
  };
}

function articleData(post: BlogPost) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      author: { "@type": "Organization", name: SITE_NAME },
      publisher: { "@type": "Organization", name: SITE_NAME, logo: abs("/brand/kutubooku-logo.png") },
      mainEntityOfPage: abs(`/blog/${post.slug}`),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: abs("/blog") },
        { "@type": "ListItem", position: 2, name: post.title, item: abs(`/blog/${post.slug}`) },
      ],
    },
  ];
}

export default async function BlogPostPage({ params }: Props) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();

  const books = post.books.map((id) => BOOKS.get(id)).filter((b): b is MockBook => !!b);
  const related = relatedPosts(post);

  return (
    <PageTransition>
      <div className={`flex min-h-dvh flex-1 flex-col ${HERO_PEACH} font-[family-name:var(--font-q-sans)] text-[#1d2838]`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleData(post)) }} />
        <Header />
        <main className={`flex-1 ${HERO_PEACH} ${REVEAL_ABOVE}`}>
          <article aria-labelledby="post-title">
            <header className="relative overflow-hidden">
              <div aria-hidden className={HERO_GLOW} />
              <div className="relative mx-auto grid w-full max-w-[1920px] items-center gap-10 px-page pb-14 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pb-20">
                <div>
                  <Link
                    href="/blog"
                    className="link-underline type-label text-[#1d2838]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]"
                  >
                    ← All posts
                  </Link>
                  <div className="mt-6">
                    <TopicPill post={post} />
                  </div>
                  <h1 id="post-title" className="mt-4 max-w-[20ch] type-display">
                    {post.title}
                  </h1>
                  <p className="mt-5 max-w-[56ch] type-body-lg text-[#1d2838]/75">{post.excerpt}</p>
                  <p className="mt-6 type-label">{post.author}</p>
                  <PostMeta post={post} className="mt-1" />
                </div>
                <PostArt post={post} size="(min-width: 1024px) 18vw, 35vw" priority />
              </div>
            </header>

            <div className="relative z-10 bg-[#fffdf8] px-page py-14 sm:py-20">
              <div className="mx-auto max-w-[68ch]">
                {post.body.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </div>
          </article>

          {books.length > 0 && (
            <section aria-labelledby="post-books-title" className="relative z-10 bg-[#f4efe6] px-page py-16 sm:py-24">
              <div className="mx-auto w-full max-w-[1920px]">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <SectionTitle id="post-books-title" eyebrow="from this post">
                    Books we mentioned
                  </SectionTitle>
                  <Button variant="split" href="/reading-preferences" className="w-fit shrink-0">Find books for my child</Button>
                </div>
                <PostBooks books={books} />
              </div>
            </section>
          )}

          <section aria-labelledby="related-title" className="relative z-10 bg-[#fffdf8] px-page py-16 sm:py-24">
            <div className="mx-auto w-full max-w-[1920px]">
              <SectionTitle id="related-title" eyebrow="keep reading">
                More from the blog
              </SectionTitle>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {related.map((p) => (
                  <li key={p.slug}>
                    <PostCard post={p} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <FooterMascot className="relative z-10 bg-[#fffdf8]" />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-12 type-title first:mt-0 sm:text-[30px]">{block.text}</h2>;
    case "quote":
      return (
        <figure className="my-10 -rotate-1 rounded-[28px] bg-[#faed8f] px-6 py-7 sm:px-8">
          <blockquote className="font-[family-name:var(--font-caveat)] text-[30px] leading-[1.1] sm:text-[36px]">“{block.text}”</blockquote>
          {block.who && <figcaption className="mt-3 type-body-sm font-semibold text-[#1d2838]/70">— {block.who}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <ul className="mt-5 flex flex-col gap-3">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 type-body-lg">
              <span aria-hidden className="mt-2.5 size-2.5 shrink-0 rotate-45 rounded-[3px] bg-[#f26b4f]" />
              {item}
            </li>
          ))}
        </ul>
      );
    default:
      return <p className="mt-5 type-body-lg text-[#1d2838]/85 first:mt-0">{block.text}</p>;
  }
}
