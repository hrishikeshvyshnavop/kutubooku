# KutuBooku

Books picked for your child. A Next.js app that curates children's books (ages under 1–14) for
parents in India, with a family book box that checks out on Amazon.in and an in-house gifting flow.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (run with `NODE_ENV` unset) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Project structure

```
app/
  page.tsx, home/            Home page (/ and /home)
  books/, books/[id]/        Catalogue and book pages
  curation/                  A child's book picks
  reading-preferences/       Questionnaire about a child
  box/                       Family book box → Amazon.in
  gifting/                   Gifting page, quiz, checkout, orders
  children/, sign-in/, curators/
  _components/
    ui/        Buttons, toast, date picker, FAQ, nav links, section title
    layout/    Header, footer, page transition, smooth scroll, preloader
    home/      Home page sections
    book/      Book card, cover, 3D book, book sheet, review wall
    ai/        Ask KutuBooku AI chat and avatar
    child/     Child avatars and questionnaire art
    media/     Mascot video
  _data/       Content and shared constants (server- and client-safe)
  _lib/        Browser state stores and helpers
  _held/       Parked pages and their components (not routed)
docs/          Product decisions (CONTEXT.md) and research
public/        Images, covers, catalogue JSON, icons
```

Folders starting with `_` are not routes.

## Conventions

See `.claude/skills/kutubooku-conventions/SKILL.md` for code style, the design language, where
things live and how to verify a change. Product decisions are recorded in `docs/CONTEXT.md`.

## Notes

- Content (books, collections, FAQ, reviews) is sample data in `app/_data/` and `public/covers/`,
  shaped for a future Payload CMS.
- The box, gift basket, gift orders and sign-in are saved in the browser until real accounts,
  payments and order emails exist.
- Deployed on Vercel.
