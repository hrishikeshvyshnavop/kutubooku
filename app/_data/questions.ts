export type Option = {
  value: string;
  label: string;
  tile?: string;
};

type Base = {
  id: string;
  question: string;
  why: string;
  optional?: boolean;
  summaryLabel: string;
};

type FollowUp = { whenValue: string; id: string; label: string; placeholder: string };

export type Question =
  | (Base & {
      kind: "single";
      options: Option[];
      layout?: "list" | "grid";
      followUp?: FollowUp;
    })
  | (Base & { kind: "multi"; options: Option[]; max?: number; followUp?: FollowUp })
  | (Base & { kind: "text"; placeholder: string; singleLine?: boolean; maxLength?: number })
  | (Base & { kind: "date" });

export const MAX_AGE = 14;

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
    id: "dob",
    summaryLabel: "Birthday",
    kind: "date",
    question: "When's {name}'s birthday?",
    why: "So every book fits {name}'s age today, and grows with them. Add the day for a birthday surprise.",
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
    followUp: { whenValue: "other", id: "avoidOther", label: "Topics or characters to skip", placeholder: "e.g. spiders — press Enter to add" },
  },
];

const AGE_ASKED_AT_KEY = "ageAskedAt";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function dobParts(v: unknown): { y: string; m: string; d: string } {
  const [y = "", m = "", d = ""] = typeof v === "string" ? v.split("-") : [];
  return { y, m, d };
}

function bornOn(v: unknown): Date | null {
  const { y, m, d } = dobParts(v);
  if (!y || !m) return null;
  const day = d ? Number(d) : 1;
  const born = new Date(Number(y), Number(m) - 1, day);
  if (born.getFullYear() !== Number(y) || born.getMonth() !== Number(m) - 1 || born.getDate() !== day) return null;
  return born;
}

export function ageFromDob(v: unknown, now?: Date): number | null {
  const born = bornOn(v);
  if (!born) return null;
  const today = now ?? new Date();
  if (born > today) return null;
  let years = today.getFullYear() - born.getFullYear();
  if (today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())) years -= 1;
  return years;
}

export function dobProblem(v: unknown, now?: Date): string | null {
  const { y, m, d } = dobParts(v);
  if (!y || !m) return null;
  const today = now ?? new Date();
  if (d && !bornOn(v)) return `${MONTHS[Number(m) - 1]} doesn't have ${d} days.`;
  const born = bornOn(v);
  if (born && born > today) return "That date hasn't happened yet.";
  const age = ageFromDob(v, today);
  if (age !== null && age > MAX_AGE) return `Our books are for children up to ${MAX_AGE}.`;
  return null;
}

export function ageInWords(v: unknown, now?: Date): string | null {
  const born = bornOn(v);
  if (!born) return null;
  const today = now ?? new Date();
  const years = ageFromDob(v, today);
  if (years === null) return null;
  let months = (today.getMonth() - born.getMonth() + 12) % 12;
  if (today.getDate() < born.getDate()) months = (months + 11) % 12;
  const y = years ? `${years} ${years === 1 ? "year" : "years"}` : "";
  const mo = months ? `${months} ${months === 1 ? "month" : "months"}` : "";
  return [y, mo].filter(Boolean).join(" and ") || "less than a month";
}

export function formatDob(v: unknown): string | null {
  if (ageFromDob(v) === null) return null;
  const { y, m, d } = dobParts(v);
  return `${d ? `${Number(d)} ` : ""}${MONTHS[Number(m) - 1]} ${y}`;
}

export function ageOf(a: Record<string, unknown> | null | undefined): number | null {
  if (!a) return null;
  const fromDob = ageFromDob(a.dob);
  if (fromDob !== null) return Math.min(fromDob, MAX_AGE);
  const given = Number(a.age);
  if (a.age === undefined || a.age === "" || !Number.isFinite(given)) return null;
  return typeof a[AGE_ASKED_AT_KEY] === "string" ? currentAge(given, a[AGE_ASKED_AT_KEY] as string) : Math.min(given, MAX_AGE);
}

function currentAge(ageGiven: number, askedAt: string, now?: Date): number {
  const asked = new Date(askedAt);
  if (Number.isNaN(asked.getTime())) return ageGiven;
  const today = now ?? new Date();
  let years = today.getFullYear() - asked.getFullYear();
  const beforeAnniversary =
    today.getMonth() < asked.getMonth() ||
    (today.getMonth() === asked.getMonth() && today.getDate() < asked.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.min(ageGiven + Math.max(years, 0), MAX_AGE);
}

export function ageBand(age: number): "0-2" | "3-5" | "6-8" | "9-12" | "13-14" {
  if (age <= 2) return "0-2";
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  if (age <= 12) return "9-12";
  return "13-14";
}
