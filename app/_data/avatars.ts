// Profile pictures for child profiles, Netflix-style: characters from the books we recommend.
// Square crops of the book covers in public/covers (made with a script, 256×256 webp in public/avatars).
// ⚠️ The covers belong to their publishers. Before launch, swap these for character art
// the publishers have cleared for this use (or our own illustrations).

export type Avatar = { id: string; label: string; book: string };

export const AVATARS: Avatar[] = [
  { id: "humpty", label: "Humpty", book: "After the Fall" },
  { id: "seed", label: "The Bad Seed", book: "The Bad Seed" },
  { id: "yellow-monster", label: "Yellow monster", book: "The Color Monster" },
  { id: "rabbit", label: "Taylor and the rabbit", book: "The Rabbit Listened" },
  { id: "penguin", label: "Penguin", book: "Lost and Found" },
  { id: "yet", label: "Explorer in a helmet", book: "The Magical Yet" },
  { id: "human", label: "Kind kid", book: "I Am Human" },
  { id: "blue-monster", label: "Blue monster", book: "The Color Monster" },
  { id: "inventor", label: "The inventor", book: "The Most Magnificent Thing" },
  { id: "jabari", label: "Jabari", book: "Jabari Jumps" },
  { id: "red-monster", label: "Red monster", book: "The Color Monster" },
  { id: "explorer", label: "The boy", book: "Lost and Found" },
  { id: "green-monster", label: "Green monster", book: "The Color Monster" },
  { id: "bottle-girl", label: "The girl", book: "The Heart and the Bottle" },
  { id: "brian", label: "Brian", book: "The Invisible Boy" },
];

export const avatarSrc = (id: string) => `/avatars/${id}.webp`;
export const avatarById = (id: unknown) => AVATARS.find((a) => a.id === id) ?? null;
