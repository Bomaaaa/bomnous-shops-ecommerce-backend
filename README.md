# Bomnous Shops

Bomnous Shops is a **curated fashion marketplace demo** for North Cyprus–style discovery: a static storefront (Bootstrap + vanilla JavaScript) backed by a **FastAPI** API and **PostgreSQL**. It is suitable for internships, portfolio demos, and local UX testing.

---

## Project description

Shoppers can browse a live **product catalog**, filter by **category**, **aesthetic**, **tags**, and **price**, open **public shop** pages, and use an **AI stylist** (Groq-powered) for outfit suggestions. **Sellers** can register, complete **onboarding**, and manage products from a **dashboard**. A **mock checkout** demonstrates payment UI without charging real cards.

The frontend loads real data when the API is available and falls back to a **static catalog** when offline so pages never look broken.

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | HTML5, Bootstrap 5, DaisyUI (CDN) + Tailwind browser build, vanilla JS (`products.js`, `script.js`, `search-page.js`, …), Swiper, AOS |
| **Backend** | Python 3, **FastAPI**, **Uvicorn**, **SQLAlchemy**, **Alembic**, **Pydantic**, **JWT** (python-jose), **passlib** |
| **Database** | **PostgreSQL** 16 (Docker or managed) |
| **AI (optional)** | **Groq** Chat Completions API (`llama-3.3-70b-versatile` by default) |

---

## Features

- **Homepage** — Hero, curated sections, API-driven product grid with **static fallback** if the API is down.
- **Discover** (`search.html`) — Full catalog on first load; **keyword search** with **synonym expansion**, **relevance ordering**, filters, URL-synced state, trending shortcut.
- **Product detail** (`product.html`) — Deep links from cards and **Quick view**.
- **Shops** (`shop.html`) — Public shop profile + products by shop id.
- **Auth** (`auth.html`) — Buyer / seller registration and login (JWT).
- **Seller onboarding** (`onboarding.html`) — Multi-step flow, creates shop via API.
- **Seller dashboard** (`seller.html`) — Add / edit / delete products.
- **Profile** (`profile.html`) — Editable profile fields and nav avatar.
- **Wishlist & cart** — `localStorage` + navbar counts; optional API-backed profile fields.
- **Checkout** (`checkout.html`) — **Demo-only** card flow (e.g. `4242…` success path).
- **AI stylist** (`stylist.html`) — Chat UI; server injects catalog context (no fake checkout claims).

---

## Repository layout

```
bomnous-shops/
├── README.md                 ← This file
├── docs/
│   └── INTERNSHIP_LOG.md     ← Ongoing work log
├── bomnous-backend/          ← FastAPI app, Alembic, seeds, Docker
└── bomnous-frontend/
    └── Bootstrap fasion E-commerce/   ← Static site (serve this folder)
```

---

## Prerequisites

- **Python 3.10+** (3.11 recommended)
- **PostgreSQL** (local or Docker)
- **Node/npm** — optional; only needed if you run the Tailwind CSS build (`package.json` in the frontend folder)
- **Conda** (recommended) or a **venv** for the backend

---

## Environment variables

Create **`bomnous-backend/.env`** (never commit real secrets to git). Typical keys:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | SQLAlchemy URL, e.g. `postgresql+psycopg2://USER:PASSWORD@localhost:5432/DBNAME` |
| `SECRET_KEY` | **Yes** (for JWT) | Long random string for signing tokens |
| `ALGORITHM` | Yes | JWT algorithm, e.g. `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | e.g. `60` |
| `GROQ_API_KEY` | No | Enables live **AI stylist**; without it, stylist falls back locally |
| `GROQ_MODEL` | No | Defaults to `llama-3.3-70b-versatile` if unset |

Example **`DATABASE_URL`** if you use the repo’s **`bomnous-backend/docker-compose.yml`** (user `postgres`, db `bomnous`):

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/bomnous
```

If you use **`docker-compose.db.yml`** instead (user `bomnous`, db `bomnous_db`), adjust the URL accordingly.

---

## Database: Docker (quick)

From **`bomnous-backend/`**:

```bash
docker compose up -d
```

Wait for Postgres to accept connections, then set `DATABASE_URL` in `.env` to match the compose file you used.

**Alternate file:**

```bash
docker compose -f docker-compose.db.yml up -d
```

Stop containers when finished:

```bash
docker compose down
```

---

## Backend: install, migrate, seed

From the **repository root** or **`bomnous-backend/`**, with your conda env or venv **activated**:

```bash
cd bomnous-backend
pip install -r requirements.txt
alembic upgrade head
python seed_bomnous.py
```

Or run the helper script (expects conda env **`bomnous-ai-shop`** or a local **`.venv`**):

```bash
cd bomnous-backend
chmod +x setup_local.sh   # once, if needed
./setup_local.sh
```

### Seeding behavior

- **`seed_bomnous.py`** creates **four seller accounts**, their **shops**, and **~30 products** with realistic categories, tags, aesthetics, and remote image URLs.
- If the **`products`** table is **already non-empty**, the seed **exits without changes**. Use a fresh database or truncate related tables to re-seed.

---

## Run locally

### 1. API (FastAPI)

```bash
cd bomnous-backend
conda activate bomnous-ai-shop    # or: source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **OpenAPI docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
- Health check: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

### 2. Frontend (static server)

```bash
cd "bomnous-frontend/Bootstrap fasion E-commerce"
python3 -m http.server 8080 --bind 0.0.0.0
```

Open [http://127.0.0.1:8080/](http://127.0.0.1:8080/) (or your machine’s LAN IP on the same port).

The bundled HTML defaults the API to **production** on Railway. To use a **local** FastAPI instance instead, set this **before** loading `js/products.js` / main scripts:

```html
<script>window.BOMNOUS_API_BASE = "http://127.0.0.1:8000";</script>
```

---

## Railway: FastAPI (private DB) vs your laptop (public DB)

Railway gives you **two ways** to connect to the same Postgres. They solve **different problems**; you are not choosing one forever—you use **both patterns** in the right place.

| Where code runs | Which database URL | Why |
|-----------------|-------------------|-----|
| **FastAPI service on Railway** | **Private** `DATABASE_URL` (hostname like `*.railway.internal` or Railway’s **private** reference) | API and Postgres sit **inside** Railway’s network. No public internet hop for normal traffic, no egress warning for that path, smaller attack surface. |
| **Your own laptop** (e.g. `python update_product_images.py`) | **Public** URL (`DATABASE_PUBLIC_URL` or proxy host like `*.proxy.rlwy.net`) | Your PC is **outside** Railway. It **cannot resolve** private `*.railway.internal` names, so you must use the URL Railway exposes for **external** clients—**only while the script runs**. |

**Important:** The **browser / Vercel** never talks to Postgres. Shoppers only call **your FastAPI HTTPS URL**. Only the **Python API** (on Railway) should have `DATABASE_URL` for Postgres.

### Part A — FastAPI on Railway (always use private DB)

1. Open [Railway](https://railway.app) → your **project** with **Postgres** + your **API** (FastAPI) service.
2. Click your **FastAPI** service → **Variables** (or **Settings → Variables**).
3. Find **`DATABASE_URL`**.
4. Set it to the **private** connection from Postgres **reference** (Railway’s UI: **New variable** → **Add reference** → pick your **Postgres** service → choose the variable usually named **`DATABASE_URL`** on Postgres — **not** `DATABASE_PUBLIC_URL`).  
   Railway may show it as a reference like `${{ Postgres.DATABASE_URL}}`; exact labels change, but the rule is: **same project, private reference, internal hostname.**
5. If you previously added a second variable that pointed the API at **`DATABASE_PUBLIC_URL`**, remove that wiring from the **API** service so routine API→DB traffic is **not** forced through the public proxy.
6. **Redeploy** the FastAPI service (or push a commit) so the new variable is picked up.
7. **Check:** open `https://<your-api-host>/docs` and hit a route that uses the DB (e.g. `GET /api/products/`). If it works, the API is using the DB correctly.

### Part B — Your laptop (one-off scripts only; use public URL)

Use this **only** when you run maintenance scripts **on your computer** (not on Railway).

1. Railway → **PostgreSQL** service → **Variables**.
2. Copy **`DATABASE_PUBLIC_URL`** (or whatever Railway labels the **public / external** `postgresql://…` connection). It must **not** contain `railway.internal`.
3. On your machine:

```bash
cd bomnous-backend
export DATABASE_URL='paste-the-public-postgresql-url-here'
export PEXELS_API_KEY='your-pexels-api-key'
python update_product_images.py
```

4. When finished, **close that terminal tab** or run `unset DATABASE_URL PEXELS_API_KEY`. Do not save these values into a file you commit to git.

### Security (simple rules)

1. **Secrets live in:** Railway **Variables**, and local **`bomnous-backend/.env`** (already in `.gitignore`). **Never** commit `.env` or paste DB URLs into GitHub issues, chat, or frontend code.
2. **Who sees the DB password?** Only Railway (for the API) and **you** when you copy the public URL for a script. If a password was ever pasted in a screenshot or public chat, **rotate** it in Railway Postgres settings and update variables.
3. **Vercel** only needs static files + `BOMNOUS_API_BASE` pointing at your **API** — **not** the database URL. The database must not be reachable from random browsers; only your backend connects.
4. **Pexels:** keep `PEXELS_API_KEY` in Railway (if you ever run Pexels from a worker) or only in your local shell / `.env` for scripts — not in the repo.

---

## Vercel and Railway product images

The storefront reads **`image_url` / `image_hover_url` from your production database** (via `GET /api/products/`). **Vercel only hosts HTML/JS/CSS**; it does not copy rows from your laptop’s Postgres.

- If **`update_product_images.py`** was only run **locally**, **Railway’s DB still has whatever was inserted at deploy** (often relative paths like `image/product-1-1.jpg`). The browser then loads those paths from **your Vercel site**, which serves the **bundled Bootstrap template images** — so it looks like everything “reverted.”
- **Fix:** update **the same database Railway uses**, using a URL your machine can reach:

  ```bash
  cd bomnous-backend
  export DATABASE_URL='postgresql://…'   # must be **public** — see below
  export PEXELS_API_KEY='…'              # https://www.pexels.com/api/
  python update_product_images.py
  ```

  **Which `DATABASE_URL` to use here:** from your **laptop**, use Postgres **`DATABASE_PUBLIC_URL`** (see [Railway: FastAPI vs laptop](#railway-fastapi-private-db-vs-your-laptop-public-db) above). Your **FastAPI service** on Railway should keep using the **private** reference instead.

  Alternatively, **`seed_bomnous.py`** already assigns **remote Unsplash/Pexels-style URLs** to new seeds — but it **skips** if the `products` table is non-empty, so for a DB that was created with placeholders you either run the script above or reset data and seed again.

- **Quick check:** open `https://<your-railway-api>/api/products/` in a browser; if `image_url` values are not `https://…`, the frontend is behaving correctly — the data still needs updating on the server.

---

## Demo accounts (after seed)

Seed password for **all seeded seller accounts**: **`demo12345`**

| Role | Username | Email |
|------|----------|--------|
| Seller | `zara_lefkos_seller` | `zara.lefkosa@bomnous.test` |
| Seller | `urban_thread_seller` | `urban.thread@bomnous.test` |
| Seller | `little_luxe_seller` | `little.luxe@bomnous.test` |
| Seller | `aso_ebi_seller` | `asoebi.house@bomnous.test` |

**Buyer:** the seed script does **not** create a buyer user. Create one once:

1. Open **`auth.html`** in the static site.  
2. Choose **Create account** → role **Buyer**.  
3. Suggested test credentials (example): **`bomnous_buyer`** / **`buyer@bomnous.test`** / password **`demo12345`** (or any password your policy allows).

Use **Sign in** afterward with the same email and password.

---

## Useful URLs (frontend)

| Page | Path |
|------|------|
| Home | `/index.html` |
| Discover | `/search.html` |
| Shop | `/shop.html?id=<shop_id>` |
| Product | `/product.html?id=<product_id>` |
| Auth | `/auth.html` |
| Seller dashboard | `/seller.html` |
| Onboarding | `/onboarding.html` |
| AI stylist | `/stylist.html` |
| Profile | `/profile.html` |

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| **Failed to fetch** from the browser | API bound to `0.0.0.0`, correct `DATABASE_URL`, CORS (wildcard is on by default), and that the browser can reach **host:8000** (WSL vs Windows networking). |
| **401 / invalid token** | `SECRET_KEY` / JWT settings; sign in again. |
| **AI stylist errors** | `GROQ_API_KEY` and `GROQ_MODEL` in `.env`; restart uvicorn after edits. |
| **Seed skipped** | Products already exist; use empty DB or clear products (and dependents) before re-seeding. |
| **Vercel shows template product photos** | Production DB still has relative `image_url`s; run `update_product_images.py` (or re-seed) against **Railway’s** `DATABASE_URL`. See [Vercel and Railway product images](#vercel-and-railway-product-images). |
| **`FATAL: database "railway " does not exist`** (note the space) | A **trailing space** in `DATABASE_URL` after the database name (often from a bad copy/paste in Railway Variables). Edit the variable so the URL ends with `/railway` with **no space**. The app and Alembic also **`.strip()`** the URL to tolerate stray whitespace. |

---

## License / status

This repository is a **demo / educational** project. Payment and checkout flows are **not** production-ready. Use real payment providers and server-side validation before any go-live.

For a running log of implementation work, see **`docs/INTERNSHIP_LOG.md`**.
