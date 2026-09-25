(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const body = document.body;

  $("#year").textContent = new Date().getFullYear();

  /* ───────────── Intro ───────────── */
  function enter() {
    if (!body.classList.contains("is-intro")) return;
    body.classList.remove("is-intro");
    dispatchEvent(new CustomEvent("garden:enter"));
  }
  $("#enter").addEventListener("click", enter);

  /* ───────────── Panels ───────────── */
  // The scene listens for garden:focus / garden:overview to move the camera.
  const panel = $("#panel");
  const sections = Object.fromEntries($$("#panel-body > section").map((s) => [s.dataset.section, s]));
  let current = null;

  function open(id, { fromHash = false } = {}) {
    const sec = sections[id];
    if (!sec) return;
    enter();
    current = id;
    Object.values(sections).forEach((s) => s.classList.toggle("is-active", s === sec));
    $("#panel-kicker").textContent = sec.dataset.kicker;
    $("#panel-title").textContent = sec.dataset.title;
    panel.hidden = false;
    $("#panel-body").scrollTop = 0;
    body.classList.add("is-open");
    $$(".dock button").forEach((b) => b.setAttribute("aria-current", b.dataset.open === id));
    if (!fromHash) history.replaceState(null, "", "#" + id);
    dispatchEvent(new CustomEvent("garden:focus", { detail: id }));
    requestAnimationFrame(() => $("#panel-close").focus({ preventScroll: true }));
  }
  function close() {
    if (!current) return;
    const was = current;
    current = null;
    body.classList.remove("is-open");
    $$(".dock button").forEach((b) => b.setAttribute("aria-current", false));
    history.replaceState(null, "", location.pathname);
    dispatchEvent(new CustomEvent("garden:overview"));
    $(`.dock button[data-open="${was}"]`)?.focus({ preventScroll: true });
  }
  window.garden = { open, close, get current() { return current; } };

  $("#panel-close").addEventListener("click", close);
  $$(".dock button").forEach((b) => {
    b.addEventListener("click", () => (current === b.dataset.open ? close() : open(b.dataset.open)));
    b.addEventListener("pointerenter", () => dispatchEvent(new CustomEvent("garden:hover", { detail: b.dataset.open })));
    b.addEventListener("pointerleave", () => dispatchEvent(new CustomEvent("garden:hover", { detail: null })));
  });
  $("#home-link").addEventListener("click", (e) => { e.preventDefault(); close(); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && current && !$("#modal").open) close();
  });

  /* ───────────── Projects ───────────── */
  const P = window.PROJECTS;
  $("#works").innerHTML = P.map((p, i) => `
    <button class="work" data-i="${i}" aria-haspopup="dialog">
      <span class="work-img"><img src="${p.img}" alt="" loading="lazy" class="${p.fit === "contain" ? "contain" : ""}" /></span>
      <span class="work-meta">
        <span class="work-fmt">${esc(p.format)}</span>
        <span class="work-title">${esc(p.title)}</span>
        ${p.award ? `<span class="work-award">${esc(p.award.split("·")[0].replace(/^\S+\s/, "").trim())}</span>` : ""}
      </span>
    </button>`).join("");

  /* ───────────── Modal ───────────── */
  const modal = $("#modal");
  const isExternal = (href) => /^https?:/.test(href);
  const ytFrame = (id, title) =>
    `<iframe class="video" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"></iframe>`;

  function openModal({ media = "", kicker = "", title, feat = "", award = "", desc = [], skills = "", links = [] }) {
    $("#modal-media").innerHTML = media;
    $("#modal-kicker").innerHTML = kicker;
    $("#modal-title").textContent = title;
    $("#modal-feat").textContent = feat;
    $("#modal-award").textContent = award;
    $("#modal-desc").innerHTML = desc.map((d) => `<p>${esc(d)}</p>`).join("");
    $("#modal-skills").textContent = skills;
    $("#modal-links").innerHTML = links
      .map((l) => `<a class="link" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}${isExternal(l.href) ? " ↗" : ""}</a>`)
      .join("");
    modal.showModal();
    modal.scrollTop = 0;
  }
  function openProject(p) {
    let media;
    if (p.video) media = `<video src="${p.video}" controls playsinline preload="metadata" poster="${p.img}"></video>`;
    else if (p.youtube) media = ytFrame(p.youtube, `${p.title} demo`);
    else media = `<img src="${p.img}" alt="${esc(p.title)}" />`;
    openModal({
      media,
      kicker: esc(p.format) + (p.event ? ` · <a href="${p.event.href}" target="_blank" rel="noopener">${esc(p.event.label)}</a>` : ""),
      title: p.title,
      feat: p.feat ? `with ${p.feat.join(", ")}` : "",
      award: p.award ? p.award.replace(/^\S+\s/, "") : "",
      desc: p.desc,
      skills: p.skills.join("  ·  "),
      links: p.links,
    });
  }
  modal.addEventListener("close", () => ($("#modal-media").innerHTML = ""));
  $("#modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  $$(".work").forEach((b) => b.addEventListener("click", () => openProject(P[+b.dataset.i])));

  /* ───────────── Play ───────────── */
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const item = (i, title, sub, kind) => `
    <li><button class="play-item" data-kind="${kind}" data-i="${i}">
      <span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>
      <span class="go" aria-hidden="true">${kind === "songs" ? "listen" : "watch"}</span>
    </button></li>`;
  $("#list-dance").innerHTML = window.DANCE.map((d, i) => item(i, d.title, d.where, "dance")).join("");
  $("#list-choir").innerHTML = window.CHOIR.map((d, i) => item(i, d.title, d.where, "choir")).join("");
  $("#list-songs").innerHTML = window.SONGS.map((s, i) => item(i, s.title, s.note ? cap(s.note) : "Original", "songs")).join("");
  $$(".play-item").forEach((b) =>
    b.addEventListener("click", () => {
      const i = +b.dataset.i;
      if (b.dataset.kind === "songs") {
        const s = window.SONGS[i];
        const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent("https://api.soundcloud.com/tracks/" + s.track)}&color=%236b8458&auto_play=true&hide_related=true&show_comments=false&show_reposts=false&visual=false`;
        openModal({
          media: `<iframe class="audio" src="${src}" title="${esc(s.title)} on SoundCloud" allow="autoplay"></iframe>`,
          kicker: "Song · Zoe Zhou",
          title: s.title,
          feat: s.note ? cap(s.note) : "",
        });
      } else {
        const d = (b.dataset.kind === "dance" ? window.DANCE : window.CHOIR)[i];
        openModal({ media: ytFrame(d.id, d.title), kicker: b.dataset.kind === "dance" ? "Dance" : "Choir", title: d.title, feat: d.where });
      }
    })
  );

  /* ───────────── Deep links ───────────── */
  const initial = location.hash.slice(1);
  if (sections[initial]) {
    // let the scene start first so the camera can glide in
    addEventListener("load", () => setTimeout(() => open(initial, { fromHash: true }), 300));
  }
})();
