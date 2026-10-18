// Local rendered website and consent state machine. No extension messaging or detector imports.
(() => {
  const purposes = [
    ["analytics", "Analytics", "Understand readership and improve the service.", "purposes"],
    ["personalization", "Personalization", "Remember the topics and recommendations you prefer.", "purposes"],
    ["marketing", "Marketing", "Make advertising and recommendations more relevant.", "purposes"],
    ["partners", "Marketing partners", "Allow selected partners to personalize their recommendations.", "partners"],
    ["interests", "Marketing legitimate interests", "Review optional advertising uses described under legitimate interests.", "interests"],
    ["vendors", "Personalization vendors", "Allow optional personalization through participating vendors.", "vendors"]
  ];
  const panelNames = [["overview", "Privacy Overview"], ["purposes", "Processing Purposes"], ["partners", "Partners"], ["interests", "Legitimate Interests"], ["vendors", "Vendor Preferences"], ["save", "Save Choices"]];
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  function mount(host, scenario, mode, onUpdate = () => {}) {
    const manipulated = mode === "manipulative" && scenario.id !== "balanced";
    const isMulti = scenario.id === "multi-step", buried = manipulated && ["second-layer", "multi-step"].includes(scenario.id);
    const selectedPurposes = isMulti ? purposes : purposes.slice(0, 3);
    const defaults = () => Object.fromEntries(selectedPurposes.map(([key]) => [key, manipulated && ["preselected", "multi-step"].includes(scenario.id)]));
    const key = `consent-lab-v2:${scenario.id}:${mode}`;
    const query = new URLSearchParams(location.search);
    let attempts = [];
    try {
      if (query.get("retain") === "1") {
        const stored = JSON.parse(sessionStorage.getItem(key) || "[]");
        if (Array.isArray(stored)) attempts = stored.filter((item) => ["accept", "reject", "custom"].includes(item.outcome) && Number.isInteger(item.actions) && item.actions > 0 && item.actions < 100 && Number.isFinite(item.timestamp))
          .slice(-10).map(({ outcome, actions, timestamp }) => ({ outcome, actions, timestamp }));
      } else sessionStorage.removeItem(key);
    } catch { /* A fresh attempt works when storage is unavailable. */ }
    let timer = null, destroyed = false, activePanel = "overview", focusReturn = null;
    const controller = new AbortController(), listeners = { signal: controller.signal };
    const state = { values: defaults(), actions: [], attempts, visited: [], toggleChanges: 0, currentActions: 0,
      decision: null, promptCount: 1, repeats: 0, repetitionEnabled: true,
      initialPreselected: Object.values(defaults()).some(Boolean), rejectionOnFirstLayer: !buried,
      delay: Math.min(10000, Math.max(500, Number(query.get("delay")) || 2000)) };
    host.innerHTML = `<div class="website-preview ${escape(scenario.theme)}">
      <header class="fictional-header"><span class="fictional-brand">${escape(scenario.brand)}</span><nav aria-label="Website sections"><a href="#website-stories">Discover</a><a href="#website-stories">Journal</a><button type="button" data-open-preferences>Privacy settings</button></nav></header>
      <div class="fictional-content"><p class="fictional-kicker">${escape(scenario.context)} · A fictional website</p><div class="fictional-hero"><div><h2>${escape(scenario.title)}</h2><p>${escape(scenario.deck)}</p><a href="#website-stories" class="story-link">Explore the collection <span aria-hidden="true">→</span></a></div><div class="site-art" aria-hidden="true"><span>${escape(scenario.brand.split(" ")[0])}</span><i></i><b></b></div></div>
      <div class="fictional-stories" id="website-stories">${scenario.cards.map((name, i) => `<article><div class="story-art art-${i}" aria-hidden="true"><span>0${i + 1}</span></div><p class="fictional-kicker">${["Perspective", "Discover", "Editor's choice"][i]}</p><h3>${escape(name)}</h3><p>Considered ideas and a fresh perspective, selected by our editors.</p></article>`).join("")}</div>
      <footer class="fictional-footer"><span>${escape(scenario.brand)} · Local simulation</span><button type="button" data-open-preferences>Privacy settings</button></footer></div>
      <div class="consent-shade" hidden></div>
      <section class="cookie-dialog ${manipulated && scenario.id === "asymmetry" ? "unequal" : "equal"}" role="dialog" aria-modal="false" aria-labelledby="cookie-heading">
        <span class="dialog-kicker">${escape(scenario.brand)} / Your privacy</span><h2 id="cookie-heading">A choice about your privacy</h2>
        <p>We use necessary cookies to keep this website working. With your permission, optional cookies help us understand usage and personalize content and advertising. You can change your preferences at any time.</p>
        <div class="consent-actions"><button type="button" class="accept-choice" data-consent-action="accept">Accept All</button>
        ${buried ? "" : `<button type="button" class="reject-choice" data-consent-action="reject">${scenario.id === "wording" ? manipulated ? "No thanks, I'll miss out on tailored picks." : "No thanks" : "Reject All"}</button>`}
        <button type="button" class="customize-choice" data-consent-action="manage">${buried ? "Manage Preferences" : "Customize"}</button></div>
      </section>
      <section class="preferences-dialog" role="dialog" aria-modal="false" aria-labelledby="preferences-heading" hidden>
        <div class="preference-heading"><div><span class="dialog-kicker">${escape(scenario.brand)} / Privacy centre</span><h2 id="preferences-heading">Cookie preferences</h2></div><button type="button" class="close-dialog" aria-label="Close privacy preferences">×</button></div>
        <p class="preference-intro">Necessary cookies stay on. Each other purpose is optional. Your choices apply to this simulated website.</p>
        ${buried ? `<div class="preference-tabs" role="tablist" aria-label="Privacy preference sections">${(isMulti ? panelNames : panelNames.slice(0, 2)).map(([id, name]) => `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${id === "overview"}" tabindex="${id === "overview" ? "0" : "-1"}" data-panel="${id}">${name}</button>`).join("")}</div>` : ""}
        <div class="preference-scroll">
          <section id="panel-overview" ${buried ? 'role="tabpanel" aria-labelledby="tab-overview"' : ""}><h3>Privacy Overview</h3><p>Review the purposes ${isMulti ? "and partners" : "below"} before saving your choice. ${manipulated && scenario.id === "preselected" ? "Recommended settings are enabled for a tailored experience." : "Optional purposes can be disabled."}</p>
          <label class="purpose-row required"><span><strong>Necessary</strong><small>Security and remembering the choices you save.</small></span><span class="purpose-end"><span>Always on</span><input type="checkbox" checked disabled required aria-required="true" aria-label="Necessary cookies"></span></label></section>
          <div class="purpose-panels">${(isMulti ? panelNames.slice(1, 5) : panelNames.slice(1, 2)).map(([panel, name]) => `<section id="panel-${panel}" data-purpose-panel="${panel}" ${buried ? `role="tabpanel" aria-labelledby="tab-${panel}" hidden` : ""}><h3>${name}</h3>${selectedPurposes.filter((item) => item[3] === panel).map(([id, label, description]) => `<label class="purpose-row" for="purpose-${id}"><span><strong>${escape(label)}</strong><small>${escape(description)}</small></span><span class="purpose-end"><span class="purpose-state" data-value="${id}"></span><input type="checkbox" id="purpose-${id}" data-purpose="${id}" aria-label="${escape(label)}" ${state.values[id] ? "checked" : ""}></span></label>`).join("")}</section>`).join("")}</div>
          <section id="panel-save" ${buried && isMulti ? 'role="tabpanel" aria-labelledby="tab-save"' : ""} hidden><p>Review your current settings below, then save. Every optional purpose remains adjustable.</p><div data-final-review></div></section>
        </div>
        <div class="preference-footer"><button type="button" data-consent-action="accept">Accept All</button>${!buried ? '<button type="button" data-consent-action="reject">Reject All</button>' : ""}<button type="button" data-consent-action="save" ${buried ? "hidden" : ""}>Save Choices</button></div>
      </section>
      <p class="website-status" role="status" aria-live="polite" hidden></p>
    </div>`;
    const banner = host.querySelector(".cookie-dialog"), preferences = host.querySelector(".preferences-dialog"), shade = host.querySelector(".consent-shade");
    const status = host.querySelector(".website-status"), saveButton = host.querySelector('[data-consent-action="save"]');
    const snapshot = () => ({ ...state, values: { ...state.values }, actions: state.actions.map((item) => ({ ...item })), attempts: state.attempts.map((item) => ({ ...item })), visited: [...state.visited] });
    const update = () => { for (const output of host.querySelectorAll("[data-value]")) output.textContent = state.values[output.dataset.value] ? "On" : "Off"; onUpdate(snapshot()); };
    const stop = () => { clearTimeout(timer); timer = null; };
    const showPreferences = (event) => {
      if (event) record(event, "manage");
      stop();
      focusReturn = event?.target; banner.hidden = true; preferences.hidden = false; shade.hidden = false;
      if (!state.visited.includes(activePanel)) state.visited.push(activePanel);
      preferences.querySelector(".close-dialog").focus({ preventScroll: true }); update();
    };
    const record = (event, action, category, value) => {
      if (!event.isTrusted) return;
      state.currentActions++;
      state.actions.push({ action, ...(category ? { category, value } : {}), timestamp: Date.now() });
      state.actions = state.actions.slice(-100);
    };
    const reopen = () => {
      if (destroyed || !state.repetitionEnabled || state.repeats >= 2 || state.decision !== "reject") return;
      state.repeats++; state.promptCount++; banner.hidden = false;
      banner.querySelector("h2").textContent = "Cookie privacy choices, revisited";
      status.textContent = "Your earlier rejection is still saved. This website is asking again."; update();
    };
    const complete = (event, accepted, saved = false) => {
      record(event, saved ? "save" : accepted ? "accept" : "reject");
      if (!saved) for (const purpose of selectedPurposes) state.values[purpose[0]] = accepted;
      state.decision = Object.values(state.values).every((value) => !value) ? "reject" : Object.values(state.values).every(Boolean) ? "accept" : "custom";
      if (event.isTrusted) state.attempts.push({ outcome: state.decision, actions: state.currentActions, timestamp: Date.now() });
      state.attempts = state.attempts.slice(-10);
      try { sessionStorage.setItem(key, JSON.stringify(state.attempts)); } catch { /* Measurements remain in memory. */ }
      for (const input of host.querySelectorAll("[data-purpose]")) input.checked = state.values[input.dataset.purpose];
      banner.hidden = true; preferences.hidden = true; shade.hidden = true; status.hidden = false;
      status.textContent = state.decision === "reject" ? "Preferences saved. Only necessary cookies are enabled." : "Your cookie preferences have been saved.";
      stop();
      if (manipulated && scenario.id === "repeated" && state.decision === "reject" && state.repetitionEnabled && state.repeats < 2) timer = setTimeout(reopen, state.delay);
      host.querySelector(".fictional-header [data-open-preferences]").focus({ preventScroll: true }); update();
    };
    function activate(panel, event) {
      if (panel === activePanel) return;
      record(event, "panel"); activePanel = panel;
      if (!state.visited.includes(panel)) state.visited.push(panel);
      host.querySelector("#panel-overview").hidden = panel !== "overview";
      for (const section of host.querySelectorAll("[data-purpose-panel]")) {
        section.hidden = panel !== "save" && section.dataset.purposePanel !== panel;
        section.setAttribute("role", panel === "save" ? "group" : "tabpanel");
        host.querySelector(panel === "save" ? "[data-final-review]" : ".purpose-panels").append(section);
      }
      for (const tab of host.querySelectorAll("[data-panel]")) { const chosen = tab.dataset.panel === panel; tab.setAttribute("aria-selected", String(chosen)); tab.tabIndex = chosen ? 0 : -1; }
      host.querySelector("#panel-save").hidden = panel !== "save";
      saveButton.hidden = isMulti ? panel !== "save" : panel !== "purposes";
      update();
    }
    const closePreferences = (event) => {
      record(event, "close"); preferences.hidden = true; shade.hidden = true;
      if (!state.decision) banner.hidden = false;
      const target = focusReturn?.getClientRects().length ? focusReturn : state.decision ? host.querySelector(".fictional-header [data-open-preferences]") : banner.querySelector("button");
      target.focus({ preventScroll: true }); update();
    };
    host.addEventListener("click", (event) => {
      const action = event.target.closest("[data-consent-action]")?.dataset.consentAction;
      if (action === "accept") complete(event, true);
      if (action === "reject") complete(event, false);
      if (action === "save") complete(event, false, true);
      if (action === "manage" || event.target.closest("[data-open-preferences]")) showPreferences(event);
      const tab = event.target.closest("[data-panel]"); if (tab) activate(tab.dataset.panel, event);
      if (event.target.closest(".close-dialog")) closePreferences(event);
    }, listeners);
    host.addEventListener("change", (event) => {
      const category = event.target.dataset.purpose;
      if (!selectedPurposes.some(([id]) => id === category)) return;
      state.values[category] = event.target.checked; record(event, "toggle", category, event.target.checked);
      if (event.isTrusted) state.toggleChanges++; update();
    }, listeners);
    host.addEventListener("keydown", (event) => {
      const tab = event.target.closest("[role='tab']");
      if (tab && ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
        event.preventDefault(); const tabs = [...host.querySelectorAll("[role='tab']")], index = tabs.indexOf(tab);
        const next = event.key === "Home" ? tabs[0] : event.key === "End" ? tabs.at(-1) : tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus(); activate(next.dataset.panel, event);
      }
      if (event.key === "Escape" && !preferences.hidden) { event.preventDefault(); closePreferences(event); }
    }, listeners);
    if (scenario.id === "preselected") showPreferences();
    update();
    return { getState: snapshot, setDelay(value) { state.delay = Math.min(10000, Math.max(500, Number(value) || 2000)); update(); },
      stopRepetition() { stop(); state.repetitionEnabled = false; update(); },
      destroy() { destroyed = true; stop(); controller.abort(); }, storageKey: key };
  }
  window.ConsentLabSimulator = { mount };
})();
