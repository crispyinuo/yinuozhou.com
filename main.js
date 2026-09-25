(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  $("#year").textContent = new Date().getFullYear();

  /* ───────────── Water chimes (used by scene.js) ───────────── */
  let ctx, out;
  let soundOn = false;
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      out = ctx.createGain();
      out.gain.value = 0.35;
      // soft hall: a decaying noise impulse
      const len = ctx.sampleRate * 3.5;
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      const verb = ctx.createConvolver();
      verb.buffer = ir;
      const wet = ctx.createGain();
      wet.gain.value = 0.55;
      out.connect(ctx.destination);
      out.connect(verb).connect(wet).connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // D major pentatonic, two octaves — nothing can sound wrong
  const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  window.chime = (x = 0.5, depth = 0.5) => {
    if (!soundOn) return;
    const c = audio();
    const t = c.currentTime;
    // nearer water rings lower, the horizon rings higher
    const idx = Math.max(0, Math.min(SCALE.length - 1, Math.round(depth * (SCALE.length - 1) + (Math.random() * 2 - 1))));
    const f = hz(SCALE[idx]);
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pan) pan.pan.value = Math.max(-0.8, Math.min(0.8, (x - 0.5) * 1.6));
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    [1, 2.01, 3.98].forEach((mult, i) => {
      const o = c.createOscillator();
      const og = c.createGain();
      o.type = "sine";
      o.frequency.value = f * mult;
      og.gain.value = [1, 0.18, 0.05][i];
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 3.3);
    });
    pan ? g.connect(pan).connect(out) : g.connect(out);
  };
  const soundBtn = $("#sound");
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", soundOn);
    $(".sound-label", soundBtn).textContent = soundOn ? "Sound on" : "Sound off";
    if (soundOn) { audio(); window.chime(0.5, 0.5); }
  });

  /* ───────────── Work ───────────── */
  const P = window.PROJECTS;
  $("#works").innerHTML = P.map((p, i) => {
    const by = p.feat ? `with ${p.feat.join(", ")}` : "Solo project";
    return `
      <button class="work reveal" data-i="${i}" aria-haspopup="dialog">
        <span class="work-img"><img src="${p.img}" alt="" loading="lazy" class="${p.fit === "contain" ? "contain" : ""}" /></span>
        <span class="work-meta">
          <span class="work-fmt">${esc(p.format)}</span>
          <span class="work-title">${esc(p.title)}</span>
          <span class="work-by">${esc(by)}</span>
          ${p.award ? `<span class="work-award">${esc(p.award.replace(/^\S+\s/, ""))}</span>` : ""}
        </span>
      </button>`;
  }).join("");

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
      .map((l) => `<a class="link-line" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}${isExternal(l.href) ? " ↗" : ""}</a>`)
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
        const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent("https://api.soundcloud.com/tracks/" + s.track)}&color=%2397664c&auto_play=true&hide_related=true&show_comments=false&show_reposts=false&visual=false`;
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

  /* ───────────── Nav state + header tone ───────────── */
  const sections = $$("main > section");
  const navLinks = $$(".topbar nav a");
  function onScroll() {
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= 120) current = s;
    // the 3D scene sets the tone from the actual sky once it's running
    if (!window.sceneTone) document.body.dataset.tone = current.dataset.tone;
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + current.id));
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ───────────── Reveal ───────────── */
  $$(".chapter-head, .paper, .play-col, .closing > *:not(.footer)").forEach((el) => el.classList.add("reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }),
      { rootMargin: "0px 0px -10% 0px" }
    );
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }
})();
