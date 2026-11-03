// Reading-preferences questionnaire.
// DRAFT question set — the final list is still open (CONTEXT.md Q6 / QA1).
// Will move to Payload CMS so the team can edit questions without a deploy.

export type Option = {
  value: string;
  /** Full label — used for screen readers and the summary. */
  label: string;
  /** Short text shown on a grid tile (e.g. "7"). */
  tile?: string;
};

type Base = {
  id: string;
  /** Large question shown in the question card. */
  question: string;
  /** Short line in the context card explaining why we ask. */
  why: string;
  optional?: boolean;
  /** Short label used on the summary screen (e.g. "Age"). */
  summaryLabel: string;
};

/** Extra input revealed on the same screen when a given option is picked. */
export type FollowUp = { whenValue: string; id: string; label: string; placeholder: string };

export type Question =
  | (Base & {
      kind: "single";
      options: Option[];
      layout?: "list" | "grid";
      followUp?: FollowUp;
    })
  | (Base & { kind: "multi"; options: Option[]; max?: number; followUp?: FollowUp })
  | (Base & { kind: "text"; placeholder: string; singleLine?: boolean; maxLength?: number });

/** Oldest age the questionnaire offers (decision 2026-11-02: up to 14). */
export const MAX_AGE = 14;

/** Placeholder replaced with the child's name (or "your child") wherever it appears. */
export const NAME_TOKEN = "{name}";

export const questions: Question[] = [
  {
    id: "name",
    summaryLabel: "Name",
    kind: "text",
    singleLine: true,
    maxLength: 40,
    question: "What's your child's name?",
    why: "We'll use it to make every pick feel like it's theirs. A nickname is fine.",
    placeholder: "First name or nickname",
  },
  {
    id: "age",
    summaryLabel: "Age",
    kind: "single",
    layout: "grid",
    question: "How old is {name}?",
    why: "We match books to their exact age — and step them up as {name} grows, month by month.",
    // Exact age in years (decision 2026-11-02). Stored with the date it was
    // given (AGE_ASKED_AT_KEY) so it can count up over time.
    options: [
      { value: "0", label: "Under 1 year", tile: "<1" },
      ...Array.from({ length: MAX_AGE }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1} ${i === 0 ? "year" : "years"}`,
        tile: String(i + 1),
      })),
    ],
  },
  {
    id: "stage",
    summaryLabel: "Reading",
    kind: "single",
    question: "Where is {name} with reading?",
    why: "Two children the same age can be at very different stages. This helps us match the reading level, not just the age.",
    options: [
      { value: "read-to", label: "We read to them" },
      { value: "learning", label: "Learning to read" },
      { value: "independent", label: "Reading on their own" },
      { value: "confident", label: "Confident, reads a lot" },
    ],
  },
  {
    id: "interests",
    summaryLabel: "Into",
    kind: "multi",
    question: "What is {name} into?",
    why: "Pick as many as you like — each book will say why it's there.",
    options: [
      { value: "animals", label: "Animals" },
      { value: "space", label: "Space" },
      { value: "dinosaurs", label: "Dinosaurs" },
      { value: "mystery", label: "Mysteries" },
      { value: "myths", label: "Myths & legends" },
      { value: "funny", label: "Funny stories" },
      { value: "feelings", label: "Feelings & friendship" },
      { value: "nature", label: "Science & nature" },
      { value: "adventure", label: "Adventure" },
      { value: "sports", label: "Sports" },
      { value: "history", label: "History" },
      { value: "making", label: "Art & making things" },
    ],
  },
  {
    id: "loves",
    summaryLabel: "Loves right now",
    kind: "text",
    optional: true,
    question: "What does {name} love right now?",
    why: "A show, game, character or book they can't stop talking about. We'll look for books fans of it enjoy.",
    placeholder: "e.g. a TV show, a game, a favourite character…",
  },
  {
    id: "skip",
    summaryLabel: "Already read",
    kind: "single",
    question: "Has {name} already read books we should skip?",
    why: "We won't recommend these. Not sure? Pick no — you can mark books as “already own” later.",
    // Yes/no first; titles only if yes (decision 2026-11-02).
    options: [
      { value: "no", label: "No, start fresh" },
      { value: "yes", label: "Yes, I'll add some" },
    ],
    followUp: { whenValue: "yes", id: "skipTitles", label: "Book titles", placeholder: "Type a title, then press Enter" },
  },
  {
    id: "avoid",
    summaryLabel: "Can't stand",
    kind: "multi",
    optional: true,
    question: "Anything {name} just can't stand?",
    why: "Every reader has a few no-go topics or characters — and that's okay. Tell us and we'll keep them off {name}'s shelf.",
    options: [
      { value: "scary", label: "Scary or spooky stories" },
      { value: "violence", label: "Fighting or violence" },
      { value: "sad", label: "Sad endings or loss" },
      { value: "romance", label: "Romance" },
      { value: "screens", label: "Books based on TV or games" },
      { value: "other", label: "Something else…" },
    ],
    // Free text for specific dislikes (spiders, clowns, a character…).
    followUp: { whenValue: "other", id: "avoidOther", label: "Topics or characters to skip", placeholder: "e.g. spiders — press Enter to add" },
  },
];

/* -------------------------------------------------------------------------- */
/* Age helpers — the AI/curation side uses these; parents never see bands.     */
/* -------------------------------------------------------------------------- */

/** Answers key holding the ISO date (YYYY-MM-DD) the age was given. */
export const AGE_ASKED_AT_KEY = "ageAskedAt";

/** Age today, counting up from the age given on `askedAt`. */
export function currentAge(ageGiven: number, askedAt: string, today = new Date()): number {
  const asked = new Date(askedAt);
  if (Number.isNaN(asked.getTime())) return ageGiven;
  let years = today.getFullYear() - asked.getFullYear();
  const beforeAnniversary =
    today.getMonth() < asked.getMonth() ||
    (today.getMonth() === asked.getMonth() && today.getDate() < asked.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.min(ageGiven + Math.max(years, 0), MAX_AGE);
}

/** Publisher-style age band used for matching book age labels. */
export function ageBand(age: number): "0-2" | "3-5" | "6-8" | "9-12" | "13-14" {
  if (age <= 2) return "0-2";
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  if (age <= 12) return "9-12";
  return "13-14";
}
