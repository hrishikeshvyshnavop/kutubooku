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
> - Fixes: open delay 450 → 120 ms (the morph carries the motion now); the book page's cover is preloaded at its real size on hover/focus/click (`getImageProps`); `Book3D` memoised; hero loop no longer reads `scrollWidth` every frame; book floats pause per book when off screen (the old `data-paused` attribute had no CSS rule, so all 30 books floated all the time); book page sections below the fold use `content-visibility: auto`; nav links to pages not built yet don't prefetch (`live` flag in `app/_data/nav.ts`); book page marked `"use cache"`.
> - Remaining biggest cost: React rendering the whole book page on arrival (~300–500 ms at 4×).
