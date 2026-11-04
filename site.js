(function () {
  // Мова сайту: ?lang=… → збережений вибір → мова браузера → англійська.
  const dict = window.MITLA_I18N || {};
  const codes = Object.keys(dict);
  const STORE = "mitla.lang";
  // Версія з HTML, поки GitHub API не відповів.
  let version = (document.querySelector("[data-version]")?.textContent.match(/\d[\w.-]*/) || [null])[0];

  function match(tag) {
    if (!tag) return null;
    const t = tag.toLowerCase();
    const exact = codes.find((c) => c.toLowerCase() === t);
    if (exact) return exact;
    const base = t.split("-")[0];
    if (base === "zh") return dict["zh-Hans"] ? "zh-Hans" : null; // китайська: лише спрощена
    return codes.find((c) => c.toLowerCase().split("-")[0] === base) || null;
  }
  function detect() {
    const param = new URLSearchParams(location.search).get("lang");
    if (match(param)) return match(param);
    try { const saved = localStorage.getItem(STORE); if (match(saved)) return match(saved); } catch (e) {}
    for (const l of navigator.languages || [navigator.language]) { const m = match(l); if (m) return m; }
    return "en";
  }

  let current = detect();
  function apply() {
    const d = dict[current];
    if (!d) return;
    document.documentElement.lang = current;
    if (d.title) document.title = d.title;
    document.querySelectorAll("[data-i18n]").forEach((el) => { const v = d[el.dataset.i18n]; if (v != null) el.textContent = v; });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => { const v = d[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
    if (version && d.version) document.querySelectorAll("[data-version]").forEach((el) => (el.textContent = d.version.replace("{v}", version)));
  }

  const select = document.getElementById("lang-select");
  if (select && codes.length) {
    codes.forEach((c) => select.add(new Option(dict[c].name, c)));
    select.value = current;
    select.addEventListener("change", () => {
      current = select.value;
      try { localStorage.setItem(STORE, current); } catch (e) {}
      apply();
    });
  }
  if (current !== "en") apply();

  window.MITLA_SET_VERSION = (v) => { version = v; apply(); };
})();

// Кнопки «Download» ведуть на DMG з останнього релізу GitHub.
// Репозиторій задано в <meta name="mitla:repo"> у index.html.
// Посилання releases/latest/download/Mitla.dmg працює й без JavaScript-запиту:
// `fastlane mac publish` завжди додає до релізу файл саме з такою назвою.
(function () {
  const repo = document.querySelector('meta[name="mitla:repo"]')?.content?.trim();
  const configured = repo && !repo.startsWith("OWNER/");

  if (configured) {
    const base = `https://github.com/${repo}`;
    const dmg = `${base}/releases/latest/download/Mitla.dmg`;
    document.querySelectorAll("[data-download]").forEach((a) => (a.href = dmg));
    document.querySelectorAll("[data-repo-link]").forEach((a) => (a.href = base));
    document.querySelectorAll("[data-releases-link]").forEach((a) => (a.href = `${base}/releases`));

    // Номер версії й розмір — з API; якщо запит не вдався, лишаються значення з HTML.
    fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((release) => {
        const version = String(release.tag_name || "").replace(/^v/, "");
        if (version) window.MITLA_SET_VERSION(version);
        const asset = (release.assets || []).find((a) => /\.dmg$/i.test(a.name));
        if (!asset) return;
        document.querySelectorAll("[data-download]").forEach((a) => (a.href = asset.browser_download_url));
        const mb = asset.size / 1e6;
        document.querySelectorAll("[data-size]").forEach((el) => {
          el.textContent = `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
          el.hidden = false;
        });
      })
      .catch(() => {});
  }

  // Вкладки з функціями.
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  function select(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });
})();
