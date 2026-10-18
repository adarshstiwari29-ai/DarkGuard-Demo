document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  const button = document.getElementById("activate-plus");
  const actions = document.getElementById("manage-actions");
  const status = document.getElementById("plus-status");
  function render() {
    const active = shop.getState().plusActive;
    status.textContent = active ? "Active" : "Not active";
    button.hidden = active;
    actions.hidden = !active;
  }
  button.addEventListener("click", () => {
    const state = shop.getState();
    state.plusActive = true;
    state.cancelStep = 1;
    shop.save();
    render();
  });
  render();
});
