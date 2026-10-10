document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  const items = document.getElementById("cart-items");
  const empty = document.getElementById("empty-cart");
  const checkout = document.getElementById("checkout-link");
  const marketing = document.getElementById("marketing-toggle");
  function render() {
    const state = shop.getState();
    items.replaceChildren();
    for (const entry of state.cart) {
      const product = shop.product(entry.productId);
      const row = document.createElement("article");
      row.className = "cart-item";
      row.dataset.productId = product.id;
      row.innerHTML = `${shop.productVisual(product, "cart-visual")}<div class="cart-item-copy"><span class="category-label">${product.category}</span><h3><a href="product.html?id=${product.id}">${product.name}</a></h3><p>Estimated delivery in 3–5 working days</p><button class="remove-button" type="button" data-remove>Remove</button></div><div class="cart-item-end"><strong>${shop.format(product.price * entry.quantity)}</strong><div class="quantity-control"><button type="button" data-change="-1" aria-label="Decrease ${product.name} quantity">−</button><output>${entry.quantity}</output><button type="button" data-change="1" aria-label="Increase ${product.name} quantity">+</button></div></div>`;
      items.append(row);
    }
    const total = shop.subtotal();
    document.getElementById("cart-subtotal").textContent = shop.format(total);
    document.getElementById("cart-total").textContent = shop.format(total);
    empty.hidden = state.cart.length > 0;
    items.hidden = state.cart.length === 0;
    checkout.hidden = state.cart.length === 0;
    marketing.checked = Boolean(state.checkout.marketing);
    document.getElementById("marketing-state").textContent = marketing.checked ? "ON" : "OFF";
  }
  items.addEventListener("click", (event) => {
    const row = event.target.closest("[data-product-id]");
    if (!row) return;
    const entry = shop.getState().cart.find((item) => item.productId === row.dataset.productId);
    if (event.target.closest("[data-remove]")) shop.setQuantity(row.dataset.productId, 0);
    else if (event.target.closest("[data-change]")) shop.setQuantity(row.dataset.productId, entry.quantity + Number(event.target.closest("[data-change]").dataset.change));
    render();
  });
  marketing.addEventListener("change", () => {
    const state = shop.getState();
    state.checkout.marketing = marketing.checked;
    state.checkout.marketingExplicit = true;
    shop.save();
    document.getElementById("marketing-state").textContent = marketing.checked ? "ON" : "OFF";
    document.getElementById("marketing-status").textContent = `Preference saved: promotional emails ${marketing.checked ? "ON" : "OFF"}.`;
  });
  document.getElementById("save-marketing-off").addEventListener("click", () => {
    const state = shop.getState();
    state.checkout.marketing = false;
    state.checkout.marketingExplicit = true;
    marketing.checked = false;
    shop.save();
    document.getElementById("marketing-state").textContent = "OFF";
    document.getElementById("marketing-status").textContent = "Preference saved: promotional emails OFF.";
  });
  checkout.addEventListener("click", () => {
    const state = shop.getState();
    state.checkout = { ...state.checkout, step: 1, delivery: "standard",
      protection: state.demoScenario !== "control", trialAccepted: false,
      trialTermsVisible: false, quantityDriftApplied: false };
    shop.save();
  });
  render();
});
