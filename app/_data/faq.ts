// Home page FAQ. Answers only state what has been decided (docs/CONTEXT.md).
// Real copy will come from Payload CMS.

export type Faq = { q: string; a: string };

export const HOME_FAQ: Faq[] = [
  {
    q: "What is KutuBooku?",
    a: "Tell us a little about your child and KutuBooku AI picks books for them, each with a short note on why it fits. When you're happy with the picks, add them all to your Amazon.in cart in one go.",
  },
  {
    q: "Does it cost anything?",
    a: "No. Answering the questions and getting your child's picks is free. You only pay for the books you choose to buy on Amazon.in. We may earn a small commission from Amazon when you do, at no extra cost to you.",
  },
  {
    q: "How are the books picked?",
    a: "From your answers: your child's age, how they read right now, what they love, books they've already read and anything they just can't stand. Books they've read or topics they dislike are left out.",
  },
  {
    q: "What ages are the books for?",
    a: "From under 1 to 14. Tell us your child's exact age and the picks are matched to it.",
  },
  {
    q: "Do I need an account?",
    a: "You can answer the questions without one. To see your child's picks, sign in with Google, so we can keep them for you.",
  },
  {
    q: "Can I add more than one child?",
    a: "Yes. Each child gets their own profile, with their own preferences and their own picks.",
  },
  {
    q: "How often do we get new books?",
    a: "Every month. We put together a fresh set of picks for your child, and you decide which ones to buy.",
  },
  {
    q: "What if a pick isn't right?",
    a: "Swap it, remove it, or mark it as already read or already owned. You can also ask for a fresh set of picks at any time.",
  },
  {
    q: "Are the books in other languages?",
    a: "Not yet. All books are in English for now.",
  },
  {
    q: "Can I send books as a gift?",
    a: "Yes. Gifting is handled by the KutuBooku team. Get in touch and we'll help you send books to a little reader.",
  },
];
