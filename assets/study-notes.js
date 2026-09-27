(() => {
  const relocatableFigures = [...document.querySelectorAll(".figure-card[data-mobile-after]")]
    .map((figure) => {
      const rail = figure.closest(".figure-rail");
      const target = document.getElementById(figure.dataset.mobileAfter)?.closest("section");
      if (!rail || !target) return null;

      const placeholder = document.createComment(" desktop figure position ");
      figure.before(placeholder);
      return { figure, placeholder, target };
    })
    .filter(Boolean);

  const mobileLayout = window.matchMedia?.("(max-width: 820px)");
  if (mobileLayout && relocatableFigures.length) {
    const placeFigures = () => {
      for (const { figure, placeholder, target } of relocatableFigures) {
        if (mobileLayout.matches) target.after(figure);
        else placeholder.after(figure);
      }
    };

    placeFigures();
    if (typeof mobileLayout.addEventListener === "function") {
      mobileLayout.addEventListener("change", placeFigures);
    } else {
      mobileLayout.addListener(placeFigures);
    }
  }

  const tabList = document.querySelector("[data-tablist]");

  if (tabList) {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const panels = [...document.querySelectorAll("[data-tab-panel]")];

    const activateTab = (tab, focus = false) => {
      const selectedName = tab.dataset.tab;

      for (const candidate of tabs) {
        const selected = candidate === tab;
        candidate.setAttribute("aria-selected", String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      }

      for (const panel of panels) {
        panel.hidden = panel.dataset.tabPanel !== selectedName;
      }

      if (location.hash !== `#${selectedName}`) {
        history.replaceState(null, "", `#${selectedName}`);
      }

      if (focus) tab.focus();
    };

    tabList.addEventListener("click", (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) activateTab(tab);
    });

    tabList.addEventListener("keydown", (event) => {
      const currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });

    const initialTab = tabs.find((tab) => `#${tab.dataset.tab}` === location.hash) || tabs[0];
    if (initialTab) activateTab(initialTab);
  }

  document.querySelectorAll("[data-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });
})();
