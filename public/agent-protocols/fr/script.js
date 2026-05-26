const protocolData = {
  acp: {
    leftLabel: "Client",
    leftTitle: "Éditeur",
    wireLabel: "Agent Client Protocol",
    wireTitle: "JSON-RPC, sessions, prompts, permissions",
    rightLabel: "Backend",
    rightTitle: "Agent de code",
    copy:
      "ACP standardise le fil entre un éditeur ou une UI et un agent de code : initialisation, session, prompt, mises à jour en streaming, outils, fichiers, terminal et permissions.",
    tags: ["1 client", "1 agent", "Conversation point à point"],
  },
  ahp: {
    leftLabel: "Clients",
    leftTitle: "IDE, web, CLI",
    wireLabel: "Agent Host Protocol",
    wireTitle: "Canaux, actions, état partagé, réconciliation",
    rightLabel: "Autorité",
    rightTitle: "Hôte de sessions",
    copy:
      "AHP coordonne plusieurs clients autour de sessions agentiques partagées. Le serveur tient l’état autoritaire et renvoie les actions dans un ordre commun.",
    tags: ["N clients", "1 hôte", "État synchronisé"],
  },
  agent: {
    leftLabel: "Pair",
    leftTitle: "Agent A",
    wireLabel: "Agent Communication Protocol",
    wireTitle: "REST, découverte, messages agent-à-agent",
    rightLabel: "Pair",
    rightTitle: "Agent B",
    copy:
      "L’ACP décrit par IBM est un autre acronyme : Agent Communication Protocol. Il sert à faire collaborer des agents indépendants, pas à brancher un éditeur sur un agent de code.",
    tags: ["Agents pairs", "Interopérabilité", "Attention au nom ACP"],
  },
};

const acpSteps = {
  initialize: {
    title: "initialize",
    arrow: "→",
    copy:
      "Le client appelle initialize pour négocier la version du protocole et les capacités disponibles.",
    code: '{\n  "method": "initialize",\n  "params": { "protocolVersion": 1 }\n}',
  },
  session: {
    title: "session/new ou session/load",
    arrow: "→",
    copy:
      "Le client crée une nouvelle session ou reprend une session existante si l’agent annonce cette capacité.",
    code: '{\n  "method": "session/new",\n  "params": { "cwd": "/project" }\n}',
  },
  prompt: {
    title: "session/prompt",
    arrow: "→",
    copy:
      "Le prompt utilisateur part vers l’agent avec le contexte que le client accepte de fournir.",
    code: '{\n  "method": "session/prompt",\n  "params": { "prompt": "Corrige ce test" }\n}',
  },
  updates: {
    title: "session/update",
    arrow: "←",
    copy:
      "L’agent envoie des notifications de progression : texte, pensée affichable, plan, tool calls, diff ou statut.",
    code: '{\n  "method": "session/update",\n  "params": { "sessionId": "s1", "update": "delta" }\n}',
  },
  permission: {
    title: "outils et permissions",
    arrow: "↔",
    copy:
      "Quand l’agent veut lire, écrire, lancer un terminal ou exécuter un outil sensible, le client peut arbitrer l’autorisation.",
    code: '{\n  "method": "client/requestPermission",\n  "params": { "tool": "writeTextFile" }\n}',
  },
  stop: {
    title: "stop reason",
    arrow: "←",
    copy:
      "Le tour se termine par une réponse à session/prompt avec une raison d’arrêt. Le client sait si l’agent a fini, été annulé ou bloqué.",
    code: '{\n  "result": {\n    "stopReason": "end_turn"\n  }\n}',
  },
};

const channelData = {
  root: {
    title: "Root channel",
    uri: "ahp-root://",
    state: "Agents disponibles, configuration globale, terminaux légers et compteurs.",
    action: "<code>root/agentsChanged</code> ou <code>root/sessionAdded</code>",
  },
  session: {
    title: "Session channel",
    uri: "ahp-session:/<uuid>",
    state: "Résumé, tours, réponse active, demandes d’entrée, usage et état de cycle de vie.",
    action: "<code>session/turnStarted</code>, <code>session/delta</code>, <code>session/toolCallReady</code>",
  },
  terminal: {
    title: "Terminal channel",
    uri: "ahp-terminal:/<uuid>",
    state: "Sortie de terminal, statut d’exécution, exit code et références vers du contenu volumineux.",
    action: "<code>terminal/outputAppended</code> ou <code>terminal/statusChanged</code>",
  },
  changeset: {
    title: "Changeset channel",
    uri: "ahp-changeset:/<uuid>",
    state: "Diffs, fichiers modifiés et métadonnées prêtes à afficher dans les clients.",
    action: "<code>changeset/updated</code> ou <code>changeset/disposed</code>",
  },
};

const scenarioData = {
  editor: {
    title: "Agent Client Protocol",
    copy:
      "L’IDE doit lancer ou joindre un agent, créer une session, envoyer des prompts, afficher les updates et demander les permissions de fichiers ou de terminal.",
    requirements: ["Capacités négociées", "Tour de prompt traçable", "Autorisations côté client"],
  },
  multi: {
    title: "Agent Host Protocol",
    copy:
      "Le même état doit apparaître dans plusieurs interfaces. Le serveur séquence les actions, diffuse les deltas et réconcilie les actions optimistes.",
    requirements: ["État autoritaire", "Abonnements par URI", "Replay après reconnexion"],
  },
  peers: {
    title: "Agent Communication Protocol",
    copy:
      "Le besoin porte sur deux agents indépendants qui se délèguent du travail ou échangent des résultats. C’est le sujet de l’ACP IBM, pas d’Agent Client Protocol.",
    requirements: ["Découverte d’agents", "Messages agent-à-agent", "Interopérabilité hors IDE"],
  },
};

const setActiveButton = (buttons, activeButton) => {
  buttons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
};

const updateProtocolDemo = (key, activeButton) => {
  const data = protocolData[key];
  const root = document.querySelector("[data-protocol-demo]");

  if (!root || !data) {
    return;
  }

  root.querySelector("[data-protocol-left] span").textContent = data.leftLabel;
  root.querySelector("[data-protocol-left] strong").textContent = data.leftTitle;
  root.querySelector("[data-protocol-wire] span").textContent = data.wireLabel;
  root.querySelector("[data-protocol-wire] strong").textContent = data.wireTitle;
  root.querySelector("[data-protocol-right] span").textContent = data.rightLabel;
  root.querySelector("[data-protocol-right] strong").textContent = data.rightTitle;
  root.querySelector("[data-protocol-copy]").textContent = data.copy;
  root.querySelector("[data-protocol-tag-one]").textContent = data.tags[0];
  root.querySelector("[data-protocol-tag-two]").textContent = data.tags[1];
  root.querySelector("[data-protocol-tag-three]").textContent = data.tags[2];

  setActiveButton([...root.querySelectorAll("[data-protocol-option]")], activeButton);
};

const updateAcpFlow = (key, activeButton) => {
  const data = acpSteps[key];
  const root = document.querySelector("[data-acp-flow]");

  if (!root || !data) {
    return;
  }

  root.querySelector("[data-acp-title]").textContent = data.title;
  root.querySelector("[data-acp-arrow]").textContent = data.arrow;
  root.querySelector("[data-acp-copy]").textContent = data.copy;
  root.querySelector("[data-acp-code]").textContent = data.code;

  setActiveButton([...root.querySelectorAll("[data-acp-step]")], activeButton);
};

const updateChannelDemo = (key, activeButton) => {
  const data = channelData[key];
  const root = document.querySelector("[data-channel-demo]");

  if (!root || !data) {
    return;
  }

  root.querySelector("[data-channel-title]").textContent = data.title;
  root.querySelector("[data-channel-uri]").textContent = data.uri;
  root.querySelector("[data-channel-state]").textContent = data.state;
  root.querySelector("[data-channel-action]").innerHTML = data.action;

  setActiveButton([...root.querySelectorAll("[data-channel-option]")], activeButton);
};

const updateScenarioDemo = (key, activeButton) => {
  const data = scenarioData[key];
  const root = document.querySelector("[data-scenario-demo]");

  if (!root || !data) {
    return;
  }

  root.querySelector("[data-scenario-title]").textContent = data.title;
  root.querySelector("[data-scenario-copy]").textContent = data.copy;
  root.querySelector("[data-scenario-one]").textContent = data.requirements[0];
  root.querySelector("[data-scenario-two]").textContent = data.requirements[1];
  root.querySelector("[data-scenario-three]").textContent = data.requirements[2];

  setActiveButton([...root.querySelectorAll("[data-scenario-option]")], activeButton);
};

document.querySelectorAll("[data-protocol-option]").forEach((button) => {
  button.addEventListener("click", () => updateProtocolDemo(button.dataset.protocolOption, button));
});

document.querySelectorAll("[data-acp-step]").forEach((button) => {
  button.addEventListener("click", () => updateAcpFlow(button.dataset.acpStep, button));
});

document.querySelectorAll("[data-channel-option]").forEach((button) => {
  button.addEventListener("click", () => updateChannelDemo(button.dataset.channelOption, button));
});

document.querySelectorAll("[data-scenario-option]").forEach((button) => {
  button.addEventListener("click", () => updateScenarioDemo(button.dataset.scenarioOption, button));
});
