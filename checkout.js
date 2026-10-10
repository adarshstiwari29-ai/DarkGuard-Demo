document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  shop.ensureCart();
  const state = shop.getState();
  const steps = Array.from(document.querySelectorAll("[data-checkout-step]"));
  const protectionControls = Array.from(document.querySelectorAll("#premium-protection, #payment-protection, #review-protection"));
  const PROTECTION = 299, HANDLING = 149;
  let seconds = 299;

  function deliveryCost() { return state.checkout.delivery === "express" ? 99 : 0; }
  function appliedProtection() { return state.checkout.step >= 2 && state.checkout.protection ? PROTECTION : 0; }
  function handlingCost() { return state.checkout.step >= 3 ? HANDLING : 0; }
  function total() { return shop.subtotal() + deliveryCost() + appliedProtection() + handlingCost(); }
  function renderItems(container) {
    container.replaceChildren();
    for (const entry of state.cart) {
      const item = shop.product(entry.productId);
      const row = document.createElement("div");
      row.className = "summary-row product-line";
      row.innerHTML = `<span>${item.name} × ${entry.quantity}</span><strong>${shop.format(item.price * entry.quantity)}</strong>`;
      container.append(row);
    }
  }
  function renderSummary() {
    renderItems(document.getElementById("checkout-items"));
    renderItems(document.getElementById("review-items"));
    const delivery = document.getElementById("delivery-summary");
    delivery.innerHTML = state.checkout.delivery === "express" ? "<span>Express delivery</span><strong>₹99</strong>" : "<span>Standard delivery</span><strong>Free</strong>";
    document.getElementById("protection-summary").hidden = !appliedProtection();
    document.getElementById("handling-fee").hidden = state.checkout.step < 3;
    document.getElementById("order-total").textContent = shop.format(total());
    protectionControls.forEach((control) => { control.checked = state.checkout.protection; });
  }
  function showStep(number) {
    state.checkout.step = Math.min(4, Math.max(1, number));
    steps.forEach((step) => { step.hidden = Number(step.dataset.checkoutStep) !== state.checkout.step; });
    document.querySelectorAll("[data-progress]").forEach((item) => {
      const position = Number(item.dataset.progress);
      item.classList.toggle("current", position === state.checkout.step);
      item.classList.toggle("complete", position < state.checkout.step);
    });
    document.querySelector(`[data-checkout-step="${state.checkout.step}"]`)?.focus({ preventScroll: true });
    shop.save();
    renderSummary();
  }
  function setProtection(value, interacted = false) {
    state.checkout.protection = value;
    protectionControls.forEach((control) => {
      control.checked = value;
      if (interacted) control.dispatchEvent(new Event("change", { bubbles: true }));
    });
    shop.save();
    renderSummary();
  }
  document.querySelectorAll('input[name="delivery"]').forEach((radio) => {
    radio.checked = radio.value === state.checkout.delivery;
    radio.addEventListener("change", () => { state.checkout.delivery = radio.value; shop.save(); renderSummary(); });
  });
  for (const control of protectionControls) control.addEventListener("change", () => setProtection(control.checked));
  document.querySelectorAll("[data-next-step]").forEach((button) => button.addEventListener("click", () => showStep(state.checkout.step + 1)));
  document.querySelectorAll("[data-previous-step]").forEach((button) => button.addEventListener("click", () => showStep(state.checkout.step - 1)));
  for (const id of ["keep-protection", "payment-keep-protection", "review-keep-protection"]) document.getElementById(id).addEventListener("click", () => setProtection(true, true));
  for (const id of ["skip-protection", "payment-skip-protection", "review-skip-protection"]) document.getElementById(id).addEventListener("click", (event) => { event.preventDefault(); setProtection(false, true); });
  document.getElementById("place-order").addEventListener("click", () => {
    state.lastOrder = { number: `DG-${String(Date.now()).slice(-6)}`, items: state.cart.map((item) => ({ ...item })), subtotal: shop.subtotal(), delivery: state.checkout.delivery, deliveryCost: deliveryCost(), protection: state.checkout.protection, protectionCost: appliedProtection(), handlingFee: HANDLING, total: total(), placedAt: new Date().toISOString() };
    state.cart = [];
    shop.save();
    const demo = new URLSearchParams(location.search).get("demo") === "1" ? "?demo=1" : "";
    location.href = `confirmation.html${demo}`;
  });
  setInterval(() => {
    seconds = Math.max(0, seconds - 1);
    const value = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    document.getElementById("offer-timer").textContent = value;
    document.getElementById("review-timer").textContent = value;
  }, 1000);
  showStep(state.checkout.step || 1);
});
