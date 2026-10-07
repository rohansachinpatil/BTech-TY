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

  // Theme toggle: injected into the header so every page gets it.
  // Preference persists in localStorage; falls back to the OS setting.
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    if (themeMeta) themeMeta.content = theme === "dark" ? "#23211b" : "#f3f0e6";
    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.textContent = theme === "dark" ? "Light" : "Dark";
  };
  const storedTheme = (() => {
    try {
      return localStorage.getItem("study-notes-theme");
    } catch (e) {
      return null;
    }
  })();
  let theme =
    storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  applyTheme(theme);
  const headerTools = document.querySelector(".header-tools");
  if (headerTools && !document.getElementById("theme-toggle")) {
    const toggle = document.createElement("button");
    toggle.id = "theme-toggle";
    toggle.type = "button";
    toggle.className = "print-action";
    toggle.setAttribute("aria-label", "Toggle dark mode");
    toggle.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("study-notes-theme", theme);
      } catch (e) {}
      applyTheme(theme);
    });
    headerTools.appendChild(toggle);
    applyTheme(theme);
  }

  // Word finder: floating button + overlay searching an embedded index.
  // SEARCH_INDEX lives here (not a separate JSON) so search also works
  // from file:// with no server. Add an entry when a page is added.
  const SEARCH_INDEX = [
    { title: "BTech Study Workspace", url: "index.html", subject: "HOME", keywords: "home subjects syllabus library", snippet: "Subject-wise syllabus aur Hinglish study notes library." },
    { title: "Database System Design — Study Notes", url: "subject/Database%20System%20Design/index.html", subject: "DATABASE SYSTEM DESIGN", keywords: "dbms database er model sql transaction nosql", snippet: "Syllabus, contents, progress aur saare notes." },
    { title: "Introduction to DBMS", url: "subject/Database%20System%20Design/01-introduction-to-dbms.html", subject: "DATABASE SYSTEM DESIGN", keywords: "data information database dbms need redundancy mysql", snippet: "Data, database, DBMS, real-life examples aur DBMS ki need." },
    { title: "Purpose of Database Systems", url: "subject/Database%20System%20Design/02-purpose-of-database-systems.html", subject: "DATABASE SYSTEM DESIGN", keywords: "purpose file system redundancy inconsistency sharing security", snippet: "Traditional file system ki problems aur database ke purposes." },
    { title: "Database-System Applications", url: "subject/Database%20System%20Design/03-database-system-applications.html", subject: "DATABASE SYSTEM DESIGN", keywords: "banking airlines ecommerce applications uses", snippet: "Banking, airlines, universities, e-commerce aur aur domains." },
    { title: "View of Data", url: "subject/Database%20System%20Design/04-view-of-data.html", subject: "DATABASE SYSTEM DESIGN", keywords: "abstraction physical conceptual view levels architecture", snippet: "Data abstraction ke teen levels aur three-level architecture." },
    { title: "Theory of Computations — Study Notes", url: "subject/Theory%20of%20Computations/index.html", subject: "THEORY OF COMPUTATIONS", keywords: "toc automata syllabus", snippet: "Syllabus, contents, QB section aur progress." },
    { title: "TOC Mid-sem QB with answers", url: "subject/Theory%20of%20Computations/qb-mid-sem.html", subject: "THEORY OF COMPUTATIONS", keywords: "dFA nFA mealy moore regular expression cfg lexical analysis mid sem question bank", snippet: "10 MCQ + 9 theory: FA, DFA/NFA, Moore/Mealy, RE, CFG, lexical analysis." },
    { title: "Machine Learning — Study Notes", url: "subject/Machine%20Learning/index.html", subject: "MACHINE LEARNING", keywords: "ml syllabus", snippet: "Syllabus, contents, QB section aur progress." },
    { title: "ML Mid-sem QB with answers", url: "subject/Machine%20Learning/qb-mid-sem.html", subject: "MACHINE LEARNING", keywords: "supervised unsupervised regression classification precision recall confusion matrix gradient descent logistic sigmoid mid sem question bank", snippet: "27 questions: ML types, metrics, confusion matrix, MAE RMSE, regression, sigmoid." },
    { title: "Software Engineering and Project Management — Study Notes", url: "subject/Software%20Engineering%20and%20Project%20Management/index.html", subject: "SEPM", keywords: "sepm syllabus software engineering", snippet: "Syllabus, contents, QB section aur progress." },
    { title: "SEPM Mid-sem QB with answers", url: "subject/Software%20Engineering%20and%20Project%20Management/qb-mid-sem.html", subject: "SEPM", keywords: "waterfall agile xp scrum srs requirements uml testing sdlc mid sem question bank", snippet: "10 theory + 20 MCQ: process models, Agile, XP, SRS, design, UML, testing." },
  ];

  if (!document.getElementById("search-fab")) {
    const fab = document.createElement("button");
    fab.id = "search-fab";
    fab.type = "button";
    fab.className = "search-fab";
    fab.setAttribute("aria-label", "Find words in study notes");
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>';

    const overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="search-panel" role="dialog" aria-modal="true" aria-label="Word finder">' +
      '<p class="search-kicker">WORD FINDER / SHABD DHOONDHO</p>' +
      '<input class="search-input" type="search" placeholder="jaise: regression, srs, dfa…" aria-label="Search words in study notes">' +
      '<p class="search-count" aria-live="polite"></p>' +
      '<ul class="search-results"></ul>' +
      "</div>";

    const input = overlay.querySelector(".search-input");
    const count = overlay.querySelector(".search-count");
    const results = overlay.querySelector(".search-results");

    const renderResults = (query) => {
      const q = query.trim().toLowerCase();
      results.innerHTML = "";
      if (!q) {
        count.textContent = "";
        return;
      }
      const hits = SEARCH_INDEX.map((entry) => {
        const hay = `${entry.title} ${entry.subject} ${entry.keywords} ${entry.snippet}`.toLowerCase();
        const score =
          (entry.title.toLowerCase().includes(q) ? 2 : 0) +
          (hay.includes(q) ? 1 : 0);
        return { entry, score };
      })
        .filter((hit) => hit.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
      count.textContent = hits.length ? `${hits.length} result${hits.length > 1 ? "s" : ""}` : "Kuch nahi mila — aur shabd try karo";
      for (const { entry } of hits) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = new URL(entry.url, document.baseURI).toString();
        const title = document.createElement("span");
        title.className = "search-title";
        title.textContent = entry.title;
        const meta = document.createElement("span");
        meta.className = "search-meta";
        meta.textContent = entry.subject;
        const snippet = document.createElement("span");
        snippet.className = "search-snippet";
        snippet.textContent = entry.snippet;
        a.append(title, meta, snippet);
        li.appendChild(a);
        results.appendChild(li);
      }
    };

    const openSearch = () => {
      overlay.hidden = false;
      input.value = "";
      renderResults("");
      input.focus();
    };
    const closeSearch = () => {
      overlay.hidden = true;
      fab.focus();
    };

    fab.addEventListener("click", openSearch);
    input.addEventListener("input", () => renderResults(input.value));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeSearch();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) closeSearch();
      if (event.key === "/" && overlay.hidden && document.activeElement !== input && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "")) {
        event.preventDefault();
        openSearch();
      }
    });

    document.body.append(fab, overlay);
  }
})();
