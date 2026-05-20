await window.customElements.whenDefined("token-flow");

const flows = {
  warm: document.querySelector("#warm-cache-flow"),
  interactive: document.querySelector("#interactive-cache-flow"),
};

const scenarios = {
  cold: {
    title: "Cold cache",
    summary: "The first request writes stable prompt parts into the cache.",
    tokens: [
      { label: "Instructions", state: "write", meta: "cache write" },
      { label: "Tool schemas", state: "write", meta: "cache write" },
      { label: "Project rules", state: "write", meta: "cache write" },
      { label: "User request", state: "fresh", meta: "fresh" },
    ],
  },
  warm: {
    title: "Warm cache",
    summary: "The next request can reuse the stable prefix and process only the new suffix.",
    tokens: [
      { label: "Instructions", state: "cached", meta: "cache hit" },
      { label: "Tool schemas", state: "cached", meta: "cache hit" },
      { label: "Project rules", state: "cached", meta: "cache hit" },
      { label: "New request", state: "fresh", meta: "fresh" },
      { label: "Latest diff", state: "fresh", meta: "fresh" },
    ],
  },
  miss: {
    title: "Cache miss",
    summary: "A changed tool schema breaks the matching prefix and forces more prompt work.",
    tokens: [
      { label: "Instructions", state: "cached", meta: "cache hit" },
      { label: "Changed tools", state: "miss", meta: "cache miss" },
      { label: "Project rules", state: "fresh", meta: "fresh" },
      { label: "User request", state: "fresh", meta: "fresh" },
    ],
  },
};

flows.warm.data = {
  tokens: [
    { label: "System instructions", state: "cached", meta: "cache hit" },
    { label: "Tool schemas", state: "cached", meta: "cache hit" },
    { label: "Repository context", state: "cached", meta: "cache hit" },
    { label: "User follow-up", state: "fresh", meta: "fresh" },
  ],
};

function setScenario(name) {
  const scenario = scenarios[name] || scenarios.cold;

  flows.interactive.setAttribute("title", scenario.title);
  flows.interactive.setAttribute("summary", scenario.summary);
  flows.interactive.data = { tokens: scenario.tokens };

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    const isActive = button.dataset.scenario === name;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

document.querySelectorAll("[data-scenario]").forEach((button) => {
  button.addEventListener("click", () => setScenario(button.dataset.scenario));
});

flows.interactive.addEventListener("token-flow-select", (event) => {
  const { token, index } = event.detail;

  document.querySelector("[data-selected-label]").textContent = token.label;
  document.querySelector("[data-selected-meta]").textContent = `Index ${index}, state "${token.state}", meta "${token.meta}".`;
});

setScenario("cold");
