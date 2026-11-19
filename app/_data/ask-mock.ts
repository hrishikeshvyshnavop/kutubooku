import { INTEREST_LABELS, MOCK_BOOKS, type MockBook } from "./curation-mock";

type AskPick = { book: MockBook;  reason: string };

export type AskAnswer = {
  text: string;
  picks: AskPick[];
  interests: string[];
  age?: number;
};

const INTEREST_WORDS: Record<string, string[]> = {
  animals: ["animal", "dog", "cat", "rabbit", "bunny", "penguin", "bird", "pet", "zoo"],
  space: ["space", "planet", "rocket", "star", "moon", "astronaut"],
  dinosaurs: ["dino"],
  mystery: ["myster", "detective", "puzzle", "clue"],
  myths: ["myth", "legend", "fairy", "folk", "magic"],
  funny: ["funn", "laugh", "silly", "humour", "humor", "joke", "giggl"],
  feelings: ["feel", "emotion", "sad", "angry", "anger", "anxious", "worr", "scared", "fear", "brave", "kind", "friend", "shy", "grief", "lonely", "calm"],
  nature: ["nature", "science", "plant", "garden", "curious", "outdoor"],
  adventure: ["adventur", "explor", "journey", "quest", "brave"],
  sports: ["sport", "football", "cricket", "swim", "game", "race"],
  history: ["history", "past", "king", "queen"],
  making: ["art", "draw", "paint", "build", "creat", "craft", "make", "making", "invent"],
};

function readAge(q: string): number | undefined {
  const patterns = [/(\d{1,2})\s*(?:-|\s)?\s*(?:years?|yrs?|y\/?o|year-old)/gi, /(?:age|aged)\s*(\d{1,2})/gi, /\b(\d{1,2})\b/g];
  for (const re of patterns) {
    const all = [...q.matchAll(re)];
    if (all.length > 0) {
      const n = Number(all[all.length - 1][1]);
      return n >= 0 && n <= 14 ? n : undefined;
    }
  }
  return undefined;
}

function readInterests(q: string): string[] {
  const words = q.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return Object.entries(INTEREST_WORDS)
    .filter(([, stems]) => stems.some((s) => words.some((w) => w.startsWith(s))))
    .map(([tag]) => tag);
}

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

const TAG_REASON: Record<string, string> = {
  animals: "🐾 Animal friends",
  space: "🪐 Space",
  dinosaurs: "🦕 Dinosaurs",
  mystery: "🔍 A mystery",
  myths: "🐉 Myths & magic",
  funny: "😂 Funny",
  feelings: "💛 Big feelings",
  nature: "🌱 Curious minds",
  adventure: "🧭 Adventure",
  sports: "⚽ Sport",
  history: "🏛️ History",
  making: "✂️ Making things",
};

export function askMock(question: string, exclude: string[] = [], followUp?: string): AskAnswer {
  const age = readAge(question);
  const interests = readInterests(question);

  const fitsAge = (b: MockBook) => age === undefined || (age >= b.ageMin - 1 && age <= b.ageMax + 1);
  const score = (b: MockBook) => b.tags.filter((t) => interests.includes(t)).length * 2 + (fitsAge(b) ? 1 : 0);
  const ranked = MOCK_BOOKS.filter((b) => !exclude.includes(b.id)).sort((a, b) => score(b) - score(a));
  const books = ranked.slice(0, 3);
  const picks = books.map((book) => {
    const hit = book.tags.find((t) => interests.includes(t)) ?? book.tags[0];
    const ages = `Ages ${book.ageMin}–${book.ageMax}`;
    return { book, reason: hit && TAG_REASON[hit] ? TAG_REASON[hit] : `📖 ${ages}` };
  });
  const anyAgeFit = MOCK_BOOKS.some(fitsAge);

  const who = age !== undefined ? `a ${age}-year-old` : "your child";
  const likes = interests.map((t) => INTEREST_LABELS[t] ?? t);
  const opener = followUp
    ? followUp === "Show me 3 more"
      ? "Here are three more from the shelf."
      : `Sure: ${followUp.charAt(0).toLowerCase()}${followUp.slice(1)}. Try these.`
    : likes.length > 0
      ? `For ${who} who's into ${list(likes)}, I'd start with these three.`
      : `Here are three lovely picks for ${who} to start with.`;
  const ageNote =
    age !== undefined && !anyAgeFit
      ? ` Our shelf here is mostly picture books for ages 3–8, so a full curation will find better matches for ${age}.`
      : "";
  const why = books[0] ? ` ${books[0].title} is a good first read. ${books[0].description}` : "";

  if (books.length === 0) {
    return { text: "That's every book on this shelf so far! A full curation will go much further.", picks: [], interests, age };
  }
  return { text: `${opener}${why}${ageNote}`, picks, interests, age };
}
