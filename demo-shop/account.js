document.addEventListener("DOMContentLoaded", () => {
  const active = window.DemoShop.getState().plusActive;
  document.getElementById("membership-status").textContent = active ? "Active · ₹199 / month" : "Not active";
  document.getElementById("membership-copy").textContent = active ? "Free delivery, special offers, and extended returns are active in this local demo." : "Join for free delivery, special offers, and extended returns.";
  document.getElementById("membership-action").textContent = active ? "Manage membership" : "Explore DemoShop Plus";
});
