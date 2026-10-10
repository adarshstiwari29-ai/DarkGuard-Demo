document.addEventListener("DOMContentLoaded", () => {
  const shop = window.DemoShop;
  const steps = Array.from(document.querySelectorAll("[data-cancel-step]"));
  const state = shop.getState();
  const stepLabel = document.getElementById("step-label");
  const progressFill = document.getElementById("progress-fill");
  let currentStep = Math.min(steps.length - 1, Math.max(0, (state.cancelStep || 1) - 1));
  function showStep(index) {
    currentStep = index;
    state.cancelStep = index + 1;
    steps.forEach((step, position) => { step.hidden = position !== index; });
    stepLabel.textContent = `Step ${index + 1} of ${steps.length}`;
    progressFill.style.width = `${((index + 1) / steps.length) * 100}%`;
    shop.save();
  }
  document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", () => showStep(currentStep + 1)));
  document.getElementById("confirm-cancellation").addEventListener("click", () => {
    steps[currentStep].hidden = true;
    state.plusActive = false;
    state.cancelStep = 1;
    shop.save();
    stepLabel.textContent = "Complete";
    progressFill.style.width = "100%";
    document.getElementById("cancel-complete").hidden = false;
  });
  showStep(currentStep);
});
