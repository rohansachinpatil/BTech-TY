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
      '<div class="search-navrow">' +
      '<button class="search-navbtn" type="button" data-nav="prev" aria-label="Previous match">↑</button>' +
      '<button class="search-navbtn" type="button" data-nav="next" aria-label="Next match">↓</button>' +
      '<span class="search-navcount" aria-live="polite">0 / 0</span>' +
      '<span class="search-navhint">Enter = next · Esc = close</span>' +
      "</div>" +
      '<p class="search-count" aria-live="polite"></p>' +
      '<ul class="search-results"></ul>' +
      "</div>";

    const input = overlay.querySelector(".search-input");
    const count = overlay.querySelector(".search-count");
    const results = overlay.querySelector(".search-results");
    const navCount = overlay.querySelector(".search-navcount");
    let pageHits = [];
    let currentHit = -1;

    const updateNav = () => {
      navCount.textContent = pageHits.length ? `${currentHit + 1} / ${pageHits.length}` : "0 / 0";
    };

    const clearMarks = () => {
      document.querySelectorAll("main mark.search-hit").forEach((mark) => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      });
      pageHits = [];
      currentHit = -1;
      updateNav();
    };

    const jumpTo = (n) => {
      if (!pageHits.length) return;
      currentHit = (n + pageHits.length) % pageHits.length;
      pageHits.forEach((mark, i) => mark.classList.toggle("search-hit-current", i === currentHit));
      pageHits[currentHit].scrollIntoView({ block: "center" });
      updateNav();
    };

    const findOnPage = (query) => {
      clearMarks();
      const q = query.trim().toLowerCase();
      if (!q) return;
      const root = document.querySelector("main") || document.body;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue.toLowerCase().includes(q)) return NodeFilter.FILTER_REJECT;
          const el = node.parentElement;
          if (!el || el.closest("[hidden],script,style")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        const val = node.nodeValue;
        const lower = val.toLowerCase();
        const frag = document.createDocumentFragment();
        let i = 0;
        let idx = lower.indexOf(q);
        while (idx !== -1) {
          frag.append(val.slice(i, idx));
          const mark = document.createElement("mark");
          mark.className = "search-hit";
          mark.textContent = val.slice(idx, idx + q.length);
          frag.append(mark);
          pageHits.push(mark);
          i = idx + q.length;
          idx = lower.indexOf(q, i);
        }
        frag.append(val.slice(i));
        node.parentNode.replaceChild(frag, node);
      }
      if (pageHits.length) jumpTo(0);
    };

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
      clearMarks();
      overlay.hidden = true;
      fab.focus();
    };

    try {
      const pending = sessionStorage.getItem("study-notes-find");
      if (pending) {
        sessionStorage.removeItem("study-notes-find");
        openSearch();
        input.value = pending;
        findOnPage(pending);
        renderResults(pending);
      }
    } catch (e) {}

    fab.addEventListener("click", openSearch);
    input.addEventListener("input", () => {
      findOnPage(input.value);
      renderResults(input.value);
    });
    overlay.querySelectorAll(".search-navbtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        jumpTo(currentHit + (btn.dataset.nav === "next" ? 1 : -1));
        input.focus();
      });
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        jumpTo(currentHit + (event.shiftKey ? -1 : 1));
      }
    });
    results.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      try {
        const target = new URL(link.getAttribute("href"), document.baseURI);
        if (target.pathname === location.pathname) {
          event.preventDefault();
          overlay.hidden = true;
          if (pageHits.length) jumpTo(0);
        } else {
          try {
            sessionStorage.setItem("study-notes-find", input.value);
          } catch (e) {}
        }
      } catch (e) {}
    });
    window.addEventListener("beforeprint", clearMarks);
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

  // Timeline navigation rail + interactive draggable scrubber.
  // Har note page par sections se auto-banta hai. Spine SVG hover/click
  // par curve hoti hai (elastic bend), scrubber drag se page scroll hota hai.
  (() => {
    if (!document.querySelector(".prose-column")) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = window.matchMedia?.("(max-width: 820px)");
    const isHorizontal = () => !!mobileQuery?.matches;

    const collectSections = () =>
      [...document.querySelectorAll(".prose-column section")].filter((sec) => {
        if (sec.closest("[hidden]")) return null;
        const h = sec.querySelector("h2[id]");
        if (!h) return null;
        if (sec.getClientRects().length === 0) return null;
        return true;
      }).map((sec) => {
        const h = sec.querySelector("h2[id]");
        const kicker = sec.querySelector(".section-kicker")?.textContent.trim() || "";
        return { id: h.id, title: h.textContent.trim(), kicker, el: sec };
      });

    let sections = collectSections();
    if (sections.length < 3) return;
    if (document.documentElement.scrollHeight < window.innerHeight * 1.4) return;

    const rail = document.createElement("nav");
    rail.className = "timeline-rail";
    rail.setAttribute("aria-label", "Timeline navigation / sections");
    rail.innerHTML =
      '<div class="timeline-count" aria-hidden="true"><strong>01</strong><span></span></div>' +
      '<div class="timeline-track">' +
      '<div class="timeline-fill"></div>' +
      '<svg class="timeline-spine" aria-hidden="true" preserveAspectRatio="none"><path d=""></path></svg>' +
      '<div class="timeline-scrubber" role="slider" tabindex="0" aria-label="Page scrubber / drag karke scroll karo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>' +
      "</div>" +
      '<div class="timeline-current" aria-live="polite"></div>' +
      '<div class="timeline-hint">DRAG / CLICK</div>';

    document.body.appendChild(rail);

    const track = rail.querySelector(".timeline-track");
    const fill = rail.querySelector(".timeline-fill");
    const svg = rail.querySelector(".timeline-spine");
    const path = svg.querySelector("path");
    const scrubber = rail.querySelector(".timeline-scrubber");
    const countStrong = rail.querySelector(".timeline-count strong");
    const countTotal = rail.querySelector(".timeline-count span");
    const currentLabel = rail.querySelector(".timeline-current");
    let dots = [];

    const DOT_PAD = 22;
    const SCRUB_PAD = 10;
    let activeIndex = 0;
    let dragging = false;
    let targetBend = 0;
    let bend = 0;
    let targetPos = -1;
    let curvePos = -1;
    let impulseTimer = 0;
    let raf = 0;

    const trackSize = () => {
      const r = track.getBoundingClientRect();
      return { w: r.width, h: r.height };
    };

    const dotPos = (i) => {
      const { w, h } = trackSize();
      const span = (isHorizontal() ? w : h) - DOT_PAD * 2;
      if (sections.length <= 1) return DOT_PAD;
      return DOT_PAD + (i / (sections.length - 1)) * span;
    };

    const fracToPos = (frac) => {
      const { w, h } = trackSize();
      const len = (isHorizontal() ? w : h) - SCRUB_PAD * 2;
      return SCRUB_PAD + Math.min(1, Math.max(0, frac)) * len;
    };

    const posToFrac = (clientX, clientY) => {
      const r = track.getBoundingClientRect();
      if (isHorizontal()) return (clientX - r.left - SCRUB_PAD) / (r.width - SCRUB_PAD * 2);
      return (clientY - r.top - SCRUB_PAD) / (r.height - SCRUB_PAD * 2);
    };

    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const drawSpine = () => {
      const { w, h } = trackSize();
      if (!w || !h) return;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      const horizontal = isHorizontal();
      const pad = 6;
      if (curvePos < 0) {
        path.setAttribute("d", horizontal ? `M ${pad} ${h / 2} L ${w - pad} ${h / 2}` : `M ${w / 2} ${pad} L ${w / 2} ${h - pad}`);
        return;
      }
      const c = Math.min(Math.max(curvePos, pad + 12), (horizontal ? w : h) - pad - 12);
      const b = bend;
      let d;
      if (horizontal) {
        const cy = h / 2;
        d = `M ${pad} ${cy} C ${c - 90} ${cy}, ${c - 30} ${cy + b}, ${c} ${cy + b} C ${c + 30} ${cy + b}, ${c + 90} ${cy}, ${w - pad} ${cy}`;
      } else {
        const cx = w / 2;
        d = `M ${cx} ${pad} C ${cx} ${c - 90}, ${cx + b} ${c - 30}, ${cx + b} ${c} C ${cx + b} ${c + 30}, ${cx} ${c + 90}, ${cx} ${h - pad}`;
      }
      path.setAttribute("d", d);
    };

    const tick = () => {
      raf = 0;
      if (reduceMotion) {
        bend = targetBend;
        curvePos = targetPos;
      } else {
        bend += (targetBend - bend) * 0.2;
        if (targetPos >= 0) {
          if (curvePos < 0) curvePos = targetPos;
          else curvePos += (targetPos - curvePos) * 0.25;
        }
        if (Math.abs(targetBend - bend) < 0.15) bend = targetBend;
      }
      drawSpine();
      if (!reduceMotion && (bend !== targetBend || (targetPos >= 0 && Math.abs((curvePos ?? 0) - targetPos) > 0.5))) {
        raf = requestAnimationFrame(tick);
      }
    };

    const kick = () => {
      if (reduceMotion) {
        drawSpine();
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const restCurve = () => {
      if (dragging) return;
      targetPos = dotPos(activeIndex);
      targetBend = -6;
      kick();
    };

    const impulse = (pos, strength = -30) => {
      targetPos = pos;
      targetBend = strength;
      kick();
      clearTimeout(impulseTimer);
      impulseTimer = setTimeout(restCurve, 380);
    };

    const setActive = (i) => {
      activeIndex = Math.min(Math.max(0, i), sections.length - 1);
      dots.forEach((d, k) => {
        d.classList.toggle("is-active", k === activeIndex);
        if (k === activeIndex) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
      const n = String(activeIndex + 1).padStart(2, "0");
      const t = String(sections.length).padStart(2, "0");
      countStrong.textContent = n;
      countTotal.textContent = ` / ${t}`;
      currentLabel.textContent = sections[activeIndex]?.title || "";
      scrubber.setAttribute("aria-valuetext", `Section ${n} of ${t}: ${sections[activeIndex]?.title || ""}`);
    };

    const buildDots = () => {
      track.querySelectorAll(".timeline-dot").forEach((d) => d.remove());
      dots = sections.map((s, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "timeline-dot";
        const num = String(i + 1).padStart(2, "0");
        btn.setAttribute("aria-label", `Section ${num} par jao: ${s.title}`);
        btn.innerHTML = `<i aria-hidden="true"></i><span class="timeline-tip"><b>${num}</b>${s.title.replace(/</g, "&lt;").slice(0, 42)}</span>`;
        const place = () => {
          const p = dotPos(i);
          if (isHorizontal()) {
            btn.style.left = `${p}px`;
            btn.style.top = "50%";
          } else {
            btn.style.top = `${p}px`;
            btn.style.left = "50%";
          }
        };
        place();
        btn.addEventListener("mouseenter", () => {
          targetPos = dotPos(i);
          targetBend = -20;
          kick();
        });
        btn.addEventListener("focus", () => {
          targetPos = dotPos(i);
          targetBend = -20;
          kick();
        });
        btn.addEventListener("mouseleave", restCurve);
        btn.addEventListener("blur", restCurve);
        btn.addEventListener("click", () => {
          impulse(dotPos(i), -32);
          const el = document.getElementById(s.id);
          if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
          setActive(i);
        });
        track.appendChild(btn);
        return btn;
      });
      countTotal.textContent = ` / ${String(sections.length).padStart(2, "0")}`;
      setActive(activeIndex);
      restCurve();
    };

    const syncFromScroll = () => {
      const frac = window.scrollY / maxScroll();
      const p = fracToPos(frac);
      if (isHorizontal()) {
        scrubber.style.left = `${p}px`;
        scrubber.style.top = "";
        fill.style.width = `${frac * 100}%`;
        fill.style.height = "";
      } else {
        scrubber.style.top = `${p}px`;
        scrubber.style.left = "";
        fill.style.height = `${frac * 100}%`;
        fill.style.width = "";
      }
      scrubber.setAttribute("aria-valuenow", String(Math.round(frac * 100)));

      const mid = window.scrollY + window.innerHeight * 0.35;
      let idx = 0;
      sections.forEach((s, i) => {
        if (s.el.getBoundingClientRect().top + window.scrollY <= mid) idx = i;
      });
      if (idx !== activeIndex) {
        setActive(idx);
        if (!dragging && targetBend === -6) {
          targetPos = dotPos(idx);
          kick();
        }
      }
    };

    let scrollQueued = false;
    const onScroll = () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        if (!dragging) syncFromScroll();
      });
    };

    const scrollToFrac = (frac) => {
      const f = Math.min(1, Math.max(0, frac));
      window.scrollTo({ top: f * maxScroll(), behavior: "auto" });
      syncFromScroll();
    };

    // Scrubber drag + track click-to-jump.
    scrubber.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      track.classList.add("is-dragging");
      scrubber.setPointerCapture?.(e.pointerId);
      const move = (ev) => {
        const frac = posToFrac(ev.clientX, ev.clientY);
        const p = fracToPos(Math.min(1, Math.max(0, frac)));
        targetPos = p;
        targetBend = -24;
        kick();
        scrollToFrac(frac);
      };
      const up = () => {
        dragging = false;
        track.classList.remove("is-dragging");
        restCurve();
        syncFromScroll();
      };
      const onMove = (ev) => move(ev);
      const onUp = () => {
        scrubber.removeEventListener("pointermove", onMove);
        scrubber.removeEventListener("pointerup", onUp);
        scrubber.removeEventListener("pointercancel", onUp);
        up();
      };
      scrubber.addEventListener("pointermove", onMove);
      scrubber.addEventListener("pointerup", onUp);
      scrubber.addEventListener("pointercancel", onUp);
      move(e);
    });

    track.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".timeline-dot") || e.target.closest(".timeline-scrubber")) return;
      const frac = posToFrac(e.clientX, e.clientY);
      impulse(fracToPos(Math.min(1, Math.max(0, frac))), -28);
      scrollToFrac(frac);
    });

    scrubber.addEventListener("keydown", (e) => {
      const step = 1 / Math.max(1, sections.length - 1);
      const cur = window.scrollY / maxScroll();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = sections[Math.min(sections.length - 1, activeIndex + 1)];
        document.getElementById(next.id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = sections[Math.max(0, activeIndex - 1)];
        document.getElementById(prev.id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToFrac(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToFrac(1);
      } else if (e.key === "PageDown") {
        e.preventDefault();
        scrollToFrac(cur + step);
      } else if (e.key === "PageUp") {
        e.preventDefault();
        scrollToFrac(cur - step);
      }
    });

    const rebuild = () => {
      const fresh = collectSections();
      if (fresh.length >= 3) {
        sections = fresh;
        activeIndex = Math.min(activeIndex, sections.length - 1);
        buildDots();
        syncFromScroll();
      }
    };

    document.getElementById("lang-toggle")?.addEventListener("click", () => setTimeout(rebuild, 60));
    mobileQuery?.addEventListener?.("change", () => {
      buildDots();
      syncFromScroll();
      targetPos = dotPos(activeIndex);
      drawSpine();
    });
    window.addEventListener("resize", () => {
      buildDots();
      syncFromScroll();
      drawSpine();
    }, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    buildDots();
    syncFromScroll();
    restCurve();
  })();
})();
