/**
 * AEL Reference Engine — Universal Shared JavaScript Engine
 * Loads data from a JSON file and renders a complete interactive reference.
 */
(function () {
  "use strict";

  const DATA_URL = "data.json";
  const SCROLL_PROGRESS_HEIGHT = 3;
  const BACK_TO_TOP_THRESHOLD = 400;
  const DEBOUNCE_MS = 150;

  let DATA = null;
  let activeFilters = new Set();
  let searchQuery = "";
  let showingFavoritesOnly = false;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function esc(str) {
    if (!str) return "";
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function localStorageKey(type) {
    return `ael-${DATA.meta.shortName}-${type}`;
  }

  function loadJSON(type) {
    try {
      return JSON.parse(localStorage.getItem(localStorageKey(type))) || {};
    } catch {
      return {};
    }
  }

  function saveJSON(type, obj) {
    localStorage.setItem(localStorageKey(type), JSON.stringify(obj));
  }

  // ── Learning Progress ──────────────────────────────────────────────────────

  const PROGRESS_STATES = ["unread", "learning", "mastered"];
  const PROGRESS_ICONS = { unread: "○", learning: "◐", mastered: "●" };

  function getProgress(name) {
    const p = loadJSON("progress");
    return p[name] || "unread";
  }

  function cycleProgress(name) {
    const p = loadJSON("progress");
    const cur = p[name] || "unread";
    const idx = (PROGRESS_STATES.indexOf(cur) + 1) % PROGRESS_STATES.length;
    p[name] = PROGRESS_STATES[idx];
    saveJSON("progress", p);
    updateProgressUI(name, PROGRESS_STATES[idx]);
    updateNavCounters();
  }

  function updateProgressUI(name, state) {
    const btn = document.querySelector(`.progress-btn[data-item="${CSS.escape(name)}"]`);
    if (btn) {
      btn.textContent = PROGRESS_ICONS[state];
      btn.title = state.charAt(0).toUpperCase() + state.slice(1);
      btn.dataset.state = state;
    }
  }

  // ── Favorites ──────────────────────────────────────────────────────────────

  function isFavorite(name) {
    const f = loadJSON("favorites");
    return !!f[name];
  }

  function toggleFavorite(name) {
    const f = loadJSON("favorites");
    if (f[name]) {
      delete f[name];
    } else {
      f[name] = true;
    }
    saveJSON("favorites", f);
    updateFavoriteUI(name, !!f[name]);
    updateNavCounters();
  }

  function updateFavoriteUI(name, fav) {
    const btn = document.querySelector(`.fav-btn[data-item="${CSS.escape(name)}"]`);
    if (btn) {
      btn.classList.toggle("active", fav);
      btn.innerHTML = fav ? "★" : "☆";
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function renderHeader(meta) {
    const statsHTML = meta.stats
      ? Object.entries(meta.stats)
          .map(([k, v]) => `<div class="stat"><span class="stat-value">${esc(v)}</span><span class="stat-label">${esc(k)}</span></div>`)
          .join("")
      : "";
    const linksHTML = [];
    if (meta.repoUrl) linksHTML.push(`<a href="${esc(meta.repoUrl)}" target="_blank" rel="noopener" class="header-link">GitHub</a>`);
    if (meta.demoUrl) linksHTML.push(`<a href="${esc(meta.demoUrl)}" target="_blank" rel="noopener" class="header-link">Live Demo</a>`);

    return `
    <header class="ael-header">
      <div class="header-top">
        <div class="header-title-group">
          <h1 class="header-title">${esc(meta.name)}</h1>
          ${meta.version ? `<span class="header-version">v${esc(meta.version)}</span>` : ""}
        </div>
        <div class="header-actions">
          <div class="export-group">
            <button class="export-btn" onclick="window.AEL.exportPDF()" title="Export PDF">PDF</button>
            <button class="export-btn" onclick="window.AEL.exportMarkdown()" title="Export Markdown">MD</button>
            <button class="export-btn" onclick="window.AEL.exportJSON()" title="Export JSON">JSON</button>
          </div>
          ${linksHTML.join("")}
        </div>
      </div>
      ${meta.description ? `<p class="header-desc">${esc(meta.description)}</p>` : ""}
      ${meta.readingTime ? `<p class="header-reading-time">Estimated reading time: ${esc(meta.readingTime)}</p>` : ""}
      ${statsHTML ? `<div class="header-stats">${statsHTML}</div>` : ""}
    </header>`;
  }

  function renderRoadmap(roadmap) {
    if (!roadmap || !roadmap.length) return "";
    const steps = roadmap
      .map((r) => {
        const cats = r.categories ? r.categories.map((c) => `<code>${esc(c)}</code>`).join(" ") : "";
        return `
        <div class="roadmap-step">
          <div class="roadmap-level">${esc(r.level)}</div>
          <div class="roadmap-desc">${esc(r.desc)}</div>
          ${cats ? `<div class="roadmap-categories">${cats}</div>` : ""}
        </div>`;
      })
      .join("");

    return `
    <section class="ael-roadmap" id="roadmap">
      <h2 class="section-title">Learning Roadmap</h2>
      <div class="roadmap-track">${steps}</div>
    </section>`;
  }

  function renderNav(categories, items) {
    const counters = {};
    categories.forEach((c) => {
      counters[c.id] = { total: 0, mastered: 0 };
    });
    items.forEach((item) => {
      if (counters[item.category]) {
        counters[item.category].total++;
        if (getProgress(item.name) === "mastered") counters[item.category].mastered++;
      }
    });

    const links = categories
      .map((c) => {
        const ct = counters[c.id] || { total: 0, mastered: 0 };
        return `<a class="nav-link" href="#cat-${c.id}" data-category="${c.id}">
          <span class="nav-icon">${c.icon || ""}</span>
          <span class="nav-name">${esc(c.name)}</span>
          <span class="nav-counter">${ct.mastered}/${ct.total}</span>
        </a>`;
      })
      .join("");

    return `
    <nav class="ael-nav" id="aelNav">
      <div class="nav-inner">
        <a class="nav-link nav-link-all active" href="#all">All</a>
        ${links}
      </div>
    </nav>`;
  }

  function updateNavCounters() {
    if (!DATA) return;
    const catMap = {};
    DATA.categories.forEach((c) => {
      catMap[c.id] = { total: 0, mastered: 0 };
    });
    DATA.items.forEach((item) => {
      if (catMap[item.category]) {
        catMap[item.category].total++;
        if (getProgress(item.name) === "mastered") catMap[item.category].mastered++;
      }
    });
    document.querySelectorAll(".nav-link[data-category]").forEach((el) => {
      const id = el.dataset.category;
      const ct = catMap[id];
      if (ct) {
        const counter = el.querySelector(".nav-counter");
        if (counter) counter.textContent = `${ct.mastered}/${ct.total}`;
      }
    });
  }

  function renderSearch() {
    return `
    <div class="ael-search" id="aelSearch">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" class="search-input" placeholder="Search items... (press / to focus)" autocomplete="off" />
        <span class="search-count" id="searchCount"></span>
        <button class="search-clear" id="searchClear" title="Clear search">&times;</button>
      </div>
      <div class="filter-bar" id="filterBar">
        <button class="filter-btn filter-all active" data-filter="all">All</button>
        <button class="filter-btn filter-fav" data-filter="favorites">★ Favorites</button>
        <button class="filter-btn" data-filter="beginner">Beginner</button>
        <button class="filter-btn" data-filter="intermediate">Intermediate</button>
        <button class="filter-btn" data-filter="advanced">Advanced</button>
      </div>
    </div>`;
  }

  function renderCategories(categories, items) {
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.id] = { ...c, items: [] };
    });
    items.forEach((item) => {
      if (catMap[item.category]) {
        catMap[item.category].items.push(item);
      }
    });

    const catColorMap = {};
    categories.forEach((c) => {
      catColorMap[c.id] = c.color || "#00FF88";
    });

    const sections = categories
      .map((c) => {
        const cat = catMap[c.id];
        if (!cat || !cat.items.length) return "";
        const itemsHTML = cat.items.map((item) => renderItem(item, catColorMap[item.category])).join("");
        return `
        <section class="ael-category" id="cat-${c.id}" data-category="${c.id}">
          <div class="category-header">
            <span class="category-icon">${c.icon || ""}</span>
            <h2 class="category-title">${esc(c.name)}</h2>
            <span class="category-count">${cat.items.length} items</span>
          </div>
          <div class="category-items">${itemsHTML}</div>
        </section>`;
      })
      .join("");

    return `<div class="ael-categories" id="aelCategories">${sections}</div>`;
  }

  function renderItem(item, color) {
    const itemId = `item-${slugify(item.name)}`;
    const diffClass = `diff-${item.difficulty || "beginner"}`;
    const prog = getProgress(item.name);
    const fav = isFavorite(item.name);
    const platformTags = (item.platforms || []).map((p) => `<span class="platform-tag">${esc(p)}</span>`).join("");

    const flagsHTML = item.flags && item.flags.length
      ? `<div class="item-section">
          <h4 class="item-section-title">Flags & Options</h4>
          <div class="flags-list">
            ${item.flags
              .map(
                (f) => `<div class="flag-row">
                <code class="flag-name">${esc(f.flag)}</code>
                <span class="flag-desc">${esc(f.desc)}</span>
              </div>`
              )
              .join("")}
          </div>
        </div>`
      : "";

    const examplesHTML = item.examples && item.examples.length
      ? `<div class="item-section">
          <h4 class="item-section-title">Examples</h4>
          <div class="examples-list">
            ${item.examples
              .map(
                (ex) => `<div class="example-block">
                <div class="example-header">
                  <span class="example-label">${esc(ex.label)}</span>
                  <button class="copy-btn" data-code="${esc(ex.code)}" title="Copy to clipboard">Copy</button>
                </div>
                <pre class="example-code"><code>${esc(ex.code)}</code></pre>
              </div>`
              )
              .join("")}
          </div>
        </div>`
      : "";

    const tipHTML = item.tip
      ? `<div class="item-section item-tip">
          <h4 class="item-section-title">💡 Tip</h4>
          <p>${esc(item.tip)}</p>
        </div>`
      : "";

    const relatedHTML = item.related && item.related.length
      ? `<div class="item-section">
          <h4 class="item-section-title">Related</h4>
          <div class="related-list">
            ${item.related.map((r) => `<span class="related-tag">${esc(r)}</span>`).join("")}
          </div>
        </div>`
      : "";

    const refsHTML = item.refs && item.refs.length
      ? `<div class="item-section">
          <h4 class="item-section-title">References</h4>
          <div class="refs-list">
            ${item.refs
              .map(
                (r) => `<a class="ref-link" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)}</a>`
              )
              .join("")}
          </div>
        </div>`
      : "";

    return `
    <article class="item-card" id="${itemId}" data-name="${esc(item.name)}" data-category="${esc(item.category)}" data-difficulty="${esc(item.difficulty || "beginner")}">
      <div class="card-header" role="button" tabindex="0" aria-expanded="false">
        <div class="card-header-left">
          <button class="progress-btn" data-item="${esc(item.name)}" data-state="${prog}" title="${prog}">${PROGRESS_ICONS[prog]}</button>
          <div class="card-title-group">
            <h3 class="card-name">${esc(item.name)}</h3>
            ${item.syntax ? `<code class="card-syntax">${esc(item.syntax)}</code>` : ""}
          </div>
        </div>
        <div class="card-header-right">
          ${platformTags ? `<div class="card-platforms">${platformTags}</div>` : ""}
          <span class="card-difficulty ${diffClass}">${esc(item.difficulty || "beginner")}</span>
          <button class="fav-btn" data-item="${esc(item.name)}" title="Toggle favorite">${fav ? "★" : "☆"}</button>
          <span class="card-arrow">▶</span>
        </div>
      </div>
      <div class="card-body">
        <p class="card-desc">${esc(item.desc)}</p>
        ${flagsHTML}
        ${examplesHTML}
        ${tipHTML}
        ${relatedHTML}
        ${refsHTML}
      </div>
    </article>`;
  }

  function renderGlossary(glossary) {
    if (!glossary || !glossary.length) return "";
    const rows = glossary
      .map((g) => `<tr><td class="glossary-term">${esc(g.term)}</td><td class="glossary-desc">${esc(g.desc)}</td></tr>`)
      .join("");
    return `
    <section class="ael-glossary" id="glossary">
      <h2 class="section-title">Glossary</h2>
      <table class="glossary-table">
        <thead><tr><th>Term</th><th>Description</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  function renderFooter(meta) {
    const year = new Date().getFullYear();
    return `
    <footer class="ael-footer">
      <div class="footer-inner">
        <p class="footer-text">${esc(meta.name)} v${esc(meta.version || "1.0.0")} &copy; ${year} AEL Engineering. All rights reserved.</p>
        <p class="footer-text footer-sub">Built with the AEL Reference Engine.</p>
      </div>
    </footer>`;
  }

  function renderScrollProgress() {
    return `<div class="scroll-progress" id="scrollProgress"></div>`;
  }

  function renderBackToTop() {
    return `<button class="back-to-top" id="backToTop" title="Back to top">↑</button>`;
  }

  // ── Search & Filter ────────────────────────────────────────────────────────

  function scoreItem(item, q) {
    const lower = q.toLowerCase();
    let score = 0;
    if (item.name && item.name.toLowerCase().includes(lower)) score += 100;
    if (item.syntax && item.syntax.toLowerCase().includes(lower)) score += 90;
    if (item.flags && item.flags.some((f) => f.flag.toLowerCase().includes(lower))) score += 80;
    if (item.related && item.related.some((r) => r.toLowerCase().includes(lower))) score += 60;
    if (item.desc && item.desc.toLowerCase().includes(lower)) score += 40;
    if (item.examples && item.examples.some((e) => (e.code + " " + e.label).toLowerCase().includes(lower))) score += 30;
    if (item.platforms && item.platforms.some((p) => p.toLowerCase().includes(lower))) score += 20;
    return score;
  }

  function applyFilters() {
    if (!DATA) return;
    const q = searchQuery.trim().toLowerCase();
    const cards = document.querySelectorAll(".item-card");
    const catSections = document.querySelectorAll(".ael-category");
    let visibleCount = 0;

    cards.forEach((card) => {
      const name = card.dataset.name;
      const category = card.dataset.category;
      const difficulty = card.dataset.difficulty;
      const itemData = DATA.items.find((i) => i.name === name);
      let show = true;

      // Favorites filter
      if (showingFavoritesOnly && !isFavorite(name)) {
        show = false;
      }

      // Difficulty filter
      if (show && activeFilters.has("beginner") && difficulty !== "beginner") show = false;
      if (show && activeFilters.has("intermediate") && difficulty !== "intermediate") show = false;
      if (show && activeFilters.has("advanced") && difficulty !== "advanced") show = false;

      // Search filter
      if (show && q && itemData) {
        const score = scoreItem(itemData, q);
        if (score === 0) show = false;
      }

      card.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    // Hide empty category sections
    catSections.forEach((sec) => {
      const visItems = sec.querySelectorAll(".item-card:not([style*='display: none']), .item-card:not([style*='display:none'])");
      const anyVisible = Array.from(visItems).some((el) => el.style.display !== "none");
      sec.style.display = anyVisible ? "" : "none";
    });

    const countEl = document.getElementById("searchCount");
    if (countEl) {
      if (q || showingFavoritesOnly || activeFilters.size > 0) {
        countEl.textContent = `${visibleCount} result${visibleCount !== 1 ? "s" : ""}`;
      } else {
        countEl.textContent = "";
      }
    }
  }

  // ── Scroll Spy ─────────────────────────────────────────────────────────────

  function initScrollSpy() {
    const sections = document.querySelectorAll(".ael-category");
    const navLinks = document.querySelectorAll(".nav-link[data-category]");
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
            });
          }
        });
      },
      { rootMargin: "-20% 0px -75% 0px", threshold: 0 }
    );

    sections.forEach((sec) => observer.observe(sec));
  }

  // ── Scroll Progress Bar ────────────────────────────────────────────────────

  function updateScrollProgress() {
    const bar = document.getElementById("scrollProgress");
    if (!bar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + "%";
  }

  // ── Back to Top ────────────────────────────────────────────────────────────

  function updateBackToTop() {
    const btn = document.getElementById("backToTop");
    if (!btn) return;
    btn.classList.toggle("visible", window.scrollY > BACK_TO_TOP_THRESHOLD);
  }

  // ── URL Hash Navigation ────────────────────────────────────────────────────

  function scrollToHash() {
    const hash = window.location.hash;
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // If it is an item card, expand it
        if (target.classList.contains("item-card")) {
          expandCard(target);
        }
      }, 100);
    }
  }

  function expandCard(card) {
    if (!card.classList.contains("expanded")) {
      card.classList.add("expanded");
      const header = card.querySelector(".card-header");
      if (header) header.setAttribute("aria-expanded", "true");
    }
  }

  // ── Export Functions ────────────────────────────────────────────────────────

  function exportPDF() {
    window.print();
  }

  function exportMarkdown() {
    if (!DATA) return;
    let md = `# ${DATA.meta.name}\n\n`;
    md += `> ${DATA.meta.description || ""}\n\n`;
    if (DATA.meta.version) md += `**Version:** ${DATA.meta.version}\n\n`;

    DATA.categories.forEach((cat) => {
      const items = DATA.items.filter((i) => i.category === cat.id);
      if (!items.length) return;
      md += `## ${cat.icon || ""} ${cat.name}\n\n`;
      items.forEach((item) => {
        md += `### ${item.name}\n\n`;
        if (item.syntax) md += `\`${item.syntax}\`\n\n`;
        md += `${item.desc}\n\n`;
        if (item.difficulty) md += `**Difficulty:** ${item.difficulty}\n\n`;
        if (item.platforms && item.platforms.length) md += `**Platforms:** ${item.platforms.join(", ")}\n\n`;
        if (item.flags && item.flags.length) {
          md += `**Flags:**\n\n`;
          item.flags.forEach((f) => {
            md += `- \`${f.flag}\` — ${f.desc}\n`;
          });
          md += "\n";
        }
        if (item.examples && item.examples.length) {
          md += `**Examples:**\n\n`;
          item.examples.forEach((ex) => {
            md += `**${ex.label}:**\n\`\`\`bash\n${ex.code}\n\`\`\`\n\n`;
          });
        }
        if (item.tip) md += `> 💡 **Tip:** ${item.tip}\n\n`;
        if (item.related && item.related.length) md += `**Related:** ${item.related.join(", ")}\n\n`;
        if (item.refs && item.refs.length) {
          md += `**References:**\n`;
          item.refs.forEach((r) => {
            md += `- [${r.label}](${r.url})\n`;
          });
          md += "\n";
        }
        md += `---\n\n`;
      });
    });

    if (DATA.glossary && DATA.glossary.length) {
      md += `## Glossary\n\n`;
      md += `| Term | Description |\n|------|-------------|\n`;
      DATA.glossary.forEach((g) => {
        md += `| ${g.term} | ${g.desc} |\n`;
      });
      md += "\n";
    }

    downloadFile(`${DATA.meta.shortName || "reference"}.md`, md, "text/markdown");
  }

  function exportJSON() {
    if (!DATA) return;
    downloadFile(`${DATA.meta.shortName || "reference"}.json`, JSON.stringify(DATA, null, 2), "application/json");
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Event Binding ──────────────────────────────────────────────────────────

  function bindEvents() {
    // Card expand/collapse
    document.addEventListener("click", (e) => {
      const header = e.target.closest(".card-header");
      if (header && !e.target.closest(".progress-btn") && !e.target.closest(".fav-btn")) {
        const card = header.closest(".item-card");
        if (!card) return;
        const isExpanded = card.classList.contains("expanded");
        card.classList.toggle("expanded");
        header.setAttribute("aria-expanded", String(!isExpanded));
        if (!isExpanded) {
          window.location.hash = card.id;
        }
      }
    });

    // Keyboard enter on card header
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const header = e.target.closest(".card-header");
        if (header) header.click();
      }
    });

    // Progress buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".progress-btn");
      if (btn) {
        e.stopPropagation();
        cycleProgress(btn.dataset.item);
      }
    });

    // Favorite buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".fav-btn");
      if (btn) {
        e.stopPropagation();
        toggleFavorite(btn.dataset.item);
      }
    });

    // Copy buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (btn) {
        const code = btn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "✅ Copied";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 1500);
        });
      }
    });

    // Search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        debounce(() => {
          searchQuery = searchInput.value;
          applyFilters();
        }, DEBOUNCE_MS)
      );
    }

    // Search clear
    const searchClear = document.getElementById("searchClear");
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        searchQuery = "";
        applyFilters();
      });
    }

    // Filter buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      const filter = btn.dataset.filter;

      if (filter === "all") {
        activeFilters.clear();
        showingFavoritesOnly = false;
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      } else if (filter === "favorites") {
        showingFavoritesOnly = !showingFavoritesOnly;
        btn.classList.toggle("active", showingFavoritesOnly);
        // Deactivate "all" if favorites active
        const allBtn = document.querySelector(".filter-btn.filter-all");
        if (allBtn && showingFavoritesOnly) allBtn.classList.remove("active");
        if (!showingFavoritesOnly && activeFilters.size === 0 && allBtn) allBtn.classList.add("active");
      } else {
        // Difficulty filters
        if (activeFilters.has(filter)) {
          activeFilters.delete(filter);
          btn.classList.remove("active");
        } else {
          activeFilters.add(filter);
          btn.classList.add("active");
        }
        // Deactivate "all" if any specific filter active
        const allBtn = document.querySelector(".filter-btn.filter-all");
        if (allBtn) {
          if (activeFilters.size > 0) allBtn.classList.remove("active");
          else if (!showingFavoritesOnly) allBtn.classList.add("active");
        }
      }
      applyFilters();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
      if (e.key === "Escape") {
        if (searchInput && document.activeElement === searchInput) {
          searchInput.value = "";
          searchQuery = "";
          searchInput.blur();
          applyFilters();
        }
      }
    });

    // Scroll events
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollProgress();
          updateBackToTop();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Back to top
    const btt = document.getElementById("backToTop");
    if (btt) {
      btt.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Nav link clicks — smooth scroll + active
    document.addEventListener("click", (e) => {
      const link = e.target.closest(".nav-link");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      if (href === "#all") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      }
    });
  }

  // ── Render Everything ──────────────────────────────────────────────────────

  function render(data) {
    // Emit before:render hook
    if (window.AEL?.events) {
      window.AEL.events.emit('before:render', { data });
    }

    const main = document.getElementById("mainContent");
    if (!main) {
      console.error("AEL Engine: #mainContent container not found.");
      return;
    }

    let html = "";
    html += renderScrollProgress();
    html += renderBackToTop();
    html += renderHeader(data.meta);
    html += renderRoadmap(data.roadmap);
    html += renderNav(data.categories, data.items);
    html += renderSearch();
    html += renderCategories(data.categories, data.items);
    html += renderGlossary(data.glossary);
    html += renderFooter(data.meta);

    main.innerHTML = html;

    bindEvents();
    initScrollSpy();
    updateScrollProgress();
    updateBackToTop();

    // Emit after:render hook
    if (window.AEL?.events) {
      window.AEL.events.emit('after:render', { data, timestamp: Date.now() });
    }

    // Restore hashes
    requestAnimationFrame(() => {
      scrollToHash();
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  async function init() {
    try {
      // Emit before:init hook
      if (window.AEL?.events) {
        window.AEL.events.emit('before:init', { timestamp: Date.now() });
      }

      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
      DATA = await res.json();

      // Emit on:data:load hook
      if (window.AEL?.events) {
        window.AEL.events.emit('on:data:load', { data: DATA });
      }

      render(DATA);

      // Emit after:init hook
      if (window.AEL?.events) {
        window.AEL.events.emit('after:init', { data: DATA, timestamp: Date.now() });
      }
    } catch (err) {
      console.error("AEL Engine initialization failed:", err);
      if (window.AEL?.events) {
        window.AEL.events.emit('on:error', { error: err });
      }
      const main = document.getElementById("mainContent");
      if (main) {
        main.innerHTML = `
          <div style="text-align:center;padding:4rem 2rem;font-family:sans-serif;">
            <h2>Failed to load reference data</h2>
            <p style="opacity:0.7;margin-top:1rem;">${esc(err.message)}</p>
            <p style="opacity:0.5;margin-top:0.5rem;">Ensure <code>data.json</code> is present and valid.</p>
          </div>`;
      }
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  window.AEL = window.AEL || {};
  window.AEL.init = init;
  window.AEL.render = () => render(DATA);
  window.AEL.exportPDF = exportPDF;
  window.AEL.exportMarkdown = exportMarkdown;
  window.AEL.exportJSON = exportJSON;
  window.AEL.getData = () => DATA;
  window.AEL.search = (q) => {
    searchQuery = q;
    const si = document.getElementById("searchInput");
    if (si) si.value = q;
    applyFilters();
  };
  window.AEL.expandAll = () => {
    document.querySelectorAll(".item-card").forEach((card) => expandCard(card));
  };
  window.AEL.collapseAll = () => {
    document.querySelectorAll(".item-card").forEach((card) => {
      card.classList.remove("expanded");
      const h = card.querySelector(".card-header");
      if (h) h.setAttribute("aria-expanded", "false");
    });
  };
  window.AEL.destroy = () => {
    if (window.AEL?.events) {
      window.AEL.events.emit('destroy', { timestamp: Date.now() });
    }
    const main = document.getElementById("mainContent");
    if (main) main.innerHTML = '';
    DATA = null;
  };

  // Auto-init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
