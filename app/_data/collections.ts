type SeasonalBook = {
  title: string;
  author: string;
  ageMin: number;
  ageMax: number;
  price: number;
  cover?: string;
  asin?: string;
};
export type CollectionBook = string | SeasonalBook;

export type Collection = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  theme: { tone: "light" | "dark"; bg: string; accent: string };
  books: CollectionBook[];
  startsAt: string;
  endsAt: string;
  order: number;
};

const MAX_ON_HOME = 3;

const COLLECTIONS: Collection[] = [
  {
    slug: "november-2026",
    eyebrow: "this month's collection",
    title: "November: brave little hearts",
    description: "Stories about trying, falling and getting back up. Picked by our curators for the month.",
    theme: { tone: "light", bg: "#dcefe4", accent: "#2e7a58" },
    books: ["after-the-fall", "jabari-jumps", "the-magical-yet", "the-most-magnificent-thing", "the-dot"],
    startsAt: "2026-11-01",
    endsAt: "2026-11-30",
    order: 1,
  },
  {
    slug: "diwali-2026",
    eyebrow: "diwali collection",
    title: "Light, family and home",
    description: "Warm stories to read together over the festival, about the people and places we love.",
    theme: { tone: "dark", bg: "#2b1d5c", accent: "#f9a220" },
    books: [
      { title: "Binny's Diwali", author: "Thrity Umrigar", ageMin: 4, ageMax: 8, price: 499 },
      "lost-and-found",
      "the-heart-and-the-bottle",
      "the-wonderful-things-you-will-be",
      "you-choose",
    ],
    startsAt: "2026-11-01",
    endsAt: "2026-11-12",
    order: 0,
  },
  {
    slug: "childrens-day-2026",
    eyebrow: "children's day · 14 nov",
    title: "Stories that celebrate being a kid",
    description: "Big imaginations, small worries and everything in between.",
    theme: { tone: "light", bg: "#ffe3c4", accent: "#d98512" },
    books: ["you-choose", "the-wonderful-things-you-will-be", "the-dot", "i-am-human", "the-invisible-boy"],
    startsAt: "2026-11-10",
    endsAt: "2026-11-16",
    order: 0,
  },
  {
    slug: "halloween-2026",
    eyebrow: "halloween collection",
    title: "A little spooky, never scary",
    description: "Monsters with feelings and brave moments in the dark, for little ones who like a shiver.",
    theme: { tone: "dark", bg: "#1d2838", accent: "#f36b4f" },
    books: [
      { title: "Room on the Broom", author: "Julia Donaldson", ageMin: 3, ageMax: 7, price: 399 },
      "the-color-monster",
      "when-sadness-is-at-your-door",
      "the-bad-seed",
    ],
    startsAt: "2026-10-15",
    endsAt: "2026-10-31",
    order: 0,
  },
];

export function liveCollections(day: string): Collection[] {
  return COLLECTIONS.filter((c) => c.startsAt <= day && day <= c.endsAt)
    .sort((a, b) => a.order - b.order || a.endsAt.localeCompare(b.endsAt))
    .slice(0, MAX_ON_HOME);
}

export const todayInIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export const untilLabel = (endsAt: string) =>
  `Until ${new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${endsAt}T00:00:00Z`))}`;
