/* Bomnous top nav: profile link, avatar, seller pill, search drawer, live API suggestions. */
(function () {
  "use strict";

  var STORAGE_KEY = "bomnous_logged_in";
  var ROLE_KEY = "bomnous_role";
  var PROFILE_PIC_KEY = "bomnous_profile_pic";
  var PROFILE_PIC_OWNER_KEY = "bomnous_profile_pic_owner";
  var profileSyncOnce = false;
  var wireSearchScheduled = false;

  function isLoggedIn() {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        return true;
      }
      if (window.localStorage.getItem("bomnous_access_token")) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  function isSeller() {
    try {
      return window.localStorage.getItem(ROLE_KEY) === "seller";
    } catch (e) {
      return false;
    }
  }

  function getApiBase() {
    if (typeof window !== "undefined" && window.BOMNOUS_API_BASE !== undefined && window.BOMNOUS_API_BASE !== "") {
      return String(window.BOMNOUS_API_BASE).replace(/\/$/, "");
    }
    return "https://bomnous-shops-ecommerce-backend-production.up.railway.app";
  }

  function getNavDisplayInitial() {
    try {
      var name = window.localStorage.getItem("bomnous_full_name");
      var user = window.localStorage.getItem("bomnous_username");
      var em = window.localStorage.getItem("bomnous_last_email");
      if (name && String(name).trim()) {
        return String(name).trim().charAt(0).toUpperCase();
      }
      if (user && String(user).trim()) {
        return String(user).trim().charAt(0).toUpperCase();
      }
      if (em && em.indexOf("@") > 0) {
        return em.charAt(0).toUpperCase();
      }
    } catch (e) {}
    return "B";
  }

  function getValidatedProfilePicDataUrl() {
    try {
      var pic = window.localStorage.getItem(PROFILE_PIC_KEY);
      if (!pic || String(pic).length <= 40) {
        return null;
      }
      var owner = String(window.localStorage.getItem(PROFILE_PIC_OWNER_KEY) || "")
        .trim()
        .toLowerCase();
      var user = String(window.localStorage.getItem("bomnous_username") || "")
        .trim()
        .toLowerCase();
      if (!user || !owner || owner !== user) {
        window.localStorage.removeItem(PROFILE_PIC_KEY);
        window.localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
        return null;
      }
      return pic;
    } catch (e) {
      return null;
    }
  }

  function setProfilePicCache(dataUrl, username) {
    try {
      if (!dataUrl || String(dataUrl).length <= 40) {
        window.localStorage.removeItem(PROFILE_PIC_KEY);
        window.localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
        return;
      }
      var u = String(username || "")
        .trim()
        .toLowerCase();
      window.localStorage.setItem(PROFILE_PIC_KEY, dataUrl);
      if (u) {
        window.localStorage.setItem(PROFILE_PIC_OWNER_KEY, u);
      } else {
        window.localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function ensureSessionFlag() {
    try {
      if (window.localStorage.getItem("bomnous_access_token") && window.localStorage.getItem(STORAGE_KEY) !== "1") {
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
    } catch (e) {}
  }

  function renderNavProfileAvatar() {
    var el = document.getElementById("nav-profile-link");
    if (!el) {
      return;
    }
    var guest = el.getAttribute("data-href-guest") || "auth.html";
    var logged = el.getAttribute("data-href-logged") || "profile.html";
    var host = document.getElementById("nav-profile-avatar");
    if (!host) {
      host = document.createElement("span");
      host.id = "nav-profile-avatar";
      el.textContent = "";
      el.appendChild(host);
    }

    if (!isLoggedIn()) {
      el.setAttribute("href", guest);
      host.className = "bomnous-nav-avatar bomnous-nav-avatar--guest";
      host.innerHTML = '<i class="bi bi-person" aria-hidden="true"></i>';
      return;
    }

    el.setAttribute("href", logged);
    var pic = getValidatedProfilePicDataUrl();

    if (pic && String(pic).length > 40) {
      host.className = "bomnous-nav-avatar bomnous-nav-avatar--has-pic";
      host.innerHTML = '<img class="bomnous-nav-avatar-img" src="" alt="Profile" />';
      var img = host.querySelector("img");
      if (img) {
        img.src = pic;
      }
      return;
    }

    var ch = getNavDisplayInitial();
    host.className = "bomnous-nav-avatar bomnous-nav-avatar--has-pic";
    host.innerHTML = '<span class="bomnous-nav-avatar-initial" aria-hidden="true">' + ch + "</span>";
  }

  function maybeSyncProfileFromApi() {
    if (profileSyncOnce) {
      return;
    }
    if (!isLoggedIn()) {
      return;
    }
    var token = null;
    try {
      token = window.localStorage.getItem("bomnous_access_token");
    } catch (e) {}
    if (!token) {
      return;
    }
    profileSyncOnce = true;
    var base = getApiBase();
    window
      .fetch(base + "/users/profile", { headers: { Authorization: "Bearer " + token } })
      .then(function (r) {
        if (!r.ok) {
          throw new Error("profile");
        }
        return r.json();
      })
      .then(function (data) {
        if (!data) {
          return;
        }
        try {
          if (data.username) {
            window.localStorage.setItem("bomnous_username", data.username);
          }
          if (data.full_name !== undefined && data.full_name !== null) {
            window.localStorage.setItem("bomnous_full_name", data.full_name);
          }
          if (data.role) {
            window.localStorage.setItem(ROLE_KEY, data.role);
          }
          if (data.profile_picture) {
            setProfilePicCache(data.profile_picture, data.username);
          } else {
            try {
              window.localStorage.removeItem(PROFILE_PIC_KEY);
              window.localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
            } catch (e1) {
              /* ignore */
            }
          }
          if (data.id) {
            window.localStorage.setItem("bomnous_user_id", String(data.id));
          }
        } catch (e) {}
        renderNavProfileAvatar();
        ensureMyShopShortcut();
      })
      .catch(function () {
        profileSyncOnce = false;
      });
  }

  function ensureMyShopShortcut() {
    var profileLink = document.getElementById("nav-profile-link");
    if (!profileLink) {
      return;
    }

    var existing = document.getElementById("nav-my-shop");
    var shouldShow = isLoggedIn() && isSeller();

    if (!shouldShow) {
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      return;
    }

    if (!existing) {
      var a = document.createElement("a");
      a.id = "nav-my-shop";
      a.href = "seller.html";
      a.className = "nav-my-shop-pill";
      a.setAttribute("title", "My Shop");
      a.innerHTML = '<i class="bi bi-shop me-1" aria-hidden="true"></i><span>My Shop</span>';
      profileLink.insertAdjacentElement("afterend", a);
    }
  }

  function migrateLegacyCommerceKeysNav() {
    try {
      if (window.localStorage.getItem("bomnous_wishlist") == null && window.localStorage.getItem("wishlist")) {
        window.localStorage.setItem("bomnous_wishlist", window.localStorage.getItem("wishlist"));
      }
      if (window.localStorage.getItem("bomnous_cart") == null && window.localStorage.getItem("cart")) {
        window.localStorage.setItem("bomnous_cart", window.localStorage.getItem("cart"));
      }
    } catch (e) {
      /* ignore */
    }
  }

  function updateCommerceNavBadges() {
    if (window.BomnousUI && typeof window.BomnousUI.updateNavCounts === "function") {
      window.BomnousUI.updateNavCounts();
      return;
    }
    migrateLegacyCommerceKeysNav();
    function parseArr(k1, k2) {
      try {
        var raw = window.localStorage.getItem(k1) || window.localStorage.getItem(k2) || "[]";
        var a = JSON.parse(raw);
        return Array.isArray(a) ? a : [];
      } catch (e1) {
        return [];
      }
    }
    var w = parseArr("bomnous_wishlist", "wishlist").length;
    var cartArr = parseArr("bomnous_cart", "cart");
    var c = 0;
    for (var i = 0; i < cartArr.length; i++) {
      c += Number((cartArr[i] && cartArr[i].quantity) || 1);
    }
    function setAll(sel, n) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (n < 1) {
          el.classList.add("d-none");
          el.setAttribute("aria-hidden", "true");
          el.textContent = "";
        } else {
          el.classList.remove("d-none");
          el.setAttribute("aria-hidden", "false");
          el.textContent = String(n);
        }
      });
    }
    setAll(".wishlist-span", w);
    setAll(".cart-span", c);
  }

  function formatCategoryLabel(cat) {
    var c = String(cat || "").toLowerCase();
    if (!c) return "—";
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  function formatPrice(n) {
    var x = Number(n);
    if (Number.isNaN(x)) {
      return "$0";
    }
    return "$" + (Math.round(x * 100) / 100).toFixed(2);
  }

  function clearSuggestions() {
    var box = document.getElementById("nav-search-suggestions");
    if (box) {
      box.classList.add("d-none");
      box.classList.remove("nav-search-suggestions--loading");
      box.removeAttribute("role");
      box.innerHTML = "";
    }
  }

  var suggestTimer = null;
  var suggestAbort = null;

  function setSuggestionsLoading(on) {
    var box = document.getElementById("nav-search-suggestions");
    if (box) {
      box.classList.toggle("nav-search-suggestions--loading", on);
    }
  }

  function runSuggestionFetch(q) {
    if (suggestAbort) {
      try {
        suggestAbort.abort();
      } catch (e) {}
    }
    suggestAbort = new AbortController();
    var base = getApiBase();
    var url = base + "/api/products/search?" + new URLSearchParams({ q: q, limit: "5" }).toString();
    setSuggestionsLoading(true);
    window
      .fetch(url, { signal: suggestAbort.signal, headers: { Accept: "application/json" }, credentials: "omit" })
      .then(function (r) {
        if (!r.ok) {
          throw new Error("suggest");
        }
        return r.json();
      })
      .then(function (data) {
        setSuggestionsLoading(false);
        if (!data || !Array.isArray(data)) {
          clearSuggestions();
          return;
        }
        var drawer = document.getElementById("nav-search-drawer");
        if (!drawer || !drawer.classList.contains("open")) {
          return;
        }
        var input = document.getElementById("nav-search-drawer-input");
        if (!input || String(input.value || "").trim() !== q) {
          return;
        }
        if (data.length === 0) {
          clearSuggestions();
          return;
        }
        var box = document.getElementById("nav-search-suggestions");
        if (!box) {
          return;
        }
        box.innerHTML = "";
        data.forEach(function (p) {
          var a = document.createElement("a");
          a.href = "product.html?id=" + encodeURIComponent(p.id);
          a.className = "nav-search-suggestion-item";
          a.setAttribute("role", "option");
          a.innerHTML =
            '<span class="nav-search-suggestion-name"></span><span class="nav-search-suggestion-meta"></span>';
          a.querySelector(".nav-search-suggestion-name").textContent = p.name || "Product";
          a.querySelector(".nav-search-suggestion-meta").textContent =
            formatPrice(p.price) + " · " + formatCategoryLabel(p.category);
          box.appendChild(a);
        });
        box.classList.remove("d-none");
        box.setAttribute("role", "listbox");
      })
      .catch(function (err) {
        setSuggestionsLoading(false);
        if (err && err.name === "AbortError") {
          return;
        }
        clearSuggestions();
      });
  }

  function onSearchInputDebounced() {
    var input = document.getElementById("nav-search-drawer-input");
    if (!input) {
      return;
    }
    if (suggestTimer) {
      clearTimeout(suggestTimer);
    }
    var v = String(input.value || "").trim();
    if (v.length < 3) {
      if (suggestAbort) {
        try {
          suggestAbort.abort();
        } catch (e) {}
      }
      clearSuggestions();
      return;
    }
    suggestTimer = setTimeout(function () {
      suggestTimer = null;
      runSuggestionFetch(v);
    }, 280);
  }

  function refreshNav() {
    ensureSessionFlag();
    renderNavProfileAvatar();
    ensureMyShopShortcut();
    wireNavbarSearch();
    maybeSyncProfileFromApi();
    updateCommerceNavBadges();
  }

  function wireNavbarSearch() {
    if (wireSearchScheduled) {
      return;
    }
    wireSearchScheduled = true;

    var searchTriggers = document.querySelectorAll(
      '.bomnous-navbar [aria-label="Open search"], .bomnous-open-nav-search'
    );
    if (!searchTriggers.length) {
      wireSearchScheduled = false;
      return;
    }

    var drawerOpenedAt = 0;
    var escapeBound = false;

    function isSearchPage() {
      var path = window.location && window.location.pathname ? String(window.location.pathname) : "";
      return path.endsWith("/search.html") || path.endsWith("search.html");
    }

    function ensureDrawer() {
      var existing = document.getElementById("nav-search-drawer");
      var backdrop = document.getElementById("nav-search-backdrop");
      if (existing && backdrop) {
        return { drawer: existing, backdrop: backdrop };
      }

      backdrop = document.createElement("div");
      backdrop.id = "nav-search-backdrop";
      backdrop.className = "nav-search-backdrop";
      backdrop.setAttribute("aria-hidden", "true");

      existing = document.createElement("div");
      existing.id = "nav-search-drawer";
      existing.className = "nav-search-drawer";
      existing.setAttribute("role", "dialog");
      existing.setAttribute("aria-modal", "true");
      existing.setAttribute("aria-label", "Search");
      existing.innerHTML =
        '<div class="nav-search-drawer-inner">' +
        '  <form class="nav-search-panel" id="nav-search-drawer-form" autocomplete="off" role="search">' +
        '    <i class="bi bi-search" aria-hidden="true"></i>' +
        '    <input class="nav-search-input" id="nav-search-drawer-input" name="q" type="search" ' +
        '      placeholder="Search for styles, shops, products…" aria-label="Search" autocomplete="off" />' +
        '    <button type="submit" class="nav-search-submit" aria-label="Run search"><i class="bi bi-search" aria-hidden="true"></i></button>' +
        '    <button type="button" class="nav-search-close" id="nav-search-drawer-close" aria-label="Close search">' +
        '      <i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
        "  </form>" +
        '  <div class="nav-search-suggestions d-none" id="nav-search-suggestions"></div>' +
        "</div>";

      document.body.appendChild(backdrop);
      document.body.appendChild(existing);

      var inputEl = document.getElementById("nav-search-drawer-input");
      if (inputEl) {
        inputEl.addEventListener("input", onSearchInputDebounced);
        inputEl.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.stopPropagation();
          }
        });
      }
      if (!escapeBound) {
        escapeBound = true;
        document.addEventListener("keydown", onGlobalKeydown);
        document.addEventListener("click", onDocClick, true);
      }
      return { drawer: existing, backdrop: backdrop };
    }

    function killBootstrapSearchArtifacts() {
      try {
        document.querySelectorAll(".modal-backdrop").forEach(function (n) {
          n.remove();
        });
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
        if (window.bootstrap && bootstrap.Modal) {
          var m = document.getElementById("navSearchModal");
          if (m) {
            var inst = bootstrap.Modal.getInstance(m);
            if (inst) {
              inst.hide();
              setTimeout(function () {
                if (inst && inst.dispose) {
                  try {
                    inst.dispose();
                  } catch (e1) {}
                }
              }, 0);
            }
          }
        }
      } catch (e) {}
    }

    function closeDrawer() {
      var drawer = document.getElementById("nav-search-drawer");
      var backdrop = document.getElementById("nav-search-backdrop");
      if (drawer) {
        drawer.classList.remove("open");
      }
      if (backdrop) {
        backdrop.classList.remove("open");
        backdrop.setAttribute("aria-hidden", "true");
      }
      if (suggestTimer) {
        clearTimeout(suggestTimer);
        suggestTimer = null;
      }
      if (suggestAbort) {
        try {
          suggestAbort.abort();
        } catch (e) {}
        suggestAbort = null;
      }
      clearSuggestions();
      killBootstrapSearchArtifacts();
    }

    function onGlobalKeydown(e) {
      if (e.key !== "Escape") {
        return;
      }
      var drawer = document.getElementById("nav-search-drawer");
      if (drawer && drawer.classList.contains("open")) {
        e.preventDefault();
        closeDrawer();
      }
    }

    function onDocClick(e) {
      var drawer = document.getElementById("nav-search-drawer");
      if (!drawer || !drawer.classList.contains("open")) {
        return;
      }
      if (Date.now() - drawerOpenedAt < 200) {
        return;
      }
      var t = e.target;
      if (!t || !t.closest) {
        return;
      }
      if (t.closest("#nav-search-drawer")) {
        return;
      }
      if (t.closest('[aria-label="Open search"]') || t.closest(".bomnous-open-nav-search")) {
        return;
      }
      closeDrawer();
    }

    function openDrawer() {
      drawerOpenedAt = Date.now();
      var ui = ensureDrawer();
      ui.drawer.classList.add("open");
      ui.backdrop.classList.add("open");
      ui.backdrop.setAttribute("aria-hidden", "false");
      var input = document.getElementById("nav-search-drawer-input");
      if (input) {
        setTimeout(function () {
          try {
            input.focus();
            input.select();
          } catch (e) {}
        }, 0);
        onSearchInputDebounced();
      }
    }

    function focusSearchPageInput() {
      var input = document.getElementById("discover-q");
      if (input) {
        try {
          input.focus();
        } catch (e) {}
        return true;
      }
      return false;
    }

    function redirectToSearch(term) {
      var q = String(term || "").trim();
      if (!q) {
        return;
      }
      window.location.href = "search.html?q=" + encodeURIComponent(q);
    }

    for (var ti = 0; ti < searchTriggers.length; ti++) {
      (function (trigger) {
        if (trigger.dataset.bomnousSearchWired === "1") {
          return;
        }
        trigger.dataset.bomnousSearchWired = "1";
        if (trigger.hasAttribute("data-bs-toggle") && trigger.getAttribute("data-bs-toggle") === "modal") {
          trigger.removeAttribute("data-bs-toggle");
        }
        if (trigger.hasAttribute("data-bs-target")) {
          trigger.removeAttribute("data-bs-target");
        }
        if (!trigger.classList.contains("bomnous-open-nav-search")) {
          trigger.classList.add("bomnous-open-nav-search");
        }
        trigger.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (isSearchPage() && focusSearchPageInput()) {
            return;
          }
          openDrawer();
        });
      })(searchTriggers[ti]);
    }

    var closeOnce = function (e) {
      e.preventDefault();
      closeDrawer();
    };
    if (!window.__bomnousSearchCloseWired) {
      window.__bomnousSearchCloseWired = true;
      document.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest("#nav-search-drawer-close") : null;
        if (btn) {
          closeOnce(e);
        }
      });
      document.addEventListener("submit", function (e) {
        var form = e.target;
        if (!form || form.id !== "nav-search-drawer-form") {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        var input = document.getElementById("nav-search-drawer-input");
        var q = input ? String(input.value || "").trim() : "";
        closeDrawer();
        redirectToSearch(q);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshNav);
  } else {
    refreshNav();
  }
  window.addEventListener("storage", refreshNav);
  window.addEventListener("bomnous-cart-wishlist-changed", function () {
    updateCommerceNavBadges();
  });
  window.addEventListener("bomnous-profile-updated", function () {
    renderNavProfileAvatar();
    ensureMyShopShortcut();
  });
})();
