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

  function updateNavCounts() {
    const store = getStore();
    const counts = store
      ? store.getNavCounts()
      : {
          wishlist: JSON.parse(localStorage.getItem("wishlist") || "[]").length,
          cart: JSON.parse(localStorage.getItem("cart") || "[]").length
        };

    document.querySelectorAll(".wishlist-span").forEach((element) => {
      element.textContent = counts.wishlist;
    });

    document.querySelectorAll(".cart-span").forEach((element) => {
      element.textContent = counts.cart;
    });
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
    const grid = section.querySelector(".product-wrap");
    const countSelector = section.dataset.countTarget || "";
    const summarySelector = section.dataset.summaryTarget || "";

    function syncButtons() {
      section.querySelectorAll("[data-filter-type]").forEach((button) => {
        const isActive = state[button.dataset.filterType] === button.dataset.filterValue;
        button.classList.toggle("active", isActive);
      });
    }

    function render() {
      store.renderProducts(grid, state, {
        countSelector,
        summarySelector
      });
      syncButtons();
      applyDataColors(section);
      initTooltips(section);
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
      renderProductSection(section);
    });
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
    initProductSections();
    initAiStylistDemo();
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
