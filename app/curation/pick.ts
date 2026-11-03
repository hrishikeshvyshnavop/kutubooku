// MOCK picking logic — a stand-in for the AI model so the curation screen can
// be designed and tested. Scores each sample book against the questionnaire
// answers; the real recommendations will come from the AI team.

import { INTEREST_LABELS, MOCK_BOOKS, type ContentFlag, type MockBook } from "../_data/curation-mock";

type Answers = Record<string, string | string[]>;

export type Pick = MockBook & { reason: string };

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

/** Small seeded shuffle so "Regenerate" gives a different but stable order. */
function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function profileOf(a: Answers) {
  const ageNum = Number(a.age);
  return {
    name: typeof a.name === "string" && a.name.trim() ? a.name.trim() : "",
    age: Number.isFinite(ageNum) ? Math.min(Math.max(ageNum, 0), 14) : null,
    stage: typeof a.stage === "string" ? a.stage : "",
    interests: list(a.interests),
    avoid: list(a.avoid).filter((x) => x !== "other") as ContentFlag[],
    skipTitles: list(a.skipTitles).map((t) => t.toLowerCase().trim()),
  };
}

function reasonFor(book: MockBook, p: ReturnType<typeof profileOf>, variant: number): string {
  const who = p.name || "your child";
  const match = book.tags.find((t) => p.interests.includes(t));
  if (match) {
    const topic = INTEREST_LABELS[match] ?? match;
    const lines = [
      `Because ${who} loves ${topic}.`,
      `${who} is into ${topic} — this one is full of it.`,
      `Picked for ${who}'s love of ${topic}.`,
    ];
    return lines[variant % lines.length];
  }
  if (p.stage === "confident") return `A satisfying, longer read for a confident reader like ${who}.`;
  if (p.stage === "learning") return `Short and steady — just right while ${who} is learning to read.`;
  if (p.stage === "read-to") return `A great one to read aloud together with ${who}.`;
  return p.age !== null ? `A favourite with ${p.age}-year-olds — a good fit for ${who}.` : `A well-loved pick for ${who}'s age.`;
}

/**
 * Ranks the sample books for this child.
 * - excludes books outside the age range (±1 year of slack), books flagged with
 *   anything the parent wants kept off the shelf, titles already read, and
 *   anything in `excludeIds` (removed / already own / already read)
 * - scores interest overlap highest, then how centred the age is in the range
 * - `seed` reshuffles books with equal scores (Regenerate)
 */
export function rankBooks(a: Answers, excludeIds: Set<string>, seed = 1): Pick[] {
  const p = profileOf(a);
  const rnd = seeded(seed * 7919);
  const eligible = (bk: MockBook, relaxedAge = false) => {
    if (excludeIds.has(bk.id)) return false;
    if (p.skipTitles.includes(bk.title.toLowerCase())) return false;
    if (bk.flags?.some((f) => p.avoid.includes(f))) return false;
    if (!relaxedAge && p.age !== null && (p.age < bk.ageMin - 1 || p.age > bk.ageMax + 1)) return false;
    return true;
  };
  const strictBooks = MOCK_BOOKS.filter((bk) => eligible(bk));
  // If the exact age band has no catalogue matches, keep the flow useful by
  // recommending the closest available books rather than showing no results.
  const source = strictBooks.length ? strictBooks : MOCK_BOOKS.filter((bk) => eligible(bk, true));
  const scored = source.map((bk) => {
    const overlap = bk.tags.filter((t) => p.interests.includes(t)).length;
    const inRange = p.age === null || (p.age >= bk.ageMin && p.age <= bk.ageMax);
    const score = overlap * 3 + (inRange ? 2 : 0) + rnd() * 1.5;
    return { bk, score };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored.map(({ bk }, i) => ({ ...bk, reason: reasonFor(bk, p, i + seed) }));
}

export const CURATION_SIZE = 9;
