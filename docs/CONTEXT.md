# KutuBooku Revamp — Project Context

_Last updated: 2026-11-02. Source: requirements Q&A with the product/design lead._

This file records every decision made so far, open questions, and risks. Answers marked **Open** have not been decided — do not fill them in with assumptions.

---

## 1. Background

- Current site: https://www.kutubooku.com/ (built on Wix). Today it sells a **children's book subscription in India**, with Shop, Gifting, Reading Levels, Our Curators, Reviews, FAQ pages and a seasonal gift box ("Jingle Jolly Box").
- The owner has had many logistics problems, so the current shop is being shut down.
- **New model:** send traffic to **Amazon.in** and earn affiliate commission (the 6% figure is unverified — see §9).
- The reading-preferences flow (https://www.kutubooku.com/reading-preferences) is being redesigned. It ends in an **AI-generated curation** of books.
- The whole site will be powered by **Payload CMS** (dev team, later).
- The **AI model** is being built by a separate team (local model). Its internals are out of scope for design.
- **Gifting** stays, handled manually by the Kutubooku team.
- A curation has several books, so it needs **Amazon bulk "add to cart"**.
- The kutubooku.com **domain stays**.

---

## 2. Audience and market

| # | Decision |
|---|---|
| Q1 | Main user: **the parent or gift-giver** choosing books for a child. |
| Q1b | Readers' ages: ~~0–17~~ → **0–14** (changed 2026-11-02; the questionnaire offers "Under 1" to 14). |
| Q1c | The questionnaire asks for the child's **exact age in years** (number tiles), not a range (decided 2026-11-02). The age is stored with the date it was given (`ageAskedAt`) so it can count up for monthly curations. Bands (0–2, 3–5, 6–8, 9–12, 13–14) are worked out internally to match publisher age labels; parents never see them. Helpers: `currentAge()` and `ageBand()` in `app/_data/questions.ts`. |
| Q2 | Users are in **India**. |
| Q2b | Amazon store: **Amazon.in only**. |
| Q9 | Books: **English only**. |

---

## 3. Business

| # | Decision |
|---|---|
| Q3 | Amazon.in Associates account: **not applied yet**. |
| Q3b | Source of the 6% figure: **unknown** — needs checking against Amazon.in's rate card. |
| Q4 | Revenue: **Amazon affiliate commission only**. |
| Q4c | "Subscription" = **a monthly curation**. Kutubooku sends a new curation each month; the parent buys on Amazon with the bulk-cart link. No subscription fee. |
| Q5 | Domain stays. |
| Q5b | Unsold stock: **Kutubooku lists it on Amazon.in as a seller**. |
| Q5c | Old customer accounts and order history: **migrate to the new site**. |
| Q6c | The subscription stays (as the monthly curation above). |

---

## 4. Accounts and profiles

| # | Decision |
|---|---|
| Q7 | Parents do the flow without an account; **sign-in is required to see the curation**. |
| Q7b | Sign-in: **Google only**. |
| Q8 | **Several child profiles per account**, each with its own preferences and curations. |

---

## 5. Reading-preferences flow

| # | Decision |
|---|---|
| Q6 (draft, built) | Built at `/reading-preferences`, one question per screen (layout modelled on a Promova quiz screen from Refero, with KutuBooku wording, neutral greys). **Questions (draft except the name, which was confirmed 2026-11-02):** 1. **child's name** (required, single line, used to personalise every later question, e.g. "How old is Meera?"), 2. age band (single), 3. reading stage (single), 4. interests (multi), 5. what they love right now (text, optional), 6. books already read (text, optional), 7. topics to avoid (multi, optional). ⚠️ The child's name is personal data about a minor, so it feeds into Q31 (privacy and consent).
  - **Already read (decided 2026-11-02):** a yes/no first ("No, start fresh" / "Yes, I'll add some"). No moves on automatically; Yes reveals a title field where each title becomes a removable chip. It's now required (a quick tap), and the summary shows "None" or the titles.
  - **Editing from the summary (decided 2026-11-02):** tapping a summary row opens that question in edit mode ("Editing" label). "Save" or "Back to summary" returns straight to the summary instead of going through the remaining questions.
  - **Can't stand (updated 2026-11-02, based on the current site's aversions question):** "Anything {name} just can't stand?", optional. Quick choices plus "Something else…", which reveals a chip field for specific topics or characters. Continue stays disabled while a revealed field is empty.
  - **Answer illustrations (2026-11-02):** every answer for reading stage, interests, already read and can't stand has its own original two-colour spot illustration (`app/_components/AnswerArt.tsx`, keyed `questionId:value`). They are **not** on the answer rows, which use letter tiles. They appear in the **left panel as a collection that builds up across all questions**: earlier picks stay in place, new picks pop in, unpicking removes a tile, "can't stand" picks carry a coral no-sign badge, and more than 10 shows "+n". The bookshelf progress was removed and replaced by "Question X of 7 · %" with a progress bar.
  - **Follow-up fields** ("Something else…", "Yes, I'll add some") open directly under their own option, scroll clear of the pinned action bar, and take focus.
  - **Progress indicator:** a small bookshelf, one spine per question, each with a topic icon (tag, cake, book, star, heart, check, no-sign) (answered = navy, current = coral and raised, upcoming = outline), with "4 of 7" underneath. It replaced the number badge and the thin line.
  - **Summary screen:** "All set for {name}", a single list of short labels and answers, skipped questions hidden, main button "See {name}'s books". Ends in a summary and "See my child's curation" → `/sign-in?next=/curation`. Answers are kept in sessionStorage so they survive sign-in. Questions live in `app/_data/questions.ts`. |
| Q6 (original note) | The current live flow's first step is "Hello there! May I know the little reader's name?" (required). Later steps aren't visible without clicking through and weren't shared. The owner of the redesigned flow must list the questions and which are required. |

---

## 6. AI curation (what the parent sees)

| # | Decision |
|---|---|
| Q10 | Model internals (type, hosting): **out of scope for design** — dev/AI team. |
| Q10 (design) | Loading state while the curation is built: **Open** (designer's call; default "curating your books" animation). |
| Q13 | Books per curation: **varies, around 10**. What decides the count is **Open**. |
| Q14 | **No human review**: AI curations go straight to the parent. |
| Q15 | Parent can: **regenerate the whole curation, swap/remove single books, rate books, mark "already own"/"already read", report unsuitable books**. |
| Q15b | Regenerate: **unlimited**. |
| Q16 | Every book shows a **short "why we picked it" reason**. |
| Q29 | **Site won't launch until the AI is ready** (no hand-picked fallback). |
| Q29b | If the AI fails or is slow: **"We'll email you when it's ready"**. |

---

## 7. Amazon bulk add to cart

| # | Decision |
|---|---|
| Q17 | All three: **"Add all"**, **tick to choose some books**, and a **"Buy on Amazon" button per book**. |
| Q17b | **One combined cart across all children.** |
| Q17c | Same book picked for two siblings: **the parent chooses** 1 or 2 copies. |
| Q18 | Out of stock / unavailable on Amazon.in: **hidden and automatically replaced**. |
| Q19 | Book card shows: **cover, title and author, price, Amazon rating and review count, age range/reading level, short description, format**, plus the reason (Q16). |
| Q19b | Price freshness: **Open** — dev team to check Amazon's rules. Design two states: live price with "as of" time, and "Check price on Amazon". |
| Q21 | Sales measurement: **dev/business**. Design part: a "Did you buy these?" prompt on the next visit, which feeds "already own". |

---

## 8. Notifications

| # | Decision |
|---|---|
| Q20 | Monthly curation sent by **email, WhatsApp and push notification**. |
| Q20b | Message links go **straight to the Amazon cart** (⚠️ see §9). |

Design needs: a step to collect the WhatsApp number with opt-in (Google sign-in doesn't provide it), a "Get notified" push prompt (not on page load), and a notification-preferences page.

---

## 9. Gifting

| # | Decision |
|---|---|
| Q22 | Gifting is **handled by Kutubooku**. |
| Q22b / Q23 | Gift-givers **pay Kutubooku on the site** (own checkout + payment gateway). Kutubooku buys, wraps and delivers. |
| Q22c | Gift-giver pays **book prices only**; Kutubooku covers wrapping and delivery. |
| Q24 | Gift books come from **Kutubooku's own stock or distributors**, not Amazon. |
| Q24b | **Any book from a child's curation** can be gifted. |
| Q25 | **No limit** on gift orders for now. |

Gift screens needed: gift basket, recipient address, gift message, wrapping choice, payment, confirmation, order tracking in the account, delivery estimate per book, and a "can't be gifted right now — here's a similar one" state.

---

## 10. Platform

| # | Decision |
|---|---|
| Q26–28 | What Payload stores, the API setup and AI hosting: **dev team**. |
| — | Front end: **Next.js 16** (this repo), Tailwind v4. |
| H1 | Home screen is being built as **working code in this repo**. |
| H2 | **New branding** — do not inherit anything from the current Wix site. Only the name "KutuBooku" stays. |

**Proposed brand direction (in the code, open to change):** warm "paper" background `#fbf6ec`, deep ink text `#1d2838`, marigold `#f4a836` for primary actions, with leaf green, coral, sky and plum accents. Fonts: Fraunces (headings) and Nunito Sans (body). Tokens live in `app/globals.css`.

---

## 11. Site pages

| # | Decision |
|---|---|
| Q30 | **Every page will be redesigned; some will be removed** (which ones: **Open**). Starting with the **home screen**. |
| — | "Our Curators" conflicts with Q14 (no human review): remove or reword, e.g. "How our curation works". |

> **Editions on hold (2026-11-02):** the `/editions` route is removed for now; its page is kept at `app/_held/editions-page.tsx` (move it back to `app/editions/page.tsx` to restore). The questionnaire has no close button while this is on hold.
>
> **Questionnaire UX (2026-11-02):** warm palette (cream page, navy ink, coral accent, left panel changes colour per question). Back sits right next to Continue at the bottom-right (Fitts's law), hidden on question 1. The action row is pinned to the bottom of the screen on every step and on the summary. Steps crossfade with React `<ViewTransition>`. Selecting an answer grows a fill from the tap point, with a spring tilt on the letter tile. Checked at 1280×720, 1366×768, 1536×864, 1920×1080 and 390×844.
>
> **Landing page (2026-11-02): `/` is now the reading-preferences questionnaire** (also at `/reading-preferences`). The Editions shelf moved to `/editions` (now on hold, see above). The questionnaire's visual style follows the design language of a Reown blog page from Refero: mid-grey page, very large rounded panels, black monospace tiles, thin light headlines, one red-orange accent. **Typography decision (2026-11-02): one typeface, Inter Tight, everywhere in the questionnaire.** The mono font (JetBrains Mono) was removed completely; numbers use tabular figures instead. All action buttons share one style (56px tall, 18px radius): coral primary, navy-outline secondary. On hover and keyboard focus they morph into a full pill (28px radius) over 300ms, and ease back when the cursor leaves. The Google button does the same.
>
> **Status (2026-11-02): home page work is paused.** Focus moved to the reading-preferences questionnaire. A neutral wireframe of the home page (Aardvark-style section structure, KutuBooku content) is in Figma: https://www.figma.com/design/D2YSLONP8r5J69GiH8YBwK?node-id=1413-2

### Home screen (current build)
The first sectioned home page was replaced. The home page is now a **"wall of shelves"** of monthly **Editions**, inspired by the layout of shopify.com/editions (original artwork and copy; nothing copied).
- Each month's curation theme is an **Edition** with a cover (3:4 book ratio) leaning on a shelf, newest first. **New concept: needs confirming** — how Editions relate to each child's personal curation.
- **Hover:** the cover tips upright, lifts, and tilts in 3D toward the cursor.
- **Click:** a pop-up opens, the cover flips open like a book, and the inside page shows the edition's books, an approximate total, **"Buy all on Amazon"** (bulk cart), and "Personalise this Edition for my child" (→ reading-preferences flow).
- Top-right button: "Find books for my child". Footer: Amazon affiliate disclosure.
- Edition books, prices and ASINs are **placeholders**. The bulk cart link falls back to an Amazon.in search until real ASINs exist. The Associates tag is read from `NEXT_PUBLIC_AMAZON_TAG`.

---

## 12. Risks and things to check

1. **Affiliate links in email/WhatsApp (Q20b).** Amazon's Associates terms, as far as we know, don't allow affiliate links in emails; breaking this can close the account. Check Amazon.in's current terms. Fallback: link to the curation page on Kutubooku.
2. **6% commission (Q3b).** Unverified. Check the books rate on the Amazon.in Associates rate card.
3. **Account approval (Q3).** Amazon reviews the site on application and may close accounts without early qualifying sales. Apply once the new site has real content; plan timing.
4. **Commission on own listings (Q5b).** Check whether Amazon pays commission on purchases of Kutubooku's own seller listings.
5. **Prices and ratings display (Q19b).** Amazon restricts showing and storing its prices and ratings outside its official product data API, and API access depends on sales.
6. **Google-only sign-in vs migration (Q5c, Q7b).** Old Wix accounts can only be matched by email; parents whose email isn't a Google account lose access to their history.
7. **No human review (Q14).** Needs a "report this book" path and age-suitability safeguards.
8. **Gift sourcing (Q24/Q24b).** Curation books come from Amazon's catalogue, but gifts come from distributors — some books may be hard to supply.
9. **Gifting costs (Q22c).** Kutubooku covers wrapping and delivery; check whether distributor margin covers it.
10. **Children's data.** The flow collects details about children from parents — privacy and consent (Q31) still to be decided.

---

## 13. Open questions

- **Q6** — Reading-preferences flow questions and which are required.
- **Q10 (design)** — Loading state while the curation is built.
- **Q13** — What decides the number of books in a curation.
- **Q19b** — Price/rating display rules (dev team).
- **Q30** — Which pages are removed.
- **Q31** — Privacy and children's-data consent in the flow.
- **Q32** — Where the Amazon affiliate disclosure appears (home footer has one for now).
- **H3/H4** — Confirm home screen sections and main action.

---

## 14. Sign-in and curation screens (built 2026-11-02, mock data)

- **`/sign-in?next=/curation`:** "Sign in to see {name}'s books" with a "Continue with Google" button. **Google sign-in is simulated** (it sets `kb:signed-in` in sessionStorage). Real Google sign-in through Payload is a dev-team task, and should use Google's official button assets.
- **`/curation`:** sends anyone not signed in to `/sign-in`, shows a friendly empty state if there are no answers, then "Curating {name}'s books…" (about 2.5s, with books sliding onto a shelf). `?slow=1` shows the "We'll email you when it's ready" state (Q29b).
- **Results:** 9 picks from **fictional sample books** (`app/_data/curation-mock.ts`), ranked by `app/curation/pick.ts`:
  - **Ranking:** interest overlap scores highest, then whether the exact age is inside the book's range (±1 year of slack).
  - **Excluded:** titles already read, books flagged with "can't stand" topics, and anything removed or marked own/read.
  - **Regenerate:** reshuffles books with similar scores.
- **Each card:** cover, title, author, ages, format, rating (sample), price, description, "Why we picked it" (uses the child's name and a matching interest), a tick to include it in the cart, thumbs up/down, Buy on Amazon, and a ⋯ menu (Swap, Remove, Already own, Already read, Report).
- **Sticky bar:** "N selected · approx ₹X", Regenerate, and "Add N to Amazon cart" (opens the Amazon link in a new tab, rel=sponsored).
- **Mock only:** "Already own/read" is remembered only until the page reloads, and Report only shows a thank-you message. Both need a backend.

> **Google sign-in button (2026-11-02):** uses Google's official four-colour "G" and the light theme from Google's Sign-In branding guidelines (white fill, #747775 border, #1F1F1F text, "Continue with Google", no extra icons). Only the size and corner radius are ours (56px, 18px). Real Google OAuth is still a dev-team task; the button only simulates sign-in.

> **Intro preloader (2026-11-02):** `app/_components/Preloader.tsx`, shown on the landing page. The motion is modelled on Aardvark Book Club's load sequence (layered waves rise, books tumble in), but it uses only KutuBooku's palette, code-drawn books and the "kutubooku" tile, with no third-party artwork. It lasts about 1.9s, then lifts away. It plays once per browser session; a click or any key skips it; it doesn't run with "reduce motion". On phones the books are repositioned so the wordmark stays clear.
>
> **Books page card (2026-11-02):** a simplified card was tried and then **reverted at the user's request** to the original fuller card: description, format, review count, boxed "Why we picked it", thumbs on the card, "Buy on Amazon". Later the same day the navy outline on selected cards was removed: selection now shows by the ticked checkbox, with unselected cards fading back and their cover dimmed.

> **Book details sheet (2026-11-02):** tapping a book's cover or title on `/curation` opens a full-page modal sheet (`app/curation/BookDetails.tsx`) that slides up and leaves a **100px gap at the top** so the list stays visible, dimmed, behind it. Close with ×, Escape or a click on the dimmed strip. Section order follows Aardvark Book Club's book page (e.g. aardvarkbookclub.co.uk/books/incarnate): title block (cover, topic chips, title, author, ages · format · rating, "Why we picked it", price, Include in cart / Add to my list, Buy on Amazon) → At a glance (4 tiles) → The story (italic tagline + synopsis) → "Don't just take our word for it" (parent reviews) → "Get a taste" (opening lines, only some books) → Notes for parents (content flags) → "Read more like this" (4 similar books, which open in the same sheet). All content is fictional sample data in `app/_data/book-details.ts`; real copy will come from Payload.

> **Books page cards, take 2 (2026-11-02):** tall colour cards, with the layout modelled on Aardvark's book cards (the user's reference) but KutuBooku's palette, fictional books, code-drawn covers and copy:
> - a solid card colour (never the same as the cover), slight alternating tilt that straightens and lifts on hover
> - large cover with the select tick on it, then tag pills (interests + ages), a big bold title, a quiet meta line, a three-line description and "Why we picked it"
> - price, thumbs and ⋯ in a row, then a full-width split "Buy on Amazon →"
> - **the whole card opens the book details**; the tick, thumbs, ⋯ and Buy keep their own actions, and the title is the keyboard trigger
> - "Read more like this" in the details pop-up uses the same style (smaller), with a split "Read more →"
>
> Shared colours, tilts and tag labels live in `app/curation/card-style.ts`. A copy of the page before this change is at `scratchpad/Curation.before-tall.tsx` (outside the repo).

> **Layout tokens (2026-11-02), one consistent set for the whole app:**
> - **Max content width 1920px**, centred (changed from 1440px on 2026-11-02 at the user's request). Applies to the questionnaire, sign-in, the books page and the book details pop-up.
> - **Inner panel side padding:** 20px on phones, 40px from `sm`, 6% from `lg`. The same on every screen and in the details pop-up.
> - **Outer frame gutter:** 10px on phones, 12px from `sm`.
> New screens should use these values.

> **Primary button (2026-11-02):** amber `#f1a903` (hover `#d99500`) with **navy text**, giving 7.4:1 contrast (6.1:1 on hover). White text on this amber is only about 2:1, so it's not used by default (`app/_components/Button.tsx`). Coral stays as the accent for selected tiles, quotes and confetti.
>
> **AI essence on the results page (2026-11-02, header simplified the same day):** one quiet line under the title, "✦ 9 books picked by KutuBooku AI from {name}'s answers. Untick any you don't want." The dark badge pill and the "Matched on" chips were removed because the left panel already lists the answers; each "Why we picked it" types itself out after its card lands. During Regenerate the badge sparkle spins and the line beside it cycles "Re-reading {name}'s answers…" → "Finding fresh matches…" → "Writing why each one fits…", then the new set is dealt in (shuffle-and-deal) and the reasons type out. With "reduce motion", reasons appear instantly. Copy deliberately says the AI *picked* the books and claims nothing more.

> **Fixes (2026-11-02):**
> - **Regenerate/swap replay:** cards play their entrance once. Reasons keep their typing delay from when they appeared, so they don't retype when the deal finishes.
> - **Names:** the child's name is capitalised for display everywhere ("hrishi" shows as "Hrishi", "anna-maria" as "Anna-Maria"). The saved answer stays exactly as typed.

> **Home FAQ (2026-11-03):** `app/_components/HomeFaq.tsx`, after the book listing. Cream panel; on desktop the title ("Questions parents ask us") and "Find books for my child" stay pinned on the left while 10 questions scroll on the right. One answer open at a time; the open row turns amber. Copy is in `app/_data/faq.ts` and only states decided facts (free, Amazon.in, ages under 1–14, Google sign-in, several child profiles, monthly picks, English only, gifting via the team). Update it if any of those decisions change.

> **Home "How it works" (2026-11-03):** `app/_components/HomeHowItWorks.tsx`, between the book listing and the FAQ. Layout modelled on givingli.com's How it works carousel (updated 2026-11-03): one step at a time, huge number left, picture card centre, "Step 01 of 03" + title + text right, round prev/next arrows and "01 / 03" below, then the CTA; copy, colours and code-drawn visuals are KutuBooku's own. Steps: 1. Tell us about your child, 2. Get books picked for them, 3. Add them all to your Amazon cart. Arrows, Left/Right keys and swipe change step; on phones the columns stack. Peach background (#FDDAA6), between the two cream sections.

> **Section titles (2026-11-03), one style everywhere:** `app/_components/SectionTitle.tsx`. A handwritten Caveat label (violet #3b308f, tilted −3°, 28→36px) above a bold title (44px on phones → 80px at 1920px, leading 0.85). Used by every section on the home page (From our shelf, How it works, Good to know) and the book page (what happens, who's who, from parents, ask after the last page, after story time, up next). New sections should use it. "At a glance" on the book page keeps its own floating label (it has no title).

> **Footer (2026-11-03):** `app/_components/GlobalFooter.tsx`, on the home page, book pages and the 404 page (not on the questionnaire, sign-in or curation screens, which are full-screen flows). Black panel; closing line "Every child has a book they'll love. Let's find it." (shared SectionTitle, amber label "one last thing") with the amber split CTA; "explore" (the header's amber nav pills), "your account" and "follow along" (Instagram, TikTok) columns; the full-width kutubooku wordmark; © line and the Amazon Associates disclosure ("As an Amazon Associate, KutuBooku earns from qualifying purchases."), which answers Q32 for now. **Open:** real Instagram/TikTok URLs (links are "#" placeholders). Nav links now live in `app/_data/nav.ts`, shared by header and footer.

> **Sticky footer reveal (2026-11-03):** each page's `<main>` gets `REVEAL_ABOVE` (from `GlobalFooter.tsx`: rounded bottom corners 32/48/64px, z-10, opaque background) and the footer sits under it (`StickyFooterShell.tsx`, sticky bottom-0, z-0), so the page lifts off the footer at the end. The footer only pins when it fits the screen (≈870px at 1440 wide, so most laptops/desktops); on phones and short screens it scrolls normally, because a taller pinned footer would be uncovered from the middle. Footer spacing was tightened for this. The copyright year is written out (`YEAR` in `GlobalFooter.tsx`; update each January), because this Next version rejects `new Date()` during prerendering.
>
> **Mascot above the footer (2026-11-03):** Figma node 1433:7 (Hrishi's Workspace), the mint KutuBooku character hugging a book, cut flat at the bottom. `app/_components/FooterMascot.tsx`, image at `public/brand/mascot/kutu-peek.png`. It's the last thing in `<main>` on the home page, book pages and 404, centred, flush with the bottom edge, so it peeks over the footer as the page lifts. The Figma mask (a 949×368 crop of the 980×389 image) is reproduced as an overflow-hidden box.

> **Footer colour (2026-11-03):** changed from black to the brand mint `#96D7C8` (the logo's "kutu" colour). Black text, violet handwritten labels (as elsewhere), amber pills and CTA, socials as black circles (the icons are peach), and the full-width wordmark rendered all black (its mint half would vanish on mint). The mint mascot peeking over the edge now reads as rising out of the footer.

> **Footer background, take 2 (2026-11-03):** the footer now uses the home hero's own background (peach `#FDDAA6` + the soft white radial glow), shared in `app/_components/hero-bg.ts` so the two can't drift. The wordmark is back in its mint + amber (as in the header on the same peach); text black, labels violet, socials black circles.

> **How it works is scroll-driven (2026-11-03):** on lg+ screens where the whole section fits (e.g. 1440×900), it pins and each ~0.7 screen of scroll moves one step (same card-deck animation, odometer number, text lines), with a short hold on step 3 before the page carries on. The arrows then scroll the page to that step, so scroll stays the one source of truth. Phones and short screens keep the tap/swipe carousel. The arrows and the "Find books for my child" button now share one row so the pinned section fits one screen.

> **Hero → book page morph (2026-11-03):** clicking a book in the home hero carousel flies that same book into the cover slot on its book page (React `<ViewTransition name="book-<id>" share="book-morph">` on both: `BookHero.tsx`, `BookCover3D.tsx`; timing in `globals.css` `.book-morph`). Only the clicked copy is named (the carousel renders each book twice). The book page is prefetched on hover, focus and click, because the morph only plays when the page is ready in the same commit. Note: Next's dev overlay flags `/books/[id]` for reading `params` outside `<Suspense>` ("instant navigation"); not fixed yet.
>
> **Mascot = the AI assistant (2026-11-03):** the mint mascot's face (`public/brand/mascot/kutu-avatar.png`, cropped from the Figma art; component `app/_components/KutuAvatar.tsx`, peach circle) replaces the sparkle wherever the AI speaks or works: hero chat header and input, "Summarised by KutuBooku AI" on book pages, the AI line on the curation page, and the How it works step-2 tag. While the AI is thinking it wiggles (bob + tilt, Web Animations API; off with reduced motion). The small inline sparkle in "Why we picked it" stays (a face is unreadable at 14px). The assistant is still named "KutuBooku AI"; **open:** does the mascot get its own name?

> **Performance pass: hero → book page (2026-11-03).** Measured on a production build in Chrome at 1440×900, normal CPU and 4× slowed (≈ mid-range phone):
> - Click → transition finished: 1440 → 1078 ms (normal), 2799 → 1976 ms (4×). Main thread blocked: 88 → 55 ms / 1203 → 598 ms. Idle hero at 4×: 37 → 50 fps.
> - Fixes: open delay 450 → 120 ms (the morph carries the motion now); the book page's cover is preloaded at its real size on hover/focus/click (`getImageProps`); `Book3D` memoised; hero loop no longer reads `scrollWidth` every frame; book floats also pause per book when off screen while the hero is visible (the hero-wide `data-paused` pause, which stops all floats when the hero is covered, was already there; only ~5 of the 30 books are ever in view); book page sections below the fold use `content-visibility: auto`; nav links to pages not built yet don't prefetch (`live` flag in `app/_data/nav.ts`); book page marked `"use cache"`.
> - Remaining biggest cost: React rendering the whole book page on arrival (~300–500 ms at 4×).

> **Hero height (2026-11-04):** the hero is exactly one screen tall below the header at every size (`h-[calc(100dvh-80px)]`, 88px header from xl; min 560px, 620px from sm). The old 940px cap left a gap on 1080p+ screens, and phones had no height at all. The carousel band grows to fill the space at every size, so the chat box always sits at the bottom.

## 15. Book cart (decided 2026-11-04, not built yet)

A family-wide cart on the site. Parents collect books, then send them all to Amazon.in in one go.

| # | Decision |
|---|---|
| C1 | The cart **replaces** the curation sticky bar: ticking a book adds it to the cart; the bar reads "N in cart · View cart". |
| C2 | Add-to-cart points: **curation page, Edition pop-up, book detail page** (not every cover on the site). |
| C3 | Per-book "Buy on Amazon" **adds the book, then sends the whole cart** to Amazon. |
| C4 | Label follows the cart: "Buy on Amazon" when the cart is empty, "Add & buy all N on Amazon" when it isn't. |
| C5 | **No sign-in needed.** Cart is saved in the browser and copied into the account on sign-in. |
| C6 | On add: **toast ("Added · View cart") + badge count**, parent stays on the page. |
| C7 | Cart is its **own page, `/cart`**. |
| C8 | **Netflix-style child profiles** ("Who's choosing books today?"). This is new and also affects home and curation pages. **One family cart, grouped by profile**, single checkout. |
| C9 | No active profile → ask once "Who's this for? Aarav · Meera · Just browsing", remembered for the visit. |
| C10 | Same book under two children → cart flags it: "Buy 1 to share, or 2?", default **1**. |
| C11 | **No quantity control.** 1 copy each, except the C10 choice. |
| C12 | Cart row: **cover, title, author, child tag, approximate price, Remove**; tapping it opens the book page. |
| C13 | **Always show an approximate total** with a disclaimer (⚠️ Amazon price-display rules, see §12.5). |
| C14 | Unavailable on Amazon.in → **keep it, mark it, offer "Swap for a similar book"**; not sent at checkout. |
| C15 | **Soft limit about 20 books.** Above it, a note and checkout in batches (dev team: confirm Amazon's limit for adding many items at once). |
| C16 | "Go to Amazon" → **handoff screen** ("you'll pay on Amazon" + affiliate disclosure) → Amazon in a **new tab**; this tab shows "What next?". |
| C17 | After Amazon: **ask on return** "Did you place the order? Yes, clear my cart / Not yet, keep it". No answer → cart stays. |
| C18 | "Yes" → books marked **Bought**: kept out of future curations, listed on each child's profile. |
| C19 | Empty cart: **mascot + "See this month's Edition" / "Find books for [child]"**, plus a few picks if a profile is active. |
| C20 | Cart icon **top-right next to the profile avatar, with a badge, on every page**. Header layout needs another look. |
| C21 | **"Share cart" link** → read-only copy of the cart on this site with its own Amazon button (no affiliate links in messages). |
| C22 | **No wishlist / save for later.** The cart is the only list. |
| C23 | New Edition with old books still in the cart → **leave them**, gentle note "3 books from October's Edition are still here". |
| C24 | Track: books added, cart views, Go to Amazon presses, "I ordered" confirmations, **by where the book was added and by child**. |

**For the dev team:** Amazon's limit for adding many items at once (C15); whether showing prices is allowed (C13); sign-in merge of the browser cart (C5); share-link storage (C21).

> **Box built (2026-11-04, mock data).** The cart is called **"box"** everywhere people see it (Amazon's own cart keeps its name). Route `/box` (`app/box/Box.tsx`), store `app/_lib/box.ts` (localStorage `kb:box`, bought books `kb:bought`), header box icon with count `app/_components/BoxLink.tsx`.
> - **Box page:** C7, C8 grouping, C10, C12–C19, C21, C23, C24 (events go to `window.dataLayer`). Fills the screen height. `/box?demo=1` = sample books for two children; `/box?checkout=1` opens the Amazon handoff straight away.
> - **Signed in vs guest (C5, simulated with `kb:signed-in`):** guest sees "Your box is only saved in this browser · Sign in to save it" (→ `/sign-in?next=/box`), and on the empty box "Started a box on another device? Sign in to see it". Signed in sees "Saved to your account"; the first visit after sign-in says "We've added the N books from this browser to your account". The header doesn't change with sign-in yet.
> - **`/curation` is box-driven (C1):** a tick adds the book to the box for that child; nothing is added automatically ("Tick the ones you want in your box"), so unticked cards no longer fade. Sticky bar: "N in {child}'s box · approx ₹X", Regenerate, "View box (N)". Remove / Swap / Already own take the book out of the box; a swap moves the tick to the new book.
> - **Buy on Amazon on a card or a book page (C3/C4):** adds the book, then sends the whole box. Only this book → Amazon opens now; otherwise → `/box?checkout=1`. Label: "Buy on Amazon" or "Add & buy all N on Amazon".
> - **Book page tray:** "Add to box" (toast "Added to box · View box"; becomes "✓ In box") + Buy. Asks "Who's this for? {child} · Just browsing" once per visit when a child name is known (C9).
> - **Listing sheet:** clicking a book on `/curation` opens the **new book page** (`BookPdp` in sheet mode) inside the old slide-up sheet; "Read more like this" opens in the same sheet; the tray sticks to the sheet's bottom. Old sheet copy: `scratchpad/BookDetails.before-pdp.tsx` (outside the repo).
> - **Not wired yet:** Edition pop-up add-to-box, real child profiles. **Mock:** availability (`MOCK_UNAVAILABLE`), share links carry the list in the URL, no ASINs yet so Amazon opens a search.

> **Sign-in works end to end (2026-11-04, still simulated).** One session store, `app/_lib/session.ts` (localStorage `kb:session`, so it survives reloads and new tabs; the old `kb:signed-in` flag is still read). "Continue with Google" signs in a **sample account** ("Sample Parent", parent@example.com) until real Google OAuth exists (dev team).
> - **`/sign-in`** works from anywhere: `?next=` is where to go after (the header passes the current page). Title follows the reason: "Sign in to see {name}'s books" (curation), "Sign in to save your box" (box), "Sign in to KutuBooku" (anything else). Already signed in → "You're signed in" with Continue and Sign out. Back goes to the answers in the curation flow, otherwise back a page.
> - **Header signed in:** "Log-in / Sign-up" is replaced by an avatar pill with the first name → menu (name and email, My box with count, My child's books, Edit reading answers, Sign out). On phones the same items sit in the Menu panel. Before hydration the slot is kept but hidden, so nothing jumps.

> **Add-to-box moment (2026-11-04):** `app/_lib/fly.ts`. Adding a book (curation tick, book page "Add to box") lifts a copy of its cover off the page and flies it in an arc into the box: it lifts and grows a little, tumbles, shrinks, and fades into the box. The header box icon (`BoxLink.tsx`) opens its lid at take-off, snaps it shut with a bounce on landing, a green "+1" pops beside it, and the count only goes up on landing (badge pop). If the header was hidden by scrolling it slides back in (`kb:reveal-header`). If the cover is off screen, a book-shaped copy pops out of the tapped button instead. Inside the listing's sheet the tray's box button catches it (the sheet covers the header). With "reduce motion" there's no flight, just the catch. Covers are marked `data-book-cover`, landing spots `data-box-target`.

> **Book page as a sheet on every screen (2026-11-04, reworked the same day).** Any book link inside the app (home hero and book list, the AI answer picks, box rows, "Read more like this") opens the book page in the slide-up sheet over the current screen. The sheet lives in the URL as **`?book=<id>`** (e.g. `/box?book=the-dot`), so **refresh keeps the screen and the sheet**, the link can be shared, and Back closes it. ×, Escape and the dimmed strip close it too (it slides down, then the URL updates). Plain `/books/<id>` links still open the full page when opened directly (search engines, old links); inside the app a click on them is caught and opens the sheet. Files: `app/_lib/book-sheet.ts` (open/close/preload/flight), `app/_components/BookSheetHost.tsx` (in the root layout), `BookSheet.tsx` (the frame), `BookSheetContent.tsx` (lazy content). `/curation` keeps its own sheet (it carries "Why we picked it", "Add to {child}'s list" and the child's box).
> - **The book flies into the sheet (made seamless the same day):** the sheet's own 3D book flies from where the clicked book was (hero 3D book, card cover, box row) into its place, following the sheet as it slides up. Because the sheet clips its content while it slides, the flying book is an exact copy of that 3D book (same markup, tilt and images) in the browser's top layer; it lands exactly on the real one, which appears in the same frame, so there is no visible swap. Measured: it starts on the clicked hero book and ends at the real book's exact position and size. The listing's sheet (`/curation`) plays the same flight. Replaces the hero → page view-transition morph.
> - **Closing puts the screen back:** the sheet announces `kb:book-sheet-closed`; the hero then drops the lifted book, un-dims the others, releases the focus the sheet returns to the clicked book, and starts drifting again.
> - **Speed:** the sheet's code is loaded once the page is idle (and on hover), focus or touch of any book link, along with the cover image. The sheet renders the top (title, cover, tray) first and the rest of the page right after, in an interruptible transition. Measured in dev without hover warm-up: cover in the sheet about 360 ms after the click, full page about 410 ms.

> **More than one child (built 2026-11-04, Q8 / C8 / C9).** Store: `app/_lib/children.ts` (localStorage `kb:children`; ⚠️ simulated until accounts exist, shown only when signed in). The active child drives `/curation`, the book page's "Who's this for?" and `readAnswers()`.
> - **Ways to add a child:** "+ Add child" tile on the `/children` picker ("Who's choosing books today?"); "Add a child" in the header account menu (the menu now lists the readers too); "+ Add another child" in the reader chips above `/curation`; "+ Someone new" in "Who's this for?" (the book goes into the new child's box, then back to the book); "Got another reader? Add them" on the questions' summary.
> - **Flow:** `/reading-preferences?new=1` (sign-in first; the first child's draft is saved as a reader then). Name question reads "Who's the next reader?". Interests and "Can't stand" offer "Start from {sibling}'s picks"; age, reading stage and books read are always asked fresh. Ends on the new child's books (active).
> - **Edit / remove:** `/reading-preferences?child=<id>` opens on the summary: change answers or picture, rename (box rows move with the name), "Remove {name}" with a confirm (their books stay in the box under "Just browsing"). "Manage readers" on `/children` leads here.
> - **Rules:** names must be unique in the account (box rows are filed by name), so a clash asks for an initial or nickname; at most 6 readers.
> - **Profile pictures (Netflix-style):** book characters, 15 square crops of our covers in `public/avatars` (list: `app/_data/avatars.ts`). A new child gets one no sibling has; "Pick a character" grid from the pencil on the summary. ⚠️ Cover art belongs to the publishers: needs cleared character art before launch.

> **Box per child: decisions (2026-11-04, B1–B10). Built 2026-11-04:** header switch `app/_components/ChildSwitch.tsx`; who-for helpers `readFor` / `setFor` / `switchChild` in `app/_lib/children.ts`; `moveItem`, scoped `markCheckoutStarted` / `confirmOrdered` and `sharedBoughtWith` in `app/_lib/box.ts`; box groups, "Buy {child}'s books" and "Move to…" in `app/box/Box.tsx`; toast "Change" and "+ Add for … too" in `BuyTray.tsx`.
> | # | Decision |
> |---|---|
> | B1 | Adding a book: ask "Who's this for?" once per visit, then remember it. Every add shows "Added to {child}'s box · Change"; Change moves that one book. Switching child in the header changes the remembered answer too. |
> | B2 | Book page button when the book is already in the box: "✓ In {child}'s box" plus "+ Add for {other child} too". |
> | B3 | One family box, grouped by child; each group has "Buy {child}'s books on Amazon"; "Go to Amazon" still buys everything. |
> | B4 | Wrong child: "Move to…" in each book's ⋯ menu (other children + For anyone). |
> | B5 | A shared copy goes with whichever child's group is bought first; the other child's row shows "Shared with {child} · bought" once the order is confirmed. |
> | B6 | Active child shown as their picture beside the box icon in the header; tap → other children, "+ Add child", "Manage readers". |
> | B7 | "Just browsing" stays only in "Who's this for?"; its books sit in a "For anyone" group; the header always shows a child. |
> | B8 | Header box badge counts the whole family box. |
> | B9 | Guest taps "+ Someone new": sign in first; the book waits and goes into the new child's box. (As built.) |
> | B10 | Box group order: active child first, then the others in the order they were added, "For anyone" last. |

> **Box polish (2026-11-04):**
> - `/curation` cards: the main button is "Add to {child}'s box" / "In {child}'s box" (tap again to take it out); the corner tick is gone.
> - Header: one profile control, the active child's picture and name, with switching, add child, manage readers, My box, the Google email and Sign out. The parent's name is no longer shown.
> - `/box`: no footer. The total counts to its new value with the difference floating beside it ("Buy 1 to share" ↔ "Buy 2", removals). Remove / Move to… run as View Transitions: rows glide, a moved row glows on landing. The Amazon handoff has a × close.
> - Ticks are an SVG (`app/_components/CheckIcon.tsx`), not the ✓ character.

> **All books page `/books` (2026-11-04).** Every book on the shelf, in the tall colour cards. Filter chips (decided): search (title/author), one age band (counts per band; empty bands greyed; the active child's band is picked to start, labelled "· Meera", and can be switched to All ages), any number of interests. Filters are kept in the URL (`?age=3-5&into=animals&q=dot`) so a filtered list can be shared. Tapping a card opens the book sheet; the main button adds to the box for the child shown in the header (B1/B6). Linked from the header nav ("All books") and the home book list ("See all books").

> **Date of birth replaces the age (2026-11-04, supersedes Q1c's age tiles).** Question 2 is now "When's {name}'s birthday?", as tiles like the other questions: Year tiles (last 15 years), then Month tiles (future months greyed), plus "🎂 Add the day for a birthday surprise", which reveals an optional day grid sized to that month ("Skip the day" hides it). Live line: "Smith is 5 years and 7 months old · turns 6 on 12 March 🎉". Saved as `dob` "YYYY-MM-DD" ("YYYY-MM-" without the day; then the birthday counts as the 1st). Checks: real date (no 31 February), not in the future, 14 or under; a live line says "Meera is 5 years and 7 months old". The age everywhere (curation picks, `/books` default age, saving a child) comes from `ageOf()` in `app/_data/questions.ts`, which also reads older answers that have `age` + `ageAskedAt`. ⚠️ A child's full date of birth adds to Q31 (privacy and consent). The birthday pick itself isn't built yet.

> **Signed out box and cursor (2026-11-04).**
> - Box notes: no "Saved to your account" banner and no guest "only saved in this browser" note. Just after signing in, a toast says "Added N books from this browser to your account" once, then fades.
> - Signed out, the box is one plain list: each book once, no child groups, no "Move to…", no "both have this"; Remove takes the book out for every child; the header badge counts each book once.
> - Home book row and `/books` cards: "Add to {child}'s box" (shared `app/_components/useCardBox.tsx`).
> - Cursor everywhere (desktop): our own chunky rounded arrow with a white outline, in the style of agentcard.com's (their image isn't used). Ink #1d2838 by default; on links, buttons, chips, tiles and cards only the fill changes, to coral #f26b4f. Disabled controls keep the ink arrow, text fields keep the text cursor, touch screens are unaffected. In `app/globals.css` (`--cursor-default`, `--cursor-action`).
