"use client";

import Link from "next/link";
import { Toast } from "../_components/Toast";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INTEREST_LABELS, MOCK_BOOKS } from "../_data/curation-mock";
import { dropFromBox, toggleInBox, useBox } from "../_lib/box";
import { isSignedIn } from "../_lib/session";
import { MAX_CHILDREN, activeOf, commitDraft, displayName, switchChild, useChildren, type ChildProfile } from "../_lib/children";
import { ReaderAvatar } from "../_components/ReaderAvatar";
import { flyToBox } from "../_lib/fly";
import {
  ArrowIcon,
  BTN_PRIMARY,
  Button,
  OutlineButton,
  childNameOf,
  readAnswers,
  rupeesFmt,
  type Answers,
} from "../_components/curation/ui";
import { BookCard } from "./BookCard";
import { BookDetails } from "./BookDetails";
import { CURATION_SIZE, profileOf, rankBooks, type Pick } from "./pick";
import { ageOf } from "../_data/questions";
import { KutuAvatar } from "../_components/KutuAvatar";

type Phase = "init" | "empty" | "loading" | "slow" | "results";

const LOADING_MS = 2500; // simulated AI time
const REGEN_MS = 1200;

const STAGE_LABELS: Record<string, string> = {
  "read-to": "We read to them",
  learning: "Learning to read",
  independent: "Reading on their own",
  confident: "Confident reader",
};

export function Curation() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("init");
  const [answers, setAnswers] = useState<Answers>({});
  const [seed, setSeed] = useState(1);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [picks, setPicks] = useState<Pick[]>([]);
  // Playful swap: card flipping out, and the freshly swapped-in card (flips in + confetti).
  const [swappingOut, setSwappingOut] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, "up" | "down">>({});
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  // Regenerate animation: "out" = cards shuffle away, "in" = new set is dealt in.
  const [deal, setDeal] = useState<"out" | "in" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const name = childNameOf(answers);
  const who = name || "your child";

  // Readers (C8): the curation follows the active child; switching reloads it.
  const kids = useChildren();
  const activeKid = activeOf(kids);
  const activeKey = kids ? activeKid?.id ?? "" : null; // null until hydrated

  // The box drives the ticks (C1): a ticked book is in the family box for this child.
  // Nothing is added on its own: the parent ticks what they want.
  const box = useBox();
  const child = name || null;
  const selected = useMemo(
    () => new Set((box?.items ?? []).filter((i) => i.child === child).map((i) => i.bookId)),
    [box, child],
  );

  const fill = useCallback(
    (a: Answers, ex: Set<string>, s: number) => {
      let ranked = rankBooks(a, ex, s);
      // The real catalogue is finite. When every current pick has been
      // removed, start a fresh recommendation set instead of leaving a dead
      // empty state behind.
      if (!ranked.length && ex.size) {
        setExcluded(new Set());
        ranked = rankBooks(a, new Set(), s + 1);
      }
      const next = ranked.slice(0, CURATION_SIZE);
      setPicks(next);
    },
    [],
  );

  // Boot: needs answers + a (simulated) signed-in session, then "curates". Again for another child.
  useEffect(() => {
    if (activeKey === null) return;
    if (isSignedIn()) commitDraft(); // answers given before signing in become a reader (then active)
    const a = readAnswers();
    if (!a || ageOf(a) === null) {
      setPhase("empty"); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    if (!isSignedIn()) {
      router.replace("/sign-in?next=/curation");
      return;
    }
    setAnswers(a);
    setExcluded(new Set());
    setSeed(1);
    setOpenId(null);
    setPhase("loading");
    const slow = new URLSearchParams(window.location.search).get("slow") === "1";
    const t = setTimeout(() => {
      fill(a, new Set(), 1);
      setPhase(slow ? "slow" : "results");
    }, LOADING_MS);
    return () => clearTimeout(t);
  }, [router, fill, activeKey]);

  // Close the ⋯ menu on outside click / Escape.
  useEffect(() => {
    if (!menuFor) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && (e.target as HTMLElement).closest("[data-menu-root]")) return;
      setMenuFor(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuFor]);

  const say = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  /* ------------------------------ book actions ----------------------------- */

  const dropBook = (id: string, msg: string) => {
    const ex = new Set(excluded).add(id);
    setExcluded(ex);
    setPicks((cur) => cur.filter((p) => p.id !== id));
    dropFromBox(id, child);
    setMenuFor(null);
    say(msg);
  };

  const swapBook = (id: string) => {
    const ex = new Set(excluded).add(id);
    const shown = new Set(picks.map((p) => p.id));
    const replacement = rankBooks(answers, new Set([...ex, ...shown]), seed)[0];
    setExcluded(ex);
    setMenuFor(null);
    if (!replacement) {
      setPicks((cur) => cur.filter((p) => p.id !== id));
      say("No more matches right now — removed it instead.");
      return;
    }
    const apply = () => {
      setPicks((cur) => cur.map((p) => (p.id === id ? replacement : p)));
      // The new pick takes the old one's place in the box, if it was there.
      if (selected.has(id)) {
        dropFromBox(id, child);
        toggleInBox(replacement.id, child, "curation");
      }
      const lines = [`Ta-da! Meet “${replacement.title}”.`, `Fresh pick: “${replacement.title}”.`, `Swapped! Say hi to “${replacement.title}”.`];
      say(lines[Math.floor(Math.random() * lines.length)]);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }
    setSwappingOut(id);
    setTimeout(() => {
      apply();
      setSwappingOut(null);
      setFreshId(replacement.id);
      setTimeout(() => setFreshId((f) => (f === replacement.id ? null : f)), 1100);
    }, 300);
  };

  const regenerate = () => {
    const s = seed + 1;
    setSeed(s);
    setRegenerating(true);
    setMenuFor(null);
    const lines = [
      `A fresh shelf for ${who}!`,
      "Shuffled! Here's a new set.",
      "Ta-da: a whole new shelf.",
    ];
    const cheer = () => say(lines[Math.floor(Math.random() * lines.length)]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fill(answers, excluded, s);
      setRegenerating(false);
      cheer();
      return;
    }
    setDeal("out"); // cards shuffle away one after another
    const outMs = 420 + picks.length * 40;
    setTimeout(() => {
      fill(answers, excluded, s);
      setDeal("in"); // new set dealt in card by card
      cheer();
      setTimeout(() => {
        setDeal(null);
        setRegenerating(false);
      }, 750 + CURATION_SIZE * 70);
    }, Math.max(outMs, REGEN_MS / 2));
  };

  const toggle = (id: string) => {
    const added = toggleInBox(id, child, "curation");
    const book = picks.find((p) => p.id === id) ?? MOCK_BOOKS.find((m) => m.id === id);
    if (added && book) flyToBox({ bookId: id, cover: book.cover });
    const whose = name ? `${name}'s box` : "your box";
    if (book) say(added ? `Added “${book.title}” to ${whose}.` : `Took “${book.title}” out of ${whose}.`);
  };

  const rate = (id: string, r: "up" | "down") => {
    const book = picks.find((p) => p.id === id);
    const nextRating = ratings[id] === r ? undefined : r;
    setRatings((cur) => {
      const n = { ...cur };
      if (n[id] === r) delete n[id];
      else n[id] = r;
      return n;
    });
    if (book) say(nextRating === "up" ? `Nice pick — ${book.title} is going on your favourites.` : `Got it — we’ll keep ${book.title} in mind.`);
  };

  /** Adds a book from "Read more like this" to the list and selects it. */
  const addBook = (id: string) => {
    const book = MOCK_BOOKS.find((m) => m.id === id);
    if (!book || picks.some((p) => p.id === id)) return;
    const reason = rankBooks(answers, new Set(), seed).find((p) => p.id === id)?.reason ?? "Added by you.";
    setPicks((cur) => [...cur, { ...book, reason }]);
    if (!selected.has(id)) toggleInBox(id, child, "curation");
    say(`Added “${book.title}” to your list and your box.`);
  };

  const openPick = picks.find((p) => p.id === openId);
  const openBook = openPick ?? (openId ? MOCK_BOOKS.find((m) => m.id === openId) ?? null : null);

  const chosen = picks.filter((p) => selected.has(p.id));
  const total = chosen.reduce((s, p) => s + p.price, 0);
  // Everything in the family box (all children), for "View box".
  const boxCount = box?.items.length ?? 0;

  const prof = profileOf(answers);
  const interestText = prof.interests.map((i) => INTEREST_LABELS[i] ?? i);

  /* --------------------------------- render -------------------------------- */

  if (phase === "init") return <div className="flex-1" />;

  if (phase === "empty") {
    return (
      <Frame panel="#c9b7f1" side={<p className="type-lead">We don&apos;t know your child yet.</p>}>
        <h1 className="type-display">
          Let&apos;s start with a few questions
        </h1>
        <p className="mt-4 max-w-xl type-body-lg text-[#1d2838]/70">
          Tell us about your child and we&apos;ll curate books just for them. It takes about two minutes.
        </p>
        <Link href="/" className={`${BTN_PRIMARY} mt-10 self-start`}>
          Start the questions
          <ArrowIcon dir="right" />
        </Link>
      </Frame>
    );
  }

  const side = (
    <>
      <p className="type-label text-[#1d2838]/80">Based on your answers</p>
      <dl className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
        {prof.age !== null ? (
          <Row k="Age" v={prof.age === 0 ? "Under 1" : `${prof.age} years`} />
        ) : null}
        {prof.stage ? <Row k="Reading" v={STAGE_LABELS[prof.stage] ?? prof.stage} /> : null}
        {interestText.length ? <Row k="Into" v={interestText.join(", ")} /> : null}
      </dl>
      <Link
        href={activeKid ? `/reading-preferences?child=${activeKid.id}` : "/"}
        className="mt-5 inline-block type-label link-underline-on sm:mt-8"
      >
        Edit {name ? `${name}'s` : ""} answers
      </Link>
    </>
  );

  if (phase === "loading") {
    return (
      <Frame panel="#f6c453" side={side}>
        <ReaderSwitch kids={kids?.list ?? []} activeId={activeKid?.id} />
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center" role="status" aria-live="polite">
          <ShelfLoader />
          <h1 className="mt-10 type-display-sm">
            Curating {name ? `${name}'s` : "your"} books…
          </h1>
          <p className="mt-3 type-body-lg text-[#1d2838]/70">Matching age, reading level and interests.</p>
        </div>
      </Frame>
    );
  }

  if (phase === "slow") {
    return (
      <Frame panel="#f6c453" side={side}>
        <div className="flex flex-1 flex-col justify-center py-10" role="status" aria-live="polite">
          <h1 className="max-w-[18ch] type-display">
            This is taking a little longer
          </h1>
          <p className="mt-4 max-w-xl type-body-lg text-[#1d2838]/70">
            We&apos;ll email you at your Google address as soon as {who}&apos;s books are ready. You can close this page.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            <OutlineButton onClick={() => router.push("/")} label="Back to your answers">
              <ArrowIcon dir="left" />
              Back to answers
            </OutlineButton>
            <Button variant="primary" onClick={() => setPhase("results")} arrow="right">
              Keep waiting
            </Button>
          </div>
        </div>
      </Frame>
    );
  }

  // results
  return (
    <Frame panel="#f6c453" side={side}>
      <ReaderSwitch kids={kids?.list ?? []} activeId={activeKid?.id} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-display">
            {name ? `${name}'s books` : "Your child's books"}
          </h1>
          <AiLine who={who} thinking={regenerating} count={picks.length} />
        </div>
      </div>

      <ul
        className={`mt-8 grid gap-x-5 gap-y-7 px-1 pt-2 transition-opacity duration-300 sm:grid-cols-2 xl:grid-cols-3 ${regenerating ? "pointer-events-none" : ""}`}
        aria-busy={regenerating}
      >
        {picks.map((p, i) => (
          <li key={p.id} className="[perspective:1400px]">
            <BookCard
              book={p}
              index={i}
              swappingOut={swappingOut === p.id}
              fresh={freshId === p.id}
              deal={deal}
              boxChild={child}
              selected={selected.has(p.id)}
              rating={ratings[p.id]}
              menuOpen={menuFor === p.id}
              onToggle={() => toggle(p.id)}
              onOpen={() => setOpenId(p.id)}
              onRate={(r) => rate(p.id, r)}
              onMenu={() => setMenuFor((m) => (m === p.id ? null : p.id))}
              onSwap={() => swapBook(p.id)}
              onRemove={() => dropBook(p.id, `Removed “${p.title}”.`)}
              onOwn={() => dropBook(p.id, `Marked “${p.title}” as already owned — we won't suggest it again.`)}
              onRead={() => dropBook(p.id, `Marked “${p.title}” as already read — we won't suggest it again.`)}
              onReport={() => {
                setMenuFor(null);
                say(`Thanks — we'll review “${p.title}”.`);
              }}
            />
          </li>
        ))}
      </ul>

      {picks.length === 0 ? (
        <p className="mt-8 type-body-lg">No books left in this set. Try Regenerate for a fresh one.</p>
      ) : null}



      <BookDetails
        book={openBook}
        reason={openPick?.reason}
        inList={!!openPick}
        child={child}
        onAdd={() => openId && addBook(openId)}
        onOpen={setOpenId}
        onClose={() => setOpenId(null)}
      />

      {/* Toast (top-right, under the header) */}
      <Toast toast={toast ? { text: toast, tone: "info" } : null} />

      {/* Sticky action bar — always in view */}
      <div data-toast-avoid className="sticky bottom-0 z-10 -mx-2 mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-t-[24px] bg-[#fffdf8]/90 px-2 pb-3 pt-3 backdrop-blur">
        <p className="type-body tabular-nums">
          <span className="font-semibold">
            {chosen.length} in {name ? `${name}'s` : "your"} box
          </span>
          <span className="text-[#1d2838]/60"> · approx {rupeesFmt(total)}</span>
          {boxCount > chosen.length ? (
            <span className="block text-sm text-[#1d2838]/55">{boxCount} books in the family box</span>
          ) : null}
        </p>
        <div className="flex flex-1 justify-end gap-1.5 sm:flex-none">
          <OutlineButton onClick={regenerate} label="Regenerate the whole list" disabled={regenerating}>
            <svg viewBox="0 0 24 24" className={`size-5 ${regenerating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
            </svg>
            <span className="hidden sm:inline">{regenerating ? "Shuffling…" : "Regenerate"}</span>
          </OutlineButton>
          {/* C1: the box replaces "Add N to Amazon cart"; Amazon is reached from the box. */}
          {boxCount ? (
            <Button variant="primary" href="/box" arrow="right" className="flex-1 sm:flex-none">
              View box ({boxCount})
            </Button>
          ) : (
            <Button variant="primary" disabled className="flex-1 sm:flex-none">
              Add books to your box
            </Button>
          )}
        </div>
      </div>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */

/** Readers above the title: switch child, or add another (C8). Only once signed in with a profile. */
function ReaderSwitch({ kids, activeId }: { kids: ChildProfile[]; activeId?: string }) {
  if (!kids.length) return null;
  const chip =
    "flex h-11 items-center gap-2 rounded-full pl-1.5 pr-4 type-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d2838]";
  return (
    <nav aria-label="Readers" className="-mt-2 mb-6 flex flex-wrap gap-2 sm:-mt-4 sm:mb-8">
      {kids.map((c, i) => {
        const on = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            aria-current={on || undefined}
            onClick={() => switchChild(c.id)}
            className={`${chip} ${on ? "bg-[#1d2838] text-white" : "bg-[#f4eee3] hover:bg-[#ece3d3]"}`}
          >
            <ReaderAvatar child={c} index={i} size={32} round />
            {displayName(c.name)}
          </button>
        );
      })}
      {kids.length < MAX_CHILDREN ? (
        <Link href="/reading-preferences?new=1&next=/curation" className={`${chip} border-2 border-dashed border-[#1d2838]/25 pl-3 hover:border-[#1d2838]`}>
          <span aria-hidden className="text-xl leading-none">+</span>
          Add another child
        </Link>
      ) : null}
    </nav>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      {/* Same type styles as the questionnaire panel: small medium label, big light value */}
      <dt className="type-label text-[#1d2838]/70">{k}</dt>
      <dd className="mt-0.5 type-value">{v}</dd>
    </div>
  );
}

function Frame({
  panel,
  side,
  children,
}: {
  panel: string;
  side: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col p-2.5 sm:p-3">
      <div className="grid flex-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-3">
        <aside
          style={{ backgroundColor: panel }}
          className="rounded-[28px] p-5 sm:rounded-[48px] sm:p-8 lg:sticky lg:top-[100px] lg:self-start lg:min-h-[min(560px,calc(100dvh-14rem))]"
        >
          {side}
        </aside>
        <main className="flex min-w-0 flex-col rounded-[36px] bg-[#fffdf8] px-page-inset pb-0 pt-8 sm:rounded-[56px] sm:pt-12 lg:rounded-b-none lg:rounded-t-[64px] lg:pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}

/* -------------------------------- Book card -------------------------------- */

/* -------------------------------------------------------------------------- */
/* AI essence: badge, match chips, typed reasons.                              */
/* -------------------------------------------------------------------------- */

const THINKING_STEPS = [
  (who: string) => `Re-reading ${who}'s answers…`,
  () => "Finding fresh matches…",
  () => "Writing why each one fits…",
];

/** One quiet line under the title: AI provenance + instruction; cycles thinking steps while regenerating. */
function AiLine({ who, thinking, count }: { who: string; thinking: boolean; count: number }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!thinking) return;
    setStep(0); // eslint-disable-line react-hooks/set-state-in-effect
    const t = setInterval(() => setStep((n) => Math.min(n + 1, THINKING_STEPS.length - 1)), 520);
    return () => clearInterval(t);
  }, [thinking]);
  return (
    <p aria-live="polite" className="mt-3 flex items-start gap-2 type-body-lg text-[#1d2838]/70">
      <KutuAvatar size={32} thinking={thinking} className="-mt-0.5" />
      {thinking ? (
        <span key={step} className="animate-q-in">{THINKING_STEPS[step](who)}</span>
      ) : (
        <span>
          {count} {count === 1 ? "book" : "books"} picked by KutuBooku AI from {who}&apos;s answers. Add the ones you want to your box.
        </span>
      )}
    </p>
  );
}

function ShelfLoader() {
  const books = [
    { h: 70, c: "#1d2838" },
    { h: 86, c: "#f26b4f" },
    { h: 76, c: "#9fcbf2" },
    { h: 92, c: "#f6c453" },
    { h: 80, c: "#a9dfc0" },
    { h: 88, c: "#c9b7f1" },
  ];
  return (
    <div aria-hidden className="flex flex-col items-center">
      <style>{`
        @keyframes kb-book-in {
          0%, 8% { transform: translateY(-46px) rotate(-14deg); opacity: 0; }
          22% { transform: translateY(4px) rotate(2deg); opacity: 1; }
          30%, 82% { transform: none; opacity: 1; }
          100% { transform: translateY(0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .kb-book { animation: none !important; opacity: 1 !important; } }
      `}</style>
      <div className="flex h-24 items-end gap-1.5 px-3">
        {books.map((b, i) => (
          <span
            key={i}
            className="kb-book block w-6 rounded-t-[5px] rounded-b-[1px] opacity-0"
            style={{
              height: `${b.h}%`,
              backgroundColor: b.c,
              animation: `kb-book-in 2.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="h-[5px] w-56 rounded-full bg-[#1d2838]" />
    </div>
  );
}
