---
name: kutubooku-conventions
description: House rules for working on the KutuBooku Next.js app — code style (no comments, plain component names, grouped props), how to ask design questions, where shared values live, how to verify a change, and known build quirks. Use before writing, refactoring, tidying, renaming or verifying code in this repo, and before asking the team design/UX questions.
---

# KutuBooku conventions

## Code style

- **No comments.** Components ship without explanatory comments. Keep only functional directives
  (`eslint-disable…`, `@ts-expect-error`) and mention that you kept them. To strip comments safely
  (TypeScript-aware, keeps directives and JSX intact):
  ```bash
  node .claude/skills/kutubooku-conventions/scripts/strip-comments.cjs <files…>
  ```
  The scanner misses comments inside an empty block (`catch { /* … */ }`) or after a trailing
  comma in an object literal; grep for `//` and `/*` afterwards and fix those by hand.
- **Plain component names.** Name by what it is: `Header`, `Footer`, `Hero`, `Faq`, `BookList`,
  `AiChat`. No `Home…`/`Global…`/`Site…` prefixes. File name = export name. Rename
  with `git mv` and update every import plus mentions in `globals.css` and `docs/CONTEXT.md`.
- **Tidying** means: extract hooks (e.g. `useScrollDrivenRow`) and small subcomponents, name magic
  numbers and long class strings as constants, group related props into objects, remove dead
  exports. Behaviour must not change.
- **Grouped props.** Prefer objects over long flat prop lists. `BookCard` is the reference:
  `book, index, titleAs, href | onOpen, box: { child, selected, onToggle }, curation: { motion, rating, onRate, menu }`.
  `useAddToBox().cardProps(id)` returns the `box` object.
- **One component per concern.** Merge thin wrappers into the component they wrap (e.g. the sticky
  wrapper lives inside `Hero`; `HideOnScroll` lives inside `Header`).

## Where things live

| What | Where |
|---|---|
| Buttons, toast, date picker, FAQ, nav links, section title | `app/_components/ui/` |
| Header, footer, page transition, smooth scroll, preloader | `app/_components/layout/` |
| Home page sections | `app/_components/home/` |
| Book card, cover, 3D book, book sheet, review wall | `app/_components/book/` |
| AI chat and avatar | `app/_components/ai/` |
| Child avatars and questionnaire art | `app/_components/child/` |
| Mascot video | `app/_components/media/` |
| Components used by only one route | Next to that route (e.g. `app/gifting/quiz/GiftQuiz.tsx`) |
| Plain values imported by server *and* client code | `app/_data/` (`theme.ts`, `footer.ts`, `nav.ts`, `card-style.ts`, `sheet.ts`, `gifting.ts`…) |
| Browser state stores and helpers | `app/_lib/` (`box.ts`, `gift-basket.ts`, `gift-orders.ts`, `answers.ts`, `format.ts`…) |
| Parked pages and their components | `app/_held/` |
| The book card | `app/_components/book/BookCard.tsx` (use it for every book card; don't make one-off tiles) |

Put a new component in the folder for its role; don't add files to the top of `app/_components/`.

A server component **cannot** import a plain value from a `"use client"` file. Put shared
constants (class strings, colours, data) in `app/_data/` instead.

## Design language (reuse, don't reinvent)

- Backgrounds: peach `HERO_PEACH` (`#FDDAA6`) with `HERO_GLOW`, cream `#fffdf8`, sand `#f4efe6`;
  ink `#1d2838`; amber `#f9a220`; coral `#f26b4f`; violet eyebrow `#3b308f`.
- Section headings: `SectionTitle` with a handwritten Caveat eyebrow.
- Buttons: always `Button` from `app/_components/ui/Button.tsx`; never hand-style a `<button>` for an action.
  `variant`: `primary` (amber block), `secondary` (outline with fill sweep), `split` (label + arrow chip,
  the main CTA), `ghost` (pill), `icon` (round, needs `label`), `link` (underlined text), `google`.
  `tone`: `amber` `violet` `ink` `light` `outline` `clear` `danger`. `size`: `sm` `md` `lg`.
  Also `href` / `newTab` (renders a link), `icon` (`arrow` `external` `none` or a node), `arrow`, `loading`.
  `AddToBoxButton` is the one exception: the stateful add/in-box toggle.
- Option rows and tiles: cream `#f4eee3`, navy fill that grows from the press point, tilted
  coral/amber accent when selected (see `app/reading-preferences/Questionnaire.tsx`,
  `app/gifting/quiz/GiftQuiz.tsx`, `app/_components/ui/DatePicker.tsx`).
- Cards: rounded 28–40px, colour from `cardColourFor`, slight alternating hover tilt.
- Motion: `animate-q-in` for entrances; respect `motion-reduce`.
- Type: the `type-*` utilities in `app/globals.css` (`type-display`, `type-title`, `type-body`…).

## Asking design questions

- Ask about what users see (flows, screens, states, copy), not infrastructure or AI internals.
- Use the question dialog, **one question per call**, 2–4 options, recommended option first and
  labelled "(Recommended)". The team usually picks it, so make it a genuinely good default.
- When a request is ambiguous ("fix all card properties", "make X a single component"), offer
  concrete interpretations as options rather than guessing.

## Verifying a change

1. `npx tsc --noEmit`
2. `npx eslint <changed paths>` (a pre-existing `BTN_PRIMARY` unused warning in
   `Questionnaire.tsx` is known)
3. `npm run build` **with `NODE_ENV` unset** (`unset NODE_ENV` in bash). A shell that sets
   `NODE_ENV=development` makes prerendering fail with
   `Cannot read properties of null (reading 'useContext')`; that is the environment, not your change.
4. If a dev server is already running on port 3000, test against it instead of starting another.
5. Say plainly what you did not check in a browser.

## Next.js in this repo

- Read `node_modules/next/dist/docs/` before using an API; this Next version differs from older ones.
- `cacheComponents` is on: don't read the current time during prerender. Read `new Date()` only in
  browser-only branches (e.g. after a `useSyncExternalStore` store returns non-null) or inside
  `useState(() => typeof window === "undefined" ? null : new Date())`.
- `useSearchParams` needs a `<Suspense>` boundary around the client component.
- Pages that hold personal or order data (`/box`, `/curation`, `/gifting/checkout`,
  `/gifting/order`, `/gifting/orders`…) get `robots: { index: false }` and a `disallow` in `app/robots.ts`.
- If `next build` stops with `SecurityFatalError`, the installed Next version has a published
  advisory; upgrade before shipping. A completed "Generating static pages (N/N)" line still means
  your pages rendered.

## Git

Commit and push directly on `main` (no feature branches) unless asked otherwise. Only commit when asked.
