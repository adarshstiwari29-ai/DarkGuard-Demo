document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  const items = document.getElementById("cart-items");
  const empty = document.getElementById("empty-cart");
  const checkout = document.getElementById("checkout-link");
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
  }
  items.addEventListener("click", (event) => {
    const row = event.target.closest("[data-product-id]");
    if (!row) return;
    const entry = shop.getState().cart.find((item) => item.productId === row.dataset.productId);
    if (event.target.closest("[data-remove]")) shop.setQuantity(row.dataset.productId, 0);
    else if (event.target.closest("[data-change]")) shop.setQuantity(row.dataset.productId, entry.quantity + Number(event.target.closest("[data-change]").dataset.change));
    render();
  });
  checkout.addEventListener("click", () => {
    const state = shop.getState();
    state.checkout = { step: 1, delivery: "standard", protection: true };
    shop.save();
  });
  render();
});
