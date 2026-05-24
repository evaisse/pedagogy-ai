const basicCatalogId = "https://a2ui.org/specification/v0_9/basic_catalog.json";
const customCatalogId = "https://pedagogy-ai.local/catalogs/a2ui-demo-web-components-v1";

const supportedComponents = new Set([
  "Button",
  "Card",
  "CheckBox",
  "ChoicePicker",
  "Column",
  "DateTimeInput",
  "Divider",
  "Icon",
  "Image",
  "List",
  "Row",
  "Slider",
  "SourceList",
  "Tabs",
  "Text",
  "TextField",
  "TokenFlow",
]);

const streamSteps = {
  create: {
    title: "Créer la surface",
    copy: "Le client réserve une surface et fixe le catalogue qui servira à valider les composants.",
    code: {
      version: "v0.9",
      createSurface: {
        surfaceId: "demo",
        catalogId: basicCatalogId,
      },
    },
  },
  components: {
    title: "Pousser la structure",
    copy: "L’agent envoie une liste plate de composants. Les relations parent-enfant passent par des IDs.",
    code: {
      version: "v0.9",
      updateComponents: {
        surfaceId: "demo",
        components: [
          { id: "root", component: "Card", child: "content" },
          { id: "content", component: "Column", children: ["title", "cta"] },
          { id: "title", component: "Text", text: "Interface générée", variant: "h2" },
          { id: "cta", component: "Button", text: "Confirmer", variant: "primary" },
        ],
      },
    },
  },
  data: {
    title: "Mettre à jour l’état",
    copy: "Les composants restent stables ; les valeurs changent via un data model adressé par chemins JSON Pointer.",
    code: {
      version: "v0.9",
      updateDataModel: {
        surfaceId: "demo",
        path: "/booking",
        value: {
          date: "2026-05-22",
          guests: 2,
          status: "ready",
        },
      },
    },
  },
  action: {
    title: "Retour utilisateur",
    copy: "Une interaction déclenche un événement vers l’agent. Les saisies locales peuvent être envoyées avec le contexte.",
    code: {
      action: {
        name: "confirm_booking",
        surfaceId: "demo",
        sourceComponentId: "cta",
        timestamp: "2026-05-21T12:00:00.000Z",
        context: {
          guests: 2,
          status: "ready",
        },
      },
    },
  },
};

const samples = {
  flight: {
    prompt: "Crée une carte de statut de vol Paris → Tokyo avec horaire, porte, état et un bouton d’action.",
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "demo",
          catalogId: basicCatalogId,
          theme: { primaryColor: "#0B7F68", agentDisplayName: "Travel Agent" },
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "demo",
          value: {
            flight: {
              code: "AF 274",
              route: "Paris CDG → Tokyo HND",
              date: "Ven. 22 mai",
              departure: "23:20",
              gate: "M42",
              status: "Embarquement à l’heure",
            },
          },
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "demo",
          components: [
            { id: "root", component: "Card", child: "flight-layout" },
            {
              id: "flight-layout",
              component: "Column",
              children: ["caption", "route", "date-row", "divider", "status-row", "action-row"],
            },
            { id: "caption", component: "Text", text: { path: "/flight/code" }, variant: "caption" },
            { id: "route", component: "Text", text: { path: "/flight/route" }, variant: "h1" },
            { id: "date-row", component: "Row", children: ["date", "departure", "gate"], justify: "spaceBetween" },
            { id: "date", component: "Text", text: { path: "/flight/date" }, variant: "h3" },
            {
              id: "departure",
              component: "Text",
              text: { call: "formatString", args: { value: "Départ ${/flight/departure}" } },
              variant: "body",
            },
            {
              id: "gate",
              component: "Text",
              text: { call: "formatString", args: { value: "Porte ${/flight/gate}" } },
              variant: "body",
            },
            { id: "divider", component: "Divider", axis: "horizontal" },
            { id: "status-row", component: "Row", children: ["status-icon", "status"], align: "center" },
            { id: "status-icon", component: "Icon", name: "send" },
            { id: "status", component: "Text", text: { path: "/flight/status" }, variant: "h2" },
            { id: "action-row", component: "Row", children: ["notify", "details"], justify: "end" },
            {
              id: "notify",
              component: "Button",
              text: "Recevoir une alerte",
              variant: "primary",
              action: { event: { name: "subscribe_flight", context: { code: { path: "/flight/code" } } } },
            },
            {
              id: "details",
              component: "Button",
              text: "Voir détails",
              variant: "borderless",
              action: { event: { name: "open_flight_details" } },
            },
          ],
        },
      },
    ],
  },
  form: {
    prompt: "Crée un formulaire d’inscription à un atelier avec nom, email, niveau, budget et validation.",
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "demo",
          catalogId: basicCatalogId,
          theme: { primaryColor: "#2F65C8", agentDisplayName: "Workshop Agent" },
          sendDataModel: true,
        },
      },
      {
        version: "v0.9",
        updateDataModel: {
          surfaceId: "demo",
          value: {
            form: {
              name: "",
              email: "",
              level: ["intermediate"],
              budget: 450,
              remote: true,
            },
          },
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "demo",
          components: [
            { id: "root", component: "Card", child: "form-layout" },
            {
              id: "form-layout",
              component: "Column",
              children: ["title", "intro", "name", "email", "level", "budget", "remote", "submit"],
            },
            { id: "title", component: "Text", text: "Inscription atelier A2UI", variant: "h1" },
            {
              id: "intro",
              component: "Text",
              text: "Les champs modifient le data model local. Le bouton enverrait ensuite ce contexte à l’agent.",
              variant: "body",
            },
            { id: "name", component: "TextField", label: "Nom", value: { path: "/form/name" } },
            { id: "email", component: "TextField", label: "Email", value: { path: "/form/email" } },
            {
              id: "level",
              component: "ChoicePicker",
              label: "Niveau",
              selections: { path: "/form/level" },
              maxAllowedSelections: 1,
              options: [
                { label: "Débutant", value: "beginner" },
                { label: "Intermédiaire", value: "intermediate" },
                { label: "Avancé", value: "advanced" },
              ],
            },
            {
              id: "budget",
              component: "Slider",
              label: "Budget",
              value: { path: "/form/budget" },
              minValue: 100,
              maxValue: 1200,
            },
            { id: "remote", component: "CheckBox", label: "Participation à distance", value: { path: "/form/remote" } },
            {
              id: "submit",
              component: "Button",
              text: "Envoyer",
              variant: "primary",
              action: { event: { name: "submit_workshop_form", context: { form: { path: "/form" } } } },
            },
          ],
        },
      },
    ],
  },
  dashboard: {
    prompt: "Crée un mini dashboard financier avec trois métriques, une tendance et une action.",
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "demo",
          catalogId: basicCatalogId,
          theme: { primaryColor: "#9A6514", agentDisplayName: "Finance Agent" },
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "demo",
          components: [
            { id: "root", component: "Column", children: ["header", "metric-row", "trend-card", "rebalance"] },
            { id: "header", component: "Text", text: "Synthèse portefeuille", variant: "h1" },
            { id: "metric-row", component: "Row", children: ["aum", "return", "risk"], justify: "spaceBetween" },
            { id: "aum", component: "Card", child: "aum-text" },
            { id: "aum-text", component: "Text", text: "Encours\n1,24 M€", variant: "h2" },
            { id: "return", component: "Card", child: "return-text" },
            { id: "return-text", component: "Text", text: "Performance\n+8,6 %", variant: "h2" },
            { id: "risk", component: "Card", child: "risk-text" },
            { id: "risk-text", component: "Text", text: "Risque\nModéré", variant: "h2" },
            { id: "trend-card", component: "Card", child: "trend-layout" },
            { id: "trend-layout", component: "Row", children: ["trend-icon", "trend-copy"], align: "center" },
            { id: "trend-icon", component: "Icon", name: "trending_up" },
            {
              id: "trend-copy",
              component: "Text",
              text: "La poche obligations stabilise le portefeuille pendant que les actions US tirent la performance.",
            },
            {
              id: "rebalance",
              component: "Button",
              text: "Préparer un arbitrage",
              variant: "primary",
              action: { event: { name: "prepare_rebalance" } },
            },
          ],
        },
      },
    ],
  },
  tokenFlow: {
    prompt: "Affiche un composant TokenFlow qui explique un tour d’agent avec cache de préfixe, outils et requête fraîche.",
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "demo",
          catalogId: customCatalogId,
          theme: { primaryColor: "#0B7F68", agentDisplayName: "Pedagogy Agent" },
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "demo",
          components: [
            { id: "root", component: "Card", child: "layout" },
            { id: "layout", component: "Column", children: ["title", "flow", "note"] },
            { id: "title", component: "Text", text: "Custom component via catalogue A2UI", variant: "h2" },
            {
              id: "flow",
              component: "TokenFlow",
              kicker: "Tour agent",
              title: "Préfixe stable, suffixe frais",
              summary: "Le renderer local mappe TokenFlow vers le Web Component existant du dépôt.",
              tokens: [
                { label: "Instructions", state: "cached", meta: "cache hit" },
                { label: "Outils", state: "cached", meta: "cache hit" },
                { label: "Contexte repo", state: "write", meta: "cache write" },
                { label: "Demande", state: "fresh", meta: "fresh" },
              ],
            },
            {
              id: "note",
              component: "Text",
              text: "Le modèle ne reçoit pas le droit d’exécuter ce composant ; il choisit seulement un type autorisé et ses données.",
            },
          ],
        },
      },
    ],
  },
  sources: {
    prompt: "Affiche une bibliographie compacte sur A2UI avec les sources officielles et la galerie composer.",
    messages: [
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "demo",
          catalogId: customCatalogId,
          theme: { primaryColor: "#2F65C8", agentDisplayName: "Research Agent" },
        },
      },
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "demo",
          components: [
            {
              id: "root",
              component: "SourceList",
              kicker: "Sources",
              title: "Références A2UI",
              summary: "Un composant du dépôt rendu depuis une description A2UI.",
              sources: [
                {
                  href: "https://a2ui.org/",
                  label: "A2UI",
                  description: "Accueil, versions et principes du protocole.",
                  meta: "a2ui.org",
                },
                {
                  href: "https://github.com/google/A2UI",
                  label: "google/A2UI",
                  description: "Dépôt officiel, README, renderers et spécification.",
                  meta: "GitHub",
                },
                {
                  href: "https://a2ui-composer.ag-ui.com/gallery",
                  label: "A2UI Composer Gallery",
                  description: "Exemples publics de widgets et surfaces A2UI.",
                  meta: "AG-UI",
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

const runtime = {
  activeSurfaceId: "demo",
  surfaces: new Map(),
};

const refs = {
  copyJson: document.querySelector("[data-copy-json]"),
  clearEvents: document.querySelector("[data-clear-events]"),
  demoPrompt: document.querySelector("#demo-prompt"),
  demoStatus: document.querySelector("[data-demo-status]"),
  endpointSettings: document.querySelector("#endpoint-settings"),
  eventLog: document.querySelector("[data-event-log]"),
  jsonOutput: document.querySelector("[data-json-output]"),
  progressFill: document.querySelector("[data-progress-fill]"),
  renderSample: document.querySelector("[data-render-sample]"),
  sendPrompt: document.querySelector("[data-send-prompt]"),
  surface: document.querySelector("[data-a2ui-surface]"),
  surfaceBadge: document.querySelector("[data-surface-badge]"),
};

let activeSampleName = "flight";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function setStatus(message, tone = "") {
  refs.demoStatus.textContent = message;
  refs.demoStatus.dataset.tone = tone;
}

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable <= 0 ? 0 : window.scrollY / scrollable;
  refs.progressFill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
}

function setupSectionObserver() {
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const sections = Array.from(document.querySelectorAll("[data-section]"));

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      const sectionId = visibleEntry.target.id;
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${sectionId}`;
        link.classList.toggle("is-active", isActive);
      });
    },
    { rootMargin: "-25% 0px -55% 0px", threshold: [0.12, 0.28, 0.46] },
  );

  sections.forEach((section) => observer.observe(section));
}

function setStreamStep(name) {
  const step = streamSteps[name] || streamSteps.create;

  document.querySelector("[data-stream-title]").textContent = step.title;
  document.querySelector("[data-stream-copy]").textContent = step.copy;
  document.querySelector("[data-stream-code]").textContent = formatJson(step.code);
  document.querySelector("[data-stream-stage]").dataset.streamStage = name;

  document.querySelectorAll("[data-stream-step]").forEach((button) => {
    const isActive = button.dataset.streamStep === name;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const order = ["create", "components", "data", "action"];
  const activeIndex = order.indexOf(name);
  document.querySelectorAll(".stage-chip").forEach((chip, index) => {
    chip.classList.toggle("is-active", index === activeIndex);
  });
}

function getPointerSegments(path) {
  return String(path || "")
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function readPointer(dataModel, path, scope = null) {
  if (!path) return undefined;

  if (!String(path).startsWith("/") && scope?.value && typeof scope.value === "object") {
    return getPointerSegments(`/${path}`).reduce((value, segment) => value?.[segment], scope.value);
  }

  const absolutePath = String(path).startsWith("/") ? path : `${scope?.path || ""}/${path}`;
  if (absolutePath === "/" || absolutePath === "") return dataModel;

  return getPointerSegments(absolutePath).reduce((value, segment) => value?.[segment], dataModel);
}

function writePointer(dataModel, path, nextValue, scope = null) {
  const absolutePath = String(path).startsWith("/") ? path : `${scope?.path || ""}/${path}`;
  const segments = getPointerSegments(absolutePath);

  if (segments.length === 0) {
    return nextValue;
  }

  let cursor = dataModel;
  segments.slice(0, -1).forEach((segment, index) => {
    const nextSegment = segments[index + 1];
    if (cursor[segment] === undefined || cursor[segment] === null) {
      cursor[segment] = Number.isInteger(Number(nextSegment)) ? [] : {};
    }
    cursor = cursor[segment];
  });

  cursor[segments.at(-1)] = nextValue;
  return dataModel;
}

function deletePointer(dataModel, path, scope = null) {
  const absolutePath = String(path).startsWith("/") ? path : `${scope?.path || ""}/${path}`;
  const segments = getPointerSegments(absolutePath);

  if (segments.length === 0) {
    return {};
  }

  const parent = segments.slice(0, -1).reduce((value, segment) => value?.[segment], dataModel);

  if (parent && typeof parent === "object") {
    delete parent[segments.at(-1)];
  }

  return dataModel;
}

function resolveDynamicValue(value, surface, scope = null) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if ("path" in value) {
      return readPointer(surface.dataModel, value.path, scope);
    }

    if (value.call === "formatString") {
      return formatStringValue(value.args?.value || "", surface, scope);
    }
  }

  return value;
}

function formatStringValue(template, surface, scope = null) {
  return String(template).replace(/\$\{([^}]+)\}/g, (_, expression) => {
    const trimmedExpression = expression.trim();
    const value = readPointer(surface.dataModel, trimmedExpression, scope);

    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

function ensureSurface(surfaceId, catalogId = basicCatalogId) {
  if (!runtime.surfaces.has(surfaceId)) {
    runtime.surfaces.set(surfaceId, {
      catalogId,
      components: new Map(),
      dataModel: {},
      id: surfaceId,
      theme: {},
    });
  }

  return runtime.surfaces.get(surfaceId);
}

function validateMessages(messages) {
  const errors = [];
  const messageTypes = ["createSurface", "updateComponents", "updateDataModel", "deleteSurface"];
  let hasRoot = false;
  let componentCount = 0;

  if (!Array.isArray(messages) || messages.length === 0) {
    return ["La réponse doit contenir un tableau messages non vide."];
  }

  messages.forEach((message, messageIndex) => {
    const keys = messageTypes.filter((key) => key in message);

    if (keys.length !== 1) {
      errors.push(`Message ${messageIndex + 1}: un seul type A2UI est attendu.`);
      return;
    }

    if (message.version && message.version !== "v0.9") {
      errors.push(`Message ${messageIndex + 1}: la démo attend version "v0.9".`);
    }

    if (message.updateComponents) {
      const components = message.updateComponents.components;

      if (!Array.isArray(components)) {
        errors.push(`Message ${messageIndex + 1}: updateComponents.components doit être un tableau.`);
        return;
      }

      componentCount += components.length;
      components.forEach((component, componentIndex) => {
        if (!component.id || typeof component.id !== "string") {
          errors.push(`Composant ${componentIndex + 1}: id manquant.`);
        }

        if (component.id === "root") {
          hasRoot = true;
        }

        if (!supportedComponents.has(component.component)) {
          errors.push(`Composant "${component.id || componentIndex + 1}": "${component.component}" est hors catalogue.`);
        }
      });
    }
  });

  if (!hasRoot) {
    errors.push('La surface doit définir un composant avec id "root".');
  }

  if (componentCount > 48) {
    errors.push("La démo limite une surface à 48 composants.");
  }

  return errors;
}

function applyMessages(messages) {
  const validationErrors = validateMessages(messages);

  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join("\n"));
  }

  runtime.surfaces.clear();
  runtime.activeSurfaceId = "demo";

  messages.forEach((message) => {
    if (message.createSurface) {
      const surfaceId = message.createSurface.surfaceId || "demo";
      runtime.activeSurfaceId = surfaceId;
      runtime.surfaces.set(surfaceId, {
        catalogId: message.createSurface.catalogId || basicCatalogId,
        components: new Map(),
        dataModel: {},
        id: surfaceId,
        theme: message.createSurface.theme || {},
      });
    }

    if (message.updateDataModel) {
      const surface = ensureSurface(message.updateDataModel.surfaceId || runtime.activeSurfaceId);
      const path = message.updateDataModel.path || "/";
      const hasValue = Object.prototype.hasOwnProperty.call(message.updateDataModel, "value");
      const value = hasValue ? clone(message.updateDataModel.value) : undefined;

      if (path === "/") {
        surface.dataModel = hasValue ? value : {};
      } else {
        surface.dataModel = hasValue
          ? writePointer(surface.dataModel, path, value)
          : deletePointer(surface.dataModel, path);
      }
    }

    if (message.updateComponents) {
      const surface = ensureSurface(message.updateComponents.surfaceId || runtime.activeSurfaceId);

      message.updateComponents.components.forEach((component) => {
        surface.components.set(component.id, component);
      });
    }

    if (message.deleteSurface) {
      runtime.surfaces.delete(message.deleteSurface.surfaceId);
    }
  });

  renderActiveSurface();
  refs.jsonOutput.textContent = formatJson({ messages });
}

function renderActiveSurface() {
  const surface = runtime.surfaces.get(runtime.activeSurfaceId) || Array.from(runtime.surfaces.values())[0];

  refs.surface.replaceChildren();

  if (!surface) {
    refs.surface.append(createEmptySurface("Aucune surface A2UI à afficher."));
    return;
  }

  refs.surfaceBadge.textContent = surface.id;

  if (!surface.components.has("root")) {
    refs.surface.append(createEmptySurface('La surface existe, mais le composant "root" manque.'));
    return;
  }

  refs.surface.append(renderComponent("root", surface));
}

function createEmptySurface(text) {
  const element = document.createElement("div");
  element.className = "empty-surface";
  element.textContent = text;
  return element;
}

function renderComponent(componentId, surface, scope = null) {
  const component = surface.components.get(componentId);

  if (!component) {
    return createErrorWidget(`Composant introuvable: ${componentId}`);
  }

  switch (component.component) {
    case "Text":
      return renderText(component, surface, scope);
    case "Column":
      return renderContainer(component, surface, scope, "a2ui-column");
    case "Row":
      return renderContainer(component, surface, scope, "a2ui-row");
    case "List":
      return renderList(component, surface, scope);
    case "Card":
      return renderCard(component, surface, scope);
    case "Divider":
      return renderDivider(component);
    case "Button":
      return renderButton(component, surface, scope);
    case "TextField":
      return renderTextField(component, surface, scope);
    case "CheckBox":
      return renderCheckBox(component, surface, scope);
    case "Slider":
      return renderSlider(component, surface, scope);
    case "ChoicePicker":
      return renderChoicePicker(component, surface, scope);
    case "DateTimeInput":
      return renderDateTimeInput(component, surface, scope);
    case "Tabs":
      return renderTabs(component, surface, scope);
    case "Image":
      return renderImage(component, surface, scope);
    case "Icon":
      return renderIcon(component, surface, scope);
    case "TokenFlow":
      return renderTokenFlow(component);
    case "SourceList":
      return renderSourceList(component);
    default:
      return createErrorWidget(`Composant hors catalogue: ${component.component}`);
  }
}

function createWidget(className, tagName = "div") {
  const element = document.createElement(tagName);
  element.className = `a2ui-widget ${className}`;
  return element;
}

function getChildren(component) {
  return Array.isArray(component.children) ? component.children : [];
}

function renderText(component, surface, scope) {
  const variant = component.variant || "body";
  const tagName = variant === "h1" ? "h2" : variant === "h2" ? "h3" : variant === "h3" ? "h4" : "p";
  const element = createWidget("a2ui-text", tagName);
  const text = resolveDynamicValue(component.text, surface, scope);

  element.dataset.variant = variant;
  element.textContent = text === undefined || text === null ? "" : String(text);
  return element;
}

function renderContainer(component, surface, scope, className) {
  const element = createWidget(className);
  const children = getChildren(component);

  if (component.justify) {
    element.style.justifyContent = getCssAlignment(component.justify);
  }

  if (component.align) {
    element.style.alignItems = getCssAlignment(component.align);
  }

  element.append(...children.map((childId) => renderComponent(childId, surface, scope)));
  return element;
}

function getCssAlignment(value) {
  const map = {
    center: "center",
    end: "flex-end",
    spaceAround: "space-around",
    spaceBetween: "space-between",
    start: "flex-start",
    stretch: "stretch",
  };

  return map[value] || value;
}

function renderList(component, surface, scope) {
  const element = createWidget("a2ui-list");

  if (Array.isArray(component.children)) {
    element.append(...component.children.map((childId) => renderComponent(childId, surface, scope)));
    return element;
  }

  const path = component.children?.path;
  const templateId = component.children?.componentId;
  const items = resolveDynamicValue({ path }, surface, scope);

  if (!Array.isArray(items) || !templateId) {
    element.append(createEmptySurface("Liste vide."));
    return element;
  }

  element.append(
    ...items.map((item, index) =>
      renderComponent(templateId, surface, {
        path: `${path}/${index}`,
        value: item,
      }),
    ),
  );

  return element;
}

function renderCard(component, surface, scope) {
  const element = createWidget("a2ui-card", "article");
  const childId = component.child || component.children?.[0];

  if (childId) {
    element.append(renderComponent(childId, surface, scope));
  }

  return element;
}

function renderDivider(component) {
  const element = createWidget("a2ui-divider", "hr");
  element.dataset.axis = component.axis || "horizontal";
  return element;
}

function getButtonText(component, surface, scope) {
  if (component.text) {
    return resolveDynamicValue(component.text, surface, scope);
  }

  const child = surface.components.get(component.child);
  if (child?.component === "Text") {
    return resolveDynamicValue(child.text, surface, scope);
  }

  return "Action";
}

function renderButton(component, surface, scope) {
  const button = createWidget("a2ui-button", "button");
  button.type = "button";
  button.dataset.variant = component.variant || (component.primary ? "primary" : "default");
  button.textContent = getButtonText(component, surface, scope);

  button.addEventListener("click", () => {
    const eventAction = component.action?.event || { name: component.action?.name || "client_action" };
    const context = resolveActionContext(eventAction.context || {}, surface, scope);

    appendEventLog({
      name: eventAction.name || "client_action",
      componentId: component.id,
      context,
    });
  });

  return button;
}

function resolveActionContext(context, surface, scope) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, resolveDynamicValue(value, surface, scope)]),
  );
}

function renderTextField(component, surface, scope) {
  const wrapper = createWidget("a2ui-form-field", "label");
  const label = document.createElement("span");
  const input = document.createElement(component.textFieldType === "longText" ? "textarea" : "input");
  const binding = component.value || component.text;
  const value = resolveDynamicValue(binding, surface, scope);

  label.textContent = component.label || "Texte";
  input.value = value === undefined || value === null ? "" : String(value);
  input.type = component.textFieldType === "number" ? "number" : component.textFieldType === "obscured" ? "password" : "text";

  input.addEventListener("input", () => {
    if (binding?.path) {
      surface.dataModel = writePointer(surface.dataModel, binding.path, input.value, scope);
    }
  });

  wrapper.append(label, input);
  return wrapper;
}

function renderCheckBox(component, surface, scope) {
  const wrapper = createWidget("a2ui-checkbox", "label");
  const input = document.createElement("input");
  const label = document.createElement("span");
  const binding = component.value;

  input.type = "checkbox";
  input.checked = Boolean(resolveDynamicValue(binding, surface, scope));
  label.textContent = component.label || "Option";

  input.addEventListener("change", () => {
    if (binding?.path) {
      surface.dataModel = writePointer(surface.dataModel, binding.path, input.checked, scope);
    }
  });

  wrapper.append(input, label);
  return wrapper;
}

function renderSlider(component, surface, scope) {
  const wrapper = createWidget("a2ui-form-field");
  const label = document.createElement("label");
  const input = document.createElement("input");
  const output = document.createElement("output");
  const binding = component.value;
  const currentValue = resolveDynamicValue(binding, surface, scope) ?? component.minValue ?? 0;

  label.textContent = component.label || "Valeur";
  input.type = "range";
  input.min = component.minValue ?? 0;
  input.max = component.maxValue ?? 100;
  input.value = currentValue;
  output.textContent = currentValue;

  input.addEventListener("input", () => {
    output.textContent = input.value;
    if (binding?.path) {
      surface.dataModel = writePointer(surface.dataModel, binding.path, Number(input.value), scope);
    }
  });

  wrapper.append(label, input, output);
  return wrapper;
}

function renderChoicePicker(component, surface, scope) {
  const fieldset = createWidget("a2ui-choice-group", "fieldset");
  const legend = document.createElement("legend");
  const selections = resolveDynamicValue(component.selections, surface, scope);
  const selectedValues = new Set(Array.isArray(selections) ? selections : [selections].filter(Boolean));
  const allowsMultiple = Number(component.maxAllowedSelections || 1) > 1;
  const groupName = `choice-${component.id}`;

  legend.className = "a2ui-choice-label";
  legend.textContent = component.label || "Choix";
  fieldset.append(legend);

  (component.options || []).forEach((option) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");

    label.className = "a2ui-choice-option";
    input.type = allowsMultiple ? "checkbox" : "radio";
    input.name = groupName;
    input.value = option.value;
    input.checked = selectedValues.has(option.value);
    text.textContent = option.label || option.value;

    input.addEventListener("change", () => {
      if (!component.selections?.path) return;

      const checkedInputs = Array.from(fieldset.querySelectorAll("input:checked")).map((item) => item.value);
      surface.dataModel = writePointer(
        surface.dataModel,
        component.selections.path,
        allowsMultiple ? checkedInputs : checkedInputs[0],
        scope,
      );
    });

    label.append(input, text);
    fieldset.append(label);
  });

  return fieldset;
}

function renderDateTimeInput(component, surface, scope) {
  const wrapper = createWidget("a2ui-form-field", "label");
  const label = document.createElement("span");
  const input = document.createElement("input");
  const binding = component.value;
  const value = resolveDynamicValue(binding, surface, scope);

  label.textContent = component.label || "Date";
  input.type = component.enableDate && component.enableTime ? "datetime-local" : component.enableTime ? "time" : "date";
  input.value = typeof value === "string" ? value.slice(0, input.type === "date" ? 10 : 16) : "";

  input.addEventListener("change", () => {
    if (binding?.path) {
      surface.dataModel = writePointer(surface.dataModel, binding.path, input.value, scope);
    }
  });

  wrapper.append(label, input);
  return wrapper;
}

function renderTabs(component, surface, scope) {
  const wrapper = createWidget("a2ui-tabs");
  const tabList = document.createElement("div");
  const panel = document.createElement("div");
  const items = component.tabItems || [];

  tabList.className = "a2ui-tab-list";
  tabList.setAttribute("role", "tablist");

  function selectTab(index) {
    const item = items[index];
    tabList.querySelectorAll("button").forEach((button, buttonIndex) => {
      button.setAttribute("aria-selected", String(buttonIndex === index));
    });
    panel.replaceChildren(item ? renderComponent(item.child, surface, scope) : createEmptySurface("Onglet vide."));
  }

  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "tab");
    button.textContent = item.title || `Onglet ${index + 1}`;
    button.addEventListener("click", () => selectTab(index));
    tabList.append(button);
  });

  wrapper.append(tabList, panel);
  selectTab(0);
  return wrapper;
}

function renderImage(component, surface, scope) {
  const image = createWidget("a2ui-image", "img");
  const url = resolveDynamicValue(component.url, surface, scope);

  image.alt = component.alt || "";
  image.loading = "lazy";
  image.src = String(url || "");
  image.style.objectFit = component.fit || "cover";
  return image;
}

function renderIcon(component, surface, scope) {
  const element = createWidget("a2ui-icon", "span");
  const name = String(resolveDynamicValue(component.name, surface, scope) || "info");
  const icons = {
    arrow_upward: "↑",
    calendar_today: "□",
    check: "✓",
    directions_run: "↗",
    favorite: "♥",
    info: "i",
    location_on: "⌖",
    mail: "@",
    payment: "¤",
    person: "●",
    play_arrow: "▶",
    send: "➤",
    star: "★",
    trending_up: "↗",
    warning: "!",
  };

  element.textContent = icons[name] || name.slice(0, 2).toUpperCase();
  element.setAttribute("aria-label", name);
  return element;
}

function renderTokenFlow(component) {
  const element = document.createElement("token-flow");
  element.className = "a2ui-token-flow";
  element.setAttribute("kicker", component.kicker || "A2UI");
  element.setAttribute("title", component.title || "Token flow");
  element.setAttribute("summary", component.summary || "");

  window.customElements.whenDefined("token-flow").then(() => {
    element.data = {
      tokens: Array.isArray(component.tokens) ? component.tokens : [],
    };
  });

  return element;
}

function renderSourceList(component) {
  const element = document.createElement("source-list");
  element.className = "a2ui-source-list";
  element.setAttribute("kicker", component.kicker || "Sources");
  element.setAttribute("title", component.title || "Source list");
  element.setAttribute("summary", component.summary || "");

  (component.sources || []).forEach((source) => {
    const link = document.createElement("a");
    link.href = source.href || "#";
    link.textContent = source.label || source.href || "Source";
    link.dataset.sourceDescription = source.description || "";
    link.dataset.sourceMeta = source.meta || "";
    element.append(link);
  });

  window.customElements.whenDefined("source-list").then(() => {
    element.sources = Array.isArray(component.sources) ? component.sources : [];
  });

  return element;
}

function createErrorWidget(message) {
  const element = createWidget("a2ui-error");
  element.textContent = message;
  return element;
}

function appendEventLog(event) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const details = document.createElement("span");

  title.textContent = event.name;
  details.textContent = `${event.componentId} · ${formatJson(event.context)}`;
  item.append(title, details);
  refs.eventLog.prepend(item);
}

function setActiveSample(name) {
  activeSampleName = samples[name] ? name : "flight";
  refs.demoPrompt.value = samples[activeSampleName].prompt;

  document.querySelectorAll("[data-sample]").forEach((button) => {
    const isActive = button.dataset.sample === activeSampleName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderSample(name = activeSampleName) {
  const sample = samples[name] || samples.flight;
  applyMessages(clone(sample.messages));
  setStatus("Exemple local rendu sans appel réseau.", "success");
}

function normalizePayload(parsedPayload) {
  if (Array.isArray(parsedPayload)) {
    return parsedPayload;
  }

  if (Array.isArray(parsedPayload?.messages)) {
    return parsedPayload.messages;
  }

  if (Array.isArray(parsedPayload?.a2ui?.messages)) {
    return parsedPayload.a2ui.messages;
  }

  const messageTypes = ["createSurface", "updateComponents", "updateDataModel", "deleteSurface"];
  if (parsedPayload && messageTypes.some((key) => key in parsedPayload)) {
    return [parsedPayload];
  }

  throw new Error('La réponse JSON doit contenir une propriété "messages".');
}

function parseJsonCandidate(candidate) {
  try {
    return normalizePayload(JSON.parse(candidate));
  } catch {
    const lines = candidate
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      throw new Error("JSON invalide.");
    }

    return normalizePayload(lines.map((line) => JSON.parse(line)));
  }
}

function extractMessagesFromText(text) {
  const trimmedText = String(text || "").trim();
  const candidates = [];
  const fencedBlocks = Array.from(trimmedText.matchAll(/```(?:json|jsonl)?\s*([\s\S]*?)```/gi));

  fencedBlocks.forEach((match) => candidates.push(match[1].trim()));
  candidates.push(trimmedText);

  const firstObject = trimmedText.indexOf("{");
  const lastObject = trimmedText.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) {
    candidates.push(trimmedText.slice(firstObject, lastObject + 1));
  }

  const firstArray = trimmedText.indexOf("[");
  const lastArray = trimmedText.lastIndexOf("]");
  if (firstArray >= 0 && lastArray > firstArray) {
    candidates.push(trimmedText.slice(firstArray, lastArray + 1));
  }

  for (const candidate of candidates) {
    try {
      return parseJsonCandidate(candidate);
    } catch {
      continue;
    }
  }

  throw new Error("Impossible d’extraire un JSON A2UI valide de la réponse du modèle.");
}

function getAssistantContent(responseJson) {
  const chatContent = responseJson?.choices?.[0]?.message?.content;

  if (Array.isArray(chatContent)) {
    return chatContent.map((part) => part.text || part.content || "").join("");
  }

  if (typeof chatContent === "string") {
    return chatContent;
  }

  if (typeof responseJson?.choices?.[0]?.text === "string") {
    return responseJson.choices[0].text;
  }

  if (typeof responseJson?.output_text === "string") {
    return responseJson.output_text;
  }

  if (Array.isArray(responseJson?.output)) {
    return responseJson.output
      .flatMap((item) => item.content || [])
      .map((part) => part.text || "")
      .join("");
  }

  return "";
}

function buildGenerationPrompt(userPrompt) {
  return [
    "Tu génères une interface A2UI v0.9 pour une démo pédagogique en français.",
    "Retourne uniquement un objet JSON valide de forme {\"messages\":[...]} sans Markdown, sans HTML, sans CSS et sans commentaire.",
    "Règles obligatoires :",
    "- Le premier message crée surfaceId \"demo\" avec createSurface.",
    "- updateComponents doit contenir un composant {\"id\":\"root\", ...}.",
    "- Utilise seulement ces composants : Text, Icon, Image, Divider, Row, Column, List, Card, Tabs, Button, TextField, CheckBox, Slider, ChoicePicker, DateTimeInput, TokenFlow, SourceList.",
    "- Utilise le format v0.9 : {\"id\":\"title\",\"component\":\"Text\",\"text\":\"...\",\"variant\":\"h2\"}.",
    "- Les containers référencent leurs enfants par IDs : children, child ou tabItems.",
    "- Les actions de boutons doivent être {\"event\":{\"name\":\"nom_action\",\"context\":{...}}}.",
    "- Ne dépasse pas 24 composants.",
    "- Si tu utilises TokenFlow, fournis kicker, title, summary et tokens avec label, state cached/write/fresh/miss, meta.",
    "- Si tu utilises SourceList, fournis kicker, title, summary et sources avec href, label, description, meta.",
    "",
    `Demande utilisateur : ${userPrompt}`,
  ].join("\n");
}

async function requestGeneratedA2UI() {
  const settings = refs.endpointSettings.getSettings();

  if (!settings) {
    refs.endpointSettings.open();
    throw new Error("Configure d’abord le proxy OpenAI local.");
  }

  const response = await fetch(refs.endpointSettings.getChatCompletionsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        {
          role: "system",
          content:
            "You generate compact A2UI v0.9 JSON for a browser demo. Return valid JSON only and never return executable code.",
        },
        {
          role: "user",
          content: buildGenerationPrompt(refs.demoPrompt.value),
        },
      ],
      max_tokens: 1800,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${responseText.slice(0, 220)}`);
  }

  const responseJson = await response.json();
  const assistantContent = getAssistantContent(responseJson);

  if (!assistantContent.trim()) {
    throw new Error("Le modèle n’a pas renvoyé de contenu exploitable.");
  }

  return extractMessagesFromText(assistantContent);
}

function bindDemoEvents() {
  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => setActiveSample(button.dataset.sample));
  });

  refs.renderSample.addEventListener("click", () => renderSample(activeSampleName));

  refs.sendPrompt.addEventListener("click", async () => {
    refs.sendPrompt.disabled = true;
    setStatus("Appel du modèle en cours…");

    try {
      const messages = await requestGeneratedA2UI();
      applyMessages(messages);
      setStatus("Réponse A2UI validée et rendue.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      refs.sendPrompt.disabled = false;
    }
  });

  refs.copyJson.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(refs.jsonOutput.textContent || "");
    setStatus("JSON copié.", "success");
  });

  refs.clearEvents.addEventListener("click", () => {
    refs.eventLog.replaceChildren();
  });
}

function init() {
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();
  setupSectionObserver();

  document.querySelectorAll("[data-stream-step]").forEach((button) => {
    button.addEventListener("click", () => setStreamStep(button.dataset.streamStep));
  });
  setStreamStep("create");

  bindDemoEvents();
  setActiveSample("flight");
  renderSample("flight");
}

init();
