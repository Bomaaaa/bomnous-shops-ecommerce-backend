(function () {
  const ALLOWED = ["soft-luxury", "event-ready", "smart-casual", "cultural-blend"];
  const LABELS = {
    "soft-luxury": "Soft luxury",
    "event-ready": "Event ready",
    "smart-casual": "Smart casual",
    "cultural-blend": "Cultural blend"
  };

  async function runSearchByAesthetic() {
    const store = window.BomnousStore;
    if (!store || typeof store.getApiBase !== "function") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const aesthetic = params.get("aesthetic");
    const titleEl = document.getElementById("search-page-title");
    const subtitleEl = document.getElementById("search-page-subtitle");
    const grid = document.getElementById("search-product-wrap");
    const countEl = document.getElementById("search-product-count");

    const base = store.getApiBase();

    if (!aesthetic || !ALLOWED.includes(aesthetic)) {
      if (titleEl) {
        titleEl.textContent = "Search";
      }
      if (subtitleEl) {
        subtitleEl.textContent =
          "Pick a mood from the homepage (“Shop by aesthetic”) to see a live edit, or open the full shop.";
      }
      if (countEl) {
        countEl.textContent = "0";
      }
      if (grid) {
        grid.innerHTML = `
          <div class="col-12">
            <div class="product-empty-state text-center py-5">
              <p>No aesthetic filter in the URL yet.</p>
              <p class="mb-0"><a href="index.html#discover-preview" class="ai-text-link">Shop by aesthetic</a> · <a href="shop.html" class="ai-text-link">Full shop</a></p>
            </div>
          </div>
        `;
      }
      return;
    }

    if (titleEl) {
      titleEl.textContent = "Shop by aesthetic";
    }
    if (subtitleEl) {
      subtitleEl.textContent = `Showing the ${LABELS[aesthetic]} edit — live from Bomnous sellers.`;
    }

    try {
      const res = await fetch(`${base}/products/aesthetic/${encodeURIComponent(aesthetic)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit"
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map(store.normalizeApiProduct);
      store.registerExtraProducts(normalized);
      store.renderProductGrid(grid, normalized);
      if (countEl) {
        countEl.textContent = String(normalized.length);
      }
      if (window.BomnousUI && typeof window.BomnousUI.initTooltips === "function") {
        window.BomnousUI.initTooltips(grid || document);
      }
      if (window.BomnousUI && typeof window.BomnousUI.applyDataColors === "function") {
        window.BomnousUI.applyDataColors(grid || document);
      }
      if (window.BomnousUI && typeof window.BomnousUI.updateNavCounts === "function") {
        window.BomnousUI.updateNavCounts();
      }
    } catch (e) {
      if (countEl) {
        countEl.textContent = "0";
      }
      if (grid) {
        grid.innerHTML = `
          <div class="col-12">
            <div class="product-empty-state text-center py-5">
              <p>Could not load products for this mood.</p>
              <small class="text-muted d-block">${String((e && e.message) || e)}</small>
              <p class="mt-3 mb-0"><a href="shop.html" class="ai-text-link">Browse the full shop</a></p>
            </div>
          </div>
        `;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", runSearchByAesthetic);
})();
