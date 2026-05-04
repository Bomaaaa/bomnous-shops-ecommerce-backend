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

---

## License / status

This repository is a **demo / educational** project. Payment and checkout flows are **not** production-ready. Use real payment providers and server-side validation before any go-live.

For a running log of implementation work, see **`docs/INTERNSHIP_LOG.md`**.
