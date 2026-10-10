(() => {
  const STORAGE_KEY = "darkguard-demo-shop-v1";
  const WINDOW_PREFIX = "darkguard-demo-shop:";
  const products = window.DEMOSHOP_PRODUCTS || [];
  const now = () => Date.now();
  const defaults = () => ({
    version: 2, updatedAt: now(), demoReady: false, demoScenario: "advanced", cart: [],
    checkout: { step: 1, delivery: "standard", protection: true, marketing: false,
      marketingExplicit: false, trialAccepted: false, trialTermsVisible: false, quantityDriftApplied: false },
    plusActive: false, cancelStep: 1, lastOrder: null
  });

  function parse(value) {
    try { return value ? JSON.parse(value) : null; } catch { return null; }
  }
  function load() {
    const stored = parse(localStorage.getItem(STORAGE_KEY));
    const mirrored = window.name.startsWith(WINDOW_PREFIX) ? parse(window.name.slice(WINDOW_PREFIX.length)) : null;
    const source = [stored, mirrored].filter((item) => [1, 2].includes(item?.version)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    return source ? { ...defaults(), ...source, version: 2, checkout: { ...defaults().checkout, ...source.checkout } } : defaults();
  }
  let state = load();
  function save() {
    state.updatedAt = now();
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    window.name = WINDOW_PREFIX + serialized;
    updateChrome();
    return state;
  }
  function reset(scenario = "advanced") {
    state = defaults();
    state.demoScenario = scenario === "control" ? "control" : "advanced";
    state.checkout.protection = state.demoScenario !== "control";
    state.demoReady = true;
    save();
    return state;
  }
  function product(id) { return products.find((item) => item.id === id) || products[0]; }
  function cartCount() { return state.cart.reduce((sum, item) => sum + item.quantity, 0); }
  function subtotal() { return state.cart.reduce((sum, item) => sum + product(item.productId).price * item.quantity, 0); }
  function addToCart(productId, quantity = 1) {
    const existing = state.cart.find((item) => item.productId === productId);
    if (existing) existing.quantity = Math.min(9, existing.quantity + quantity);
    else state.cart.push({ productId, quantity: Math.min(9, Math.max(1, quantity)) });
    save();
  }
  function setQuantity(productId, quantity) {
    const item = state.cart.find((entry) => entry.productId === productId);
    if (!item) return;
    if (quantity <= 0) state.cart = state.cart.filter((entry) => entry !== item);
    else item.quantity = Math.min(9, quantity);
    save();
  }
  function ensureCart() {
    if (!state.cart.length) {
      state.cart = [{ productId: "wireless-headphones", quantity: 1 }];
      save();
    }
  }
  function format(amount) { return `₹${Number(amount).toLocaleString("en-IN")}`; }
  function productVisual(item, className = "") {
    return `<span class="product-visual tone-${item.tone} ${className}" aria-hidden="true"><span>${item.mark}</span></span>`;
  }
  function updateChrome() {
    document.querySelectorAll("[data-cart-count]").forEach((element) => { element.textContent = String(cartCount()); });
    document.querySelectorAll("[data-plus-status]").forEach((element) => { element.textContent = state.plusActive ? "Plus active" : "Join Plus"; });
  }
  function preserveDemoMode() {
    if (new URLSearchParams(location.search).get("demo") !== "1") return;
    document.querySelectorAll("a[href]").forEach((anchor) => {
      const url = new URL(anchor.href, location.href);
      if (url.protocol !== "file:" || !url.pathname.includes("/demo-shop/")) return;
      url.searchParams.set("demo", "1");
      anchor.href = url.href;
    });
  }
  function addDemoToolbar() {
    if (new URLSearchParams(location.search).get("demo") !== "1") return;
    const bar = document.createElement("aside");
    bar.className = "demo-toolbar";
    bar.setAttribute("aria-label", "Presentation demo controls");
    bar.innerHTML = '<span><strong>Demo Mode</strong> · <span data-demo-scenario></span></span><div><button type="button" data-reset-scenario="advanced">Reset advanced demo</button><button type="button" data-reset-scenario="control">Reset fair control</button></div>';
    bar.querySelector("[data-demo-scenario]").textContent = state.demoScenario === "control" ? "Fair control" : "Advanced integrity scenario";
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reset-scenario]");
      if (!button) return;
      reset(button.dataset.resetScenario);
      location.href = "index.html?demo=1";
    });
    document.body.prepend(bar);
  }

  const params = new URLSearchParams(location.search);
  if (params.get("demo") === "1" && !state.demoReady) reset("advanced");
  window.DemoShop = {
    products, product, getState: () => state, save, reset, cartCount, subtotal,
    addToCart, setQuantity, ensureCart, format, productVisual
  };
  document.addEventListener("DOMContentLoaded", () => {
    updateChrome();
    addDemoToolbar();
    setTimeout(preserveDemoMode);
  });
})();
