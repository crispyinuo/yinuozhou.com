(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const body = document.body;

  $("#year").textContent = new Date().getFullYear();

  /* ───────────── Pages ───────────── */
  // The garden is the menu: a building click glides the camera over (scene.js listens for
  // garden:focus / garden:overview), then the section opens as a full page.
  const page = $("#page");
  const scroller = $("#page-scroll");
  const sections = Object.fromEntries($$("#page-body > section").map((s) => [s.dataset.section, s]));
  const ORDER = Object.keys(sections);
  const NAMES = Object.fromEntries($$(".dock button").map((b) => [b.dataset.open, $("b", b).textContent]));
  let current = null;
  let shownTimer;

  function show(id) {
    const sec = sections[id];
    current = id;
    Object.values(sections).forEach((s) => s.classList.toggle("is-active", s === sec));
    $("#page-kicker").textContent = sec.dataset.kicker;
    $("#page-icon").setAttribute("href", "#i-" + id);
    $("#page-title").textContent = sec.dataset.title;
    $("#page-lede").textContent = sec.dataset.lede || $(":scope > .lede", sec)?.textContent || "";
    const next = ORDER[(ORDER.indexOf(id) + 1) % ORDER.length];
    $("#next").dataset.to = next;
    $("#next-name").textContent = `${NAMES[next]} →`;
    $$(".tabs button").forEach((b) => b.setAttribute("aria-current", b.dataset.tab === id));
    $(`.tabs button[data-tab="${id}"]`).scrollIntoView({ inline: "center", block: "nearest" });
    $$(".dock button").forEach((b) => b.setAttribute("aria-current", b.dataset.open === id));
    scroller.scrollTop = 0;
    history.replaceState(null, "", "#" + id);
    dispatchEvent(new CustomEvent("garden:focus", { detail: id }));
  }
  function open(id) {
    if (!sections[id]) return;
    const wasOpen = !!current;
    show(id);
    page.hidden = false;
    // let the camera glide toward the building before the page rises over it
    requestAnimationFrame(() => body.classList.add("is-open"));
    clearTimeout(shownTimer);
    shownTimer = setTimeout(() => body.classList.add("page-shown"), wasOpen ? 0 : 1300);
    if (!wasOpen) setTimeout(() => $("#back").focus({ preventScroll: true }), 900);
  }
  function close() {
    if (!current) return;
    const was = current;
    current = null;
    clearTimeout(shownTimer);
    body.classList.remove("is-open", "page-shown");
    $$(".dock button").forEach((b) => b.setAttribute("aria-current", false));
    history.replaceState(null, "", location.pathname);
    dispatchEvent(new CustomEvent("garden:overview"));
    setTimeout(() => { if (!current) page.hidden = true; }, 900);
    $(`.dock button[data-open="${was}"]`)?.focus({ preventScroll: true });
  }
  window.garden = { open, close, get current() { return current; } };

  $("#back").addEventListener("click", close);
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  $("#next").addEventListener("click", (e) => show(e.currentTarget.dataset.to));
  $$(".dock button").forEach((b) => {
    b.addEventListener("click", () => open(b.dataset.open));
    b.addEventListener("pointerenter", () => dispatchEvent(new CustomEvent("garden:hover", { detail: b.dataset.open })));
    b.addEventListener("pointerleave", () => dispatchEvent(new CustomEvent("garden:hover", { detail: null })));
  });
  $("#home-link").addEventListener("click", (e) => { e.preventDefault(); close(); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && current && !$("#modal").open) close();
  });
  // experience entries are always open here; keep them from collapsing
  $$(".role summary").forEach((sm) => sm.addEventListener("click", (e) => e.preventDefault()));

  /* ───────────── Projects ───────────── */
  const P = window.PROJECTS;
  $("#works").innerHTML = P.map((p, i) => `
    <button class="work" data-i="${i}" aria-haspopup="dialog">
      <span class="work-img"><img src="${p.img}" alt="" loading="lazy" class="${p.fit === "contain" ? "contain" : ""}" /></span>
      <span class="work-meta">
        <span class="work-fmt">${esc(p.format)}${p.event ? " · " + esc(p.event.label) : ""}</span>
        <span class="work-title">${esc(p.title)}</span>
        ${p.award ? `<span class="work-award">${esc(p.award.split("·")[0].replace(/^\S+\s/, "").trim())}</span>` : ""}
        <span class="work-desc">${esc(p.desc[0])}</span>
        <span class="work-by">${p.feat ? "with " + esc(p.feat.join(", ")) : "Solo project"}</span>
        <span class="work-more">Open project</span>
      </span>
    </button>`).join("");

  /* ───────────── Modal ───────────── */
  const modal = $("#modal");
  const isExternal = (href) => /^https?:/.test(href);
  const ytFrame = (id, title) =>
    `<iframe class="video" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"></iframe>`;

  function openModal({ media = "", kicker = "", title, feat = "", award = "", desc = [], skills = [], links = [] }) {
    $("#modal-media").innerHTML = media;
    $("#modal-kicker").innerHTML = kicker;
    $("#modal-title").textContent = title;
    $("#modal-feat").textContent = feat;
    $("#modal-award").textContent = award;
    $("#modal-desc").innerHTML = desc.map((d) => `<p>${esc(d)}</p>`).join("");
    $("#modal-skills").innerHTML = skills.map((k) => `<span>${esc(k)}</span>`).join("");
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
      skills: p.skills,
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
  if (sections[initial]) addEventListener("load", () => setTimeout(() => open(initial), 300));
})();
