document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  const item = shop.product(new URLSearchParams(location.search).get("id"));
  let quantity = 1;
  document.title = `${item.name} | DemoShop`;
  document.getElementById("product-crumb").textContent = item.name;
  const detail = document.getElementById("product-detail");
  detail.innerHTML = `<div class="product-gallery">${shop.productVisual(item, "product-visual-large")}<div class="thumbnail-row" aria-hidden="true"><span></span><span></span><span></span></div></div>
    <section class="product-information"><span class="category-label">${item.category}</span><h1>${item.name}</h1>
    <div class="rating" aria-label="${item.rating} out of 5 stars"><span aria-hidden="true">★★★★★</span> ${item.rating} · 126 reviews</div>
    <strong class="detail-price">${shop.format(item.price)}</strong><p class="lead">${item.description}</p>
    <ul class="feature-list">${item.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
    <div class="purchase-controls"><div class="quantity-control" aria-label="Quantity"><button type="button" data-quantity="-1" aria-label="Decrease quantity">−</button><output id="product-quantity">1</output><button type="button" data-quantity="1" aria-label="Increase quantity">+</button></div><button id="add-product" class="primary-button" type="button">Add to cart</button></div>
    <label class="normal-warranty"><input id="normal-warranty" type="checkbox"><span><strong>Add 1-year protection for ₹299</strong><small>Optional and not selected. You can decide before checkout.</small></span></label>
    <p id="product-status" class="inline-status" role="status" aria-live="polite"></p></section>`;
  detail.addEventListener("click", (event) => {
    const control = event.target.closest("[data-quantity]");
    if (control) {
      quantity = Math.min(9, Math.max(1, quantity + Number(control.dataset.quantity)));
      document.getElementById("product-quantity").textContent = quantity;
    }
    if (event.target.id === "add-product") {
      shop.addToCart(item.id, quantity);
      document.getElementById("product-status").innerHTML = `Added ${quantity} to your cart. <a href="cart.html">View cart</a>`;
    }
  });
});
