const templateUrl = new URL("./concept-callout.html", import.meta.url);
const stylesheetUrl = new URL("./concept-callout.css", import.meta.url);

const variantDefaults = {
  example: { kicker: "Example", marker: "EX" },
  metaphor: { kicker: "Metaphor", marker: "MT" },
  note: { kicker: "Note", marker: "NB" },
  story: { kicker: "Story", marker: "ST" },
};

const supportedVariants = new Set(Object.keys(variantDefaults));

function stripInjectedClientScript(markup) {
  return markup.replace(/\s*<script\b[^>]*\bsrc=["']\/@vite\/client["'][^>]*>\s*<\/script>\s*/gi, "\n");
}

async function loadText(url, type = "text") {
  const accept = type === "stylesheet" ? "text/css,*/*;q=0.1" : "text/html,*/*;q=0.1";
  const response = await fetch(url, { headers: { Accept: accept } });

  if (!response.ok) {
    throw new Error(`Unable to load ${url.pathname}`);
  }

  const text = await response.text();
  return type === "template" ? stripInjectedClientScript(text) : text;
}

const [templateMarkup, stylesheetText] = await Promise.all([
  loadText(templateUrl, "template"),
  loadText(stylesheetUrl, "stylesheet"),
]);

const template = document.createElement("template");
template.innerHTML = templateMarkup;

const stylesheet = new CSSStyleSheet();
await stylesheet.replace(stylesheetText);

function normalizeVariant(variant) {
  return supportedVariants.has(variant) ? variant : "note";
}

function readStep(value) {
  const step = Number.parseInt(value, 10);
  return Number.isFinite(step) && step > 0 ? step : null;
}

function formatMarker(step, total, fallback) {
  if (step && total) {
    return `${step}/${total}`;
  }

  return step ? String(step).padStart(2, "0") : fallback;
}

class ConceptCallout extends HTMLElement {
  static observedAttributes = [
    "kicker",
    "marker",
    "step",
    "summary",
    "theme",
    "title",
    "total",
    "variant",
  ];

  connectedCallback() {
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "note");
    }

    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: "open" });
      shadow.adoptedStyleSheets = [stylesheet];
      shadow.append(template.content.cloneNode(true));
    }

    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    if (!this.shadowRoot) return;

    const variant = normalizeVariant(this.getAttribute("variant"));
    const defaults = variantDefaults[variant];
    const shell = this.shadowRoot.querySelector("[data-shell]");
    const step = readStep(this.getAttribute("step"));
    const total = readStep(this.getAttribute("total"));

    shell.dataset.variant = variant;
    this.shadowRoot.querySelector("[data-marker]").textContent =
      this.getAttribute("marker") || formatMarker(step, total, defaults.marker);
    this.shadowRoot.querySelector("[data-kicker]").textContent = this.getAttribute("kicker") || defaults.kicker;
    this.shadowRoot.querySelector("[data-title]").textContent = this.getAttribute("title") || "";
    this.shadowRoot.querySelector("[data-summary]").textContent = this.getAttribute("summary") || "";
  }
}

if (!window.customElements.get("concept-callout")) {
  window.customElements.define("concept-callout", ConceptCallout);
}
