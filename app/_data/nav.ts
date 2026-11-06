// Site navigation, shared by the header (client) and the footer (server).
// Kept out of HomeHeader.tsx: a "use client" module's plain values can't be imported by server components.

// /gifting and /blog are still to be built (they show the 404 page for now). FAQ is the home
// page's FAQ section (/#faq); NavLink glides to it when already on home.
// `live: false` = page not built yet: links to it don't prefetch (it would only fetch the 404).
export const NAV = [
  { href: "/reading-preferences", label: "Find books for my child", live: true },
  { href: "/books", label: "All books", live: true },
  { href: "/curators", label: "Our curators", live: true },
  { href: "/gifting", label: "Gifting", live: false },
  { href: "/blog", label: "Blog", live: false },
  { href: "/#faq", label: "FAQ", live: true },
];

export const PILL =
  "flex h-14 items-center whitespace-nowrap rounded-full bg-[#fbbe63] px-4 text-2xl font-semibold leading-none tracking-[-0.16px] text-black transition-[background-color,scale] duration-200 hover:bg-[#f9a220] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";
