document.addEventListener("DOMContentLoaded", () => {
  const first = document.querySelector('[data-fair-step="1"]');
  const second = document.querySelector('[data-fair-step="2"]');
  const complete = document.getElementById("fair-complete");
  document.querySelector("[data-fair-next]").addEventListener("click", () => { first.hidden = true; second.hidden = false; });
  document.querySelector("[data-fair-back]").addEventListener("click", () => { second.hidden = true; first.hidden = false; });
  document.querySelector("[data-fair-confirm]").addEventListener("click", () => {
    window.DemoShop.getState().plusActive = false;
    window.DemoShop.save();
    second.hidden = true;
    complete.hidden = false;
  });
});
