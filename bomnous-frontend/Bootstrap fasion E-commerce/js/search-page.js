(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const ALLOWED = ["soft-luxury", "event-ready", "smart-casual", "cultural-blend"];
  const LABELS = {
    "soft-luxury": "Soft luxury",
    "event-ready": "Event ready",
    "smart-casual": "Smart casual",
    "cultural-blend": "Cultural blend"
  };

  function refreshAOS() {
    if (typeof window.bomnousAOSRefresh === "function") {
      window.bomnousAOSRefresh();
    }
  }

  async function runSearchByAesthetic() {
    const store = window.BomnousStore;
    if (!store || typeof store.getApiBase !== "function") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const aesthetic = params.get("aesthetic");
    const tag = params.get("tag");
    const q = params.get("q");
    const category = params.get("category");
    const minPrice = params.get("min_price");
    const maxPrice = params.get("max_price");
    const sort = params.get("sort");
    const titleEl = document.getElementById("search-page-title");
    const subtitleEl = document.getElementById("search-page-subtitle");
    const grid = document.getElementById("search-product-wrap");
    const countEl = document.getElementById("search-product-count");
    const errorEl = document.getElementById("discover-error");
    const formEl = document.getElementById("discover-form");
    const qEl = document.getElementById("discover-q");
    const categoryEl = document.getElementById("discover-category");
    const aestheticEl = document.getElementById("discover-aesthetic");
    const minEl = document.getElementById("discover-min");
    const maxEl = document.getElementById("discover-max");
    const sortEl = document.getElementById("discover-sort");

    const base = store.getApiBase();

    function setError(msg) {
      if (!errorEl) return;
      if (!msg) {
        errorEl.classList.add("d-none");
        errorEl.textContent = "";
        return;
      }
      errorEl.textContent = msg;
      errorEl.classList.remove("d-none");
    }

    function setParams(next) {
      const url = new URL(window.location.href);
      url.search = next.toString();
      window.history.replaceState({}, "", url.toString());
    }

    function hydrateControls() {
      if (qEl) qEl.value = q || "";
      if (categoryEl) categoryEl.value = category || "all";
      if (aestheticEl) aestheticEl.value = aesthetic || "all";
      if (minEl) minEl.value = minPrice || "";
      if (maxEl) maxEl.value = maxPrice || "";
      if (sortEl) sortEl.value = sort || "";
    }

    hydrateControls();

    if (formEl && !formEl.dataset.bomnousDiscoverBound) {
      formEl.dataset.bomnousDiscoverBound = "1";
      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const next = new URLSearchParams(window.location.search);
        const nq = qEl ? String(qEl.value || "").trim() : "";
        const ncat = categoryEl ? String(categoryEl.value || "") : "all";
        const na = aestheticEl ? String(aestheticEl.value || "") : "all";
        const nmin = minEl ? String(minEl.value || "").trim() : "";
        const nmax = maxEl ? String(maxEl.value || "").trim() : "";
        const nsort = sortEl ? String(sortEl.value || "").trim() : "";

        // preserve tag=trending if already on trending view
        if (tag === "trending") {
          next.set("tag", "trending");
        } else {
          next.delete("tag");
        }

        if (nq) next.set("q", nq);
        else next.delete("q");
        if (ncat && ncat !== "all") next.set("category", ncat);
        else next.delete("category");
        if (na && na !== "all") next.set("aesthetic", na);
        else next.delete("aesthetic");
        if (nmin) next.set("min_price", nmin);
        else next.delete("min_price");
        if (nmax) next.set("max_price", nmax);
        else next.delete("max_price");
        if (nsort) next.set("sort", nsort);
        else next.delete("sort");

        setParams(next);
        await runSearchByAesthetic();
      });
    }

    if (tag === "trending") {
      if (titleEl) {
        titleEl.textContent = "Trending";
      }
      if (subtitleEl) {
        subtitleEl.textContent = "Trending this week — the pieces shoppers are viewing most.";
      }
      setError("");
      try {
        const res = await fetch(`${base}/products/trending`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit"
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map(store.normalizeApiProduct);
        store.registerExtraProducts(normalized);
        store.renderProductGrid(grid, normalized);
        if (countEl) countEl.textContent = String(normalized.length);
        if (window.BomnousUI && typeof window.BomnousUI.initTooltips === "function") {
          window.BomnousUI.initTooltips(grid || document);
        }
        if (window.BomnousUI && typeof window.BomnousUI.applyDataColors === "function") {
          window.BomnousUI.applyDataColors(grid || document);
        }
        if (window.BomnousUI && typeof window.BomnousUI.updateNavCounts === "function") {
          window.BomnousUI.updateNavCounts();
        }
        refreshAOS();
      } catch (e) {
        if (countEl) countEl.textContent = "0";
        setError("Could not load trending products right now.");
        refreshAOS();
      }
      return;
    }

    const hasText = Boolean(q && String(q).trim());
    const hasFacet = Boolean(
      (category && category !== "all") ||
        (aesthetic && aesthetic !== "all") ||
        minPrice ||
        maxPrice ||
        (tag && tag !== "all")
    );

    if (!hasText && !hasFacet) {
      if (titleEl) titleEl.textContent = "Discover";
      if (subtitleEl) {
        subtitleEl.textContent =
          "Browsing the full catalog — use search or filters to narrow results.";
      }
    } else {
      if (titleEl) titleEl.textContent = "Search results";
      if (subtitleEl) {
        const bits = [];
        if (hasText) bits.push(`“${q}”`);
        if (aesthetic && ALLOWED.includes(aesthetic)) bits.push(LABELS[aesthetic]);
        if (category && category !== "all") bits.push(category);
        if (tag && tag !== "all") bits.push(`tag: ${tag}`);
        subtitleEl.textContent = bits.length
          ? `Showing results for ${bits.join(" · ")}.`
          : "Showing filtered results.";
      }
    }

    try {
      setError("");
      const qs = new URLSearchParams();
      if (q && String(q).trim()) qs.set("q", String(q).trim());
      if (category && category !== "all") qs.set("category", category);
      if (aesthetic && aesthetic !== "all") qs.set("aesthetic", aesthetic);
      if (tag && tag !== "all") qs.set("tag", tag);
      if (minPrice) qs.set("min_price", minPrice);
      if (maxPrice) qs.set("max_price", maxPrice);
      if (sort) qs.set("sort", sort);
      qs.set("limit", "500");
      const res = await fetch(`${base}/api/products/search?${qs.toString()}`, {
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
      if (countEl) {
        countEl.textContent = String(normalized.length);
      }
      if (!normalized.length && q) {
        if (grid) {
          grid.innerHTML = `
          <div class="col-12">
            <div class="product-empty-state text-center py-5">
              <p class="mb-0">No results for <strong>${escapeHtml(q)}</strong> — try something else.</p>
              <a href="shop.html" class="btn btn-default mt-4">Browse All</a>
            </div>
          </div>
        `;
        }
        if (window.BomnousUI && typeof window.BomnousUI.updateNavCounts === "function") {
          window.BomnousUI.updateNavCounts();
        }
        refreshAOS();
        return;
      }
      store.renderProductGrid(grid, normalized);
      if (window.BomnousUI && typeof window.BomnousUI.initTooltips === "function") {
        window.BomnousUI.initTooltips(grid || document);
      }
      if (window.BomnousUI && typeof window.BomnousUI.applyDataColors === "function") {
        window.BomnousUI.applyDataColors(grid || document);
      }
      if (window.BomnousUI && typeof window.BomnousUI.updateNavCounts === "function") {
        window.BomnousUI.updateNavCounts();
      }
      refreshAOS();
    } catch (e) {
      if (countEl) {
        countEl.textContent = "0";
      }
      setError(String((e && e.message) || e));
      if (grid) {
        grid.innerHTML = `
          <div class="col-12">
            <div class="product-empty-state text-center py-5">
              <p>Could not load results.</p>
              <small class="text-muted d-block">Try again, or open the full shop.</small>
              <p class="mt-3 mb-0"><a href="shop.html" class="ai-text-link">Browse the full shop</a></p>
            </div>
          </div>
        `;
      }
      refreshAOS();
    }
  }

  document.addEventListener("DOMContentLoaded", runSearchByAesthetic);
})();
