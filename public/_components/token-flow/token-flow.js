const templateUrl = new URL("./token-flow.html", import.meta.url);
const stylesheetUrl = new URL("./token-flow.css", import.meta.url);

const defaultData = {
  kicker: "Prompt cache",
  title: "Token flow",
  summary: "A compact view of stable and volatile prompt segments.",
  tokens: [
    { label: "Instructions", state: "cached", meta: "cache hit" },
    { label: "Tool schemas", state: "cached", meta: "cache hit" },
    { label: "Project rules", state: "write", meta: "cache write" },
    { label: "User request", state: "fresh", meta: "fresh" },
  ],
};

const tokenStates = new Set(["cached", "write", "fresh", "miss"]);

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

function normalizeToken(token) {
  const state = tokenStates.has(token.state) ? token.state : "fresh";

  return {
    label: String(token.label || "Token"),
    state,
    meta: String(token.meta || state),
  };
}

class TokenFlow extends HTMLElement {
  static observedAttributes = ["kicker", "title", "summary"];

  #data = defaultData;

  get data() {
    return this.#data;
  }

  set data(nextData) {
    this.#data = {
      ...defaultData,
      ...nextData,
      tokens: Array.isArray(nextData?.tokens) ? nextData.tokens.map(normalizeToken) : defaultData.tokens,
    };

    this.#render();
  }

  connectedCallback() {
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

    const model = this.#data;
    const kicker = this.getAttribute("kicker") || model.kicker;
    const title = this.getAttribute("title") || model.title;
    const summary = this.getAttribute("summary") || model.summary;

    this.shadowRoot.querySelector("[data-kicker]").textContent = kicker;
    this.shadowRoot.querySelector("[data-title]").textContent = title;
    this.shadowRoot.querySelector("[data-summary]").textContent = summary;
    this.shadowRoot.querySelector("[data-token-list]").replaceChildren(
      ...model.tokens.map((token, index) => this.#createTokenButton(token, index)),
    );
  }

  #createTokenButton(token, index) {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const meta = document.createElement("em");

    button.className = "token-button";
    button.type = "button";
    button.dataset.state = token.state;
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", `${token.label}: ${token.meta}`);

    label.className = "token-label";
    label.textContent = token.label;

    meta.className = "token-meta";
    meta.textContent = token.meta;

    button.append(label, meta);
    button.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("token-flow-select", {
          bubbles: true,
          composed: true,
          detail: { index, token },
        }),
      );
    });

    return button;
  }
}

if (!window.customElements.get("token-flow")) {
  window.customElements.define("token-flow", TokenFlow);
}
