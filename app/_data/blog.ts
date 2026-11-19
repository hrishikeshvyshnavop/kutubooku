export type BlogTopic = "reading-tips" | "book-lists" | "feelings" | "gifting";

export const BLOG_TOPICS: { value: BlogTopic; label: string; tone: string }[] = [
  { value: "reading-tips", label: "Reading tips", tone: "#f6c453" },
  { value: "book-lists", label: "Book lists", tone: "#9fcbf2" },
  { value: "feelings", label: "Big feelings", tone: "#f7ab95" },
  { value: "gifting", label: "Gifting", tone: "#a9dfc0" },
];

export const topicOf = (value: BlogTopic) => BLOG_TOPICS.find((t) => t.value === value) ?? BLOG_TOPICS[0];

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; who?: string }
  | { type: "list"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  topic: BlogTopic;
  author: string;
  date: string;
  readMinutes: number;
  books: string[];
  body: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "make-bedtime-reading-stick",
    title: "Ten minutes a night: making bedtime reading stick",
    excerpt: "You don't need a reading nook or a perfect routine. A few small habits turn bedtime books into the part of the day your child asks for.",
    topic: "reading-tips",
    author: "The KutuBooku team",
    date: "2026-11-14",
    readMinutes: 5,
    books: ["the-rabbit-listened", "the-wonderful-things-you-will-be", "you-choose"],
    body: [
      { type: "p", text: "Most parents we talk to want the same thing: a child who reaches for a book on their own. The good news is that it rarely starts with a big plan. It starts with ten minutes, most nights, with a book your child actually enjoys." },
      { type: "h2", text: "Let them choose (most of the time)" },
      { type: "p", text: "Children who pick the book are more invested in it. Offer two or three options rather than the whole shelf, and don't worry if they want the same story for the fortieth time. Re-reading builds vocabulary and confidence." },
      { type: "h2", text: "Make it a conversation, not a performance" },
      { type: "p", text: "Pause on a page and ask what they notice. Let them predict what happens next. A book like You Choose is built for exactly this: every page is a question, and every answer is right." },
      { type: "quote", text: "The best bedtime stories are the ones where your child does half the talking.", who: "A KutuBooku curator" },
      { type: "h2", text: "Small habits that help" },
      { type: "list", items: ["Keep tonight's book where your child can see it.", "Stop while they still want more.", "Let older siblings read to younger ones.", "Swap a screen for a story once a week, not every night."] },
      { type: "p", text: "If an evening goes wrong, skip it. Reading should be the calm part of the day, never another task on the list." },
    ],
  },
  {
    slug: "books-for-big-feelings",
    title: "Books that help children name big feelings",
    excerpt: "Anger, worry, sadness, jealousy. Picture books give children words for what's happening inside, and give us a gentle way to talk about it.",
    topic: "feelings",
    author: "The KutuBooku team",
    date: "2026-11-07",
    readMinutes: 6,
    books: ["the-color-monster", "when-sadness-is-at-your-door", "the-heart-and-the-bottle", "the-bad-seed"],
    body: [
      { type: "p", text: "Young children feel things long before they can explain them. A meltdown at dinner is often a tired, worried or left-out feeling that hasn't found its words yet. Stories help by showing a feeling from the outside, where it's safer to look at." },
      { type: "h2", text: "Start with colours and characters" },
      { type: "p", text: "The Color Monster sorts feelings into colours, which makes them easy to point at. Ask your child which colour they are today. Some days the answer will surprise you." },
      { type: "h2", text: "Let sadness sit for a while" },
      { type: "p", text: "When Sadness Is at Your Door treats sadness as a visitor you can sit with, not a problem to fix. It's a lovely book to read after a loss, a move, or just a hard week." },
      { type: "quote", text: "Naming a feeling is the first step to managing it, for children and for us.", who: "A KutuBooku curator" },
      { type: "h2", text: "Read it again on a calm day" },
      { type: "p", text: "These books work best when nobody is upset. Read them on an ordinary evening, so the words are already there when a big feeling arrives." },
    ],
  },
  {
    slug: "picking-books-by-age",
    title: "How to pick the right book for your child's age",
    excerpt: "Age labels on covers are a starting point, not a rule. Here's what actually changes from board books to first chapter books.",
    topic: "reading-tips",
    author: "The KutuBooku team",
    date: "2026-10-30",
    readMinutes: 7,
    books: ["the-dot", "jabari-jumps", "the-invisible-boy"],
    body: [
      { type: "p", text: "Two six-year-olds can be in very different places with reading. One wants long stories read aloud, the other is sounding out every sign on the road. Matching the book to the child, not just the number, is what keeps them reading." },
      { type: "h2", text: "Under 3: touch, sound and repetition" },
      { type: "p", text: "Board books with bold pictures, rhythm and repeated lines. Babies love hearing the same words again and again, and toddlers love joining in." },
      { type: "h2", text: "3 to 5: stories with a heart" },
      { type: "p", text: "Picture books with a clear problem and a warm ending. Jabari Jumps is a perfect example: one brave moment, told slowly enough to feel every step up the ladder." },
      { type: "h2", text: "6 to 9: bigger ideas, more independence" },
      { type: "p", text: "Children start reading parts of books on their own and want stories about friendship, fairness and belonging. The Invisible Boy opens great conversations about who gets noticed at school." },
      { type: "list", items: ["Read slightly above their level together.", "Let them read slightly below their level alone.", "Follow their interests over any reading list."] },
    ],
  },
  {
    slug: "festive-season-stories",
    title: "Stories to share this festive season",
    excerpt: "Books about light, family and home, for reading together between the sweets and the visitors.",
    topic: "book-lists",
    author: "The KutuBooku team",
    date: "2026-10-24",
    readMinutes: 4,
    books: ["i-am-human", "lost-and-found", "the-magical-yet"],
    body: [
      { type: "p", text: "Festivals are full of noise, food and family, and that's exactly why a quiet story at the end of the day feels so good. These picks are about kindness, home and the people who make it." },
      { type: "h2", text: "Kindness, close to home" },
      { type: "p", text: "I Am Human is a gentle reminder that everyone makes mistakes and everyone can be kind. It's a lovely one to read with cousins visiting." },
      { type: "h2", text: "Friendship that finds its way" },
      { type: "p", text: "Lost and Found is about a boy, a penguin and what it really means to look after someone. Short, funny and very sweet." },
      { type: "quote", text: "A festival is a good time to start a family tradition: one new book, read together, every year." },
    ],
  },
  {
    slug: "gifting-books-children-love",
    title: "How to gift a book a child will actually love",
    excerpt: "Not sure what they're reading? Start with what they're into, not what you loved at their age.",
    topic: "gifting",
    author: "The KutuBooku team",
    date: "2026-10-17",
    readMinutes: 4,
    books: ["the-most-magnificent-thing", "the-dot", "jabari-jumps"],
    body: [
      { type: "p", text: "A book is one of the best gifts you can give a child, and one of the easiest to get slightly wrong. The classic we loved growing up might not land with a child who's into dinosaurs and space right now." },
      { type: "h2", text: "Ask one question first" },
      { type: "p", text: "What are they into this month? Animals, building things, superheroes, cricket? Pick a story that meets them there, and the reading follows." },
      { type: "h2", text: "When in doubt, pick a story about trying" },
      { type: "p", text: "Books like The Most Magnificent Thing and The Dot suit almost every child: they're about making something, getting frustrated and trying again." },
      { type: "list", items: ["Add a short note about why you chose it.", "Pick one great book over three average ones.", "Wrap it. Unwrapping is half the fun."] },
    ],
  },
  {
    slug: "reading-with-siblings",
    title: "Reading time with two (or three) children",
    excerpt: "A toddler and a seven-year-old at the same story time? It's easier than it sounds, and the older one often becomes the best reader in the house.",
    topic: "reading-tips",
    author: "The KutuBooku team",
    date: "2026-10-09",
    readMinutes: 5,
    books: ["you-choose", "the-wonderful-things-you-will-be"],
    body: [
      { type: "p", text: "Different ages, different attention spans, one bedtime. Families tell us this is the hardest part of reading together. A few small changes make it work." },
      { type: "h2", text: "Pick books with layers" },
      { type: "p", text: "Books with rich pictures and simple words work for everyone: the little one points, the older one reads. You Choose is a favourite for this." },
      { type: "h2", text: "Give the older child a job" },
      { type: "p", text: "Let them read a page, do the voices, or turn the pages. They feel grown-up, and the younger one hears reading from someone who isn't a parent." },
      { type: "quote", text: "My son reads to his sister every night now. I just listen.", who: "A parent, Kochi" },
    ],
  },
];

export const postBySlug = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);

export const sortedPosts = () => [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

export const relatedPosts = (post: BlogPost, count = 3) =>
  sortedPosts()
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => Number(b.topic === post.topic) - Number(a.topic === post.topic))
    .slice(0, count);

export const postDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
