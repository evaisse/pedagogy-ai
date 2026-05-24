const templateUrl = new URL("./source-list.html", import.meta.url);
const stylesheetUrl = new URL("./source-list.css", import.meta.url);

const defaultData = {
  kicker: "References",
  title: "Source links",
  summary: "Primary references used for this explanation.",
  sources: [],
};

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

function getHostName(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeSource(source) {
  const href = String(source.href || "");

  return {
    href,
    label: String(source.label || href || "Source"),
    description: String(source.description || ""),
    meta: String(source.meta || getHostName(href)),
    target: String(source.target || "_blank"),
  };
}

function readSourcesFromLightDom(element) {
  return Array.from(element.querySelectorAll("a[href]")).map((link) =>
    normalizeSource({
      href: link.href,
      label: link.textContent.trim(),
      description: link.dataset.sourceDescription || link.getAttribute("title") || "",
      meta: link.dataset.sourceMeta || getHostName(link.href),
      target: link.target || "_blank",
    }),
  );
}

class SourceList extends HTMLElement {
  static observedAttributes = ["kicker", "title", "summary"];

  #sources = null;

  get sources() {
    return this.#sources || readSourcesFromLightDom(this);
  }

  set sources(nextSources) {
    this.#sources = Array.isArray(nextSources) ? nextSources.map(normalizeSource) : [];
    this.#render();
  }

  connectedCallback() {
    if (this.#sources === null) {
      this.#sources = readSourcesFromLightDom(this);
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

    const kicker = this.getAttribute("kicker") || defaultData.kicker;
    const title = this.getAttribute("title") || defaultData.title;
    const summary = this.getAttribute("summary") || defaultData.summary;

    this.shadowRoot.querySelector("[data-kicker]").textContent = kicker;
    this.shadowRoot.querySelector("[data-title]").textContent = title;
    this.shadowRoot.querySelector("[data-summary]").textContent = summary;
    this.shadowRoot.querySelector("[data-source-list]").replaceChildren(
      ...this.sources.map((source) => this.#createSourceItem(source)),
    );
  }

  #createSourceItem(source) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const description = document.createElement("p");
    const meta = document.createElement("span");

    item.className = "source-item";

    link.className = "source-link";
    link.href = source.href;
    link.textContent = source.label;
    link.target = source.target;
    link.rel = source.target === "_blank" ? "noreferrer" : "";

    description.className = "source-description";
    description.textContent = source.description;

    meta.className = "source-meta";
    meta.textContent = source.meta;

    item.append(link);

    if (source.description) {
      item.append(description);
    }

    if (source.meta) {
      item.append(meta);
    }

    return item;
  }
}

if (!window.customElements.get("source-list")) {
  window.customElements.define("source-list", SourceList);
}
