(() => {
  const KEY = "consent-lab-v1", PREFIX = "consent-lab:";
  const categories = ["analytics", "personalization", "marketing"];
  const defaults = (fair = false) => ({ version: 1, updatedAt: Date.now(), fair, decided: false,
    analytics: !fair, personalization: false, marketing: !fair, reversed: false, promptCount: 0, actions: [] });
  const parse = (value) => { try { return JSON.parse(value); } catch { return null; } };
  const sanitize = (value) => {
    if (value?.version !== 1) return null;
    const result = defaults(value.fair === true);
    for (const key of ["fair", "decided", ...categories, "reversed"]) result[key] = value[key] === true;
    result.updatedAt = Number(value.updatedAt) || 0;
    result.promptCount = Math.min(20, Math.max(0, Number(value.promptCount) || 0));
    result.actions = (Array.isArray(value.actions) ? value.actions : []).filter((action) =>
      [...categories, "accept", "reject", "save"].includes(action.category) && typeof action.value === "boolean" && Number.isFinite(action.timestamp))
      .slice(-40).map(({ category, value, timestamp }) => ({ category, value, timestamp }));
    return result;
  };
  let stored; try { stored = sanitize(parse(localStorage.getItem(KEY))); } catch { /* Storage may be disabled. */ }
  const mirrored = window.name.startsWith(PREFIX) ? sanitize(parse(window.name.slice(PREFIX.length))) : null;
  let state = [stored, mirrored].filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt)[0] || defaults();
  const save = () => {
    state.updatedAt = Date.now();
    const serialized = JSON.stringify(state);
    try { localStorage.setItem(KEY, serialized); } catch { /* The same-tab mirror still supports local files. */ }
    window.name = PREFIX + serialized;
  };
  const reset = (fair = false) => { state = defaults(fair); save(); return state; };
  const record = (category, value) => {
    if (![...categories, "accept", "reject", "save"].includes(category) || typeof value !== "boolean") return;
    state.actions.push({ category, value, timestamp: Date.now() }); state.actions = state.actions.slice(-40);
    if (categories.includes(category)) state[category] = value;
    save();
  };
  window.ConsentLab = { categories, getState: () => state, reset, save, record };
})();
