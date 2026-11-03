// Shared styling for the tall colour book cards (books page + "Read more like
// this" in the details pop-up). Layout modelled on Aardvark's book cards;
// colours are KutuBooku's palette.

/** Card colours. `dark` = light text on a dark card. */
export const CARD_COLOURS = [
  { bg: "#f6c453", fg: "#1d2838", dark: false },
  { bg: "#1d2838", fg: "#fffdf8", dark: true },
  { bg: "#c9b7f1", fg: "#1d2838", dark: false },
  { bg: "#f26b4f", fg: "#1d2838", dark: false },
  { bg: "#a9dfc0", fg: "#1d2838", dark: false },
  { bg: "#5b4a8b", fg: "#fffdf8", dark: true },
  { bg: "#9fcbf2", fg: "#1d2838", dark: false },
];

/** Card colour comes from the cover accent stored in the book JSON. */
export function cardColourFor(coverTone: string, _index: number) {
  void _index;
  const fallback = CARD_COLOURS[0].bg;
  const bg = /^#[0-9a-f]{6}$/i.test(coverTone) ? coverTone : fallback;
  const hex = bg.slice(1);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const lightness = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  const dark = lightness < 0.55;
  return { bg, fg: dark ? "#fffdf8" : "#1d2838", dark };
}

/** Cards rest straight; on hover they lift and tilt slightly (alternating direction). */
export const CARD_TILTS = ["hover:-rotate-2", "hover:rotate-[1.5deg]", "hover:-rotate-1", "hover:rotate-2", "hover:-rotate-[1.5deg]", "hover:rotate-1"];

export const PILL_COLOURS = [
  { bg: "#1d2838", fg: "#fffdf8" },
  { bg: "#fffdf8", fg: "#1d2838" },
  { bg: "#f26b4f", fg: "#1d2838" },
  { bg: "#9fcbf2", fg: "#1d2838" },
  { bg: "#c9b7f1", fg: "#1d2838" },
  { bg: "#d8e88a", fg: "#1d2838" },
];

/** Short tag labels for pills. */
export const TAG_SHORT: Record<string, string> = {
  animals: "Animals",
  space: "Space",
  dinosaurs: "Dinosaurs",
  mystery: "Mystery",
  myths: "Myths",
  funny: "Funny",
  feelings: "Feelings",
  nature: "Science",
  adventure: "Adventure",
  sports: "Sports",
  history: "History",
  making: "Making",
};
