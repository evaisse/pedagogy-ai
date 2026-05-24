const templateUrl = new URL("./openai-endpoint-settings.html", import.meta.url);
const stylesheetUrl = new URL("./openai-endpoint-settings.css", import.meta.url);

const storageKey = "pedagogyAi.openaiEndpointSettings";
const connectionTimeoutMs = 25000;
const serverSettingsUrl = "/__openai-settings";
const defaultEndpoint = "/api/v1";
const defaultModel = "gpt-5.5";

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
const initialStoredSettings = readStoredSettings();

function readStoredSettings() {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const value = JSON.parse(rawValue);
    return normalizeSettings(value);
  } catch {
    return null;
  }
}

function normalizeSettings(settings) {
  const endpoint = String(settings?.endpoint || defaultEndpoint).trim();
  const model = String(settings?.model || defaultModel).trim();

  if (!endpoint || !model || !isLocalApiEndpoint(endpoint)) {
    return null;
  }

  return { endpoint, model };
}

function writeStoredSettings(settings) {
  window.localStorage.setItem(storageKey, JSON.stringify(settings));
}

function removeStoredSettings() {
  window.localStorage.removeItem(storageKey);
}

function getChatCompletionsUrl(endpoint) {
  const trimmedEndpoint = String(endpoint || "").trim().replace(/\/+$/, "");

  if (!trimmedEndpoint) {
    throw new Error("Missing endpoint URL.");
  }

  if (/\/chat\/completions$/i.test(trimmedEndpoint)) {
    return trimmedEndpoint;
  }

  if (/\/v1$/i.test(trimmedEndpoint)) {
    return `${trimmedEndpoint}/chat/completions`;
  }

  return `${trimmedEndpoint}/v1/chat/completions`;
}

function isLocalApiEndpoint(endpoint) {
  return /^\/api\/v1(?:\/.*)?$/i.test(endpoint);
}

function getReadableError(error) {
  if (error?.name === "AbortError") {
    return "La connexion a expiré.";
  }

  return error?.message || "La connexion a échoué.";
}

class OpenAIEndpointSettings extends HTMLElement {
  #hasStoredSettings = Boolean(initialStoredSettings);
  #settings = initialStoredSettings || normalizeSettings({ endpoint: defaultEndpoint, model: defaultModel });
  #serverSettings = {
    endpoint: defaultEndpoint,
    model: defaultModel,
    baseUrl: "",
    hasApiKey: false,
  };
  #refs = {};

  get settings() {
    return this.getSettings();
  }

  getSettings() {
    return this.#settings ? { ...this.#settings } : null;
  }

  getChatCompletionsUrl() {
    if (!this.#settings) return "";
    return getChatCompletionsUrl(this.#settings.endpoint);
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: "open" });
      shadow.adoptedStyleSheets = [stylesheet];
      shadow.append(template.content.cloneNode(true));
      this.#bindRefs();
      this.#bindEvents();
    }

    this.#renderSummary();
    this.#loadServerSettings();
  }

  open() {
    this.#populateFields();
    this.#setStatus("");

    if (typeof this.#refs.dialog.showModal === "function") {
      this.#refs.dialog.showModal();
      return;
    }

    this.#refs.dialog.setAttribute("open", "");
  }

  #bindRefs() {
    this.#refs = {
      clear: this.shadowRoot.querySelector("[data-clear]"),
      close: this.shadowRoot.querySelector("[data-close]"),
      closeSecondary: this.shadowRoot.querySelector("[data-close-secondary]"),
      dialog: this.shadowRoot.querySelector("[data-dialog]"),
      endpoint: this.shadowRoot.querySelector("[data-endpoint]"),
      form: this.shadowRoot.querySelector("[data-form]"),
      model: this.shadowRoot.querySelector("[data-model]"),
      open: this.shadowRoot.querySelector("[data-open]"),
      status: this.shadowRoot.querySelector("[data-status]"),
      summary: this.shadowRoot.querySelector("[data-summary]"),
      validate: this.shadowRoot.querySelector("[data-validate]"),
    };
  }

  #bindEvents() {
    this.#refs.open.addEventListener("click", () => this.open());
    this.#refs.close.addEventListener("click", () => this.#close());
    this.#refs.closeSecondary.addEventListener("click", () => this.#close());
    this.#refs.clear.addEventListener("click", () => this.#clearSettings());
    this.#refs.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.#validateAndStore();
    });
  }

  #populateFields() {
    const settings = this.#settings || this.#serverSettings;
    this.#refs.endpoint.value = settings.endpoint || defaultEndpoint;
    this.#refs.model.value = settings.model || defaultModel;
  }

  #getFormSettings() {
    const settings = normalizeSettings({
      endpoint: this.#refs.endpoint.value,
      model: this.#refs.model.value,
    });

    if (!settings) {
      throw new Error("Renseigne un endpoint /api/v1 et un modèle.");
    }

    return settings;
  }

  async #validateAndStore() {
    let nextSettings;

    try {
      nextSettings = this.#getFormSettings();
    } catch (error) {
      this.#setStatus(getReadableError(error), "error");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), connectionTimeoutMs);

    this.#refs.validate.disabled = true;
    this.#setStatus("Test de connexion en cours…");

    try {
      const response = await fetch(getChatCompletionsUrl(nextSettings.endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: nextSettings.model,
          messages: [
            { role: "system", content: "Reply with the word ok." },
            { role: "user", content: "connection test" },
          ],
          max_completion_tokens: 4,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${responseText.slice(0, 180)}`);
      }

      await response.json().catch(() => null);
      this.#settings = nextSettings;
      this.#hasStoredSettings = true;
      writeStoredSettings(nextSettings);
      this.#renderSummary();
      this.#emitChange();
      this.#setStatus("Connexion validée avec les identifiants serveur.", "success");
    } catch (error) {
      this.#setStatus(getReadableError(error), "error");
    } finally {
      window.clearTimeout(timeout);
      this.#refs.validate.disabled = false;
    }
  }

  #clearSettings() {
    this.#hasStoredSettings = false;
    this.#settings = normalizeSettings(this.#serverSettings);
    removeStoredSettings();
    this.#populateFields();
    this.#renderSummary();
    this.#emitChange();
    this.#setStatus("Configuration locale effacée. Les valeurs .env sont utilisées.", "success");
  }

  #close() {
    this.#refs.dialog.close();
  }

  #renderSummary() {
    if (!this.#refs.summary) return;

    if (!this.#settings) {
      this.#refs.summary.textContent = "Non configuré";
      return;
    }

    let endpointHost = this.#settings.endpoint;

    try {
      endpointHost = new URL(this.#settings.endpoint).host;
    } catch {
      endpointHost = this.#settings.endpoint === defaultEndpoint ? "proxy local" : this.#settings.endpoint;
    }

    this.#refs.summary.textContent = `${this.#settings.model} · ${endpointHost}`;
  }

  async #loadServerSettings() {
    try {
      const response = await fetch(serverSettingsUrl, { cache: "no-store" });

      if (!response.ok) return;

      const payload = await response.json();
      const nextServerSettings = normalizeSettings({
        endpoint: payload.endpoint || defaultEndpoint,
        model: payload.model || defaultModel,
      });

      if (!nextServerSettings) return;

      this.#serverSettings = {
        ...nextServerSettings,
        baseUrl: String(payload.baseUrl || ""),
        hasApiKey: Boolean(payload.hasApiKey),
      };

      if (!this.#hasStoredSettings) {
        this.#settings = nextServerSettings;
      }

      this.#populateFields();
      this.#renderSummary();
      this.#emitChange();
    } catch {
      // The settings endpoint is only available when served through the Vite dev server.
    }
  }

  #setStatus(message, tone = "") {
    this.#refs.status.textContent = message;
    this.#refs.status.dataset.tone = tone;
  }

  #emitChange() {
    this.dispatchEvent(
      new CustomEvent("openai-endpoint-settings-change", {
        bubbles: true,
        composed: true,
        detail: {
          configured: Boolean(this.#settings),
          endpoint: this.#settings?.endpoint || "",
          model: this.#settings?.model || "",
          baseUrl: this.#serverSettings.baseUrl,
          hasServerApiKey: this.#serverSettings.hasApiKey,
          usesServerCredentials: true,
        },
      }),
    );
  }
}

window.OpenAIEndpointSettings = {
  getChatCompletionsUrl,
  readStoredSettings,
  storageKey,
};

if (!window.customElements.get("openai-endpoint-settings")) {
  window.customElements.define("openai-endpoint-settings", OpenAIEndpointSettings);
}
