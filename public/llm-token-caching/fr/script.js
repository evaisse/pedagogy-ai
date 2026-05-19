const sections = Array.from(document.querySelectorAll("[data-section]"));
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const progressFill = document.querySelector("[data-progress-fill]");

const chatDemo = document.querySelector("[data-chat-demo]");
const chatStepButtons = Array.from(document.querySelectorAll("[data-chat-step]"));
const chatTitle = document.querySelector("[data-chat-title]");
const chatUser = document.querySelector("[data-chat-user]");
const chatAssistant = document.querySelector("[data-chat-assistant]");
const cacheMode = document.querySelector("[data-cache-mode]");
const stableCacheStatuses = Array.from(document.querySelectorAll("[data-stable-cache-status]"));
const tailCacheLabel = document.querySelector("[data-tail-cache-label]");
const tailCacheStatus = document.querySelector("[data-tail-cache-status]");
const chatExplanation = document.querySelector("[data-chat-explanation]");
const conversationDemos = Array.from(document.querySelectorAll("[data-conversation-demo]"));

const prefixInput = document.querySelector("[data-prefix-size]");
const tailInput = document.querySelector("[data-tail-size]");
const changeInput = document.querySelector("[data-change-position]");
const stableToolsInput = document.querySelector("[data-stable-tools]");

const prefixOutput = document.querySelector("[data-prefix-output]");
const tailOutput = document.querySelector("[data-tail-output]");
const changeOutput = document.querySelector("[data-change-output]");
const cachedTokensOutput = document.querySelector("[data-cached-tokens]");
const uncachedTokensOutput = document.querySelector("[data-uncached-tokens]");
const workIndexOutput = document.querySelector("[data-work-index]");
const meterHit = document.querySelector("[data-meter-hit]");
const meterMiss = document.querySelector("[data-meter-miss]");
const simNote = document.querySelector("[data-sim-note]");

let ticking = false;

const chatSteps = {
  cold: {
    title: "Tour 1 · cache froid",
    user: "Peux-tu trouver où le formulaire d’inscription est validé ?",
    assistant: "Je lis les règles du projet, les outils disponibles et le contexte du dépôt avant de répondre.",
    mode: "Cache froid : écriture du préfixe",
    stableStatus: "Écrit dans le cache",
    tailLabel: "Demande utilisateur",
    tailStatus: "Relu normalement",
    explanation:
      "Au premier tour, rien n’est encore disponible : le préfixe stable est traité puis stocké, tandis que la demande du moment reste lue normalement.",
  },
  warm: {
    title: "Tour 2 · cache chaud",
    user: "Le test échoue encore. Peux-tu corriger le validateur et vérifier le diff ?",
    assistant:
      "Je réutilise le préfixe déjà calculé. Seuls la nouvelle demande, le diff et la sortie de test sont relus.",
    mode: "Cache chaud : lecture du préfixe",
    stableStatus: "Lu depuis le cache",
    tailLabel: "Nouvelle demande + diff",
    tailStatus: "Relu normalement",
    explanation:
      "Au deuxième tour, les instructions, outils, règles projet et contexte repo forment le même début de prompt : l’endpoint peut les reprendre depuis le cache.",
  },
};

function formatTokens(valueInThousands) {
  return `${Math.round(valueInThousands)}k`;
}

function updateProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;
  progressFill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  updateActiveFromScroll();
  ticking = false;
}

function requestProgressUpdate() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateProgress);
}

function setActiveSection(id) {
  sections.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.section === id);
  });

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.navLink === id);
  });
}

function setChatStep(step) {
  const content = chatSteps[step] || chatSteps.cold;

  chatDemo.dataset.chatState = step;
  chatTitle.textContent = content.title;
  chatUser.textContent = content.user;
  chatAssistant.textContent = content.assistant;
  cacheMode.textContent = content.mode;
  tailCacheLabel.textContent = content.tailLabel;
  tailCacheStatus.textContent = content.tailStatus;
  chatExplanation.textContent = content.explanation;

  stableCacheStatuses.forEach((status) => {
    status.textContent = content.stableStatus;
  });

  chatStepButtons.forEach((button) => {
    const isActive = button.dataset.chatStep === step;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function bindChatDemo() {
  if (!chatDemo || chatStepButtons.length === 0) return;

  chatStepButtons.forEach((button) => {
    button.addEventListener("click", () => setChatStep(button.dataset.chatStep));
  });

  setChatStep("cold");
}

function setConversationDemoStep(demo, step) {
  const buttons = Array.from(demo.querySelectorAll("[data-demo-step]"));
  const panels = Array.from(demo.querySelectorAll("[data-demo-panel]"));

  demo.dataset.demoState = step;

  buttons.forEach((button) => {
    const isActive = button.dataset.demoStep === step;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.demoPanel !== step;
  });
}

function bindConversationDemos() {
  conversationDemos.forEach((demo) => {
    const buttons = Array.from(demo.querySelectorAll("[data-demo-step]"));
    const initialStep = demo.dataset.demoState || buttons[0]?.dataset.demoStep || "one";

    buttons.forEach((button) => {
      button.addEventListener("click", () => setConversationDemoStep(demo, button.dataset.demoStep));
    });

    setConversationDemoStep(demo, initialStep);
  });
}

function updateActiveFromScroll() {
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0;
  const marker = window.scrollY + headerHeight + 120;
  let activeId = sections[0]?.dataset.section;

  sections.forEach((section) => {
    if (section.offsetTop <= marker) {
      activeId = section.dataset.section;
    }
  });

  if (activeId) {
    setActiveSection(activeId);
  }
}

function updateSimulator() {
  const stablePrefix = Number(prefixInput.value);
  const volatileTail = Number(tailInput.value);
  const changePosition = Number(changeInput.value);
  const toolsAreStable = stableToolsInput.checked;

  const totalPrompt = stablePrefix + volatileTail;
  const rawCachedPrefix = stablePrefix * (changePosition / 100);
  const stabilityFactor = toolsAreStable ? 1 : 0.38;
  const cachedTokens = Math.round(rawCachedPrefix * stabilityFactor);
  const uncachedTokens = Math.max(0, totalPrompt - cachedTokens);

  const cachedWorkWeight = 0.2;
  const relativeWork = Math.round(((uncachedTokens + cachedTokens * cachedWorkWeight) / totalPrompt) * 100);
  const hitRatio = totalPrompt > 0 ? (cachedTokens / totalPrompt) * 100 : 0;

  prefixOutput.value = `${formatTokens(stablePrefix)} tokens`;
  tailOutput.value = `${formatTokens(volatileTail)} tokens`;
  changeOutput.value = `après ${changePosition}%`;
  cachedTokensOutput.textContent = formatTokens(cachedTokens);
  uncachedTokensOutput.textContent = formatTokens(uncachedTokens);
  workIndexOutput.textContent = `${relativeWork}%`;
  meterHit.style.flexBasis = `${hitRatio}%`;
  meterMiss.style.flexBasis = `${100 - hitRatio}%`;

  if (!toolsAreStable) {
    simNote.textContent =
      "Les schémas d’outils bougent : le préfixe reconnu se raccourcit fortement, même si la demande arrive tard.";
    return;
  }

  if (changePosition < 30) {
    simNote.textContent =
      "Le changement arrive tôt : l’endpoint doit relire presque toute la base avant de retrouver une partie stable.";
  } else if (changePosition < 70) {
    simNote.textContent =
      "Le changement arrive au milieu : une part utile du préfixe est reprise, mais le gain reste modéré.";
  } else {
    simNote.textContent =
      "Le changement arrive tard : la majeure partie de la base stable peut être réutilisée.";
  }
}

function bindSimulator() {
  [prefixInput, tailInput, changeInput, stableToolsInput].forEach((input) => {
    input.addEventListener("input", updateSimulator);
    input.addEventListener("change", updateSimulator);
  });

  updateSimulator();
}

window.addEventListener("scroll", requestProgressUpdate, { passive: true });
window.addEventListener("resize", requestProgressUpdate);

bindChatDemo();
bindConversationDemos();
bindSimulator();
updateProgress();
