const harnessModes = {
  chat: {
    request: "Explique ce bug",
    model: "Raisonne et propose",
    layer: "Historique de chat",
    result: "Réponse en prose",
    copy:
      "Le chat ajoute surtout un historique autour du modèle. Il peut expliquer, mais il ne lit pas le dépôt, ne modifie pas les fichiers et ne lance pas les tests.",
    signals: ["Historique", "Prompt", "Réponse texte"],
  },
  code: {
    request: "Corrige le test",
    model: "Choisit une action",
    layer: "Fichiers · shell · permissions · tests",
    result: "Diff vérifié",
    copy:
      "L’agent de code donne au modèle un environnement. Le harnais lit les fichiers, applique les patchs, exécute les commandes et renvoie les observations dans la boucle.",
    signals: ["Workspace", "Outils structurés", "Vérification"],
  },
  team: {
    request: "Migrer un module",
    model: "Décompose",
    layer: "Plan · sous-agents · état partagé",
    result: "Travail coordonné",
    copy:
      "Pour un travail long, le harnais garde l’état durable, répartit des sous-tâches indépendantes et recolle les résultats sans perdre l’objectif initial.",
    signals: ["Plan durable", "Délégation bornée", "Reprise"],
  },
};

const loopOrder = ["observe", "inspect", "choose", "act", "verify", "reduce"];

const loopSteps = {
  observe: {
    title: "Observer",
    copy:
      "Le harnais collecte les signaux utiles : fichiers, statut git, logs, erreurs de test, sortie terminal et consignes du projet.",
    code: '{\n  "phase": "observe",\n  "inputs": ["git status", "README", "test log"]\n}',
  },
  inspect: {
    title: "Inspecter",
    copy:
      "Le modèle analyse les observations dans un contexte limité. Le harnais garde les détails lourds hors du prompt tant qu’ils ne sont pas nécessaires.",
    code: '{\n  "phase": "inspect",\n  "focus": ["failing assertion", "changed file"]\n}',
  },
  choose: {
    title: "Choisir",
    copy:
      "Le modèle émet une prochaine action. Le harnais exige une forme structurée pour pouvoir valider l’outil et les arguments.",
    code: '{\n  "phase": "choose",\n  "tool": "apply_patch",\n  "reason": "fix failing branch"\n}',
  },
  act: {
    title: "Agir",
    copy:
      "Le harnais exécute l’action dans l’environnement autorisé : lire, écrire, lancer une commande, ouvrir un navigateur ou demander une permission.",
    code: '{\n  "phase": "act",\n  "sandbox": "workspace",\n  "approval": "required for risky command"\n}',
  },
  verify: {
    title: "Vérifier",
    copy:
      "Les tests, logs, captures et diffs deviennent un signal de vérité. Le modèle peut corriger sa trajectoire au lieu de supposer que tout va bien.",
    code: '{\n  "phase": "verify",\n  "checks": ["targeted test", "lint", "diff review"]\n}',
  },
  reduce: {
    title: "Réduire",
    copy:
      "Quand le contexte grossit, le harnais compacte l’ancien historique, tronque les sorties volumineuses et conserve les faits qui guident la suite.",
    code: '{\n  "phase": "reduce",\n  "keep": ["goal", "decisions", "latest errors"]\n}',
  },
};

const scenarios = {
  explain: {
    title: "Contexte court + réponse",
    copy:
      "Une explication locale peut rester proche du chat, à condition que le bon extrait soit déjà dans le prompt.",
    requirements: ["Prompt clair", "Contexte fourni", "Pas d’exécution"],
  },
  fix: {
    title: "Workspace + outils + tests",
    copy:
      "Corriger un test demande de lire le dépôt, modifier un fichier, lancer une commande et réinjecter le résultat dans la boucle.",
    requirements: ["Recherche fichiers", "Édition contrôlée", "Vérification test"],
  },
  risky: {
    title: "Permissions + sandbox + audit",
    copy:
      "Une action sensible doit passer par des garde-fous : chemins autorisés, approbation, isolation et trace de ce qui a changé.",
    requirements: ["Validation stricte", "Permission utilisateur", "Diff inspectable"],
  },
  parallel: {
    title: "Plan + délégation bornée",
    copy:
      "Le parallélisme devient utile quand les sous-tâches sont indépendantes, bien délimitées et capables de rendre un résultat intégrable.",
    requirements: ["Mission étroite", "Contexte hérité", "Résultat intégrable"],
  },
};

function setActiveButton(buttons, activeButton) {
  buttons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateHarnessMode(key, activeButton) {
  const root = document.querySelector("[data-harness-demo]");
  const data = harnessModes[key];

  if (!root || !data) {
    return;
  }

  root.querySelector("[data-harness-request]").textContent = data.request;
  root.querySelector("[data-harness-model]").textContent = data.model;
  root.querySelector("[data-harness-layer]").textContent = data.layer;
  root.querySelector("[data-harness-result]").textContent = data.result;
  root.querySelector("[data-harness-copy]").textContent = data.copy;
  root.querySelector("[data-harness-signal-one]").textContent = data.signals[0];
  root.querySelector("[data-harness-signal-two]").textContent = data.signals[1];
  root.querySelector("[data-harness-signal-three]").textContent = data.signals[2];

  setActiveButton(Array.from(root.querySelectorAll("[data-harness-mode]")), activeButton);
}

function updateLoopStep(key, activeButton) {
  const root = document.querySelector("[data-loop-demo]");
  const data = loopSteps[key];

  if (!root || !data) {
    return;
  }

  root.querySelector("[data-loop-title]").textContent = data.title;
  root.querySelector("[data-loop-copy]").textContent = data.copy;
  root.querySelector("[data-loop-code]").textContent = data.code;

  root.querySelectorAll(".ring-step").forEach((step, index) => {
    step.classList.toggle("is-active", loopOrder[index] === key);
  });

  setActiveButton(Array.from(root.querySelectorAll("[data-loop-step]")), activeButton);
}

function updateScenario(key, activeButton) {
  const root = document.querySelector("[data-scenario-demo]");
  const data = scenarios[key];

  if (!root || !data) {
    return;
  }

  root.querySelector("[data-scenario-title]").textContent = data.title;
  root.querySelector("[data-scenario-copy]").textContent = data.copy;
  root.querySelector("[data-scenario-one]").textContent = data.requirements[0];
  root.querySelector("[data-scenario-two]").textContent = data.requirements[1];
  root.querySelector("[data-scenario-three]").textContent = data.requirements[2];

  setActiveButton(Array.from(root.querySelectorAll("[data-scenario]")), activeButton);
}

document.querySelectorAll("[data-harness-mode]").forEach((button) => {
  button.addEventListener("click", () => updateHarnessMode(button.dataset.harnessMode, button));
});

document.querySelectorAll("[data-loop-step]").forEach((button) => {
  button.addEventListener("click", () => updateLoopStep(button.dataset.loopStep, button));
});

document.querySelectorAll("[data-scenario]").forEach((button) => {
  button.addEventListener("click", () => updateScenario(button.dataset.scenario, button));
});
