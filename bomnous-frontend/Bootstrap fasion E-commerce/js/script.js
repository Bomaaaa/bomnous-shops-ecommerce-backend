(function () {
  function getStore() {
    return window.BomnousStore || null;
  }

  function applyDataColors(root) {
    const scope = root || document;
    scope.querySelectorAll(".data-colors").forEach((item) => {
      const backgroundColor = item.getAttribute("data-bg-color");
      const color = item.getAttribute("data-color");
      const border = item.getAttribute("data-border-color");

      if (backgroundColor) {
        item.style.backgroundColor = backgroundColor;
      }

      if (color) {
        item.style.color = color;
      }

      if (border) {
        item.style.border = `1px solid ${border}`;
      }
    });
  }

  function initTooltips(root) {
    if (typeof bootstrap === "undefined" || !bootstrap.Tooltip) {
      return;
    }

    const scope = root || document;
    scope.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
      if (!bootstrap.Tooltip.getInstance(element)) {
        new bootstrap.Tooltip(element);
      }
    });
  }

  function migrateLegacyCommerceKeysForCounts() {
    try {
      if (localStorage.getItem("bomnous_wishlist") == null && localStorage.getItem("wishlist")) {
        localStorage.setItem("bomnous_wishlist", localStorage.getItem("wishlist"));
      }
      if (localStorage.getItem("bomnous_cart") == null && localStorage.getItem("cart")) {
        localStorage.setItem("bomnous_cart", localStorage.getItem("cart"));
      }
    } catch (e) {
      /* ignore */
    }
  }

  function readWishlistCountFromStorage() {
    migrateLegacyCommerceKeysForCounts();
    try {
      const raw = localStorage.getItem("bomnous_wishlist") || localStorage.getItem("wishlist") || "[]";
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function readCartCountFromStorage() {
    migrateLegacyCommerceKeysForCounts();
    try {
      const raw = localStorage.getItem("bomnous_cart") || localStorage.getItem("cart") || "[]";
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) {
        return 0;
      }
      return arr.reduce((total, item) => total + (Number(item && item.quantity) || 1), 0);
    } catch (e) {
      return 0;
    }
  }

  function setBadgeTextAndVisibility(selector, count) {
    document.querySelectorAll(selector).forEach((element) => {
      if (count < 1) {
        element.classList.add("d-none");
        element.setAttribute("aria-hidden", "true");
        element.textContent = "";
        return;
      }
      element.classList.remove("d-none");
      element.setAttribute("aria-hidden", "false");
      element.textContent = String(count);
    });
  }

  function updateNavCounts() {
    const store = getStore();
    let wishlist = 0;
    let cart = 0;
    if (store && typeof store.getNavCounts === "function") {
      const counts = store.getNavCounts();
      wishlist = Number(counts.wishlist) || 0;
      cart = Number(counts.cart) || 0;
    } else {
      wishlist = readWishlistCountFromStorage();
      cart = readCartCountFromStorage();
    }

    setBadgeTextAndVisibility(".wishlist-span", wishlist);
    setBadgeTextAndVisibility(".cart-span", cart);
  }

  function ensureToastContainer() {
    let container = document.querySelector(".bomnous-toast-stack");
    if (container) {
      return container;
    }

    container = document.createElement("div");
    container.className = "bomnous-toast-stack";
    document.body.appendChild(container);
    return container;
  }

  function showCommerceToast(message, actionLabel, actionHref) {
    const container = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = "bomnous-toast";
    toast.innerHTML = `
      <div class="bomnous-toast-copy">
        <strong>${message}</strong>
      </div>
      ${
        actionLabel && actionHref
          ? `<a href="${actionHref}" class="bomnous-toast-link">${actionLabel}</a>`
          : ""
      }
    `;

    container.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("is-visible");
    }, 10);

    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function initHeroSwiper() {
    if (typeof Swiper === "undefined" || !document.querySelector(".heroSwiper")) {
      return;
    }

    const swiper = new Swiper(".heroSwiper", {
      effect: "fade",
      fadeEffect: { crossFade: true },
      loop: true,
      speed: 1200,
      autoplay: {
        delay: 6000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      allowTouchMove: false
    });

    const prevButton = document.querySelector(".hero-prev");
    const nextButton = document.querySelector(".hero-next");

    if (prevButton) {
      prevButton.addEventListener("click", () => swiper.slidePrev());
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => swiper.slideNext());
    }
  }

  function initSwiperIfPresent(selector, options) {
    if (typeof Swiper === "undefined" || !document.querySelector(selector)) {
      return;
    }

    new Swiper(selector, options);
  }

  function initCarousels() {
    initSwiperIfPresent(".popular-categories-swiper", {
      slidesPerView: 6,
      spaceBetween: 20,
      breakpoints: {
        1200: { slidesPerView: 6 },
        1199: { slidesPerView: 5 },
        767: { slidesPerView: 4 },
        575: { slidesPerView: 3 },
        425: { slidesPerView: 2 },
        0: { slidesPerView: 1 }
      }
    });

    initSwiperIfPresent(".new-arrivals-swiper", {
      slidesPerView: 5,
      spaceBetween: 20,
      loop: true,
      autoplay: true,
      breakpoints: {
        1400: { slidesPerView: 5 },
        1199: { slidesPerView: 4 },
        991: { slidesPerView: 3 },
        575: { slidesPerView: 2 },
        0: { slidesPerView: 1 }
      }
    });

    initSwiperIfPresent(".brand-swiper", {
      slidesPerView: 5,
      spaceBetween: 20,
      loop: true,
      autoplay: true,
      breakpoints: {
        992: { slidesPerView: 5 },
        991: { slidesPerView: 4 },
        767: { slidesPerView: 3 },
        575: { slidesPerView: 2 },
        0: { slidesPerView: 1 }
      }
    });

    initSwiperIfPresent(".best-sell-swiper", {
      slidesPerView: 3,
      spaceBetween: 20,
      breakpoints: {
        768: { slidesPerView: 3 },
        767: { slidesPerView: 2 },
        0: { slidesPerView: 1 }
      }
    });
  }

  function initScrolledNavbar() {
    const navbar = document.querySelector(".bomnous-navbar");
    if (!navbar) {
      return;
    }

    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    });
  }

  function renderProductSection(section) {
    const store = getStore();
    if (!store || !section) {
      return;
    }

    const state = { category: "all", tag: "all" };
    try {
      const params = new URLSearchParams(window.location.search);
      const qCat = String(params.get("category") || "")
        .toLowerCase()
        .trim();
      const qTag = String(params.get("tag") || "")
        .toLowerCase()
        .trim();
      const allowedCat = new Set(["women", "men", "children", "accessories"]);
      const allowedTag = new Set(["trending", "just-dropped", "editors-picks", "all"]);
      if (qCat && allowedCat.has(qCat)) {
        state.category = qCat;
      }
      if (qTag && allowedTag.has(qTag)) {
        state.tag = qTag;
      }
    } catch (e) {
      /* ignore */
    }
    const grid = section.querySelector(".product-wrap");
    const countSelector = section.dataset.countTarget || "";
    const summarySelector = section.dataset.summaryTarget || "";
    const limitRaw = section.dataset.limit;
    const limit = limitRaw != null && String(limitRaw).trim() !== "" ? Number(limitRaw) : undefined;
    const viewMore = section.querySelector("#homepage-view-more");

    function syncButtons() {
      section.querySelectorAll("[data-filter-type]").forEach((button) => {
        const isActive = state[button.dataset.filterType] === button.dataset.filterValue;
        button.classList.toggle("active", isActive);
      });
    }

    function render() {
      store.renderProducts(grid, state, {
        countSelector,
        summarySelector,
        limit: typeof limit === "number" && !Number.isNaN(limit) ? limit : undefined
      });
      syncButtons();
      applyDataColors(section);
      initTooltips(section);
      if (viewMore) {
        const params = new URLSearchParams();
        if (state.category && state.category !== "all") params.set("category", state.category);
        if (state.tag && state.tag !== "all") params.set("tag", state.tag);
        viewMore.href = params.toString() ? `shop.html?${params.toString()}` : "shop.html";
      }
    }

    section.querySelectorAll("[data-filter-type]").forEach((button) => {
      button.addEventListener("click", () => {
        state[button.dataset.filterType] = button.dataset.filterValue;
        render();
      });
    });

    render();
  }

  function initProductSections() {
    document.querySelectorAll("[data-product-section]").forEach((section) => {
      if (section.dataset.hydrated === "1") {
        return;
      }
      renderProductSection(section);
    });
  }

  async function hydrateShopPageIfNeeded() {
    const shopSection = document.querySelector("section.Shop[data-product-section]");
    if (!shopSection) {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    const idRaw = params.get("id");
    const shopId = idRaw ? Number(String(idRaw).trim()) : NaN;
    if (!shopId || Number.isNaN(shopId)) {
      // Not a shop-profile route; fall back to the regular "all products" shop page behavior.
      return false;
    }
    if (shopSection.dataset.hydrated === "1") {
      return true;
    }

    const store = getStore();
    if (!store) {
      return false;
    }

    const grid = shopSection.querySelector(".product-wrap");
    const countSelector = shopSection.dataset.countTarget || "";
    const summarySelector = shopSection.dataset.summaryTarget || "";

    function apiBase() {
      if (typeof window !== "undefined" && window.BOMNOUS_API_BASE !== undefined && window.BOMNOUS_API_BASE !== "") {
        return String(window.BOMNOUS_API_BASE).replace(/\/$/, "");
      }
      const host = window.location && window.location.hostname ? window.location.hostname : "127.0.0.1";
      return `http://${host}:8000`;
    }

    const titleNode = shopSection.querySelector(".shop-toolbar-copy .section-title");
    const profileCard = shopSection.querySelector("#shop-profile-card");
    const summaryNode = document.querySelector(summarySelector);
    const countNode = countSelector ? document.querySelector(countSelector) : null;

    function setEmptyState(titleText, summaryText, bodyHtml) {
      if (titleNode) titleNode.textContent = titleText;
      if (summaryNode) summaryNode.textContent = summaryText;
      if (countNode) countNode.textContent = "0";
      if (profileCard) profileCard.classList.add("d-none");
      if (grid) {
        grid.innerHTML =
          bodyHtml ||
          `
            <div class="col-12">
              <div class="product-empty-state">
                <p>Nothing to show right now.</p>
                <small>Try another shop or browse the full collection.</small>
              </div>
            </div>
          `;
      }
    }

    let shop = null;
    let products = [];
    try {
      const [shopRes, prodRes] = await Promise.all([
        fetch(`${apiBase()}/shops/${shopId}`),
        fetch(`${apiBase()}/shops/${shopId}/products`)
      ]);
      shop = await shopRes.json().catch(() => null);
      products = await prodRes.json().catch(() => []);
      if (!shopRes.ok) {
        const msg =
          shopRes.status === 404
            ? "This shop was not found."
            : "Could not load this shop right now.";
        setEmptyState(
          "Shop not found",
          msg,
          `
            <div class="col-12">
              <div class="product-empty-state">
                <p>${msg}</p>
                <small class="text-muted">Tip: check the link or try again in a moment.</small>
              </div>
            </div>
          `
        );
        shopSection.dataset.hydrated = "1";
        return true;
      }
      if (!prodRes.ok) {
        products = [];
      }
    } catch (e) {
      setEmptyState(
        "Shop offline",
        "Could not reach the API. Is the backend running on port 8000?",
        `
          <div class="col-12">
            <div class="product-empty-state">
              <p>Shop page is offline right now.</p>
              <small class="text-muted">Start the backend API and refresh this page.</small>
            </div>
          </div>
        `
      );
      shopSection.dataset.hydrated = "1";
      return true;
    }

    if (titleNode && shop && shop.name) {
      titleNode.textContent = shop.name;
    }

    if (profileCard && shop) {
      profileCard.classList.remove("d-none");
      const loc = profileCard.querySelector("#shop-profile-location");
      const cats = profileCard.querySelector("#shop-profile-categories");
      const whatsappBtn = profileCard.querySelector("#shop-whatsapp");
      const phoneBtn = profileCard.querySelector("#shop-phone");
      if (loc) loc.textContent = shop.location ? String(shop.location) : "";
      if (cats) {
        const arr = Array.isArray(shop.categories) ? shop.categories : [];
        cats.textContent = arr.length ? arr.join(" · ") : "";
      }
      if (whatsappBtn) {
        const w = shop.whatsapp ? String(shop.whatsapp).trim() : "";
        if (w) {
          const digits = w.replace(/[^\d+]/g, "");
          whatsappBtn.href = `https://wa.me/${digits.replace(/^\+/, "")}`;
          whatsappBtn.classList.remove("d-none");
        }
      }
      if (phoneBtn) {
        const p = shop.phone ? String(shop.phone).trim() : "";
        if (p) {
          phoneBtn.href = `tel:${p}`;
          phoneBtn.classList.remove("d-none");
        }
      }
    }

    if (summaryNode && shop) {
      const bits = [];
      if (shop.description) bits.push(String(shop.description));
      if (shop.location) bits.push(`Location: ${shop.location}`);
      summaryNode.textContent = bits.length ? bits.join(" · ") : "Shop profile loaded.";
    }

    // Render this shop's products into the existing grid (and make the filters work)
    if (grid) {
      const mapped = (Array.isArray(products) ? products : []).map((raw) => ({
        ProductId: `P${raw.id}`,
        apiNumericId: raw.id,
        title: (raw.category || "Shop").toString().charAt(0).toUpperCase() + (raw.category || "").toString().slice(1),
        name: raw.name || "Product",
        category: String(raw.category || "women").toLowerCase().trim(),
        tag: String(raw.tag || "trending").toLowerCase().trim(),
        aestheticTag: String(raw.aesthetic_tag || "soft-luxury").toLowerCase().trim(),
        image: raw.image_url || "image/product-1-1.jpg",
        imageHover: raw.image_hover_url || raw.image_url || "image/product-1-1.jpg",
        price: `$${Number(raw.price || 0).toFixed(2)}`,
        lessprice:
          raw.compare_at_price != null && Number(raw.compare_at_price) > Number(raw.price || 0)
            ? `$${Number(raw.compare_at_price).toFixed(2)}`
            : `$${Number(raw.price || 0).toFixed(2)}`,
        off:
          raw.compare_at_price != null && Number(raw.compare_at_price) > Number(raw.price || 0)
            ? `${Math.round((1 - Number(raw.price || 0) / Number(raw.compare_at_price)) * 100)}%`
            : "0%",
        shopId: raw.shop_id != null ? Number(raw.shop_id) : shopId,
        shopName: shop && shop.name ? String(shop.name) : undefined,
        quantity: raw.quantity
      }));

      // Temporarily override store's internal list for this render by calling renderProducts directly
      // registerExtraProducts makes getProductById still work for cart/wishlist.
      const soldBy = shop && shop.name ? shop.name : "";
      shopSection.dataset.hydrated = "1";

      if (!mapped.length) {
        grid.innerHTML = `
          <div class="col-12">
            <div class="product-empty-state">
              <p>No products found for this shop yet.</p>
              <small>Check back soon — new drops land weekly.</small>
            </div>
          </div>
        `;
      } else {
        if (window.BomnousStore && typeof window.BomnousStore.registerExtraProducts === "function") {
          window.BomnousStore.registerExtraProducts(mapped);
        }
        // Render with the standard filter pipeline so the chips work on this shop subset.
        grid.__bomnous_shop_products = mapped;
        const currentState = { category: "all", tag: "all" };
        function applyFilter() {
          const filtered = mapped.filter((p) => {
            const catOk = currentState.category === "all" || p.category === currentState.category;
            const tagOk = currentState.tag === "all" || p.tag === currentState.tag;
            return catOk && tagOk;
          });
          grid.innerHTML = filtered
            .map((p, i) => window.BomnousStore.createProductCardMarkup(p, { soldBy, aosIndex: i }))
            .join("");
          const countNode = countSelector ? document.querySelector(countSelector) : null;
          if (countNode) countNode.textContent = String(filtered.length);
          if (typeof window.bomnousAOSRefresh === "function") window.bomnousAOSRefresh();
        }
        shopSection.querySelectorAll("[data-filter-type]").forEach((button) => {
          button.addEventListener("click", () => {
            currentState[button.dataset.filterType] = button.dataset.filterValue;
            applyFilter();
          });
        });
        applyFilter();
      }

      if (countNode && !countNode.textContent) countNode.textContent = String(mapped.length);
    }

    return true;
  }

  function initAiStylistDemo() {
    const demoCard = document.querySelector(".ai-stylist-demo-card");
    const chat = document.querySelector(".ai-demo-chat");
    const userMessage = document.querySelector(".user-message");
    const promptNode = document.querySelector("#ai-demo-prompt");
    const followupTextNode = document.querySelector("#ai-demo-followup-text");
    const responseTextNode = document.querySelector("#ai-demo-response-text");
    const preferencesNode = document.querySelector("#ai-demo-preferences");
    const steps = document.querySelectorAll(".ai-step");
    if (!promptNode || !followupTextNode || !responseTextNode || !preferencesNode || !demoCard || !chat || !userMessage) {
      return;
    }

    const scenarios = [
      {
        prompt:
          "It's my graduation in a few weeks. I want a classy look that works with my gown and still feels soft, elegant, and picture-ready.",
        followup:
          "Beautiful. Tell me your preferred colors, heel height, and budget so I can refine the styling.",
        preferences: ["Lilac, ivory, nude", "Mid heels", "Elegant and classy"],
        response:
          "Here are three soft-luxury looks from Bomnous sellers that can work beautifully under your gown and still stand out in your photos.",
        looks: [
          {
            label: "Look 01",
            title: "Graduation Soft Luxe",
            copy: "Structured dress, elegant heels, subtle jewelry, and a polished layering option.",
            image: "image/product-1-1.jpg"
          },
          {
            label: "Look 02",
            title: "After-party Chic",
            copy: "A modern silhouette with a clean heel and a refined bag for pictures after the ceremony.",
            image: "image/product-2-1.jpg"
          },
          {
            label: "Look 03",
            title: "Photo-ready Elegance",
            copy: "Soft color harmony with elevated details that still feel graceful and wearable.",
            image: "image/product-5-1.jpg"
          }
        ]
      },
      {
        prompt:
          "I need a brunch outfit for Abuja this weekend. I want to look feminine, comfortable, and quietly expensive.",
        followup:
          "Got it. Do you want something more relaxed or more dressed up, and are you open to accessories making the look pop?",
        preferences: ["Feminine neutrals", "Comfort first", "Statement bag yes"],
        response:
          "These Bomnous outfit ideas keep the look breathable and polished while still giving you that soft-luxury energy.",
        looks: [
          {
            label: "Look 01",
            title: "Brunch in Abuja",
            copy: "Easy luxury styling with a clean silhouette, breathable fabric, and refined accessories.",
            image: "image/product-8-1.jpg"
          },
          {
            label: "Look 02",
            title: "Modern Day Look",
            copy: "Soft structure, comfortable movement, and a calm premium finish for daytime plans.",
            image: "image/product-7-1.jpg"
          },
          {
            label: "Look 03",
            title: "Quiet Statement",
            copy: "Understated but memorable styling with a polished bag and minimal jewelry.",
            image: "image/product-5-1.jpg"
          }
        ]
      },
      {
        prompt:
          "Style me for a formal dinner. I want something modest, elegant, and rich-looking without feeling overdone.",
        followup:
          "Perfect. Do you prefer darker tones or softer evening shades, and would you like the look to feel more classic or more fashion-forward?",
        preferences: ["Soft evening shades", "Modest fit", "Classic elegance"],
        response:
          "Here are evening recommendations that feel graceful, elevated, and occasion-ready using the Bomnous style direction.",
        looks: [
          {
            label: "Look 01",
            title: "Dinner Guest Look",
            copy: "A refined evening base with elegant accessories and a silhouette that feels confident and composed.",
            image: "image/product-6-1.jpg"
          },
          {
            label: "Look 02",
            title: "Classic Evening",
            copy: "Timeless styling with soft texture, clean tailoring, and rich understated details.",
            image: "image/product-3-1.jpg"
          },
          {
            label: "Look 03",
            title: "Graceful Formal",
            copy: "A balanced formal look with polish, modesty, and a premium finish that photographs beautifully.",
            image: "image/product-4-1.jpg"
          }
        ]
      }
    ];

    let currentScenarioIndex = 0;
    let runningTimeouts = [];
    let isPaused = false;

    function clearTimers() {
      runningTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      runningTimeouts = [];
    }

    function scrollDemoToElement(element, force) {
      if (!chat || !element || isPaused) {
        return;
      }

      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.offsetHeight;
      const viewTop = chat.scrollTop;
      const viewBottom = viewTop + chat.clientHeight;
      const targetTop = Math.max(0, elementBottom - chat.clientHeight + 16);
      const shouldScroll = force || elementBottom > viewBottom || elementTop < viewTop;

      if (!shouldScroll) {
        return;
      }

      chat.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });
    }

    function runWhenActive(callback, delay) {
      const timeoutId = window.setTimeout(() => {
        if (isPaused) {
          runWhenActive(callback, 220);
          return;
        }

        callback();
      }, delay);

      runningTimeouts.push(timeoutId);
    }

    function setLookCard(index, look) {
      const number = index + 1;
      const imageNode = document.querySelector(`#ai-look-image-${number}`);
      const labelNode = document.querySelector(`#ai-look-label-${number}`);
      const titleNode = document.querySelector(`#ai-look-title-${number}`);
      const copyNode = document.querySelector(`#ai-look-copy-${number}`);

      if (imageNode) imageNode.src = look.image;
      if (labelNode) labelNode.textContent = look.label;
      if (titleNode) titleNode.textContent = look.title;
      if (copyNode) copyNode.textContent = look.copy;
    }

    function resetDemo(scenario) {
      clearTimers();
      promptNode.textContent = "";
      followupTextNode.textContent = scenario.followup;
      responseTextNode.textContent = scenario.response;
      preferencesNode.innerHTML = scenario.preferences
        .map((item) => `<div class="ai-followup-chip">${item}</div>`)
        .join("");

      scenario.looks.forEach((look, index) => setLookCard(index, look));

      userMessage.classList.remove("is-visible");
      steps.forEach((step) => step.classList.remove("is-visible"));
      chat.classList.remove("is-playing");
      demoCard.classList.remove("is-playing");
      promptNode.classList.remove("typing-cursor");
      chat.scrollTop = 0;
    }

    function playScenario(scenario) {
      resetDemo(scenario);
      chat.classList.add("is-playing");
      demoCard.classList.add("is-playing");
      userMessage.classList.add("is-visible");
      promptNode.classList.add("typing-cursor");

      let index = 0;
      const typeNextCharacter = () => {
        if (isPaused) {
          runWhenActive(typeNextCharacter, 220);
          return;
        }

        if (index < scenario.prompt.length) {
          promptNode.textContent += scenario.prompt[index];
          index += 1;
          const timeoutId = window.setTimeout(typeNextCharacter, 42);
          runningTimeouts.push(timeoutId);
          return;
        }

        promptNode.classList.remove("typing-cursor");

        const stepDelays = [1300, 2800, 4500, 6500];

        steps.forEach((step, stepIndex) => {
          runWhenActive(() => {
            step.classList.add("is-visible");
            scrollDemoToElement(step, false);
          }, stepDelays[stepIndex] || 1300 + stepIndex * 1700);
        });

        runWhenActive(() => {
          currentScenarioIndex = (currentScenarioIndex + 1) % scenarios.length;
          playScenario(scenarios[currentScenarioIndex]);
        }, 15500);
      };

      typeNextCharacter();
    }

    demoCard.addEventListener("mouseenter", () => {
      isPaused = true;
    });

    demoCard.addEventListener("mouseleave", () => {
      isPaused = false;
      const latestVisibleStep = Array.from(steps).reverse().find((step) => step.classList.contains("is-visible"));
      if (latestVisibleStep) {
        scrollDemoToElement(latestVisibleStep, false);
      }
    });

    playScenario(scenarios[currentScenarioIndex]);
  }

  function renderWishlistPage() {
    const store = getStore();
    if (!store || !document.querySelector(".wishlist-wrapper tbody")) {
      return;
    }

    store.renderWishlistTable(".wishlist-wrapper tbody");
    initTooltips(document);
  }

  function renderCartPage() {
    const store = getStore();
    if (!store || !document.querySelector("#cartBody")) {
      return;
    }

    store.renderCartTable({
      bodySelector: "#cartBody",
      subtotalSelector: ".cart-subtotal",
      totalSelector: ".cart-total"
    });
  }

  function handleCommerceActions() {
    document.addEventListener("click", (event) => {
      const store = getStore();
      if (!store) {
        return;
      }

      const wishlistButton = event.target.closest(".add-to-wishlist-btn");
      if (wishlistButton) {
        event.preventDefault();
        const result = store.addToWishlist(wishlistButton.dataset.productId);
        updateNavCounts();
        showCommerceToast(
          result.added ? `"${result.product.name}" saved to wishlist.` : `"${result.product.name}" is already in your wishlist.`,
          "View wishlist",
          "wishlist.html"
        );
        return;
      }

      const cartButton = event.target.closest(".add-to-cart-btn, .move-to-cart-btn");
      if (cartButton) {
        event.preventDefault();
        const result = store.addToCart(cartButton.dataset.productId);
        updateNavCounts();
        showCommerceToast(`"${result.product.name}" added to cart.`, "View cart", "carts.html");
        return;
      }

      const removeWishlistButton = event.target.closest(".remove-from-wishlist");
      if (removeWishlistButton) {
        event.preventDefault();
        store.removeFromWishlist(removeWishlistButton.dataset.productId);
        renderWishlistPage();
        updateNavCounts();
        showCommerceToast("Item removed from wishlist.");
        return;
      }

      const removeCartButton = event.target.closest(".remove-cart-item");
      if (removeCartButton) {
        event.preventDefault();
        store.removeFromCart(removeCartButton.dataset.productId);
        renderCartPage();
        updateNavCounts();
        showCommerceToast("Item removed from cart.");
      }
    });

    document.addEventListener("change", (event) => {
      const store = getStore();
      if (!store) {
        return;
      }

      const quantityInput = event.target.closest(".cart-quantity-input");
      if (!quantityInput) {
        return;
      }

      store.updateCartQuantity(quantityInput.dataset.productId, quantityInput.value);
      renderCartPage();
      updateNavCounts();
    });
  }

  function updateHomepageCatalogBadge() {
    const inner = document.querySelector("#homepage-catalog-badge .catalog-badge-inner");
    if (!inner) {
      return;
    }
    const src = typeof window !== "undefined" ? window.__BOMNOUS_CATALOG_SOURCE__ : undefined;
    if (src === "api") {
      inner.className = "catalog-badge-inner catalog-badge-live";
      inner.innerHTML =
        '<i class="bi bi-broadcast-pin me-1" aria-hidden="true"></i>Live catalog from FastAPI (<code class="small">GET /api/products/</code>)';
      return;
    }
    if (src === "static") {
      inner.className = "catalog-badge-inner catalog-badge-offline";
      inner.innerHTML =
        '<i class="bi bi-cloud-slash me-1" aria-hidden="true"></i>Showing bundled demo catalog — start the API and refresh for live data';
    }
  }

  async function initStylistPage() {
    const windowEl = document.getElementById("stylist-chat-window");
    const form = document.getElementById("stylist-chat-form");
    const input = document.getElementById("stylist-chat-input");
    const typing = document.getElementById("stylist-typing");
    const endBtn = document.getElementById("stylist-end-session");
    if (!windowEl || !form || !input || !typing) {
      return false;
    }

    const apiBase =
      window.BomnousStore && typeof window.BomnousStore.getApiBase === "function"
        ? window.BomnousStore.getApiBase()
        : "http://127.0.0.1:8000";

    function scrollToBottom() {
      windowEl.scrollTop = windowEl.scrollHeight + 9999;
    }

    function escapeHtml(s) {
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function addBubble(role, text) {
      const isUser = role === "user";
      const div = document.createElement("div");
      div.className = `stylist-bubble ${isUser ? "user user-message" : "ai ai-message"}`;
      div.innerHTML = `
        <span class="stylist-role">${isUser ? "You" : "Bomnous AI"}</span>
        <p>${escapeHtml(text).replaceAll("\n", "<br/>")}</p>
      `;
      windowEl.appendChild(div);
      scrollToBottom();
      return div;
    }

    // Session memory: keep the last few turns and send them to the backend.
    const convo = [];
    function pushTurn(role, content) {
      const c = String(content || "").trim();
      if (!c) return;
      convo.push({ role, content: c });
      if (convo.length > 12) convo.splice(0, convo.length - 12);
    }

    function getDisplayName() {
      try {
        const username = localStorage.getItem("bomnous_username");
        if (username) {
          const u = String(username).trim();
          if (u) return u.charAt(0).toUpperCase() + u.slice(1);
        }
        const email = localStorage.getItem("bomnous_last_email");
        if (email) {
          const base = String(email).split("@")[0].trim();
          if (base) return base.charAt(0).toUpperCase() + base.slice(1);
        }
      } catch (e) {
        // ignore
      }
      return null;
    }

    function isClosingIntent(message) {
      const s = String(message || "").toLowerCase();
      return (
        s.includes("thank you") ||
        s.includes("thanks") ||
        s.includes("thx") ||
        s.includes("done") ||
        s.includes("thats all") ||
        s.includes("that's all") ||
        s.includes("goodbye") ||
        s.includes("bye")
      );
    }

    function findProductsMentionedByName(reply, catalog) {
      const text = String(reply || "").toLowerCase();
      if (!text || !Array.isArray(catalog) || catalog.length === 0) return [];

      // Prefer longer names first to avoid partial overlaps.
      const byLength = catalog
        .filter((p) => p && p.name)
        .slice()
        .sort((a, b) => String(b.name).length - String(a.name).length);

      const found = [];
      for (const p of byLength) {
        const name = String(p.name).trim();
        if (!name) continue;
        if (text.includes(name.toLowerCase())) {
          found.push(p);
        }
        if (found.length >= 3) break;
      }
      return found;
    }

    async function fetchCatalogOnce() {
      try {
        if (window.__BOMNOUS_STYLIST_CATALOG__) return window.__BOMNOUS_STYLIST_CATALOG__;
        const res = await fetch(`${apiBase}/api/products/`);
        if (!res.ok) throw new Error(`catalog_http_${res.status}`);
        const data = await res.json();
        window.__BOMNOUS_STYLIST_CATALOG__ = Array.isArray(data) ? data : [];
        return window.__BOMNOUS_STYLIST_CATALOG__;
      } catch (e) {
        window.__BOMNOUS_STYLIST_CATALOG__ = [];
        return [];
      }
    }

    let lastRecommended = [];

    function addProductToCartByNumericId(numericId) {
      const store = getStore();
      if (!store || typeof store.addToCart !== "function") {
        return { ok: false, reason: "store_missing" };
      }
      const productId = `P${Number(numericId)}`;
      const result = store.addToCart(productId);
      updateNavCounts();
      return { ok: true, result };
    }

    function attachRecommendations(parentBubble, products) {
      if (!products || !products.length) return;
      lastRecommended = products.map((p) => Number(p.id)).filter((n) => !Number.isNaN(n));
      const grid = document.createElement("div");
      grid.className = "stylist-recs";
      grid.innerHTML = products
        .map((p) => {
          const img = escapeHtml(p.image_url || "image/product-1-1.jpg");
          const name = escapeHtml(p.name || "Product");
          const shopName = escapeHtml(p.shop_name || "");
          const price = typeof p.price === "number" ? `$${p.price.toFixed(2)}` : "";
          const pid = Number(p.id);
          return `
            <div class="stylist-rec-card" data-product-numeric-id="${Number.isNaN(pid) ? "" : pid}">
              <a class="stylist-rec-card-link" href="product.html?id=${encodeURIComponent(p.id)}" title="${name}">
                <img class="stylist-rec-img" src="${img}" alt="${name}" loading="lazy" decoding="async"/>
                <div class="stylist-rec-meta">
                  <strong>${name}</strong>
                  <small>${shopName ? `${shopName} · ` : ""}${price}</small>
                </div>
              </a>
              <button type="button" class="btn btn-outline-dark btn-sm stylist-add-cart" data-product-numeric-id="${Number.isNaN(pid) ? "" : pid}">
                Add to cart
              </button>
            </div>
          `;
        })
        .join("");
      parentBubble.appendChild(grid);
      scrollToBottom();

      grid.querySelectorAll(".stylist-add-cart").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.getAttribute("data-product-numeric-id"));
          if (!Number.isNaN(id)) {
            addProductToCartByNumericId(id);
            addBubble("ai", "Done — I added it to your cart. Want me to suggest a bag + shoes to match?");
            pushTurn("assistant", "Done — I added it to your cart. Want me to suggest a bag + shoes to match?");
          }
        });
      });
    }

    const name = getDisplayName();
    addBubble(
      "ai",
      `Hi ${name ? name : "there"}! 👋 I'm your Bomnous AI Stylist. Describe your vibe, occasion, budget, or just tell me what you're looking for — and I'll find your perfect look!`
    );
    pushTurn(
      "assistant",
      `Hi ${name ? name : "there"}! 👋 I'm your Bomnous AI Stylist. Describe your vibe, occasion, budget, or just tell me what you're looking for — and I'll find your perfect look!`
    );

    if (endBtn) {
      endBtn.addEventListener("click", () => {
        const closingName = getDisplayName();
        addBubble(
          "ai",
          `You’ve got this${closingName ? `, ${closingName}` : ""}. Happy shopping — if you want, tell me what you picked and I’ll style accessories + shoes to match.`
        );
      });
    }

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const msg = String(input.value || "").trim();
      if (!msg) return;
      input.value = "";

      addBubble("user", msg);
      pushTurn("user", msg);

      const sLower = msg.toLowerCase();
      const cartIntent =
        sLower.includes("add to cart") ||
        sLower.includes("add it to cart") ||
        sLower.includes("add it") ||
        sLower.includes("add that") ||
        sLower.includes("yes add") ||
        sLower === "ok" ||
        sLower === "okay" ||
        sLower === "yes" ||
        sLower === "sure";

      if (cartIntent && lastRecommended.length) {
        const numericId = lastRecommended[0];
        addProductToCartByNumericId(numericId);
        addBubble("ai", "Perfect — I added the recommended item to your cart. Want me to suggest a bag + shoes to match?");
        pushTurn("assistant", "Perfect — I added the recommended item to your cart. Want me to suggest a bag + shoes to match?");
        return;
      }

      if (isClosingIntent(msg)) {
        addBubble(
          "ai",
          "It was so lovely styling you today! Come back anytime you need a fresh look. Happy shopping on Bomnous! ✨"
        );
        return;
      }

      typing.classList.remove("d-none");
      scrollToBottom();

      try {
        const payloadMessage = name ? `User name: ${name}\n\n${msg}` : msg;
        // Exclude the just-added user turn so it is not duplicated with `message` on the server.
        const historyForApi = convo.length ? convo.slice(0, -1) : [];

        async function sendOnce() {
          const res = await fetch(`${apiBase}/chat`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: payloadMessage, history: historyForApi })
          });
          const data = await res.json().catch(() => ({}));
          return { res, data };
        }

        let { res, data } = await sendOnce();
        if (!res.ok) {
          const detail = data && (data.detail || data.message) ? String(data.detail || data.message) : `HTTP ${res.status}`;
          // If rate-limited, wait briefly and retry once automatically.
          if (res.status === 429) {
            const m = detail.match(/try again in\s+(\d+(?:\.\d+)?)s/i);
            const seconds = m ? Math.min(12, Math.max(1, Math.ceil(Number(m[1])))) : 7;
            addBubble("ai", `One sec — I'm still styling for a few shoppers. Retrying in ${seconds}s…`);
            await new Promise((r) => setTimeout(r, seconds * 1000));
            ({ res, data } = await sendOnce());
          }
          if (!res.ok) {
            const detail2 =
              data && (data.detail || data.message) ? String(data.detail || data.message) : `HTTP ${res.status}`;
            throw new Error(detail2);
          }
        }

        const reply = data && data.reply ? String(data.reply) : "Tell me a bit more and I’ll style you.";
        const bubble = addBubble("ai", reply);
        pushTurn("assistant", reply);
        const catalog = await fetchCatalogOnce();
        const selected = findProductsMentionedByName(reply, catalog);
        attachRecommendations(bubble, selected);
      } catch (e) {
        addBubble(
          "ai",
          `I couldn’t style that request just now. ${e && e.message ? String(e.message) : ""}`
        );
      } finally {
        typing.classList.add("d-none");
      }
    });

    return true;
  }

  async function loadSmartHomepageSections() {
    const trendingWrap = document.getElementById("trending-wrap");
    const trendingCount = document.getElementById("trending-count");
    const newshopsWrap = document.getElementById("newshops-wrap");
    if (!trendingWrap && !newshopsWrap) {
      return;
    }

    function apiBase() {
      if (typeof window !== "undefined" && window.BOMNOUS_API_BASE !== undefined && window.BOMNOUS_API_BASE !== "") {
        return String(window.BOMNOUS_API_BASE).replace(/\/$/, "");
      }
      const host = window.location && window.location.hostname ? window.location.hostname : "127.0.0.1";
      return `http://${host}:8000`;
    }

    const base = apiBase();
    try {
      if (trendingWrap) {
        const res = await fetch(`${base}/products/trending`);
        const data = await res.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((raw) => (window.BomnousStore ? window.BomnousStore.normalizeApiProduct(raw) : raw));
        trendingWrap.innerHTML = mapped.length
          ? mapped
              .slice(0, 8)
              .map((p, i) => (window.BomnousStore ? window.BomnousStore.createProductCardMarkup(p, { aosIndex: i }) : ""))
              .join("")
          : '<div class="col-12 text-muted small">No trending products yet.</div>';
        if (trendingCount) trendingCount.textContent = String(mapped.length);
        if (typeof window.bomnousAOSRefresh === "function") window.bomnousAOSRefresh();
      }
    } catch (e) {
      if (trendingWrap) trendingWrap.innerHTML = '<div class="col-12 text-muted small">Trending section offline.</div>';
    }

    try {
      if (newshopsWrap) {
        const res = await fetch(`${base}/shops/new`);
        const data = await res.json().catch(() => []);
        const shops = Array.isArray(data) ? data : [];
        newshopsWrap.innerHTML = shops.length
          ? shops
              .slice(0, 6)
              .map((s, i) => {
                const name = s && s.name ? String(s.name) : "Shop";
                const location = s && s.location ? String(s.location) : "";
                return `
                  <a class="shop-mini-card" href="shop.html?id=${s.id}" data-aos="fade-up" data-aos-delay="${i * 80}">
                    <div class="shop-mini-card-inner">
                      <strong>${name}</strong>
                      <span class="text-muted small">${location}</span>
                    </div>
                    <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  </a>
                `;
              })
              .join("")
          : '<div class="text-muted small">No new shops yet.</div>';
        if (typeof window.bomnousAOSRefresh === "function") window.bomnousAOSRefresh();
      }
    } catch (e) {
      if (newshopsWrap) newshopsWrap.innerHTML = '<div class="text-muted small">New shops section offline.</div>';
    }
  }

  window.addEventListener("storage", (e) => {
    if (!e || !e.key) {
      return;
    }
    if (
      e.key === "bomnous_wishlist" ||
      e.key === "bomnous_cart" ||
      e.key === "wishlist" ||
      e.key === "cart"
    ) {
      updateNavCounts();
    }
  });

  window.addEventListener("bomnous-cart-wishlist-changed", () => {
    updateNavCounts();
  });

  document.addEventListener("DOMContentLoaded", async () => {
    applyDataColors(document);
    initTooltips(document);
    initHeroSwiper();
    initCarousels();
    initScrolledNavbar();
    const store = getStore();
    if (store && typeof store.loadProductsFromApi === "function") {
      await store.loadProductsFromApi();
    }
    updateHomepageCatalogBadge();
    await loadSmartHomepageSections();
    const shopHydrated = await hydrateShopPageIfNeeded();
    if (!shopHydrated) {
      initProductSections();
    } else {
      // still wire filters/buttons for non-shop sections if any exist
      initProductSections();
    }
    initAiStylistDemo();
    await initStylistPage();
    renderWishlistPage();
    renderCartPage();
    updateNavCounts();
    handleCommerceActions();
  });

  window.BomnousUI = {
    applyDataColors,
    initTooltips,
    updateNavCounts,
    showCommerceToast
  };
})();
