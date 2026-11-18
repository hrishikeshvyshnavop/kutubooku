import { INTEREST_LABELS, MOCK_BOOKS, type MockBook } from "./curation-mock";
import type { Faq } from "./faq";

export type Occasion = { value: string; label: string; line: string; tone: string };

export const OCCASIONS: Occasion[] = [
  { value: "birthday", label: "Birthday", line: "A book they'll still be reading next birthday.", tone: "bg-[#ffe75e]" },
  { value: "festival", label: "Festival", line: "Diwali, Eid, Christmas, Onam: stories to unwrap.", tone: "bg-[#b6beff]" },
  { value: "sibling", label: "New sibling", line: "Big feelings, gently told, for the new big brother or sister.", tone: "bg-[#ffd0b2]" },
  { value: "just-because", label: "Just because", line: "No reason needed. The best gifts often aren't.", tone: "bg-[#a9dfc0]" },
];

export const GIFT_STEPS = [
  { title: "Tell us about the child", text: "Their age, the occasion and what they're into. Five quick questions, no reading levels needed.", tone: "bg-[#ffe75e]" },
  { title: "Pick books to gift", text: "We suggest books that suit them, each with a reason. Add the ones you like to your gift basket.", tone: "bg-[#b6beff]" },
  { title: "We wrap and deliver", text: "KutuBooku wraps every book, adds your note and delivers it to their door.", tone: "bg-[#ffd0b2]" },
];

export const GIFT_INCLUDED = [
  { title: "Gift wrapping", text: "Every book wrapped by hand, ready to open.", icon: "wrap" },
  { title: "Your note", text: "A handwritten-style card with your message.", icon: "note" },
  { title: "Free delivery", text: "To their door anywhere in India. You pay book prices only.", icon: "truck" },
] as const;

export const GIFT_FAQ: Faq[] = [
  {
    q: "How long does delivery take?",
    a: "Most gifts arrive in 4 to 6 days. Each book shows its own delivery estimate before you add it, and some take a little longer while we source them.",
  },
  {
    q: "What does gifting cost?",
    a: "Just the price of the books. KutuBooku covers the wrapping, the card and the delivery.",
  },
  {
    q: "Can I add a message?",
    a: "Yes. You write a note at checkout and we print it on a card that goes in with the books.",
  },
  {
    q: "Do I need to know the child's reading level?",
    a: "No. Their age, the occasion and one or two things they love are enough for us to suggest good books.",
  },
  {
    q: "What if a book can't be gifted right now?",
    a: "Gift books come from our own stock and distributors. If one isn't available, we'll suggest a similar book instead.",
  },
  {
    q: "Can I send books to more than one child?",
    a: "Yes. Finish one gift, then start the quiz again for the next child.",
  },
];

export type QuizOption = { value: string; label: string };

export const GIFT_AGES: QuizOption[] = Array.from({ length: 15 }, (_, age) => ({
  value: String(age),
  label: age === 0 ? "Under 1" : String(age),
}));

export const GIFT_INTERESTS: QuizOption[] = [
  { value: "animals", label: "Animals" },
  { value: "funny", label: "Funny stories" },
  { value: "feelings", label: "Feelings & friendship" },
  { value: "adventure", label: "Adventure" },
  { value: "nature", label: "Science & nature" },
  { value: "making", label: "Art & making things" },
  { value: "space", label: "Space" },
  { value: "myths", label: "Myths & legends" },
];

export const GIFT_BUDGETS: (QuizOption & { max: number | null })[] = [
  { value: "under-500", label: "Under ₹500", max: 500 },
  { value: "500-1000", label: "₹500 – ₹1,000", max: 1000 },
  { value: "1000-plus", label: "₹1,000 or more", max: null },
];

export const MAX_GIFT_INTERESTS = 2;

export type GiftAnswers = {
  name: string;
  age: string;
  occasion: string;
  interests: string[];
  budget: string;
};

export const EMPTY_GIFT_ANSWERS: GiftAnswers = { name: "", age: "", occasion: "", interests: [], budget: "" };

export type GiftPick = { book: MockBook; reason: string; delivery: string };

const SLOW_SOURCING = new Set(["the-heart-and-the-bottle", "after-the-fall", "the-invisible-boy"]);

export const deliveryFor = (bookId: string) => (SLOW_SOURCING.has(bookId) ? "Arrives in 7–9 days" : "Arrives in 4–6 days");

export const giftName = (name: string) => name.trim() || "them";

const OCCASION_THEMES: Record<string, string[]> = {
  birthday: ["growing up", "confidence", "imagination", "creativity"],
  festival: ["family", "kindness", "love", "belonging"],
  sibling: ["family", "feelings", "love", "change", "empathy"],
  "just-because": [],
};

const ageGap = (b: MockBook, age: number) => (age < b.ageMin ? b.ageMin - age : age > b.ageMax ? age - b.ageMax : 0);

export const budgetOf = (value: string) => GIFT_BUDGETS.find((b) => b.value === value) ?? null;

export function giftPicks(a: GiftAnswers, limit = 6): GiftPick[] {
  const age = Number(a.age);
  const occasion = OCCASIONS.find((o) => o.value === a.occasion);
  const occasionThemes = OCCASION_THEMES[a.occasion] ?? [];
  const who = giftName(a.name);
  const cheapFirst = a.budget === "under-500";

  return MOCK_BOOKS.map((book) => {
    const gap = ageGap(book, age);
    const interest = a.interests.find((i) => book.tags.includes(i));
    const occasionMatch = book.themes.some((t) => occasionThemes.includes(t));
    const score = (interest ? 4 : 0) + (occasionMatch ? 2 : 0) - gap * 3;
    const reason =
      gap > 0
        ? age < book.ageMin
          ? "A picture book to grow into"
          : "A short, comforting favourite"
        : interest
          ? `For ${who === "them" ? "a child who" : `${who}, who`} loves ${INTEREST_LABELS[interest] ?? interest}`
          : occasionMatch && occasion
            ? `A lovely ${occasion.label.toLowerCase()} read`
            : `Loved by ${age === 0 ? "babies" : `${age}-year-olds`}`;
    return { book, reason, delivery: deliveryFor(book.id), score };
  })
    .sort((x, y) => y.score - x.score || (cheapFirst ? x.book.price - y.book.price : 0))
    .slice(0, limit)
    .map(({ book, reason, delivery }) => ({ book, reason, delivery }));
}
