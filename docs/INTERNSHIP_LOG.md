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

**One-line elevator pitch:**  
*Turned a Bootstrap template into a branded Bomnous frontend with modular product logic, combined filters, wishlist/cart feedback, an AI stylist concept demo, responsive nav fixes, DaisyUI via CDN, and a first step toward loading real products from the API with a safe static fallback.*

---

## Changelog

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

*Last updated: 2026-04-22*
