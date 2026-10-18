document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  const grid = document.getElementById("product-grid");
  for (const item of shop.products) {
    const article = document.createElement("article");
    article.className = "product-card";
    article.innerHTML = `${shop.productVisual(item)}
      <div class="product-card-copy"><span class="category-label">${item.category}</span><h3>${item.name}</h3>
      <p>${item.description}</p><div class="rating" aria-label="${item.rating} out of 5 stars"><span aria-hidden="true">★★★★★</span> ${item.rating}</div>
      <div class="product-card-bottom"><strong>${shop.format(item.price)}</strong><div><a href="product.html?id=${item.id}">View Product</a><button type="button" data-add="${item.id}">Add to Cart</button></div></div></div>`;
    grid.append(article);
  }
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    shop.addToCart(button.dataset.add);
    button.textContent = "Added";
    button.classList.add("added");
    setTimeout(() => { button.textContent = "Add to Cart"; button.classList.remove("added"); }, 1200);
  });
  const timer = document.getElementById("dispatch-timer");
  let seconds = 600;
  setInterval(() => {
    seconds = Math.max(0, seconds - 1);
    timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }, 1000);
});
