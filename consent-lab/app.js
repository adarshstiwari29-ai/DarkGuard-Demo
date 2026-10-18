document.addEventListener("DOMContentLoaded", () => {
  const lab = window.ConsentLab, params = new URLSearchParams(location.search);
  const fair = document.body.dataset.page === "fair" || params.get("fair") === "1";
  if (fair !== lab.getState().fair) lab.reset(fair);
  const state = lab.getState();
  const destination = (file) => file + "?" + new URLSearchParams({ ...(params.get("demo") === "1" ? { demo: "1" } : {}), ...(fair ? { fair: "1" } : {}) });
  for (const link of document.querySelectorAll("a[data-local]")) {
    link.href = destination(link.getAttribute("href"));
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); setTimeout(() => { location.href = link.href; }, 350);
    });
  }
  const navigate = (file) => setTimeout(() => { location.href = destination(file); }, 350);
  const controls = () => document.querySelectorAll("input[data-category]");
  const render = () => {
    for (const control of controls()) control.checked = state[control.dataset.category];
    for (const output of document.querySelectorAll("[data-state]")) output.textContent = state[output.dataset.state] ? "ON" : "OFF";
    for (const summary of document.querySelectorAll("[data-saved-summary]")) summary.hidden = !state.decided;
  };
  if (document.body.dataset.page === "review" && !fair && state.decided && !state.marketing && !state.reversed) {
    state.marketing = true; state.reversed = true; lab.save();
  }
  render();
  for (const control of controls()) control.addEventListener("change", (event) => {
    if (event.isTrusted) lab.record(control.dataset.category, control.checked);
    else { state[control.dataset.category] = control.checked; lab.save(); }
    render();
  });
  const decide = (accepted, event) => {
    for (const category of lab.categories) state[category] = accepted;
    state.decided = true;
    if (event.isTrusted) lab.record(accepted ? "accept" : "reject", accepted);
    lab.save(); render();
    for (const prompt of document.querySelectorAll("[data-consent-prompt]")) prompt.hidden = true;
    const status = document.querySelector("[data-status]");
    if (status) status.textContent = accepted ? "Your consent preferences have been saved." : "You are continuing with essential cookies only.";
  };
  for (const button of document.querySelectorAll("[data-accept]")) button.addEventListener("click", (event) => decide(true, event));
  for (const button of document.querySelectorAll("[data-reject]")) button.addEventListener("click", (event) => decide(false, event));
  document.querySelector("[data-save]")?.addEventListener("click", (event) => {
    state.decided = true;
    if (event.isTrusted) lab.record("save", lab.categories.some((category) => state[category]));
    lab.save(); navigate("review.html");
  });
  const banner = document.querySelector("[data-initial-banner]");
  if (banner && state.decided) banner.hidden = true;
  if (params.get("scenario") === "buried" && !fair) document.querySelector("[data-direct-reject]")?.setAttribute("hidden", "");
  if (params.get("scenario") === "neutral" && !fair) {
    const decline = document.querySelector("[data-direct-reject]");
    if (decline) decline.textContent = "Reject non-essential cookies";
  }
  document.querySelector("[data-reading]")?.addEventListener("click", () => {
    document.querySelector("[data-article]").hidden = false;
    const rejected = state.actions.some((action) => action.category === "reject" || (action.category === "save" && !action.value));
    if (!fair && rejected && state.promptCount === 0) {
      state.promptCount++; lab.save(); document.querySelector("[data-repeat-prompt]").hidden = false;
    }
  });
  const resetDemo = () => { lab.reset(fair); navigate(fair ? "fair-consent.html" : "advanced.html"); };
  for (const button of document.querySelectorAll("[data-reset-demo]")) button.addEventListener("click", resetDemo);
  const bar = document.createElement("aside"); bar.className = "demo-toolbar";
  bar.innerHTML = `<span>ConsentLab · ${fair ? "fair control" : "deceptive privacy journey"}</span><button type="button">Reset ${fair ? "Fair Control" : "Consent Demo"}</button>`;
  bar.querySelector("button").addEventListener("click", resetDemo);
  document.body.prepend(bar);
});
