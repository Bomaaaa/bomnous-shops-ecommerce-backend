/**
 * Bomnous catalog: loads from FastAPI GET /api/products when available,
 * otherwise uses STATIC_PRODUCTS. Category + tag filters apply to the active catalog.
 *
 * Configure API origin (if not same host/port as the static site):
 *   <script>window.BOMNOUS_API_BASE = "http://127.0.0.1:8000";</script>
 * before this file, or set at runtime before DOMContentLoaded.
 */
(function () {
  const STATIC_PRODUCTS = [
    {
      ProductId: "P1",
      title: "Women",
      name: "Colorful Pattern Dress",
      category: "women",
      tag: "trending",
      image: "image/product-1-1.jpg",
      imageHover: "image/product-1-2.jpg",
      price: "$238.85",
      lessprice: "$245.80",
      off: "10%"
    },
    {
      ProductId: "P2",
      title: "Women",
      name: "Floral Summer Dress",
      category: "women",
      tag: "editors-picks",
      image: "image/product-2-1.jpg",
      imageHover: "image/product-2-2.jpg",
      price: "$199.99",
      lessprice: "$249.99",
      off: "20%"
    },
    {
      ProductId: "P3",
      title: "Men",
      name: "Slim Fit Shirt",
      category: "men",
      tag: "just-dropped",
      image: "image/product-3-1.jpg",
      imageHover: "image/product-3-2.jpg",
      price: "$149.99",
      lessprice: "$189.99",
      off: "15%"
    },
    {
      ProductId: "P4",
      title: "Children",
      name: "Kids Winter Jacket",
      category: "children",
      tag: "trending",
      image: "image/product-4-1.jpg",
      imageHover: "image/product-4-2.jpg",
      price: "$129.99",
      lessprice: "$159.99",
      off: "18%"
    },
    {
      ProductId: "P5",
      title: "Accessories",
      name: "Leather Handbag",
      category: "accessories",
      tag: "editors-picks",
      image: "image/product-5-1.jpg",
      imageHover: "image/product-5-2.jpg",
      price: "$179.99",
      lessprice: "$199.99",
      off: "10%"
    },
    {
      ProductId: "P6",
      title: "Men",
      name: "Tailored Evening Blazer",
      category: "men",
      tag: "trending",
      image: "image/product-6-1.jpg",
      imageHover: "image/product-6-2.jpg",
      price: "$289.99",
      lessprice: "$335.00",
      off: "13%"
    },
    {
      ProductId: "P7",
      title: "Accessories",
      name: "Soft Structure Tote",
      category: "accessories",
      tag: "just-dropped",
      image: "image/product-7-1.jpg",
      imageHover: "image/product-7-2.jpg",
      price: "$154.50",
      lessprice: "$185.00",
      off: "16%"
    },
    {
      ProductId: "P8",
      title: "Women",
      name: "Pleated Occasion Set",
      category: "women",
      tag: "just-dropped",
      image: "image/product-8-1.jpg",
      imageHover: "image/product-8-2.jpg",
      price: "$214.00",
      lessprice: "$260.00",
      off: "18%"
    }
  ];

  /** Active catalog (replaced after successful API load, or static copy on failure). */
  let productsData = STATIC_PRODUCTS.slice();

  /** Products shown only on e.g. search.html (not in main catalog) — still addable to cart/wishlist. */
  const extraById = new Map();

  let loadPromise = null;

  function getApiBase() {
    if (typeof window !== "undefined" && window.BOMNOUS_API_BASE !== undefined && window.BOMNOUS_API_BASE !== "") {
      return String(window.BOMNOUS_API_BASE).replace(/\/$/, "");
    }
    return "http://127.0.0.1:8000";
  }

  function titleFromCategory(category) {
    const c = String(category || "all").toLowerCase();
    const map = {
      women: "Women",
      men: "Men",
      children: "Children",
      accessories: "Accessories"
    };
    return map[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : "Shop");
  }

  function formatMoney(n) {
    const x = Number(n);
    if (Number.isNaN(x)) {
      return "$0.00";
    }
    return `$${x.toFixed(2)}`;
  }

  /**
   * Maps FastAPI ProductResponse-style JSON to the card shape used by the UI.
   * Accepts optional fields: category, tag, image_url, image_hover_url, compare_at_price
   */
  function normalizeApiProduct(raw) {
    const id = raw.id;
    const category = String(raw.category || "women")
      .toLowerCase()
      .trim();
    const tag = String(raw.tag || "trending")
      .toLowerCase()
      .trim();
    const priceNum = Number(raw.price);
    const compareRaw = raw.compare_at_price != null ? Number(raw.compare_at_price) : null;
    const hasCompare = compareRaw != null && !Number.isNaN(compareRaw) && compareRaw > priceNum;

    const price = formatMoney(priceNum);
    const lessprice = hasCompare ? formatMoney(compareRaw) : price;
    let off = "0%";
    if (hasCompare) {
      off = `${Math.round((1 - priceNum / compareRaw) * 100)}%`;
    }

    const image = raw.image_url || raw.image || "image/product-1-1.jpg";
    const imageHover = raw.image_hover_url || raw.image_hover || image;

    const aestheticTag = String(raw.aesthetic_tag || "soft-luxury")
      .toLowerCase()
      .trim();

    return {
      ProductId: `P${id}`,
      apiNumericId: id,
      title: titleFromCategory(category),
      name: String(raw.name || "Product"),
      category,
      tag,
      aestheticTag,
      image,
      imageHover,
      price,
      lessprice,
      off,
      shopId: raw.shop_id != null ? Number(raw.shop_id) : undefined,
      shopName: raw.shop_name != null ? String(raw.shop_name) : undefined,
      quantity: raw.quantity
    };
  }

  function applyStaticFallback() {
    extraById.clear();
    productsData = STATIC_PRODUCTS.slice();
  }

  /**
   * Fetches GET {API_BASE}/api/products once; on failure or empty list uses static data.
   * API origin defaults to http://127.0.0.1:8000; override with window.BOMNOUS_API_BASE.
   */
  function loadProductsFromApi() {
    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async function () {
      const base = getApiBase();

      try {
        const url = `${base}/api/products/`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit"
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("empty_or_invalid");
        }
        productsData = data.map(normalizeApiProduct);
        if (typeof window !== "undefined") {
          window.__BOMNOUS_CATALOG_SOURCE__ = "api";
          window.__BOMNOUS_CATALOG_COUNT__ = productsData.length;
        }
        return { ok: true, source: "api", count: productsData.length };
      } catch (e) {
        applyStaticFallback();
        if (typeof window !== "undefined") {
          window.__BOMNOUS_CATALOG_SOURCE__ = "static";
          window.__BOMNOUS_CATALOG_COUNT__ = productsData.length;
        }
        return { ok: false, source: "static", reason: String(e && e.message ? e.message : e) };
      }
    })();

    return loadPromise;
  }

  const STORAGE_KEYS = {
    wishlist: "bomnous_wishlist",
    cart: "bomnous_cart"
  };

  const LEGACY_KEYS = { wishlist: "wishlist", cart: "cart" };
  let legacyStorageMigrated = false;

  function migrateLegacyCommerceKeysOnce() {
    if (legacyStorageMigrated) {
      return;
    }
    legacyStorageMigrated = true;
    try {
      if (localStorage.getItem(STORAGE_KEYS.wishlist) == null && localStorage.getItem(LEGACY_KEYS.wishlist)) {
        localStorage.setItem(STORAGE_KEYS.wishlist, localStorage.getItem(LEGACY_KEYS.wishlist));
      }
      if (localStorage.getItem(STORAGE_KEYS.cart) == null && localStorage.getItem(LEGACY_KEYS.cart)) {
        localStorage.setItem(STORAGE_KEYS.cart, localStorage.getItem(LEGACY_KEYS.cart));
      }
    } catch (err) {
      /* ignore */
    }
  }

  function parsePrice(value) {
    return Number.parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;
  }

  function getStoredItems(key) {
    migrateLegacyCommerceKeysOnce();
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function setStoredItems(key, items) {
    migrateLegacyCommerceKeysOnce();
    localStorage.setItem(key, JSON.stringify(items));
    try {
      window.dispatchEvent(new CustomEvent("bomnous-cart-wishlist-changed"));
    } catch (err) {
      /* ignore */
    }
  }

  function cloneProduct(product) {
    return {
      ProductId: product.ProductId,
      apiNumericId: product.apiNumericId,
      title: product.title,
      name: product.name,
      category: product.category,
      tag: product.tag,
      aestheticTag: product.aestheticTag,
      image: product.image,
      imageHover: product.imageHover,
      price: product.price,
      lessprice: product.lessprice,
      off: product.off,
      quantity: product.quantity || 1
    };
  }

  function normalizeProductIdKey(productId) {
    if (productId == null || productId === "") {
      return null;
    }
    const s = String(productId).trim();
    const m = s.match(/^P?(\d+)$/i);
    if (m) {
      return `P${m[1]}`;
    }
    return s;
  }

  function getProductById(productId) {
    const key = normalizeProductIdKey(productId) || String(productId);
    return (
      productsData.find((product) => product.ProductId === key) ||
      productsData.find((product) => product.ProductId === productId) ||
      extraById.get(key) ||
      extraById.get(productId) ||
      null
    );
  }

  function registerExtraProducts(items) {
    extraById.clear();
    (items || []).forEach((p) => {
      if (p && p.ProductId) {
        extraById.set(p.ProductId, p);
      }
    });
  }

  function getAllProducts() {
    return productsData.slice();
  }

  function renderProductGrid(container, normalizedProducts) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    if (!el) {
      return;
    }
    const list = normalizedProducts || [];
    if (!list.length) {
      el.innerHTML = `
        <div class="col-12">
          <div class="product-empty-state text-center py-4">
            <p>No products match this aesthetic yet.</p>
            <small class="text-muted">Try another mood or browse the full shop.</small>
          </div>
        </div>
      `;
      return;
    }
    el.innerHTML = list.map((p, i) => createProductCardMarkup(p, { aosIndex: i })).join("");
    if (typeof window.bomnousAOSRefresh === "function") {
      window.bomnousAOSRefresh();
    }
  }

  function getWishlist() {
    return getStoredItems(STORAGE_KEYS.wishlist);
  }

  function getCart() {
    return getStoredItems(STORAGE_KEYS.cart);
  }

  function getFilterLabel(type, value) {
    const labels = {
      category: {
        all: "All categories",
        women: "Women",
        men: "Men",
        children: "Children",
        accessories: "Accessories"
      },
      tag: {
        all: "All edits",
        trending: "Trending",
        "just-dropped": "Just dropped",
        "editors-picks": "Editor's picks"
      }
    };

    return labels[type] && labels[type][value] ? labels[type][value] : value;
  }

  function filterProducts(filters) {
    const state = {
      category: filters && filters.category ? filters.category : "all",
      tag: filters && filters.tag ? filters.tag : "all"
    };

    return productsData.filter((product) => {
      const categoryMatch = state.category === "all" || product.category === state.category;
      const tagMatch = state.tag === "all" || product.tag === state.tag;
      return categoryMatch && tagMatch;
    });
  }

  function createProductCardMarkup(product, options) {
    const opts = options || {};
    const soldBy = (product && product.shopName ? String(product.shopName) : "") || (opts.soldBy ? String(opts.soldBy) : "");
    const soldByHref =
      product && product.shopId != null && !Number.isNaN(Number(product.shopId)) ? `shop.html?id=${Number(product.shopId)}` : "shop.html";
    const soldByMarkup = soldBy
      ? `<div class="product-sold-by-row"><a class="product-sold-by" href="${soldByHref}">Sold by ${soldBy}</a></div>`
      : "";
    const staggerIdx = opts.aosIndex != null ? Number(opts.aosIndex) : null;
    const aosAttrs =
      staggerIdx != null && !Number.isNaN(staggerIdx)
        ? ` data-aos="fade-up" data-aos-delay="${Math.min(staggerIdx, 24) * 50}"`
        : "";
    return `
      <div class="col-12 col-sm-6 col-lg-3 product-grid-item"${aosAttrs}>
        <article class="product-item bomnous-product-card h-100" data-product-id="${product.ProductId}">
          <div class="product-image bomnous-product-image section-image position-relative overflow-hidden rounded-4">
            <img src="${product.image}" alt="${product.name}" class="img-fluid obj-cover bomnous-main-img">
            <img src="${product.imageHover}" alt="${product.name}" class="img-fluid obj-cover defalut-img bomnous-hover-img">
            <span class="badge bomnous-off-badge">${product.off}</span>
            <div class="product-social-icons bomnous-product-actions">
              <button type="button" class="product-social-icon add-to-wishlist-btn" data-product-id="${product.ProductId}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-title="Save to wishlist">
                <i class="ri-heart-3-line"></i>
              </button>
              <a href="product.html?id=${product.apiNumericId != null ? product.apiNumericId : String(product.ProductId).replace(/^P/i, "")}" class="product-social-icon text-decoration-none" role="button" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-custom-class="custom-tooltip" data-bs-title="Quick view">
                <i class="ri-eye-line"></i>
              </a>
            </div>
          </div>
          <div class="product-content bomnous-product-content">
            ${soldByMarkup}
            <div class="product-meta-row">
              <span class="product-category-label">${product.title}</span>
              <span class="product-tag-label">${getFilterLabel("tag", product.tag)}</span>
            </div>
            <h3 class="bomnous-product-name">
              <a href="product.html?id=${product.apiNumericId != null ? product.apiNumericId : String(product.ProductId).replace(/^P/i, "")}" class="product-link">${product.name}</a>
            </h3>
            <div class="product-price-row">
              <span class="new-price">${product.price}</span>
              <span class="old-price">${product.lessprice}</span>
            </div>
            <div class="product-card-footer">
              <button type="button" class="product-add-btn add-to-cart-btn" data-product-id="${product.ProductId}">
                <i class="ri-shopping-bag-3-line"></i>
                Add to cart
              </button>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function renderProducts(target, filters, options) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) {
      return [];
    }

    const settings = options || {};
    const filteredProducts = filterProducts(filters);
    const limitedProducts =
      typeof settings.limit === "number" ? filteredProducts.slice(0, settings.limit) : filteredProducts;

    const soldBy = settings.soldBy != null ? String(settings.soldBy) : "";
    container.innerHTML = limitedProducts.length
      ? limitedProducts.map((p, i) => createProductCardMarkup(p, { soldBy, aosIndex: i })).join("")
      : `
        <div class="col-12">
          <div class="product-empty-state">
            <p>No products match this selection yet.</p>
            <small>Try another category or another curated tag.</small>
          </div>
        </div>
      `;

    if (typeof window.bomnousAOSRefresh === "function") {
      window.bomnousAOSRefresh();
    }

    if (settings.countSelector) {
      const countNode = document.querySelector(settings.countSelector);
      if (countNode) {
        countNode.textContent = String(filteredProducts.length);
      }
    }

    if (settings.summarySelector) {
      const summaryNode = document.querySelector(settings.summarySelector);
      if (summaryNode) {
        summaryNode.textContent =
          filters.category === "all" && filters.tag === "all"
            ? "Showing all curated pieces."
            : `Showing ${getFilterLabel("category", filters.category).toLowerCase()} pieces in ${getFilterLabel("tag", filters.tag).toLowerCase()}.`;
      }
    }

    return filteredProducts;
  }

  function addToWishlist(productId) {
    const product = getProductById(productId);
    if (!product) {
      return { added: false, reason: "missing" };
    }

    const wishlist = getWishlist();
    const exists = wishlist.some((item) => item.ProductId === productId);

    if (exists) {
      return { added: false, reason: "exists", product };
    }

    wishlist.push(cloneProduct(product));
    setStoredItems(STORAGE_KEYS.wishlist, wishlist);
    return { added: true, product };
  }

  function addToCart(productId) {
    const product = getProductById(productId);
    if (!product) {
      return { added: false, reason: "missing" };
    }

    const cart = getCart();
    const existing = cart.find((item) => item.ProductId === productId);

    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push(cloneProduct(product));
    }

    setStoredItems(STORAGE_KEYS.cart, cart);
    return { added: true, product };
  }

  function removeFromWishlist(productId) {
    const nextWishlist = getWishlist().filter((item) => item.ProductId !== productId);
    setStoredItems(STORAGE_KEYS.wishlist, nextWishlist);
    return nextWishlist;
  }

  function removeFromCart(productId) {
    const nextCart = getCart().filter((item) => item.ProductId !== productId);
    setStoredItems(STORAGE_KEYS.cart, nextCart);
    return nextCart;
  }

  function updateCartQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find((entry) => entry.ProductId === productId);
    if (!item) {
      return cart;
    }

    item.quantity = Math.max(1, Number.parseInt(quantity, 10) || 1);
    setStoredItems(STORAGE_KEYS.cart, cart);
    return cart;
  }

  function getNavCounts() {
    return {
      wishlist: getWishlist().length,
      cart: getCart().reduce((total, item) => total + (item.quantity || 1), 0)
    };
  }

  function renderWishlistTable(target) {
    const tableBody = typeof target === "string" ? document.querySelector(target) : target;
    if (!tableBody) {
      return;
    }

    const wishlist = getWishlist();

    tableBody.innerHTML = wishlist.length
      ? wishlist
          .map(
            (product) => `
              <tr>
                <td>
                  <div class="wishlist-product-cell">
                    <img src="${product.image}" class="img-fluid rounded-4" width="88" alt="${product.name}">
                    <div>
                      <h6 class="mb-1">${product.name}</h6>
                      <p class="mb-0 text-muted">Curated ${product.category} piece for premium everyday styling.</p>
                    </div>
                  </div>
                </td>
                <td class="text-end text-secondary">${product.price}</td>
                <td class="text-center text-success d-none d-md-table-cell">In Stock</td>
                <td class="text-center d-none d-md-table-cell">
                  <button class="btn wishlist-btn py-2 btn-sm move-to-cart-btn" data-product-id="${product.ProductId}">
                    <i class="bi bi-bag"></i> Add to cart
                  </button>
                </td>
                <td class="text-center">
                  <button class="icon-action-btn remove-from-wishlist" data-product-id="${product.ProductId}" type="button" aria-label="Remove from wishlist">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td colspan="5">
            <div class="empty-state-card text-center">
              <h5>Your wishlist is still empty</h5>
              <p class="mb-2">Save the pieces you love and come back to them anytime.</p>
              <a href="shop.html" class="empty-state-link">Discover products</a>
            </div>
          </td>
        </tr>
      `;
  }

  function renderCartTable(config) {
    const settings = config || {};
    const body = document.querySelector(settings.bodySelector || "#cartBody");
    const subtotalNode = document.querySelector(settings.subtotalSelector || ".cart-subtotal");
    const totalNode = document.querySelector(settings.totalSelector || ".cart-total");

    if (!body) {
      return;
    }

    const cart = getCart();
    let totalPrice = 0;

    body.innerHTML = cart.length
      ? cart
          .map((item) => {
            const quantity = item.quantity || 1;
            const price = parsePrice(item.price);
            const subtotal = price * quantity;
            totalPrice += subtotal;

            return `
              <tr>
                <td>
                  <div class="cart-product-cell">
                    <img src="${item.image}" alt="${item.name}" width="88" class="img-fluid rounded-4">
                    <div>
                      <h6 class="mb-1">${item.name}</h6>
                      <small class="text-muted">${item.title}</small>
                    </div>
                  </div>
                </td>
                <td class="text-end">${item.price}</td>
                <td class="text-center">
                  <input type="number" class="form-control text-center cart-quantity-input" data-product-id="${item.ProductId}" value="${quantity}" min="1">
                </td>
                <td class="text-end">$${subtotal.toFixed(2)}</td>
                <td class="text-center">
                  <button class="icon-action-btn remove-cart-item" data-product-id="${item.ProductId}" type="button" aria-label="Remove from cart">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </td>
              </tr>
            `;
          })
          .join("")
      : `
        <tr>
          <td colspan="5">
            <div class="empty-state-card text-center">
              <h5>Your cart is empty</h5>
              <p class="mb-2">Add a few curated finds to begin your Bomnous checkout journey.</p>
              <a href="shop.html" class="empty-state-link">Continue shopping</a>
            </div>
          </td>
        </tr>
      `;

    const totalText = `$${totalPrice.toFixed(2)}`;
    if (subtotalNode) {
      subtotalNode.textContent = totalText;
    }
    if (totalNode) {
      totalNode.textContent = totalText;
    }
  }

  window.BomnousStore = {
    STATIC_PRODUCTS,
    get productsData() {
      return productsData;
    },
    getApiBase,
    loadProductsFromApi,
    normalizeApiProduct,
    registerExtraProducts,
    renderProductGrid,
    createProductCardMarkup,
    getProductById,
    getAllProducts,
    normalizeProductIdKey,
    filterProducts,
    renderProducts,
    addToWishlist,
    addToCart,
    removeFromWishlist,
    removeFromCart,
    updateCartQuantity,
    renderWishlistTable,
    renderCartTable,
    getWishlist,
    getCart,
    getNavCounts,
    getFilterLabel
  };
})();
