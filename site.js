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
        if (version) document.querySelectorAll("[data-version]").forEach((el) => (el.textContent = `Version ${version}`));
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
