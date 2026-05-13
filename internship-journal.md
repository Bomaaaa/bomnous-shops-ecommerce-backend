# Internship journal — Bomnous Shops

---

**Date:** 2026-04-24

**Task:** Product section (homepage) — category and tag filters wired to FastAPI `GET /api/products/`, with static-data fallback and design-system styling.

**What I did:** I set a default `window.BOMNOUS_API_BASE` in `index.html` so a static site on one port (for example 8080) can always reach the API on 127.0.0.1:8000, then updated `products.js` to call `GET /api/products/` (trailing slash to match FastAPI’s list route) and to record whether the grid is filled from the API or from the bundled `STATIC_PRODUCTS` fallback. I added a loading skeleton and a live-versus-offline status line in the “Discover Pieces” section, hooked `js/script.js` to update that badge after the fetch resolves, and tightened the purple-themed product cards (hover, shimmer skeleton). I also fixed `product.html` so it loads the catalog the same way (via `BomnousStore.loadProductsFromApi`), uses `getProductById` with both numeric and `P` IDs, and no longer depends on a non-existent global `productsData` variable, so product links from the grid work for API-backed products.

**What I learned:** Using a shared `loadPromise` in `loadProductsFromApi` means every page can `await` the same network request without double-fetching, which matters when the homepage and product detail both need the same catalog. CORS and separate origins only work if the browser is allowed to call the API, so documenting `BOMNOUS_API_BASE` and defaulting it to the local FastAPI host avoids silent “always static” behavior.

**Challenges:** The product page used to read an undefined `productsData` in an inline script; the fix was to rely only on `window.BomnousStore` after the same IIFE that powers the shop, and to normalize IDs so `?id=3` and `?id=P3` both resolve. Initial HTML used an empty product grid, so the section looked blank until JavaScript ran; adding a short loading state and badge text makes the loading path visible and testable.

**Status:** Complete

---

**Date:** 2026-05-03

**Task:** Production deployment (Railway + Vercel), production product images, database connection reliability, and deployment/security documentation.

**What I did:** Pointed the static frontend’s default **`BOMNOUS_API_BASE`** at the live **Railway FastAPI** URL so the Vercel-hosted UI loads real catalog data. Ran **`update_product_images.py`** against the **production** Postgres using **`DATABASE_PUBLIC_URL`** from my laptop (the internal `postgres.railway.internal` URL only works inside Railway). Documented in **`README.md`** the split between **private `DATABASE_URL`** on the FastAPI service (API ↔ Postgres inside Railway, avoids egress/public-endpoint warnings) versus **public URL only for one-off local scripts**. Fixed a deploy failure where Postgres reported **`database "railway " does not exist`** by trimming **`DATABASE_URL`** in **`app/db.py`** and **`alembic/env.py`** so stray spaces in Railway variables do not break Alembic or the app. Hardened **`update_product_images.py`** to require **`PEXELS_API_KEY`** from the environment (no key in source), detect **`railway.internal`** when running locally and print a clear hint, and extended the README with troubleshooting and security habits (secrets in Railway / `.env`, rotating anything pasted in chat or logs).

**What I learned:** “Deployed backend” does not automatically mean the **same** database I used locally: image URLs and product rows live in **whatever Postgres Railway uses**, so maintenance scripts must target that URL. Private DNS names are a **network boundary** issue, not a bug—laptops need the public TCP proxy URL for Postgres, while services in the same Railway project should use the **referenced private** connection. A single trailing space in a connection string is enough for PostgreSQL to look for a **different database name**; defensive `.strip()` on URLs saves hours of confusing `FATAL` errors.

**Challenges:** Mixing up internal vs public `DATABASE_URL` caused DNS errors locally and Railway UI warnings about egress when the API was pointed at a public DB endpoint; separating “API variable” vs “laptop export” fixed both. Remembering to **rotate** credentials if they ever appeared in shared logs or chat is now part of my checklist for any future deploy.

**Status:** Complete

---
