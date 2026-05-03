# Internship journal — Bomnous Shops

---

**Date:** 2026-04-24

**Task:** Product section (homepage) — category and tag filters wired to FastAPI `GET /api/products/`, with static-data fallback and design-system styling.

**What I did:** I set a default `window.BOMNOUS_API_BASE` in `index.html` so a static site on one port (for example 8080) can always reach the API on 127.0.0.1:8000, then updated `products.js` to call `GET /api/products/` (trailing slash to match FastAPI’s list route) and to record whether the grid is filled from the API or from the bundled `STATIC_PRODUCTS` fallback. I added a loading skeleton and a live-versus-offline status line in the “Discover Pieces” section, hooked `js/script.js` to update that badge after the fetch resolves, and tightened the purple-themed product cards (hover, shimmer skeleton). I also fixed `product.html` so it loads the catalog the same way (via `BomnousStore.loadProductsFromApi`), uses `getProductById` with both numeric and `P` IDs, and no longer depends on a non-existent global `productsData` variable, so product links from the grid work for API-backed products.

**What I learned:** Using a shared `loadPromise` in `loadProductsFromApi` means every page can `await` the same network request without double-fetching, which matters when the homepage and product detail both need the same catalog. CORS and separate origins only work if the browser is allowed to call the API, so documenting `BOMNOUS_API_BASE` and defaulting it to the local FastAPI host avoids silent “always static” behavior.

**Challenges:** The product page used to read an undefined `productsData` in an inline script; the fix was to rely only on `window.BomnousStore` after the same IIFE that powers the shop, and to normalize IDs so `?id=3` and `?id=P3` both resolve. Initial HTML used an empty product grid, so the section looked blank until JavaScript ran; adding a short loading state and badge text makes the loading path visible and testable.

**Status:** Complete

---
