const apiSwitcher = document.querySelector("[data-api-switcher]");
const apiButtons = Array.from(document.querySelectorAll("[data-api-option]"));
const apiTitle = document.querySelector("[data-api-title]");
const apiPath = document.querySelector("[data-api-path]");
const requestCode = document.querySelector("[data-request-code]");
const responseCode = document.querySelector("[data-response-code]");
const apiNote = document.querySelector("[data-api-note]");

const stateLab = document.querySelector("[data-state-lab]");
const stateButtons = Array.from(document.querySelectorAll("[data-state-mode]"));
const turnInput = document.querySelector("[data-turn-count]");
const turnOutput = document.querySelector("[data-turn-output]");
const payloadOutput = document.querySelector("[data-payload-output]");
const serverOutput = document.querySelector("[data-server-output]");
const payloadMeter = document.querySelector("[data-payload-meter]");
const serverMeter = document.querySelector("[data-server-meter]");
const stateNote = document.querySelector("[data-state-note]");

const scenarioButtons = Array.from(
  document.querySelectorAll("[data-scenario]"),
);
const recommendationTitle = document.querySelector(
  "[data-recommendation-title]",
);
const recommendationCopy = document.querySelector("[data-recommendation-copy]");
const recommendationGain = document.querySelector("[data-recommendation-gain]");
const recommendationCost = document.querySelector("[data-recommendation-cost]");

const apiExamples = {
  chat: {
    title: "Chat Completions : une conversation en messages.",
    path: "POST /v1/chat/completions",
    request: `const completion = await client.chat.completions.create({
  model: "gpt-5",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" }
  ]
});`,
    response: "const text = completion.choices[0].message.content;",
    note: "Tu reconstruis toi-même le tableau messages à chaque tour. C’est simple, portable et très compatible avec les gateways multi-fournisseurs.",
  },
  responses: {
    title: "Responses : une exécution en items typés.",
    path: "POST /v1/responses",
    request: `const response = await client.responses.create({
  model: "gpt-5",
  instructions: "You are a helpful assistant.",
  input: "Hello!"
});`,
    response: `const text = response.output_text;
const trace = response.output;`,
    note: "Tu peux lire la réponse finale, mais aussi inspecter les items de sortie : messages, raisonnement, appels de fonctions et sorties d’outils.",
  },
};

const stateNotes = {
  chat: "En mode Chat, la charge visible côté client grandit avec la conversation : tu renvoies les messages utiles à chaque tour.",
  responses:
    "En mode Responses, tu peux chaîner ou utiliser une conversation serveur : l’application envoie surtout la nouvelle entrée et une référence d’état.",
};

const recommendations = {
  portable: {
    title: "Chat Completions",
    copy: "Utilise Chat Completions si la priorité est de rester portable entre fournisseurs et de garder le contrôle complet du contexte côté application.",
    gain: "Une forme de requête largement supportée.",
    cost: "La mémoire, la compaction et la boucle d’outils.",
  },
  agent: {
    title: "Responses API",
    copy: "Utilise Responses si le produit ressemble à un agent : outils, étapes observables, état serveur, multimodalité ou modèles de raisonnement.",
    gain: "Des items typés et des primitives agentiques natives.",
    cost: "Une dépendance plus forte aux capacités OpenAI ou à une gateway compatible.",
  },
  compliance: {
    title: "Chat ou Responses stateless",
    copy: "Choisis le contrat qui passe tes exigences de rétention. Avec Responses, vérifie store=false, les conversations et les mécanismes de raisonnement chiffré si disponibles.",
    gain: "Un contrôle explicite sur ce qui est stocké ou renvoyé.",
    cost: "Moins de confort serveur et plus de logique d’état côté application.",
  },
  migration: {
    title: "Responses + Conversations",
    copy: "Pour un Assistant existant, migre les nouveaux flux vers Responses et Conversations, puis backfill les anciens threads si le produit en a besoin.",
    gain: "Le modèle mental cible d’OpenAI pour les agents.",
    cost: "Une migration d’objets : assistants, threads, runs et run steps doivent changer de forme.",
  },
};

let activeStateMode = "chat";

function setApiExample(apiName) {
  const example = apiExamples[apiName] || apiExamples.chat;

  if (apiSwitcher) {
    apiSwitcher.dataset.activeApi = apiName;
  }

  apiTitle.textContent = example.title;
  apiPath.textContent = example.path;
  requestCode.textContent = example.request;
  responseCode.textContent = example.response;
  apiNote.textContent = example.note;

  apiButtons.forEach((button) => {
    const isActive = button.dataset.apiOption === apiName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function formatTokenEstimate(value) {
  if (value < 1000) {
    return String(value);
  }

  return `${(value / 1000).toFixed(1)}k`;
}

function updateStateLab() {
  if (!turnInput) return;

  const turns = Number(turnInput.value);
  const basePrompt = 1400;
  const perTurn = 920;
  const maxPayload = basePrompt + perTurn * 6;
  const chatPayload = basePrompt + perTurn * turns;
  const responsePayload = basePrompt + perTurn;
  const responseServerState = perTurn * Math.max(0, turns - 1);

  const payload = activeStateMode === "chat" ? chatPayload : responsePayload;
  const serverState = activeStateMode === "chat" ? 0 : responseServerState;

  turnOutput.textContent = `${turns} ${turns > 1 ? "tours" : "tour"}`;
  payloadOutput.textContent = formatTokenEstimate(payload);
  serverOutput.textContent =
    serverState === 0 ? "0" : formatTokenEstimate(serverState);
  payloadMeter.style.width = `${Math.min(100, Math.round((payload / maxPayload) * 100))}%`;
  serverMeter.style.width = `${Math.min(100, Math.round((serverState / maxPayload) * 100))}%`;
  stateNote.textContent = stateNotes[activeStateMode];
}

function setStateMode(mode) {
  activeStateMode = mode === "responses" ? "responses" : "chat";

  if (stateLab) {
    stateLab.dataset.stateMode = activeStateMode;
  }

  stateButtons.forEach((button) => {
    const isActive = button.dataset.stateMode === activeStateMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  updateStateLab();
}

function setScenario(scenarioName) {
  const recommendation =
    recommendations[scenarioName] || recommendations.portable;

  recommendationTitle.textContent = recommendation.title;
  recommendationCopy.textContent = recommendation.copy;
  recommendationGain.textContent = recommendation.gain;
  recommendationCost.textContent = recommendation.cost;

  scenarioButtons.forEach((button) => {
    const isActive = button.dataset.scenario === scenarioName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

apiButtons.forEach((button) => {
  button.addEventListener("click", () =>
    setApiExample(button.dataset.apiOption),
  );
});

stateButtons.forEach((button) => {
  button.addEventListener("click", () =>
    setStateMode(button.dataset.stateMode),
  );
});

if (turnInput) {
  turnInput.addEventListener("input", updateStateLab);
}

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => setScenario(button.dataset.scenario));
});

setApiExample("chat");
setStateMode("chat");
setScenario("portable");
