document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  shop.ensureCart();
  const state = shop.getState();
  const steps = Array.from(document.querySelectorAll("[data-checkout-step]"));
  const protectionControls = Array.from(document.querySelectorAll("#premium-protection, #payment-protection"));
  const reviewMarketing = document.getElementById("review-marketing");
  const PROTECTION = 299, HANDLING = 149;
  let seconds = 299;

  if (state.demoScenario === "control") state.checkout.trialTermsVisible = true;
  function deliveryCost() { return state.checkout.delivery === "express" ? 99 : 0; }
  function appliedProtection() { return state.checkout.step >= 2 && state.checkout.protection ? PROTECTION : 0; }
  function handlingCost() { return state.checkout.step >= 4 ? HANDLING : 0; }
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
    const delivery = document.getElementById("delivery-summary");
    delivery.innerHTML = state.checkout.delivery === "express" ? "<span>Express delivery</span><strong>₹99</strong>" : "<span>Standard delivery</span><strong>Free</strong>";
    document.getElementById("protection-summary").hidden = !appliedProtection();
    document.getElementById("handling-fee").hidden = state.checkout.step < 4;
    document.getElementById("order-total").textContent = shop.format(total());
    protectionControls.forEach((control) => { control.checked = state.checkout.protection; });
    document.getElementById("trial-accept").checked = Boolean(state.checkout.trialAccepted);
    document.getElementById("trial-recurring-terms").hidden = !state.checkout.trialTermsVisible;
    document.getElementById("payment-trial-terms").hidden = !(state.checkout.trialAccepted && state.checkout.trialTermsVisible && state.checkout.step === 4);
    document.getElementById("summary-trial-terms").hidden = !(state.checkout.trialAccepted && state.checkout.trialTermsVisible);
    document.getElementById("review-preference-row").hidden = state.checkout.step !== 5;
    reviewMarketing.checked = Boolean(state.checkout.marketing);
    const first = state.cart[0] && shop.product(state.cart[0].productId);
    document.getElementById("review-anchor-price").textContent = first ? shop.format(first.price) : shop.format(0);
  }

  function applyAdvancedReviewDrift() {
    if (state.demoScenario !== "advanced" || state.checkout.quantityDriftApplied) return;
    const first = state.cart.find((entry) => entry.productId === "wireless-headphones") || state.cart[0];
    if (first?.quantity === 1) first.quantity = 2;
    if (state.checkout.marketingExplicit && state.checkout.marketing === false) state.checkout.marketing = true;
    state.checkout.quantityDriftApplied = true;
  }

  function showStep(number) {
    const next = Math.min(5, Math.max(1, number));
    if (next >= 4 && state.checkout.trialAccepted) state.checkout.trialTermsVisible = true;
    if (next === 5) applyAdvancedReviewDrift();
    state.checkout.step = next;
    document.body.dataset.checkoutStep = String(next);
    steps.forEach((step) => { step.hidden = Number(step.dataset.checkoutStep) !== next; });
    document.querySelectorAll("[data-progress]").forEach((item) => {
      const position = Number(item.dataset.progress);
      item.classList.toggle("current", position === next);
      item.classList.toggle("complete", position < next);
    });
    document.querySelector(`[data-checkout-step="${next}"]`)?.focus({ preventScroll: true });
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
  document.getElementById("trial-accept").addEventListener("change", (event) => {
    state.checkout.trialAccepted = event.target.checked;
    if (!event.target.checked && state.demoScenario !== "control") state.checkout.trialTermsVisible = false;
    shop.save();
    renderSummary();
  });
  reviewMarketing.addEventListener("change", () => {
    state.checkout.marketing = reviewMarketing.checked;
    state.checkout.marketingExplicit = true;
    shop.save();
    renderSummary();
  });
  document.querySelectorAll("[data-next-step]").forEach((button) => button.addEventListener("click", () => showStep(state.checkout.step + 1)));
  document.querySelectorAll("[data-previous-step]").forEach((button) => button.addEventListener("click", () => showStep(state.checkout.step - 1)));
  for (const id of ["keep-protection", "payment-keep-protection"]) document.getElementById(id).addEventListener("click", () => setProtection(true, true));
  for (const id of ["skip-protection", "payment-skip-protection"]) document.getElementById(id).addEventListener("click", (event) => { event.preventDefault(); setProtection(false, true); });
  document.getElementById("place-order").addEventListener("click", () => {
    state.lastOrder = { number: `DG-${String(Date.now()).slice(-6)}`, items: state.cart.map((item) => ({ ...item })), subtotal: shop.subtotal(), delivery: state.checkout.delivery, deliveryCost: deliveryCost(), protection: state.checkout.protection, protectionCost: appliedProtection(), handlingFee: HANDLING, trialAccepted: state.checkout.trialAccepted, marketing: state.checkout.marketing, total: total(), placedAt: new Date().toISOString() };
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
