(() => {
  const sections = Array.from(document.querySelectorAll("[data-section]"));
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const progressFill = document.querySelector("[data-progress-fill]");

  if (sections.length === 0 && !progressFill) {
    return;
  }

  let ticking = false;

  function getHeaderHeight() {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--header-height");

    return Number.parseFloat(value) || 0;
  }

  function getSectionId(section) {
    return section.dataset.section || section.id;
  }

  function setActiveSection(activeId) {
    sections.forEach((section) => {
      section.classList.toggle("is-active", getSectionId(section) === activeId);
    });

    navLinks.forEach((link) => {
      const target = link.dataset.navLink || link.getAttribute("href")?.replace(/^#/, "");
      link.classList.toggle("is-active", target === activeId);
    });
  }

  function updateProgressFill() {
    if (!progressFill) return;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressFill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  function updateActiveSection() {
    if (sections.length === 0) return;

    const marker = window.scrollY + getHeaderHeight() + 120;
    let activeId = getSectionId(sections[0]);

    sections.forEach((section) => {
      if (section.offsetTop <= marker) {
        activeId = getSectionId(section);
      }
    });

    setActiveSection(activeId);
  }

  function updateStoryState() {
    updateProgressFill();
    updateActiveSection();
    ticking = false;
  }

  function requestStoryStateUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateStoryState);
  }

  window.addEventListener("scroll", requestStoryStateUpdate, { passive: true });
  window.addEventListener("resize", requestStoryStateUpdate);
  updateStoryState();
})();
