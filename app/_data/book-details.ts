// MOCK book-detail content for the book details sheet (modeled on the section
// structure of Aardvark Book Club's book pages). Everything here is FICTIONAL
// sample data, like curation-mock.ts. The real content will come from Payload CMS.

import {
  MOCK_BOOKS,
  type BookActivity,
  type CharacterPortrait,
  type ContentFlag,
  type MockBook,
  type StoryPlot,
} from "./curation-mock";

export type BookDetails = {
  /** One-line hook shown in italics above the synopsis. */
  tagline: string;
  /** Rich "About this book" narrative overview. */
  about: string;
  synopsis: string[];
  /** Core themes like empathy, compassion, kindness, local culture, curiosity. */
  themes: string[];
  /** 3-stage Story Plot: setup, turningPoint, resolution. */
  storyPlot?: StoryPlot;
  /** Key character portraits with roles and personality traits. */
  portraits: CharacterPortrait[];
  /** Hands-on parent-child activities inspired by the book. */
  activities: BookActivity[];
  /** Thoughtful conversation and discussion cues for parents. */
  cues: string[];
  /** Four short "at a glance" points. */
  glance: { label: string; value: string }[];
  /** Sample parent reviews. */
  reviews: { quote: string; who: string }[];
  /** Opening lines ("Get a taste"). Only some books have one. */
  excerpt?: string[];
  /** Content notes for parents. Empty = nothing to flag. */
  notes: string[];
};

const TAGLINES: Record<string, string> = {
  m01: "Goodnight, sky. Goodnight, me.",
  m02: "Ten tigers. Zero naps.",
  m03: "Every puddle is going somewhere.",
  m04: "Some mornings are a little bit roar-y.",
  m05: "One brush can change a whole town.",
  m06: "The quietest voice can be the bravest.",
  m07: "Homework, but on the moon.",
  m08: "Somebody ate the last mango. Somebody will pay.",
  m09: "The school basement was hiding a secret 65 million years old.",
  m10: "You can't win the final on your own.",
  m11: "Twelve stories the banyan tree has been keeping.",
  m12: "He built a robot. It built an opinion.",
  m13: "When the lights go out, listen closely.",
  m14: "The library is older than the city — and it remembers.",
  m15: "Somewhere in the monsoon, a frog no one has seen in fifty years.",
  m16: "They went looking for a comet. They found each other.",
  m17: "Grandma's stories were never just stories.",
  m18: "Every hour, the clock tells a little more.",
  m19: "Everything you need to find your first fossil.",
  m20: "Six balls. One chance.",
  m21: "Break it first. Then make it better.",
  m22: "The footsteps on Hampi Hill aren't theirs.",
  m23: "Saving the day. Mostly.",
  m24: "Some summers change the way you see the sky.",
  m25: "The old legends were a map all along.",
  m26: "A village wants it gone. She won't let it go.",
  m27: "The people behind the things you use every day.",
  m28: "The worst team in school. The best season ever.",
  m29: "Four friends. One code. No adults allowed.",
  m30: "One sketchbook. One summer. Finally, her people.",
};

const EXCERPTS: Record<string, string[]> = {
  m04: [
    "Dino woke up with a grumble in his tummy and a growl in his throat.",
    "“GRRR,” said Dino to his toothbrush. “GRRR,” said Dino to his socks.",
    "Mama Dino looked at him over her cup of tea. “Somebody,” she said, “woke up on the roar-y side of the bed.”",
  ],
  m07: [
    "My name is Kiran, I am nine years old, and I live on the moon.",
    "Not the whole moon. Just Dome Three, which has a canteen, a gym, a greenhouse that smells like wet socks, and one classroom with exactly four students in it.",
    "Today, one of those students was about to be in very big trouble. Spoiler: it was me.",
  ],
  m08: [
    "There had been six mangoes in the bowl on Sunday night. Pinky had counted them twice.",
    "On Monday morning there were five.",
    "Pinky put on her detective hat, which was really her brother's old cricket cap, and took out her notebook. “Nobody leave the kitchen,” she said.",
  ],
  m14: [
    "The map fell out of a book nobody had borrowed since 1962.",
    "Meera caught it before it hit the floor. It was thin as onion skin, folded eight times, and covered in tiny handwriting that wasn't English or Malayalam or anything she had ever seen.",
    "Behind her, the library clock stopped ticking.",
  ],
  m17: [
    "My grandmother told me a story every night of my life, and I never believed a single one.",
    "Not the one about the serpent king under the temple tank. Not the one about the woman who could talk to storms. Definitely not the one about our family being the last guards of a door between worlds.",
    "Then, the night after her funeral, the door opened.",
  ],
  m24: [
    "From the observatory roof, Noor could see more stars than she had seen in her whole life put together.",
    "“You're staring,” said Dr. Angmo, handing her a flask of salt tea.",
    "“I've never seen the sky before,” Noor said, and was surprised to find that it was true.",
  ],
};

const TOPIC_GLANCE: Record<string, string> = {
  animals: "Animal friends",
  space: "Stars and planets",
  dinosaurs: "Dinosaurs",
  mystery: "A mystery to solve",
  myths: "Myths and legends",
  funny: "Laugh-out-loud funny",
  feelings: "Big feelings",
  nature: "Science and nature",
  adventure: "Adventure",
  sports: "Sport",
  history: "History",
  making: "Making things",
};

const FLAG_NOTES: Record<ContentFlag, string> = {
  scary: "Some scary moments",
  violence: "Fantasy fighting",
  sad: "Sad moments (loss)",
  romance: "A light crush storyline",
  screens: "Gadgets and screens",
};

const REVIEW_LINES: Record<string, string> = {
  animals: "My daughter now does all the animal voices herself. We've read it every night for two weeks.",
  space: "He asked to see the moon from the balcony straight after. Lovely, calm and full of wonder.",
  dinosaurs: "Dinosaur-obsessed son approved. He corrected me on the names, which tells you how much he loves it.",
  mystery: "She guessed the ending wrong and was thrilled about it. Clever and very easy to follow.",
  myths: "Brings back the stories I grew up with, told in a way my kids actually sit still for.",
  funny: "We were both laughing out loud. Rare to find one that's funny for parents too.",
  feelings: "Opened up a great conversation about how she feels when things go wrong.",
  nature: "Full of real facts but never feels like homework. He keeps quoting bits of it at dinner.",
  adventure: "Couldn't put it down. Asked for 'just one more chapter' four times.",
  sports: "Got my non-reader reading. It's about cricket, so of course it did.",
  history: "Made history feel like a story, not a lesson. Great for curious kids.",
  making: "We tried two of the ideas the same weekend. Hands-on and inspiring.",
};

const CITIES = ["Bengaluru", "Pune", "Kochi", "Delhi", "Chennai", "Hyderabad", "Mumbai", "Jaipur"];

const FALLBACK_REVIEWS = [
  "A lovely one to keep on the shelf. We have already read it more times than I can count.",
  "The pacing is just right for bedtime, and it gave us plenty to talk about afterwards.",
  "A warm, memorable story that works beautifully for reading together.",
];

function readingMode(b: MockBook) {
  if (b.ageMax <= 5) return "Read aloud together";
  if (b.ageMin <= 7) return "Read together or alone";
  if (b.ageMin >= 11) return "Longer read";
  return "Reading on their own";
}

export function detailsFor(book: MockBook): BookDetails {
  // Stable per-book number (ids are slugs now, e.g. "the-dot").
  const n = Math.max(0, MOCK_BOOKS.findIndex((b) => b.id === book.id));
  const ages = book.ageMin === book.ageMax ? `Age ${book.ageMin}` : `Ages ${book.ageMin}–${book.ageMax}`;
  const topics = book.tags.slice(0, 2).map((t) => TOPIC_GLANCE[t] ?? t);

  const glance = [
    { label: "For", value: ages },
    { label: "How", value: readingMode(book) },
    ...topics.map((t, i) => ({ label: i === 0 ? "About" : "Also", value: t })),
  ].slice(0, 4);
  if (glance.length < 4) glance.push({ label: "Format", value: book.format });

  const topicReviews = book.tags.slice(0, 3).map((t, i) => {
    const age = Math.min(Math.max(book.ageMin + i, 1), 14);
    return {
      quote: REVIEW_LINES[t] ?? "A lovely book. We've read it many times already.",
      who: `Parent of a ${age}-year-old, ${CITIES[(n + i * 3) % CITIES.length]}`,
    };
  });

  // Keep every book page useful even when a catalogue item has only one or two
  // interest tags. The real CMS will replace these with submitted reviews.
  const reviews = [...topicReviews, ...FALLBACK_REVIEWS.map((quote) => ({ quote }))].slice(0, 4).map((review, i) => ({
    quote: review.quote,
    who: "who" in review && typeof review.who === "string" ? review.who : `Parent of a ${Math.min(Math.max(book.ageMin + i, 1), 14)}-year-old, ${CITIES[(n + i * 3) % CITIES.length]}`,
  }));

  const second =
    book.ageMax <= 5
      ? "Short lines, bold pictures and a rhythm made for reading aloud — it's the kind of book little ones ask for again and again."
      : book.ageMin >= 11
        ? "Thoughtful, funny and a real page-turner, it's a story that trusts older readers with big ideas."
        : "Short chapters, lively pictures and a story that keeps moving make it a great pick for growing readers.";

  return {
    tagline: TAGLINES[book.id] ?? book.description,
    about: book.about ?? book.description,
    synopsis: [book.description, second],
    themes: book.themes && book.themes.length > 0 ? book.themes : book.tags,
    storyPlot: book.storyPlot,
    portraits: book.portraits ?? [],
    activities: book.activities ?? [],
    cues: book.cues ?? [],
    glance,
    reviews,
    excerpt: EXCERPTS[book.id],
    notes: (book.flags ?? []).map((f) => FLAG_NOTES[f]),
  };
}

/** Books that share topics and fit a similar age, most similar first. */
export function similarTo(book: MockBook, count = 4): MockBook[] {
  return MOCK_BOOKS.filter((b) => b.id !== book.id && b.ageMax >= book.ageMin - 1 && b.ageMin <= book.ageMax + 1)
    .map((b) => ({ b, score: b.tags.filter((t) => book.tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || (y.b.rating ?? 0) - (x.b.rating ?? 0))
    .slice(0, count)
    .map((x) => x.b);
}

export const TOPIC_LABEL = TOPIC_GLANCE;

export const THEME_LABEL: Record<string, string> = {
  empathy: "Empathy",
  compassion: "Compassion",
  kindness: "Kindness",
  "local culture": "Local Culture",
  helpfulness: "Helpfulness",
  curiosity: "Curiosity",
  courage: "Courage",
  resilience: "Resilience",
  friendship: "Friendship",
  "emotional literacy": "Emotional Literacy",
  "growth mindset": "Growth Mindset",
  mindfulness: "Mindfulness",
  belonging: "Belonging",
  inclusion: "Inclusion",
  creativity: "Creativity",
  family: "Family",
  nature: "Nature",
  "self-awareness": "Self-Awareness",
  "self-care": "Self-Care",
  listening: "Listening",
  healing: "Healing",
  individuality: "Individuality",
  imagination: "Imagination",
  perseverance: "Perseverance",
  "problem-solving": "Problem Solving",
};

export const themeLabel = (t: string) =>
  THEME_LABEL[t.toLowerCase()] ?? t.charAt(0).toUpperCase() + t.slice(1);

