// Compatibility module for the curation flow. The catalogue now comes from
// the JSON source used by the Books page; this adapter adds UI-only fields.
import books from "../../public/covers/books.json";

export type ContentFlag = "scary" | "violence" | "sad" | "romance" | "screens";
export type BookFormat = "Board book" | "Picture book" | "Paperback" | "Hardcover";

export type StoryPlot = {
  setup: string;
  turningPoint: string;
  resolution: string;
};

export type CharacterPortrait = {
  name: string;
  role: string;
  traits: string;
  avatar?: string;
};

export type BookActivity = {
  title: string;
  description: string;
};

export type MockBook = {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  illustrator?: string;
  cover: string;
  ageMin: number;
  ageMax: number;
  format: BookFormat;
  pages?: number;
  rating: number | null;
  reviews: number | null;
  price: number;
  description: string;
  about?: string;
  themes: string[];
  interests?: string[];
  tags: string[];
  storyPlot?: StoryPlot;
  portraits?: CharacterPortrait[];
  activities?: BookActivity[];
  cues?: string[];
  flags?: ContentFlag[];
  tone: string;
  motif: "circle" | "stripes" | "wave" | "star" | "arch" | "dots";
  asin?: string;
};

export const INTEREST_LABELS: Record<string, string> = {
  animals: "animals",
  space: "space",
  dinosaurs: "dinosaurs",
  mystery: "mysteries",
  myths: "myths and legends",
  funny: "funny stories",
  feelings: "stories about feelings and friendship",
  nature: "science and nature",
  adventure: "adventure",
  sports: "sports",
  history: "history",
  making: "art and making things",
};

const THEME_TAGS: Record<string, string> = {
  animals: "animals",
  nature: "nature",
  space: "space",
  dinosaurs: "dinosaurs",
  mystery: "mystery",
  myths: "myths",
  adventure: "adventure",
  sports: "sports",
  history: "history",
  creativity: "making",
  imagination: "making",
  "problem-solving": "making",
  learning: "making",
  feelings: "feelings",
  "emotional literacy": "feelings",
  empathy: "feelings",
  compassion: "feelings",
  helpfulness: "feelings",
  "local culture": "myths",
  mindfulness: "feelings",
  listening: "feelings",
  healing: "feelings",
  grief: "feelings",
  sadness: "feelings",
  "self-awareness": "feelings",
  "self-care": "feelings",
  friendship: "feelings",
  inclusion: "feelings",
  kindness: "feelings",
  belonging: "feelings",
  identity: "feelings",
  family: "feelings",
  confidence: "adventure",
  courage: "adventure",
  perseverance: "adventure",
  "growth mindset": "adventure",
  change: "feelings",
  choice: "making",
  conversation: "funny",
  "growing up": "adventure",
  love: "feelings",
  curiosity: "nature",
};

const MOTIFS: MockBook["motif"][] = ["circle", "stripes", "wave", "arch", "dots", "star"];
const tagsFor = (themes: string[]) => [
  ...new Set(themes.map((theme) => THEME_TAGS[theme] ?? theme).filter(Boolean)),
];

export const MOCK_BOOKS: MockBook[] = books.map((book, index) => ({
  id: book.id,
  title: book.title,
  subtitle: book.subtitle,
  author: book.author,
  illustrator: book.illustrator,
  cover: book.cover,
  ageMin: book.ageMin,
  ageMax: book.ageMax,
  format: book.format as BookFormat,
  pages: book.pages,
  rating: null,
  reviews: null,
  price: book.priceInr,
  description: book.description,
  about: book.about,
  themes: book.themes || [],
  interests: book.interests,
  tags: book.interests || tagsFor(book.themes || []),
  storyPlot: book.storyPlot,
  portraits: book.portraits,
  activities: book.activities,
  cues: book.cues,
  tone: book.coverTone,
  motif: MOTIFS[index % MOTIFS.length],
}));
