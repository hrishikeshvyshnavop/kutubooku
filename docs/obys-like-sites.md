# Sites like Obys' Design Books (library.obys.agency)

Research date: 2026-11-02
Status: complete.
Companion to `docs/design-inspiration.md`.

## How this was researched

Each site was checked on 2026-11-02 in three ways:
- curl, for HTTP status, page title and front-end libraries
- a text fetch of the page
- for Obys, its raw HTML: class names, `data-*` hooks and scripts

**Limits.** I see markup and text, not rendered pixels. "Verified" means the page loaded with real content. Interaction notes come from the markup (hooks such as `data-animation="particle-hover"`, Tailwind hover classes) or from Awwwards write-ups, as marked. I have **not** watched the motion. A designer should open each link before quoting a detail as fact.

---

## The reference: Obys' Design Books (ODB)

- **URL:** https://library.obys.agency/. Verified, home page and a book page (`/books/graphic-design-manual/`).
- **Category:** curated library of design books, by Obys agency (a "Design Education Series").
- **Award:** Awwwards SOTD + Developer Award, 17 Dec 2025. Scores: SOTD 7.6 (Design 7.94, Creativity 8.13); Dev 7.47 with Animations/Transitions 8.2 and Accessibility 6.4. Tags: Experimental, Typography, Unusual Navigation, WebGL, GSAP.
- **Stack (from markup):** three.js and GSAP bundles, Swup-style page transitions (`data-swup-ignore-script`, `data-transitions-container`), Tailwind CSS, a custom cursor (`.cursor__inner`).

### What makes it stand out (only what I could verify)

**Layout**
- A 12-column grid.
- On desktop, a **sticky left panel with an orange paper texture** (`bg-texture--orange`, `md:sticky`) holds the ODB wordmark and a "Quotes: (3)" block.
- The right column scrolls the "Featured Books" list past it.
- Every block is separated by thin full-width rules (`border-t border-current`), giving a ledger or index-card feel.

**Typography**
- Big uppercase display headings, some set with `mix-blend-overlay` over imagery, so the type takes on the colour beneath it.
- Bold, tight-leading blockquotes (`leading-none font-bold`).
- Citations set uppercase with forced line breaks ("TYPOGRAPHY: / A MANUAL OF DESIGN").
- Counts in parentheses after headings: "Featured Authors (6)", "Quotes: (3)".
- Abbreviated attributions as a label column ("E. Ruder:", "J. Müller-Brockmann:").
- Awwwards lists the palette as #0E0E0E / #D9D9D9, with orange textures and a rust accent (#80361F) in the markup.

**How books are presented**
- **Home:** books appear as a **numbered text list, not a cover grid**. Each row is title, number (1–8, right-aligned on laptop) and "(Author, Year)", e.g. "Graphic Design Manual 1 (Armin Hofmann, 1965)".
- **Hover:** each row carries a hidden `Hover_Book_NN.png` image inside `data-animation="particle-hover"` with `data-particle-image`. Hovering a title brings in the book image as a **WebGL particle effect** (three.js in the bundle). The image is triggered by a text row.
- **Detail page:**
  - The title as H1, then "(Armin Hofmann, 1965)".
  - A one-line thesis as H2 ("Design as balance — precision guided by intuition.").
  - The ISBN.
  - A pull quote decorated with a **paper-clip image** (`quote-clip.png`).
  - A large spread photo rendered through WebGL (`data-gl`).
- **Featured Authors (6):** cards with a square portrait, name and role ("Graphic Designer").

**Hover, scroll and click interactions (from markup hooks)**
- **Particle hover:** described above.
- **Binder-clip object:** a "binder" image is animated in WebGL (`data-animation="binder-gl"`) on the sticky orange panel. It is a stationery object pinned to the page.
- **Printhouse marquee:** six publisher logos (Prestel, Thames & Hudson, Phaidon…) loop in an endless marquee (`animate-crawling-line`) on an orange textured band with rust tabs at each end. Each logo zooms 110% on hover (`group-hover:scale-110 transition-transform duration-500`).
- **Scroll-linked logo:** the footer wordmark transforms as you scroll to the bottom (`data-animation="logo-transform"`, scrubbed with `data-start="top bottom-=50"`, `data-ease="none"`). The header logo reveals with a per-letter stagger (`logo-reveal`, interval 0.02 s, duration 0.9 s).
- **Draw-on-the-page tool:** a toggle opens a full-screen canvas with **Draw / Erase / Save drawing to JPG / Clear** buttons (each has an `aria-label`). Visitors can doodle over the library and download it.
- **Screensaver:** an idle-state `screen-saver` overlay with a marquee and an animated SVG "glitch shadow" filter.
- **Transitions:** page-to-page transitions with a loading overlay. The mobile menu shows a **thumbnail of each page** next to its link (`mobile-menu__thumbnail`).

### What Kutubooku's Editions shelf/pop-up could learn
- **Pair a fast text index with a rich hover reveal.** A plain numbered list (title · number · "(Author, Illustrator, Age)") can sit beside the 3D cover wall. Hovering a row lifts and highlights the matching cover on the shelf. This makes a quick-scan and accessible mode feel like a feature, not a fallback.
- **The book pop-up as an editorial page in miniature:** title, credit line, **one-line thesis** ("A brave little auto-rickshaw finds its way home"), an age and format line, one pull-quote from the book clipped on with a paper clip, then the Amazon CTA.
- **Stationery props** (binder clip, paper clip, orange paper texture) give a library warmth without heavy 3D. Kutubooku can use school-bag stationery the same way: a bookmark ribbon, washi tape, a library due-date stamp.
- **A "draw on the shelf" mode for kids.** Children can doodle on the wall and save the picture, which is delightful, cheap (2D canvas) and on-brand for a children's site.
- **Watch out:** Obys scored only 6.4 on accessibility, and a particle effect on hover does nothing on touch. Keep the list readable on its own, and show cover thumbnails inline on mobile.

---

## Similar sites

### 1. Creative Reference Library (CRL)
- **URL:** https://crl-2026.webflow.io/. Verified.
- **Category:** curated library of creative references: books, albums, videos, playlists, films.
- **What stands out:**
  - "A curated library of creative references from music, film, books, and writing" (Awwwards), labelled "V.01 (2026)", curated by Josh Bendall.
  - Black/white only.
  - Category counts in parentheses: Books (2), Albums (2), Videos (9), Playlist (3), Films & documentaries (2), plus a "Library (20)" nav item. This is the same counting device as Obys.
  - An "Enter Library" threshold, and Index / Library / About nav.
  - **Awwwards-listed elements:** a **WebGL Wheel Gallery**, a **List-to-carousel transition**, an Intro Loader and a **Footer letter playground**. I did not see these myself; the text fetch showed none of the item layout.
- **Kutubooku Editions lesson:** a **list ⇄ shelf toggle with a real transition between them**. Items animate from list rows into shelf positions, so switching view feels like rearranging the same objects rather than loading a new page. A "wheel" (circular carousel) is also a good mobile-friendly alternative to a wide wall.
- **Award:** Awwwards HM, 9 Oct 2026, nominated for Typography Honors. Credits: Bimo Tri, Josh Bendall. Tags: Typography, Gallery, WebGL, GSAP, Webflow.

### 2. Archive for Hans Sleutelaar
- **URL:** https://sleutelaar.xyz/. Verified (HTTP 200; it is a JavaScript app, and my text fetch saw only the title "Hans Sleutelaar | Officiële website").
- **Category:** editorial archive of a Dutch poet and writer (co-founder of *De Nieuwe Stijl*).
- **What stands out (from Awwwards):**
  - An "editorial-style archive".
  - Two colours: cyan #00A3DA with near-black #0D0D0D.
  - Featured elements: a hero text animation and an **interactive archive grid**.
  - Tags: Typography, Parallax, Storytelling, Interaction Design. Built with Svelte.
  - Barba.js is in the markup.
- **Kutubooku Editions lesson:** a **single bold accent colour on near-black or white** can carry an entire archive. Give each Edition one signature colour, and let the archive grid of past Editions read as a colour-coded timeline.
- **Award:** Awwwards HM, 30 Sep 2026. Credits: Ilias Salvatore Sleutelaar, Arvin Leeuwis, Filip Gadzinski.

### 3. Object & Archive
- **URL:** https://objectandarchive.com/. Verified.
- **Category:** curated shop of archival fine-art prints.
- **What stands out:**
  - "Curated fine art with a past and a point of view", with works "sourced from archives, restored in high resolution".
  - Paper-white #F9F8F2 on #121212.
  - The featured carousel shows a **position counter on each item ("1/18" … "18/18")**.
  - The collection is browsed by **Mood, Interior Style, Curation, Subject and Primary Color**, with mood headings like "Mood > Movement".
  - Stack: GSAP + ScrollTrigger + Lenis on Shopify.
  - Awwwards tags: Big Background Images, Gallery, Storytelling.
- **Kutubooku Editions lesson:**
  - Use the "**3/8**" position counter in the Edition pop-up so parents know how many picks are left to see.
  - Offer browse-by-mood shelves ("Bedtime calm", "Giggles", "Big feelings", "Brave adventures") next to age, because parents often shop by moment, not genre.
- **Award:** Awwwards HM, 18 Jun 2026. Creator: Erin Hammond.

### 4. The Manolo Blahnik Archives
- **URL:** https://thearchives.manoloblahnik.com/. Verified (the text shows only the shell: "A Curious Journey", Play/Pause, Sound On/Off).
- **Category:** virtual museum / 3D object archive (50th anniversary).
- **What stands out:**
  - Awwwards: "a virtual museum" with sketches, behind-the-scenes material and **3D shoe models**.
  - Tags: Unusual Navigation, 360, Gallery, 3D, Microinteractions. Stack: Three.js, GSAP, Nuxt.
  - Palette: black, white, Manolo red #D14836.
  - The landing page offers two doors: **"Full experience" and "Accessible Version"**.
- **Kutubooku Editions lesson:**
  - Copy the explicit **two-door entry**: a lightweight, accessible Edition list for slow phones and screen readers, alongside the full 3D shelf.
  - Pairing each object with its sketch also suggests showing an illustrator's rough sketch beside the final cover in the book pop-up.
- **Award:** Awwwards HM, 17 Mar 2022. Credits: Rōnin Amsterdam, Codeam.Studio.

### 5. Online Collection of the Tiroler Landesmuseen
- **URL:** https://sammlung.tiroler-landesmuseen.at/. Verified (German).
- **Category:** museum collection browser.
- **What stands out:**
  - 11 collection tiles with hover states (Awwwards lists a "Collections hover" element).
  - A **"Two works, linked by a keyword" random pairing** with a dice button ("Zufallsgenerator starten").
  - A **Favourites** counter in the main nav.
  - Search & Filter.
  - Black/white, clean. Nuxt + Swiper in the markup.
- **Kutubooku Editions lesson:**
  - A **"Surprise me" dice** that pairs two books by a shared theme ("Both have a grandmother hero!"). It is a playful way to explore beyond the current Edition.
  - A **wishlist heart with a nav counter**, so kids can collect favourites before a parent adds to cart.
- **Award:** Awwwards HM, 20 Oct 2023. Credits: Wir sind Plural.

### 6. Harvard Film Archive
- **URL:** https://harvardfilmarchive.org/. Verified.
- **Category:** cinematheque programme and film collection archive.
- **What stands out:**
  - Numbered featured cards.
  - "Now Playing" programme cards with date ranges.
  - "Upcoming screenings" grouped by day, each with time, title, director, year and a thumbnail.
  - Collections shown with a "Collection" label in the same stream as programmes.
  - Black/grey (#000 / #9C9C9C), Typekit type, `<canvas>` in the markup.
  - Awwwards tags: Retro, Typography, Flat Design.
- **Kutubooku Editions lesson:**
  - Mix **time-bound items (this month's Edition) and evergreen items (themed Collections)** in one stream, distinguished only by a label.
  - Number featured items so they read as a programme, not a product feed.
- **Award:** Awwwards SOTD + Developer Award, 18 Sep 2019 (7.43). Credits: Huncwot.

### 7. Roma Publications
- **URL:** https://www.romapublications.org/. Verified.
- **Category:** Amsterdam art-book publisher (Roger Willems). Its catalogue is a famously plain, typographic index.
- **What stands out:**
  - The entire catalogue is **one long numbered table**, newest first (524 → 1).
  - Columns: TITLE · ARTIST(S) · PAGES · SIZE (in cm.) · IN COLLABORATION WITH · ORDER · YEAR.
  - Number suffixes encode type ("500b" merchandise, "512 SP" special edition).
  - Each row expands in place into a detail block (format, description, design credit, ISBN, order link).
  - Status labels: "Out of print", "Edition of 400 copies".
  - Barba.js page transitions in the markup.
- **Kutubooku Editions lesson:**
  - **Expand-in-place rows** for the accessible list view: tap a book row, and the curator note, age, pages and Amazon button unfold beneath it with no page change.
  - Give every Kutubooku pick a **permanent catalogue number** ("KB-0142") that never changes across Editions.
- **Award:** none checked; a canonical reference among graphic designers for catalogue-as-index.

### 8. Standards Manual
- **URL:** https://standardsmanual.com/. Verified.
- **Category:** independent imprint reissuing historic design manuals (NYCTA, NASA, Coca-Cola…), Brooklyn.
- **What stands out:**
  - Each title is shown as an object: cover, several page **spreads**, a **spine** detail shot, and sometimes a video.
  - Status language is part of the design ("Pre-order · Shipping Nov 2026", "sold out", "First edition pricing").
  - Companion essays ("Read the essay", "Read the introduction by…").
  - "Compact Edition" variants sit beside the originals.
  - Shopify.
- **Kutubooku Editions lesson:** in the book pop-up, show **cover → two inside spreads → spine**, so the parent can judge illustration and text density before buying. For picture books this matters more than the blurb.
- **Award:** none checked; widely cited design-publishing benchmark.

### 9. TASCHEN
- **URL:** https://www.taschen.com/en/. Verified.
- **Category:** art-book publisher ("Books for Optimists Since 1980").
- **What stands out:**
  - Size and edition become badges: "XXL", "Baby Sumo", "Limited Edition (No. 201–1,500), each numbered and signed", "Art Edition No. 1–80".
  - Hero banners pair a title with a **celebrity or critic quote** (George Lucas, Richard Gere).
  - A seasonal curated shelf with a pun title ("Trick, Treat & Turn the Page").
  - "New", "Coming Soon" tags.
  - Stack: Next.js + Shopify + Barba.
- **Kutubooku Editions lesson:**
  - **Pun-titled seasonal shelves** fit Indian festivals: "Diwali Lights & Bedtime Bites", "Monsoon Reads".
  - Physical-format badges ("Board book", "Lift-the-flap", "Chapter book") work like TASCHEN's XXL tag, and tell a parent what the object is before they read the title.
- **Award:** none checked.

### 10. Codapress Publishing
- **URL:** https://codapress.co.uk/. Verified (the text fetch shows only a plain linked "Featured books" list; the visual layer is `<canvas>`/JS).
- **Category:** independent British publisher of technical guides.
- **What stands out (from Awwwards' element list, which I did not observe):**
  - An **"Infinite circular book carousel with snapping, inertia, and 3D hover"**.
  - A "Loading animation sequence with staggered grid reveal".
  - A "Pixel distortion image mouse interaction" and an interactive dithered-plasma hero.
  - "Seamless page transitions with Astro and GSAP".
  - A "Meltdown & reboot" SVG easter egg.
  - Black/white retro styling.
  - Notably, the underlying HTML is a **plain list of book links** (and the site even publishes an `llms.txt`), so the spectacle sits on top of a crawlable, accessible base.
- **Kutubooku Editions lesson:** this is the closest match to our shelf mechanics. **Snap + inertia + 3D hover on a book carousel** is the right physics for a swipeable mobile shelf. Building it as progressive enhancement over a plain HTML list is the right architecture for SEO and accessibility.
- **Award:** Awwwards HM, 24 Jul 2026. Creator: Dave Holloway. Stack: GSAP, Astro, SVG.

### 11. Stack
- **URL:** https://stackmagazines.com/. Verified.
- **Category:** monthly independent-magazine subscription club. It is the closest business analogue to Kutubooku Editions.
- **What stands out:**
  - "Subscribe to join our independent magazine club": each month one surprise independent magazine arrives.
  - Covers are shown with issue names ("Pit issue 17", "The Fence issue 28") plus origin and theme tags.
  - A **magazine archive of every title delivered in about 16 years**.
  - Testimonials carry the emotional promise ("like a little serotonin boost in my mailbox!").
  - Editorial cards with category labels.
- **Kutubooku Editions lesson:**
  - The **"every Edition we've ever made" archive** becomes a trust signal over time. Design it from day one, even when it holds only three Editions.
  - The **"little serotonin boost" monthly-ritual tone** suits a parent receiving a new Edition.
- **Award:** none checked.

### 12. Set Margins'
- **URL:** https://www.setmargins.press/. Verified.
- **Category:** independent art and design publisher (Eindhoven).
- **What stands out:**
  - Book cards carry a **sequence number** (high to low, with decimals for related sets: #36.1, #36.2, #36.3).
  - A status marker on every card: "New!", "Forthcoming", "In (re)print", "Sold out".
  - Discipline and language tags.
  - A "BOOK-SURPRISE" item.
  - A full "Filter & search" panel (search Anything / Title / Author, sort, status, keywords, languages, "Clear all", "No results found.").
  - Barba.js page transitions in the markup.
- **Kutubooku Editions lesson:**
  - **Decimal numbering for series and sequels** (#12.1, #12.2) makes a book series in an Edition visibly belong together.
  - A **"Surprise book"** card (mystery cover, revealed on click) would delight kids.
  - Language tags matter for Indian multilingual households.
- **Award:** none checked.

### 13. Fonts In Use
- **URL:** https://fontsinuse.com/. Verified.
- **Category:** searchable archive of typography in the wild (book covers, posters, packaging…).
- **What stands out:**
  - Every entry carries a title + date ("The Budget postal card, c. 1893"), a contributor credit, a thumbnail, and up to three **typeface tags with small type-specimen images**.
  - The indexes show **counts** ("Helvetica (1540)"; Show: All (34986) / Staff Picks (6400)).
  - Sort by Contribution Date, Artwork Date, Most Liked, Most Viewed.
  - A "Staff Pick" badge.
- **Kutubooku Editions lesson:**
  - **Tags with tiny visual samples**: a theme tag like "Animals" shows a mini illustration chip, and a language tag shows the script ("हिंदी", "தமிழ்").
  - Live counts on filters ("Ages 3–5 (8)") let parents see how deep each shelf is.
  - A "Curator's pick" badge is our equivalent of Staff Pick.
- **Award:** none checked; a long-running design-community archive.

### 14. NTS Radio
- **URL:** https://www.nts.live/. Verified.
- **Category:** radio station with a huge show archive and curated collections.
- **What stands out:**
  - **"Infinite Mixtapes"**: mood-themed endless streams ("Poolside", "Slow Focus"), each with an icon, a mood line and Play.
  - Show cards with genre tags separated by middots ("soul · lovers rock · rnb").
  - "Collections: themed playlists showcasing the breadth of the NTS archive".
  - "NTS Picks".
  - "Personalised Recommendations" behind MY NTS sign-in.
  - "1 / 14" carousel counters.
  - Barba.js transitions.
- **Kutubooku Editions lesson:**
  - **Mood shelves with an icon and a one-line mood description** ("Slow Focus" becomes "Wind-down Reads: quiet books for the last 10 minutes before sleep").
  - Middot-separated tag lines are a compact, elegant metadata style for book cards.
  - The "personalised for you" layer comes after sign-in, as at NTS.
- **Award:** none checked.

### 15. magCulture
- **URL:** https://magculture.com/. Verified (a second fetch succeeded after a 429 rate limit).
- **Category:** independent-magazine shop and journal (Jeremy Leslie, London).
- **What stands out:**
  - Cover grids with a **spec line** (size, page count, city, frequency), a status badge and a short blurb.
  - Opinionated section names ("New this week", "**We love...**", "New launches", "Books about magazines").
  - Issue numbers as identity ("Study #16").
  - Shop-by options that include **colour** ("blue", "red").
  - A companion Journal ("At work with:", "Events:").
  - Barba.js + Shopify.
- **Kutubooku Editions lesson:**
  - **A spec line on every book** ("32 pages · 22×28 cm · Read-aloud: 8 min · Hardback"), because practical facts sell to parents.
  - A warm, first-person "We love…" shelf for the curators' favourites.
  - Kids genuinely choose by colour, so a "Shop by colour" filter for children is worth testing.
- **Award:** none checked.

---

### Could not verify
- **Books of Design** (https://booksofdesign.designstripe.com/). Awwwards SOTD, 14 May 2023. This is the closest concept to Obys (design books per artist), but the host did not respond (curl status 000) on 2026-11-02. It may be offline.
- **Letterform Archive Online Archive** (https://oa.letterformarchive.org/). Loads, but showed "The Online Archive is temporarily offline", so I could not see the browsing UI. Its filters are People, Firms, Disciplines, Decades, Countries, Formats.
- **typo/graphic posters** (https://www.typographicposters.com/). HTTP 200, but it is a JavaScript-only page and no content was readable.
- **Printed Matter** (https://www.printedmatter.org/). No response (curl status 000).

---

## Takeaways: what the Editions shelf and pop-up should take from this family of sites

1. **Make the index a feature.** Obys, Roma, Codapress and A24 (see the main doc) all put a typographic list or index underneath or beside the visual layer. Build the shelf as progressive enhancement over a semantic list, and offer a visible List ⇄ Shelf toggle with an animated transition (CRL).
2. **Hover on a text row reveals the object.** Obys's particle-hover reveal is the signature move. A Kutubooku version: hovering a row in the list lifts the matching cover out of the shelf, and on touch, tapping a row expands it in place (Roma).
3. **Numbers and counts give a collection shape.** Item numbers (Obys 1–8, Set Margins' #36.1), position counters (Object & Archive "1/18", NTS "1 / 14") and category counts (CRL, Fonts In Use). For example: "Edition No. 07 · 3/8 · KB-0142".
4. **The pop-up as a miniature editorial page.** Every pop-up should contain:
   - title
   - credit line
   - a one-line thesis (Obys)
   - a spec line (magCulture)
   - cover, spreads and spine (Standards Manual)
   - a pull-quote with a stationery detail (Obys paper clip)
   - one clear Amazon CTA
5. **Physics for the mobile shelf.** Use snap, inertia and a gentle 3D hover or tilt (Codapress), and a circular "wheel" as an alternative layout (CRL).
6. **Stationery and paper props instead of heavy 3D.** Obys's orange paper texture, binder clip and marquee band show that warmth can come from 2D props. Kid-world equivalents: washi tape, library due-date stamps, bookmark ribbons, crayon marks.
7. **Playful extras that suit children.** Obys's draw-on-the-page canvas (Draw / Erase / Save JPG), Tiroler's "Surprise me" dice pairing, Set Margins' "Book-surprise" card, and a favourites counter (Tiroler).
8. **Two doors.** Manolo Blahnik's "Full experience / Accessible Version" choice is the honest answer to heavy WebGL. Make the light version the default on slow connections and when `prefers-reduced-motion` is set.
9. **Restrained palettes.** Almost every site here uses 2–3 colours: black or white plus one accent (Sleutelaar cyan, Manolo red, Obys orange and rust). Kutubooku can use a neutral wall and let the book covers and one signature Edition colour supply the play.

**Pitfalls seen in this group.** Awwwards accessibility scores are low across the board (Obys 6.4, Harvard Film Archive 6.4). Several sites render nothing readable without JavaScript (Sleutelaar, typo/graphic posters, Manolo's shell). Hover-only reveals don't exist on phones. Kutubooku's audience is mostly on mobile, so every hover idea above needs a tap equivalent, and the list must work with no JavaScript at all.

*Research completed 2026-11-02. 15 similar sites profiled (all verified as loading), plus Obys itself and 4 candidates marked unverified.*
