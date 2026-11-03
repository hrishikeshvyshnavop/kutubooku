// Monthly "Editions": each month's curation theme, newest first.
// PLACEHOLDER content until editions come from Payload CMS — books, prices
// and ASINs below are illustrative, not real listings.

export type EditionArt =
  | "starry"
  | "monsoon"
  | "explorers"
  | "feelings"
  | "dino"
  | "myths"
  | "mystery"
  | "words"
  | "wild"
  | "chapters";

export type EditionBook = {
  title: string;
  author: string;
  ages: string;
  price: number;
  /** Amazon.in ASIN — filled in from Payload once real books are chosen. */
  asin?: string;
};

export type Edition = {
  slug: string;
  title: string;
  month: string;
  year: number;
  art: EditionArt;
  blurb: string;
  books: EditionBook[];
  current?: boolean;
};

const b = (title: string, author: string, ages: string, price: number): EditionBook => ({
  title,
  author,
  ages,
  price,
});

export const editions: Edition[] = [
  {
    slug: "2026-11",
    title: "Starry Nights",
    month: "November",
    year: 2026,
    art: "starry",
    current: true,
    blurb: "Bedtime stories, planets and the people who watch the sky.",
    books: [
      b("Goodnight, Little Comet", "Anaya Rao", "0–5", 249),
      b("The Girl Who Counted Stars", "Meher Kapoor", "6–9", 299),
      b("Mission: Moon Base", "Arjun Pillai", "8–12", 349),
      b("Night Sky Atlas for Kids", "Leela Thomas", "7–12", 499),
    ],
  },
  {
    slug: "2026-10",
    title: "Monsoon Tales",
    month: "October",
    year: 2026,
    art: "monsoon",
    blurb: "Rainy-day reads full of puddles, paper boats and cosy adventures.",
    books: [
      b("Pitter Patter Puddle", "Sana Iqbal", "0–5", 229),
      b("Kiran and the Monsoon Kite", "Dev Menon", "6–8", 299),
      b("The Flooded Village", "Ravi Nair", "9–12", 349),
    ],
  },
  {
    slug: "2026-09",
    title: "Tiny Explorers",
    month: "September",
    year: 2026,
    art: "explorers",
    blurb: "Maps, journeys and curious kids who wander off the path.",
    books: [
      b("Where Does the River Go?", "Ishaan Bose", "3–6", 279),
      b("The Lost Map of Hampi", "Tara Krishnan", "8–11", 349),
      b("Explorers Who Changed the World", "Nikhil Rao", "9–13", 449),
    ],
  },
  {
    slug: "2026-08",
    title: "Big Feelings",
    month: "August",
    year: 2026,
    art: "feelings",
    blurb: "Stories that help children name, share and handle their emotions.",
    books: [
      b("My Grumpy Morning", "Aditi Shah", "2–5", 249),
      b("When Ammu Felt Small", "Neha Joseph", "5–8", 279),
      b("The Worry Jar", "Kabir Sethi", "7–10", 299),
    ],
  },
  {
    slug: "2026-07",
    title: "Dino Days",
    month: "July",
    year: 2026,
    art: "dino",
    blurb: "Roaring picture books and fossil facts for dinosaur fans.",
    books: [
      b("Ten Little Dinosaurs", "Maya Iyer", "0–4", 229),
      b("Dinosaurs Under Delhi", "Priya Sethi", "6–9", 349),
      b("The Fossil Hunter's Handbook", "Rohan Das", "9–13", 449),
    ],
  },
  {
    slug: "2026-06",
    title: "Myths & Legends",
    month: "June",
    year: 2026,
    art: "myths",
    blurb: "Heroes, gods and monsters from India and around the world.",
    books: [
      b("Tales from the Panchatantra", "Retold by Uma Rao", "4–8", 299),
      b("Gods and Monsters of the World", "Vikram Shetty", "8–12", 399),
      b("The Last Gandharva", "Aisha Menon", "12–17", 449),
    ],
  },
  {
    slug: "2026-05",
    title: "The Mystery Edition",
    month: "May",
    year: 2026,
    art: "mystery",
    blurb: "Clues, codes and detectives — for readers who love a puzzle.",
    books: [
      b("Who Ate the Mango?", "Farah Ali", "3–6", 249),
      b("The Secret Library of Kochi", "Rahul Varghese", "7–10", 349),
      b("The Clocktower Code", "Sameer Joshi", "11–15", 399),
    ],
  },
  {
    slug: "2026-04",
    title: "Words at Play",
    month: "April",
    year: 2026,
    art: "words",
    blurb: "Rhymes, poems and wordplay that make reading aloud a joy.",
    books: [
      b("ABC, Look at Me!", "Pooja Nair", "0–4", 199),
      b("Silly Poems for Sunny Days", "Anand Rao", "5–9", 279),
      b("The Word Collector", "Zoya Khan", "8–12", 329),
    ],
  },
  {
    slug: "2026-03",
    title: "Wild Wonders",
    month: "March",
    year: 2026,
    art: "wild",
    blurb: "Tigers, forests and the creatures we share the planet with.",
    books: [
      b("Stripes the Tiger Cub", "Lakshmi Menon", "2–5", 249),
      b("Into the Western Ghats", "Joseph Mathew", "8–12", 399),
      b("Wild Hearts", "Riya Banerjee", "13–17", 449),
    ],
  },
  {
    slug: "2026-02",
    title: "First Chapters",
    month: "February",
    year: 2026,
    art: "chapters",
    blurb: "Short chapters and big stories for brand-new independent readers.",
    books: [
      b("Pip Goes to School", "Sneha Kulkarni", "5–7", 229),
      b("The Boy Who Lost His Laugh", "Aman Gupta", "6–8", 249),
      b("Mira and the Magic Bicycle", "Divya Pillai", "7–9", 279),
    ],
  },
];
