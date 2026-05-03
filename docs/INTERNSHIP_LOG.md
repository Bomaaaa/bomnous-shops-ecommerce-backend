# Bomnous Shops — Internship work log

**Purpose:** Running summary of what changed, why, and lessons learned — for your supervisor and your internship journal.  
**How to update:** After each work session, add a dated entry under [Changelog](#changelog) and refresh the [Current snapshot](#current-snapshot) if the “big picture” moved. You can also ask in Cursor: *“Append today’s changes to `docs/INTERNSHIP_LOG.md`.”*

---

## Opening this project in WSL Ubuntu (and Cursor chat)

Your repo lives at (inside WSL):

`/home/tripple-beeee/bomnous-shops`

### Option A — Recommended: open the folder *as a WSL workspace*

This keeps paths Linux-native and usually matches how terminals and servers behave.

1. Open **Ubuntu** (WSL).
2. Run:
   ```bash
   cd /home/tripple-beeee/bomnous-shops
   cursor .
   ```
   (If `cursor` is not in PATH, use **Cursor → Command Palette** → search **WSL** / **Remote** and choose **“WSL: Open Folder in WSL…”**, then pick `bomnous-shops`.)

### Option B — Open from Windows via the WSL share

In Cursor: **File → Open Folder** and use:

`\\wsl$\Ubuntu-22.04\home\tripple-beeee\bomnous-shops`

### Will it be the “same chat”?

Cursor ties chat history to the **workspace**. If Windows and WSL register as **two different** workspace roots, you may see **separate** chat threads. To keep one thread:

- Prefer **one** way of opening the folder (ideally **WSL-connected** as in Option A), and always use that same path/method.

Frontend subfolder (static site):

`/home/tripple-beeee/bomnous-shops/bomnous-frontend/Bootstrap fasion E-commerce`

---

## Current snapshot

**Project:** Bomnous Shops — fashion e-commerce / discovery frontend (internship).

**Stack:** HTML, CSS, Bootstrap 5, vanilla JS modules (`products.js`, `script.js`), Swiper; **DaisyUI 5** via CDN + Tailwind browser script; optional local Tailwind build in `package.json` (see lessons).

**Highlights:**

| Area | What we implemented |
|------|---------------------|
| Products | `BomnousStore` in `products.js`: filter, render cards, wishlist/cart, navbar counts, shop/wishlist/cart tables. **New:** homepage catalog tries **`GET /api/products`** from FastAPI first; if the request fails or returns nothing, it **falls back** to the built-in static list so the site never looks broken offline. |
| Filters | Category + tag filters work **together** (e.g. women + trending). |
| UX | Wishlist/cart: **toast** feedback; **localStorage**; no forced redirect on add. |
| Homepage | Brand sections, **Bomnous edit** and **Seller spotlight** banners (identical layout: `brand-story-banner` + `seasonal-banner` + copy + `seasonal-banner-link`; spotlight uses `.seller-spotlight-banner` background with placeholder photo), AI stylist **demo**, discover-by-aesthetic, Bomnous footer; removed obsolete template blocks. |
| Nav | Glass Bomnous navbar; **mobile:** logo left, menu control right (grid + cleaned markup); inner pages: mobile menu button pinned right in CSS. |
| DaisyUI | Loaded from **CDN** on HTML pages (reliable without a local Tailwind build on UNC paths). |
| Backend (WIP) | FastAPI products live under **`/api/products`**; **CORS** enabled so the browser can call the API from the static site. Product rows include **category, tag, image URLs, compare-at price** so the frontend can map JSON into the same card layout as before. |
| Responsive UI | **May 2026:** Shared **`styles.css`** rules for **phones & tablets** (`max-width: 991.98px`), preserving **`lg`** desktop; breadcrumbs/checkout/cart fixes; homepage AI CTA + stylist chat + discover cards tuned for small viewports. |
| Docs | Root **`README.md`** — stack, features, env vars, Docker DB, migrate/seed, run commands, demo accounts. |

**One-line elevator pitch:**  
*Turned a Bootstrap template into a branded Bomnous frontend with modular product logic, combined filters, wishlist/cart feedback, an AI stylist concept demo, responsive nav fixes, DaisyUI via CDN, and a first step toward loading real products from the API with a safe static fallback.*

---

## Changelog

### 2026-05-02 — Profile picture: no cross-account leakage in `localStorage`

**Problem:** The navbar and profile page cached **`bomnous_profile_pic`** in `localStorage` without tying it to the signed-in user, so after **logout → login as another account** the previous user’s photo could still appear.

**Changes:**

- **`auth.html`:** On every successful **`setAuth`** (login/signup), remove **`bomnous_profile_pic`**, **`bomnous_profile_pic_owner`**, **`bomnous_full_name`**, and **`bomnous_user_id`** before writing the new session so no prior user’s avatar or profile cache carries over.
- **`js/bomnous-nav.js`:** Introduced **`bomnous_profile_pic_owner`** (lowercased username). **`getValidatedProfilePicDataUrl()`** only returns a cached image when owner matches **`bomnous_username`**; otherwise it clears stale keys. **`maybeSyncProfileFromApi`** sets or clears the cache with the correct owner; empty **`profile_picture`** clears local cache.
- **`js/profile-page.js`:** Same owner key on save/load/file pick; **`clearStoredProfilePicIfStale`** skips removal while a **pending** (unsaved) file pick exists, then **`loadProfile`** re-tags pending uploads with **`data.username`**.
- **`seller.html`:** Logout now clears the same session keys as the profile page (**token, role, username, full name, email, profile pic + owner, shop id, user id**).

---

### 2026-05-03 — Root `README.md` (project handbook)

Replaced the short root readme with a **full project README** covering: overview, **tech stack** table, **feature list**, **repo layout**, prerequisites, **environment variables** (`DATABASE_URL`, JWT settings, optional Groq), **PostgreSQL via Docker** (`docker-compose.yml` / `docker-compose.db.yml`), **Alembic + seed** steps (`setup_local.sh`, `seed_bomnous.py` behavior), **local run commands** for FastAPI and the static frontend, **WSL / API base** notes, **demo seller accounts** from seed (password `demo12345`), **buyer** instructions (register via `auth.html` — not created by seed), troubleshooting, and links to **`docs/INTERNSHIP_LOG.md`**.

---

### 2026-05-03 — Discover search: synonym / alias expansion for everyday words

**Problem:** Shoppers type generic words (**bags**, **dresses**, **trousers**) while catalog titles often use specific terms (**Tote**, **Midi**, **Cargo**), so strict substring search returned **few or zero** rows.

**Backend (`app/product_search.py`):**

- Added a **`SYNONYMS`** map (bags/bag, shoes, dress/dresses, trousers/pants, tops, jewelry, african, kids/children, etc.) mapping each **lowercased** search token key to a list of **catalog-style** substrings.
- **`_token_search_clause`:** if the token matches a key, build an **`OR`** of **`ILIKE`** needles on **`name`** and **`description`** (with existing **`%`/`_` escaping**) for **every** synonym value; this is **`OR`**’d with the **existing** token clause (**name / description / tag** + stem variants) so literal matches still work.
- **No `q`:** unchanged — still returns the **full filtered catalog** (Discover default load).

---

### 2026-05-03 — Discover page: default full catalog + relevance-ranked search

**Problems:** (1) `search.html` showed **0 results** on first load with an empty query. (2) Text search could feel **irrelevant** (e.g. product-type words matching only loose fields).

**Frontend (`js/search-page.js`):**

- Removed the early return that rendered an empty “start your search” grid when **no URL params** were set.
- On load (and after submit), the page always calls **`GET /api/products/search`** with **`limit=500`**, sending **`q`** / facets only when present so the backend returns the **full catalog** when nothing is filtered.
- Titles/subtitles: **Discover** + “Browsing the full catalog…” when unfiltered; **Search results** when `q` or any facet is active.
- Query params: only send **`category`**, **`aesthetic`**, **`tag`** when not **`all`** (avoids noisy `category=all`).
- **Submit handler** is bound **once** (`data-bomnous-discover-bound`) so repeated runs do not stack duplicate listeners.

**Backend (`app/product_search.py`, routes):**

- **No `q`:** no text filter — returns all rows (subject to category / aesthetic / tag / price filters), sorted by **`sort`** (`newest` vs id) as before.
- **With `q`:** token **AND** still applies; each token must match **`name`**, **`description`**, or **`tag`** only (ILIKE + escaped wildcards + light plural variants). **Category / aesthetic** are **not** used for loose token matching — they remain **explicit** URL filters only, which cuts unrelated hits.
- **Relevance ordering** when `q` is set: SQL score from **exact name**, **prefix name**, **substring name**, then **description**, **tag**, **category**, **aesthetic** (for ranking among matches). **`ORDER BY relevance DESC`**, then **`created_at`** / **`id`** when **`sort=newest`**.
- **`GET /api/products/search`** and **`GET /products/search`**: default **`limit=200`**, max **`500`** (`product_routes.py`, `aesthetic_routes.py`).

---

### 2026-05-03 — Discover search: tighter text matching + `tag` field + frontend `tag` param

**Problem:** Queries like **"dresses"** could surface weakly related rows (substring noise, plural vs singular copy in titles, missing **`tag`** in the text OR).

**Backend (`app/product_search.py`):**

- Text match now includes **`Product.tag`** alongside **`name`**, **`description`**, **`category`**, **`aesthetic_tag`** (all **`ILIKE`**, case-insensitive).
- User **`q`** is escaped for **`%`** / **`_`** and passed with SQLAlchemy **`escape='\\'`** so search strings cannot hijack wildcard semantics.
- **Multi-word** `q` is split on whitespace; **each** token must match **at least one** field (**AND** across tokens) for stricter relevance.
- **Light plural/singular relaxations** per token (e.g. `…ies`→`…y`, trailing `…es` / `…s`) so **"dresses"** also matches copy containing **"dress"** without returning unrelated single-token noise as easily as before.

**Frontend (`js/search-page.js`):**

- **`tag`** from the page URL (e.g. `?tag=editors-picks`) is now forwarded to **`GET /api/products/search`** with **`q`** and other filters so server-side tag filters compose with text search.

---

### 2026-05-03 — Mobile / tablet responsive pass (listed storefront pages)

**Goal:** Improve readability and tap targets on **phones (~375–430px)** and **tablets (~768–1024px)** without changing **desktop (`lg` ≥ 992px)** layouts.

**Pages reviewed / touched:** `index.html`, `search.html`, `product.html`, `stylist.html`, `auth.html`, `onboarding.html`, `seller.html`, `shop.html`, `profile.html` (structure aligns with shared CSS), `about.html`, `checkout.html`, `carts.html`, `wishlist.html`.

**CSS (`styles.css`):**

- Added a **scoped block** using **`max-width: 991.98px`** so Bootstrap **`lg`** desktop grids stay as before.
- **Hero:** narrower inset, scaled title/subtitle clamp, avoids overflow on small viewports.
- **Homepage AI stylist CTA:** Replaced inline sizing with class **`bomnous-ai-cta-primary`**; mobile/tablet uses **full-width** button; **`min-width: 18rem`** and nowrap restored only at **`min-width: 992px`** (matches prior desktop look).
- **Stylist chat:** Header wraps; chat window height capped; **≤576px** stacks input + **Send** full width; bubbles slightly wider max-width on phones.
- **Discover mood cards:** Tighter padding/smaller `h4` on small screens; **`discover-card h4`** loses fixed **`max-width`** below `lg` so long titles don’t clip.
- **Checkout:** Place-order minimum tap height; tighter horizontal padding on very small screens.
- **Footer containers:** Slightly reduced horizontal padding on small phones to prevent edge clipping.
- **`overflow-x: clip`** on **`html`** below `lg` to reduce accidental horizontal scroll.
- **Tablet-only (`768px–991.98px`):** Slightly reduced padding on product/wishlist/cart shells and AI stylist panel.

**HTML / markup fixes:**

- **Valid breadcrumbs** (semantic `<nav>`, no nested `<p>`): `checkout.html`, `carts.html`, `wishlist.html`, `shop.html`; **`search.html`** aligned to same pattern.
- **`checkout.html`:** `body.checkout-page`; billing/order columns **`col-12 col-lg-6`** with **`g-4`**; order totals use **flex** instead of **`float-end`** so labels and amounts stay aligned when stacked.
- **`carts.html`:** Removed a **stray `</div>`** that broke section structure.
- **`index.html`:** AI stylist primary CTA uses **`bomnous-ai-cta-primary`** (no inline width styles).
- **`seller.html`:** Dashboard actions **`flex-column`** on narrow screens, **`w-100`** until **`lg`** so **View shop / Logout** aren’t cramped.
- **`stylist.html`:** Chat header utilities for **wrap**, **truncate** title, **`min-w-0`**.
- **`product.html`:** Breadcrumb row **`flex-wrap`**.
- **`onboarding.html`:** Progress pills **single column** at **`≤430px`** (very small phones).
- **`auth.html`:** Container **`px-3 px-sm-4`** for safe gutters on narrow devices.

**Prior related work (from this development thread, for journal context):**

- Documented how to run **frontend** (`python3 -m http.server … --bind 0.0.0.0`) and **backend** (`uvicorn`), freeing **port 8080** when busy.
- **Groq:** Default model **`llama-3.3-70b-versatile`** in code and **`.env`** so **`GROQ_MODEL`** no longer overrides with the low-TPM **8B** model.
- **Quick View** on product cards: eye icon is now a **link** to **`product.html?id=…`** (`products.js`), matching the numeric id used elsewhere.

---

### 2026-04-29 — Premium scroll and UI motion (AOS, CSS, confetti)

Rolled out **Animate On Scroll (AOS 2.3.1)** across the static Bomnous frontend: every page loads `aos.css` in the head, `aos.js` and `js/bomnous-aos-boot.js` before `</body>`, and **`AOS.init({ duration: 800, easing: "ease-in-out", once: true, offset: 80 })` on `DOMContentLoaded`**. The boot script sets **`window.bomnousAOSRefresh` → `AOS.refresh()`** so grids and tables that are filled after fetch (home/product cards, search results, seller product table, shop grid) still get correct trigger positions.

**Page-level work:** `index.html` — hero, feature and mood cards, product block, banners, and API-driven sections use `data-aos` and staggered delays; `product` rendering in `js/products.js` passes an index into `createProductCardMarkup` and calls refresh after paint. `search.html` / `js/search-page.js` — toolbar and live results refresh AOS when markup changes. `stylist.html` — hero and chat shell use `fade-up` (chat delayed 200ms); chat bubbles use **CSS** `slideInLeft` / `slideInRight` (see `styles.css` and `addBubble` in `script.js`). `auth.html` — form card `fade-up`; tab buttons already use **transition** on active (`.btn-dark` vs outline). `onboarding.html` — **progress rail** + smooth width via `.onboard-progress-fill`, **step enter** via `.onboarding-step-anim` and `showStep`, success **canvas-confetti** (`confetti.browser.min.js` + `confetti({ particleCount: 150, spread: 80, colors: [...] })` inside `confettiBurst`). `seller.html` — dashboard cards staggered `fade-up`, product rows `fade-up` with delay from JS + `refreshSellerAOS` after shop card and table render. `shop.html` — `shop-toolbar` `fade-up` (product cards already staggered from shared hydration). `profile.html` — hero and form card `fade-up`, form fields wrapper `fade-up` + 200ms delay; removed a stray `</div>` after the navbar. `about.html` — story, mission, and values sections `fade-up`; value columns `zoom-in` with **0 / 150 / 300** ms delays.

**Global CSS (`styles.css`):** `pageFadeIn` on `body`, **button hover** glow on `.btn-primary` / `.btn-purple` (and aligned defaults), **`.bomnous-product-card` lift**, **navbar** transition, **product image** opacity transition, plus stylist/auth/onboarding keyframes as above.

**Files touched in this pass (non-exhaustive with earlier AOS wiring):** `js/bomnous-aos-boot.js`, `js/products.js`, `js/script.js`, `js/search-page.js`, `styles.css`, `onboarding.html`, `profile.html`, `stylist.html`, `auth.html`, `shop.html`, `seller.html`, `about.html`, and related HTML/JS already updated in the same feature branch.

**Follow-up fix (same day):** Removed `data-aos*` from the **homepage hero Swiper slider** (`index.html` hero section) because AOS can conflict with Swiper’s own transition/visibility logic. Added a lightweight entrance animation just for the hero: `.hero-section { animation: pageFadeIn 0.8s ease; }`. All other AOS animations remain active across the rest of the site.

### 2026-04-25 — AI Stylist integration journey (Claude → Gemini → Groq)

Today was one of those “real world” build days where the code wasn’t the hard part — choosing a provider that actually works (for free) was.

I started this feature planning to use **Anthropic Claude** (I originally aimed for a lightweight “haiku” model) because it’s great at clean, warm writing and follow-up questions. The problem came fast: **Anthropic doesn’t really have a usable free tier for API access** — to get an API key working for real requests, I learned you need to add at least **$5 credit**. That’s fair for production, but not ideal for an internship demo where I’m trying to keep the setup simple and free.

So I switched to **Google Gemini** as a free alternative (first: `gemini-1.5-flash`). That introduced the next kind of pain: **model name / API version drift**. I kept hitting “model not found” errors, and I had to debug whether it was the model name, the API version (`v1beta` vs `v1`), or the client SDK. I upgraded the model target to **`gemini-2.0-flash`**, which at least resolved the “not found” part.

But then I ran into the real blocker: **`429 RESOURCE_EXHAUSTED`** — and not in the normal “too many requests” way. The quota message showed **`limit: 0`** across free tier metrics. That basically meant: “Even if my code is correct, this key/project is not allowed to generate responses for this model in my region.” In practice (for me, testing from **North Cyprus**), Gemini’s free tier wasn’t usable.

At that point I did the most practical thing: I switched providers again — this time to **Groq**.

### 2026-04-27 — Sticky glass navbar consistency (inner pages)

Polished the Bomnous navbar behavior across inner pages (shop/search/stylist and any page using the shared navbar):

- Switched the shared navbar to **`position: sticky; top: 0; z-index: 999;`** so it stays visible while scrolling (homepage-style).
- Removed the extra whitespace caused by fixed-header body offsets so page content starts immediately below the navbar.
- Kept the “glass” look, and ensured the existing JS scroll handler toggles a stronger frosted/blurred state via `.bomnous-navbar.scrolled`.

### 2026-04-28 — User profile page + `PUT /users/profile` + navbar avatars

Shipped a full **Profile** experience so members can see and edit their identity in one place, keep the nav feeling personal, and persist data on the server (not just `localStorage`).

- **Frontend (`profile.html`, `js/profile-page.js`, `styles.css`)**: Hero header with large circular photo or initial, display name, `@username`, and a **Seller** (purple) / **Buyer** (lilac) badge. Editable fields: full name, username, email, phone, **North Cyprus city** dropdown, **150-char bio**, and profile photo upload. Photos are stored as **base64 in `localStorage` (`bomnous_profile_pic`)** and sent to the API on save. Sellers get quick links to **View My Shop** (`shop.html?id=…` from `GET /shops/my`) and **Go to Dashboard** (`seller.html`). **Save** calls `PUT /users/profile` and shows a toast: “Profile updated! ✨”.

- **Navbar (all main pages + `js/bomnous-nav.js`)**: When signed in, the old person icon is replaced by a **small circle avatar** (image or first letter from name/username/email). Guests still see the default icon and go to `auth.html`; signed-in users go to `profile.html`. A one-time **`GET /users/profile`** (when a bearer token exists) syncs `localStorage` for name, role, and server-side profile picture so the avatar stays accurate after login.

- **Backend**: New columns on `users` — `full_name`, `phone`, `city`, `bio`, `profile_picture` (Text for long base64). **`GET /users/profile`** and **`PUT /users/profile`** for the current user (must be registered *before* `/{user_id}` so `"profile"` is not parsed as an id). **Alembic** revision `bomnous_2026_004_user_profile_fields`.

**Lessons / notes:** Duplicate DOM ids (like the old search input) are painful—here we kept drawer ids unique and rely on a clear **profile** path segment. Storing large base64 images in the DB is fine for a demo; production would use object storage and URLs.

### 2026-04-28 — About page + unified footer + live wishlist/cart badges

- **`about.html`**: Replaced template copy with the real Bomnous story: **OUR STORY** (headline + two paragraphs), **OUR MISSION** (card section), and **OUR VALUES** (three cards: Global &amp; Local, Intelligently Curated, Seller First). Removed the old team grid, branches, testimonials, and newsletter. Kept the existing sticky `bomnous-navbar` and added the shared **Bomnous footer** below the content. Styles live in `styles.css` under the “About page” section.
- **Global footer**: Canonical markup is in `partials/bomnous-footer.html` and the same block is inlined across `index.html`, `about.html`, `shop.html`, `search.html`, `stylist.html`, `auth.html`, `seller.html`, `onboarding.html`, `profile.html`, `wishlist.html`, `carts.html`, and the other shop pages that still used the old “Trendify” footer. Layout: **BOMNOUS** + tagline *Curated Fashion. Intelligent Discovery.*, middle links (Home, Discover, AI Stylist, Sell on Bomnous, About), right column *Made with love in North Cyprus 🇨🇾* + social placeholders, bottom *© 2026 Bomnous. All rights reserved.* — dark plum bar, lilac-tinted links (existing `.bomnous-footer` styles + new `.bomnous-footer-nav`, `.bomnous-footer-tagline`, `.bomnous-footer-made`).
- **Newsletter strips**: Removed from every HTML page that had the old signup band.
- **Wishlist / cart counts**: Storage keys are now **`bomnous_wishlist`** and **`bomnous_cart`** (with one-time migration from legacy `wishlist` / `cart` in `products.js` and `script.js`). Navbar badges use **`.wishlist-span` / `.cart-span`**: hidden when count is 0, purple pill when 1+; cart total uses line-item **quantities**. Updates run on load, on `bomnous-cart-wishlist-changed`, and on cross-tab `storage` events. `bomnous-nav.js` falls back if `script.js` is not loaded.

### 2026-04-28 — Navbar search: duplicate id fix (could not type in drawer)

The dropdown drawer injected an input with `id="nav-search-input"`, but the mobile offcanvas already used the same id. `document.getElementById` always returned the **first** match (the hidden offcanvas field), so focus and submit targeted the wrong element — the visible drawer field never received keystrokes. Renamed the drawer form/input/close ids to `nav-search-drawer-*` so they are unique. Added a short post-open debounce on the document click handler so an immediately following click cannot close the drawer in edge cases.

### 2026-04-27 — Navbar search drawer (smooth dropdown)

Replaced the navbar search icon’s modal behavior with a smoother “dropdown drawer” search bar:

- Clicking the search icon slides down a full-width drawer **under the navbar** with a dark plum background, lilac border, and white text.
- Includes a close (X) button, closes on outside click or Escape, and on Enter redirects to `search.html?q=...`.
- If the user is already on `search.html`, clicking the navbar search icon focuses the Discover search input instead of opening a second search UI.

### 2026-04-27 — Seller + Shop + Discover finishing push

Today I focused on completing the remaining “marketplace MVP” pages so the project can be demoed end-to-end:

- **Seller dashboard (`seller.html`)**: added an **Edit product** modal and wired it to `PUT /api/products/{id}`. The seller can now add, edit, and delete products from one place.
- **Public shop page (`shop.html?id=...`)**: ensured the shop profile (location/categories/WhatsApp/Call) loads from `GET /shops/{id}`, and the shop’s product grid loads from `GET /shops/{id}/products`, with clear offline/not-found empty states.
- **Discover/Search (`search.html`)**: added a real filter toolbar (keyword, category, aesthetic, min/max price, newest sort), implemented a public `GET /products/search` endpoint, and updated the page JS so URL params hydrate the UI and drive live results.
- **AI Stylist safety**: added a hard rule + server-side guard so the stylist can help with outfits and **add-to-cart**, but **never** hallucinate checkout/payment/order confirmations.
- **Navbar seller shortcut**: when logged in as a seller, store `localStorage.bomnous_role = "seller"` and show a **My Shop** pill in the navbar that links to `seller.html` (hidden for buyers/guests).
- **Sticky glass navbar consistency**: updated the shared `styles.css` navbar to use `position: sticky` (homepage-style), removed extra top whitespace on inner pages, and enhanced the frosted/blur effect when scrolling (via the existing `.scrolled` toggle in `script.js`).

### 2026-04-28 — Navbar search: close state, API path, live suggestions

- **Close / reset:** The primary search UI is the **nav drawer** (`bomnous-nav.js` + `.nav-search-backdrop`), not a Bootstrap modal. Removed the duplicate `#navSearchModal` blocks and `data-bs-toggle="modal"` triggers from shared nav HTML so opening search no longer leaves a **Bootstrap `.modal-backdrop`** or `body.modal-open` stuck. `closeDrawer()` now strips modal backdrops, restores `body` overflow/padding, and disposes any stray modal instance; Escape, X, click-outside, and backdrop all call the same cleanup.
- **Search flow:** Drawer submit or Enter goes to `search.html?q=…`. Discover page uses **`GET /api/products/search`** (new route on `product_routes`) with the same query model as legacy `GET /products/search`.
- **Backend:** Centralized filter logic in `app/product_search.py`. The `q` term matches **name, description, category, and `aesthetic_tag`** (ilike). Optional `limit` (e.g. 5 for typeahead) is supported.
- **Typeahead:** After 3+ characters, debounced requests show up to **five** suggestions (name, price, category) with links to `product.html?id=…`. Styles live under `.nav-search-suggestions` in `styles.css`.
- **Empty state:** `search-page.js` shows *No results for [q] — try something else* plus a **Browse All** button when `q` is set and the API returns no rows.

### 2026-04-28 — Mock payment system (demo checkout)

Added a **fake/mock card payment flow** on `checkout.html` so the demo feels complete without integrating a real provider.

- **Demo card that succeeds:** `4242 4242 4242 4242` (any future expiry like `12/27`, any 3-digit CVV like `123`, any name).
- **Declined cards:** Any other card number shows a friendly error: *Payment declined. Please check your card details and try again.*
- **Processing UX:** On “Place Order”, we show a spinner + *Processing your payment…* for **2 seconds**.
- **Success state:** The checkout content is replaced in-place with a full-page confirmation (purple/lilac checkmark animation, order number `BOM-######`, summary lines, total, and CTAs).
- **Cart cleanup:** On success, we clear the cart keys (`bomnous_cart` and legacy `cart`) and refresh navbar counts.
- **Input UX polish:** Card number auto-spaces, expiry auto-formats `MM/YY`, CVV max 3 digits, and a lightweight card-type label (VISA/MC) is shown in the input.
- **Design:** Styles added to `styles.css` under “BOMNOUS MOCK PAYMENT” to match the lilac brand system.

Note: This is strictly a **demo-only mock**. In production we’d replace it with a real payment processor (e.g. Stripe) + server-side payment intent creation and webhook-based confirmation.

**Final solution: Groq + Llama 3**

I updated the backend to call the **Groq API** using the **Llama 3.1 8B Instant** chat model (**`llama-3.1-8b-instant`**). This solved everything at once:

- It works globally (no “quota = 0” regional surprises).
- It’s fast — noticeably faster than my earlier attempts.
- The integration is simple because Groq is compatible with the OpenAI-style Chat Completions API.

**What I built (and kept consistent throughout)**

- **Frontend**: a dedicated `stylist.html` page with the Bomnous navbar, a hero section, and a full chat UI.
  - On page load, the assistant greets the user warmly using `localStorage.bomnous_username` (or “Hi there!” if not logged in).
  - Messages are styled like a real chat: user on the right (purple), AI on the left (dark card).
  - There’s a typing state (“Bomnous is styling…”) while waiting.
  - When the AI mentions a product name that exists in the catalog, the UI renders a clickable product card inside the chat.
  - If the user says “thank you”, “done”, “goodbye”, etc., the assistant closes with a warm send-off.

- **Backend**: `POST /chat` returns `{ "reply": "..." }`.
  - Each request fetches real products from Postgres (id, name, price, category, aesthetic_tag, description, image_url).
  - I embed the full product list into the system prompt and instruct the model to recommend **2–3 specific products** by **exact name + price**.

**What I learned**

- AI providers vary a lot on **pricing**, **free tiers**, and **regional restrictions** — “free tier” isn’t the same everywhere.
- I need a backup provider in mind when building AI features (this project needed two pivots before it worked).
- Groq serves open-source models (Llama 3) on specialized hardware, and that’s why it feels *instant*.
- The pattern we used here is **RAG (Retrieval Augmented Generation)**: I’m not “training” the model; I’m fetching the live catalog from the database and giving it as context every time.
  - That means the AI stays grounded in real inventory and stays up-to-date as products change.

**Challenges resolved**

- Provider constraints (Claude paid minimum)
- Model naming / API version issues (Gemini model not found)
- Regional free tier quota restrictions (Gemini `limit: 0`)
- Switched providers twice and still shipped a consistent UX

I honestly feel good about this one because it’s exactly the kind of messy integration work that happens in real product teams — and now Bomnous has an AI stylist that’s both demo-friendly and actually usable.

**Tiny personal win (end-of-day moment):** I tested the full flow and it finally worked — real responses, real product callouts, and the UI turning those mentions into clickable cards. After all the provider switching and quota surprises, that “it’s working!” moment felt genuinely exciting. It reminded me that debugging integrations is less about being “stuck” and more about iterating until the system fits reality.

### 2026-04-25 — Smart homepage sections (Trending + New Shops)

Today I added “smart sections” to the homepage so it feels alive even before we build a full recommendation engine.

**Backend**

- Added **`GET /products/trending`** (MVP trending list). For now it sorts by a simple **`views_count`** counter and prefers items created in the last 7 days when possible.
- Added **`GET /shops/new`** to return newest shops (sorted by `created_at DESC`).
- Added new fields to support this:
  - `products.views_count`, `products.created_at`
  - `shops.created_at`
  - New Alembic revision: `bomnous_2026_003_add_shop_product_metrics.py`

**Frontend**

- Added a new homepage section “**Trending this week**” that renders product cards from the trending endpoint.
- Added a “**New shops**” block that renders a quick list of shop links (`shop.html?id=...`).

**Lesson learned:** A small “smart feed” makes the homepage feel like a marketplace (not a template), even when the scoring logic is still basic.

### 2026-04-24 — Seller onboarding flow + shop profile fields

Today I built a proper **seller onboarding** experience so sellers don’t land on an empty dashboard with no context.

**Debugging note (WSL + browser networking):**  
We hit the classic “**Failed to fetch**” issue even though the backend returned 200 in terminal checks. The root cause was **host binding + WSL networking**: the frontend was running on `127.0.0.1:8080` but the browser couldn’t reliably reach `127.0.0.1:8000`. The fix was to bind servers to **`0.0.0.0`** when testing via the WSL IP and to make the frontend API base default to **`http://<page-hostname>:8000`**. Lesson: “backend is up” is not enough — the browser must be able to reach the same host/port across WSL boundaries.

**Frontend: onboarding flow (`onboarding.html`)**

- Added a warm, multi-step onboarding page in the **Bomnous dark purple** style.
- Steps: **Welcome → Shop basics → Contact → Categories → Success**.
- Includes a top **progress indicator** and a lightweight **confetti animation** on completion.
- On completion, it creates the shop by calling **`POST /shops/create`**, then sets `localStorage.bomnous_onboarded = "1"` so onboarding only happens once.

**Auth routing behavior**

- Seller **signup/login** now routes based on whether the seller already has a shop:
  - If `GET /shops/my` returns **404** → send to **`onboarding.html`** (unless already onboarded).
  - If `GET /shops/my` returns **200** → send to **`seller.html`**.
  - If `GET /shops/my` returns **403** → treat as buyer → send to **`index.html`**.

**Backend: shop profile fields**

- Extended `Shop` to support richer profile details: `description`, `whatsapp`, `phone`, and `categories`.
- Added Alembic revision to add these columns.
- Added a route alias **`POST /shops/create`** for the onboarding flow (same behavior as `POST /shops/`).

**Lesson learned:** The best “seller dashboard” starts before the dashboard—onboarding sets expectations, captures the shop story, and makes the product-management screen feel like the *next step*, not the first step.

### 2026-04-24 — Catalog seed: 30 products, four shops, `editors-picks` tag

**Goal:** Give the shop enough **realistic** inventory that every **category**, **aesthetic**, and **curated tag** filter returns a healthy list, and represent the **North Cyprus** + **African diaspora** story in the data (Aso-Ebi House in Lefkoşa: Agbada, Ankara, gele, waist beads, etc.).

**What changed**

- **`seed_bomnous.py`:** Replaced the old 3-shop / 12-item seed with **4 shops**—**Zara Lefkoşa** (women + accessories, Lefkoşa), **Urban Thread** (men’s / street, Gazimağusa, no accessories), **Little Luxe** (children, Girne, no accessories), **Aso-Ebi House** (West African / Nigerian occasion wear + traditional accessories, Lefkoşa). **30 products** with **USD $15–$250** prices, warm marketplace-style **descriptions**, and **remote** Unsplash/Pexels **image URLs** (no local `image/product-*.jpg` placeholders). Curated tag values use **`trending`**, **`just-dropped`**, and **`editors-picks`** so they stay consistent with the UI labels.
- **Database:** Added optional **`description`** on `Product` (new Alembic revision) and exposed it on **Pydantic** `ProductBase` / `ProductResponse` so the API can return long copy when the app starts using it on product detail.
- **Frontend:** Filter value for “Editor’s Picks” is now **`editors-picks`** (was `editors`) in `index.html`, `shop.html`, `script.js` (URL `?tag=`), and `products.js` (static fallback + label map) so the chips match the seed.

**Mood / lesson:** Seeding is product design: you are defining **what the filters mean** in practice. If one tag only has one row, the UI looks broken—so we aimed for **several** items per tag and category from the start.

### 2026-04-22 — Homepage polish, Seller Spotlight, and “use Conda, not venv”

Today was mostly about **making the homepage feel intentional** and writing down how we run the stack.

**Bomnous edit block (spacing and consistency)**  
We kept chasing the gap between the **body copy** and the **“Browse the collection”** CTA. I learned (again) that **margin collapse** is sneaky: putting all the space on a sibling’s `margin-top` does not always read the way you expect next to a paragraph with `margin-bottom: 0`. We tried larger margins, padding on the paragraph, and nudging the button row — then we stepped back and **matched the seasonal-banner pattern**: same structure as the other full-width card, using **`seasonal-banner-link`** so spacing and typography stay one system instead of a one-off button row.

**Seasonal campaign → Seller Spotlight**  
The old **Easter / seasonal** strip is gone from the homepage. In its place is **Seller spotlight**: **same HTML + card pattern as Bomnous edit** (`brand-story-banner` → `seasonal-banner` → `seasonal-banner-copy` + `seasonal-banner-link`). **`.seller-spotlight-banner`** mirrors **`.bomnous-main-banner`** (same dark overlay gradient + full-bleed background photo); the photo is a **Pexels placeholder** in CSS until final art ships. CTA stays **`shop.html?id=1`** with **Meet this week's seller** copy.

**How we run the servers (for future me)**  
We had briefly created a **`.venv`** under the backend; the team preference is **Conda** (`bomnous-ai-shop`). I removed the stray `.venv` and documented that the API should be started with **`conda activate bomnous-ai-shop`** then **`python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000`**. Frontend stays the simple static server from the Bootstrap folder (see reminder below — **8080** for HTML, **8000** for API, so they do not fight).

**Mood:** Good “product + systems” day — fewer one-off CSS hacks, more named sections and one place to tweak the spotlight story.

### 2026-04-18 — Hooking the shop up to the API (kind of scary, kind of cool)

Honestly this week felt like connecting two worlds that didn’t know each other: the pretty static homepage and the FastAPI backend sitting in another folder.

**What I (we) did, in plain English:**

- The **featured products** block on `index.html` was already there — category chips plus “edit” tags (trending, just dropped, editor’s picks). So we didn’t have to redesign the page; we had to make the **data** smarter.
- In **`products.js`**, I kept a **backup list** of products (the same fake inventory as before). On page load, the app now tries to **`fetch`** real products from the backend at **`/api/products`**. If the server is asleep, wrong port, or returns an empty list, it quietly switches back to the backup list. No white screen, no panic — that was the whole point.
- **`script.js`** waits for that fetch to finish *before* it draws the grid, so you don’t get a flash of wrong data. Small detail, but it feels more professional.
- On the Python side, the product routes moved under **`/api/...`** so the URL matches what you’d expect in a real app, and we turned on **CORS** so the browser doesn’t block the request when the frontend and API aren’t on the exact same origin. (Still wrapping my head around CORS — basically the browser is picky about who talks to who.)
- We added extra fields on products in the database layer (**category, tag, images, optional “was” price**) so the API can send everything the cards need for filters and sale badges. I need to run **migrations** when my venv/Postgres is ready — didn’t get to click “upgrade” in the sandbox, but the migration file is there.

**What I learned (journal mode):**

I used to think “wire it to the API” meant one line of code. It’s more like: agree on the JSON shape, handle failure, don’t break the old UI, and remember ports — if `python -m http.server` and `uvicorn` both want port 8000, something has to move. Setting `window.BOMNOUS_API_BASE` is the escape hatch for that.

**Mood:** Tired but proud. The site still works with zero backend, which is exactly what you want while you’re still figuring Docker and databases out.

### 2026-04-05 — Documentation + DaisyUI delivery fix

- **Added** this file (`docs/INTERNSHIP_LOG.md`) for ongoing internship logging.
- **DaisyUI:** Switched from missing local `css/bomnous-daisy.css` to **official CDN** (DaisyUI 5 + `@tailwindcss/browser`) on all main HTML pages so the UI loads without a Tailwind CLI build.
- **Reason:** Local `npm run build:css` failed when the shell could not use the WSL/UNC path as a normal Windows working directory (Tailwind could not see `src/bomnous-tailwind.css`).
- **Note:** `package.json` still documents optional `build:css` for environments with a normal filesystem path (e.g. `cd` in WSL terminal only).

### 2026-04-03 — Responsive nav + mobile menu position

- **Homepage (`index.html`):** Fixed broken/extra wrapper markup; single offcanvas menu (`#Sidebar`); **CSS grid** (`.bomnous-nav-row`) for desktop three-column nav and mobile two-column (logo | menu).
- **Styles (`styles.css`):** `.bomnous-menu-toggle` for right-side mobile trigger; `.middle-navbar` mobile rule with `margin-left: auto` on `.sidebar-menu-toggler` for template inner pages.

### Earlier (consolidated) — Core frontend foundation

- Refactored product rendering and filtering; toast notifications; navbar count sync; AI stylist demo timing/scroll behavior; homepage content and footer rebrand; inner pages aligned with shared store logic.

---

## Errors & lessons (for reflection)

| Issue | What happened | Takeaway |
|--------|----------------|----------|
| Tailwind build on Windows UNC | `tailwindcss` could not resolve `./src/bomnous-tailwind.css` when npm ran from a UNC cwd. | Prefer **CDN** for class libraries, or run builds from a **native Linux path** inside WSL. |
| Cursor / shell automation | Some agent terminals failed to spawn PowerShell or run WSL reliably. | Use a **local WSL terminal** for `python3 -m http.server` and `npm` when automations fail. |

---

## Local dev server (reminder)

**Frontend** (static site — pick a free port; **8080** avoids clashing with the API on **8000**):

```bash
cd "/home/tripple-beeee/bomnous-shops/bomnous-frontend/Bootstrap fasion E-commerce"
python3 -m http.server 8080 --bind 127.0.0.1
```

Browser: `http://127.0.0.1:8080/` (or `http://localhost:8080/`)

**Backend** (Conda — not project `.venv`):

```bash
source ~/miniconda3/etc/profile.d/conda.sh   # adjust if your conda install path differs
conda activate bomnous-ai-shop
cd /home/tripple-beeee/bomnous-shops/bomnous-backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API: `http://127.0.0.1:8000/` (see `bomnous-backend/setup_local.sh` for migrations/seed notes).

---

### 2026-04-29 — Full UI pass (nav/footer consistency, “dead” links, checkout reliability)

**Goal:** Make the static demo feel cohesive end-to-end: no obvious broken navigation, fewer “#” dead-ends, and keep core flows (shop/search/auth/checkout) working when the API is up — with safe placeholder messaging when it isn’t.

**What I checked (repo-level):**
- Scanned all `*.html` pages for **missing local `href` targets** and **missing `js/css` assets** (static link integrity).
- Spot-checked the main feature wiring in `js/script.js`, `js/search-page.js`, `js/products.js`, and `checkout.html` inline payment script.

**Fixes / improvements shipped:**
- **Checkout (`checkout.html`) hardening (high impact):**  
  - Fixed inline-script **RegExp escaping** so `\D` / `\d` behave like real JS regex tokens (not “literal backslash + `D`”), which was breaking:
    - card digit parsing (spaces weren’t stripped → length checks failed),
    - expiry parsing (`MM/YY` validation failed),
    - and indirectly made **Place Order** look “broken”.
  - Added a defensive guard around the **terms checkbox** (`terms` missing/null-safe).
  - Listens for `bomnous-cart-wishlist-changed` to refresh totals when cart updates.
- **Demo dead-link cleanup:**
  - `Contact.html`: wired **About Us → `about.html`**, **Support Center → `#support`**, **View map → `#map`**, added `id="map"` on the embedded map iframe, and replaced **Send Message** from `#` → **`mailto:support@bomnous.com`** (demo-safe outbound action).
  - `myaccount.html`: **Lost password?** now routes to the real auth flow: **`auth.html`**.
  - `blog.html`: all **Read more** links now go to **`shop.html`** (demo destination) instead of `href="#"`.

**Notes / what still looks like a “placeholder” on purpose:**
- Footer **social icons** are still `href="#"` in many pages (intentional “coming soon” affordance unless real brand URLs exist). They don’t break routing, but they’re not real profiles.

**How to sanity test quickly:**
- Open homepage → confirm API sections show either real data or **offline placeholders** (not blank crashes).
- Visit `search.html?aesthetic=soft-luxury` → filters hydrate + results render (or controlled empty state).
- Visit `checkout.html` after adding to cart → totals non-zero; demo card `4242…`, future expiry, accept terms → success screen.

---

## Files reference (high level)

| Path | Role |
|------|------|
| `bomnous-frontend/Bootstrap fasion E-commerce/index.html` | Homepage, nav, sections |
| `bomnous-frontend/Bootstrap fasion E-commerce/styles.css` | Theme, layout, components |
| `bomnous-frontend/Bootstrap fasion E-commerce/js/products.js` | `BomnousStore`, `loadProductsFromApi()`, static fallback |
| `bomnous-frontend/Bootstrap fasion E-commerce/js/script.js` | UI, Swiper, toasts, AI demo; awaits catalog load before product section |
| `bomnous-backend/main.py` | CORS middleware |
| `bomnous-backend/app/routes/product_routes.py` | Products API under `/api/products` |
| `bomnous-frontend/Bootstrap fasion E-commerce/*.html` | Inner pages + Daisy CDN tags |
| `bomnous-frontend/Bootstrap fasion E-commerce/package.json` | Optional Tailwind/Daisy npm scripts |

---

*Last updated: 2026-05-03*
