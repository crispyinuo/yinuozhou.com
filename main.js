(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  $("#year").textContent = new Date().getFullYear();

  /* ───────────── Audio ───────────── */
  let ctx, master;
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.22;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, when = 0, dur = 0.55, type = "triangle") {
    const c = audio();
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o2.type = "sine";
    o.frequency.value = freq;
    o2.frequency.value = freq * 2.001;
    const g2 = c.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.8, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  /* ───────────── Synth keyboard ───────────── */
  // C4..C5, mapped to the home row like a DAW's typing keyboard
  const NOTES = [
    { n: 60, k: "a", w: true, name: "C" },
    { n: 61, k: "w" },
    { n: 62, k: "s", w: true, name: "D" },
    { n: 63, k: "e" },
    { n: 64, k: "d", w: true, name: "E" },
    { n: 65, k: "f", w: true, name: "F" },
    { n: 66, k: "t" },
    { n: 67, k: "g", w: true, name: "G" },
    { n: 68, k: "y" },
    { n: 69, k: "h", w: true, name: "A" },
    { n: 70, k: "u" },
    { n: 71, k: "j", w: true, name: "B" },
    { n: 72, k: "k", w: true, name: "C" },
  ];
  const keysEl = $("#keys");
  const keyByLetter = {};
  let whiteIndex = 0;
  NOTES.forEach((note) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "key" + (note.w ? "" : " black");
    b.setAttribute("aria-label", `Play note ${note.name || "sharp"} (${note.k.toUpperCase()})`);
    b.textContent = note.k.toUpperCase();
    if (note.w) whiteIndex++;
    else b.style.left = `calc(${(whiteIndex / 8) * 100}% - (100% / 8 * 0.3))`;
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      press(note, b);
    });
    keysEl.appendChild(b);
    note.el = b;
    keyByLetter[note.k] = note;
  });

  const NOTE_GLYPHS = ["♪", "♫", "♬", "♩", "✦"];
  const NOTE_COLORS = ["var(--tomato)", "var(--blue)", "var(--pink)", "#3aa76d", "var(--ink)"];
  function burst(el) {
    if (reduceMotion) return;
    const r = el.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "note-fx";
    s.textContent = NOTE_GLYPHS[(Math.random() * NOTE_GLYPHS.length) | 0];
    s.style.left = r.left + r.width / 2 - 10 + "px";
    s.style.top = r.top - 10 + "px";
    s.style.color = NOTE_COLORS[(Math.random() * NOTE_COLORS.length) | 0];
    s.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
    s.style.setProperty("--rot", (Math.random() * 60 - 30).toFixed(0) + "deg");
    document.body.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
  }
  function press(note, el = note.el) {
    tone(midi(note.n));
    el.classList.add("on");
    setTimeout(() => el.classList.remove("on"), 160);
    // show particles from the on-screen key if visible, else near the bottom bar
    const r = el.getBoundingClientRect();
    burst(r.bottom > 0 && r.top < innerHeight ? el : $(".nowplaying"));
  }
  addEventListener("keydown", (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
    const note = keyByLetter[e.key.toLowerCase()];
    if (note) press(note);
  });

  /* ───────────── Vinyl: plays a little loop ───────────── */
  const vinyl = $("#vinyl");
  // a small, bouncy I–V–vi–IV arpeggio
  const LOOP = [
    [60, 64, 67, 72], [67, 71, 74, 79], [69, 72, 76, 81], [65, 69, 72, 77],
  ];
  let loopTimer = null;
  function playBar(i) {
    const chord = LOOP[i % LOOP.length];
    const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
    pattern.forEach((p, j) => tone(midi(chord[p]), j * 0.2, 0.45));
    tone(midi(chord[0] - 12), 0, 1.5, "sine");
    // light up the matching on-screen key when the note is in range
    pattern.forEach((p, j) => {
      const n = NOTES.find((x) => x.n === chord[p] || x.n === chord[p] - 12);
      if (n) setTimeout(() => { n.el.classList.add("on"); setTimeout(() => n.el.classList.remove("on"), 150); }, j * 200);
    });
  }
  vinyl.addEventListener("click", () => {
    const on = !vinyl.classList.contains("is-playing");
    vinyl.classList.toggle("is-playing", on);
    vinyl.setAttribute("aria-pressed", on);
    vinyl.setAttribute("aria-label", on ? "Stop the tune" : "Play a little tune");
    clearInterval(loopTimer);
    if (on) {
      let bar = 0;
      playBar(bar++);
      loopTimer = setInterval(() => playBar(bar++), 1600);
    }
  });

  /* ───────────── Discography filter ───────────── */
  $$(".genres .chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      $$(".genres .chip").forEach((c) => c.classList.toggle("is-on", c === chip));
      const g = chip.dataset.genre;
      $$("#tracklist > li").forEach((li) => (li.hidden = g !== "all" && li.dataset.genre !== g));
    })
  );

  /* ───────────── Sticker board ───────────── */
  const board = $("#stickerboard");
  const STICKER_COLORS = ["#ff4d2e", "#2f4bff", "#d6f54a", "#ff9bd2", "#ffb82e", "#fffdf8", "#b56cff", "#3aa76d"];
  const LIGHT_TEXT = new Set(["#ff4d2e", "#2f4bff", "#b56cff", "#3aa76d"]);
  const stickers = [];
  Object.entries(window.SKILLS).forEach(([kind, list]) =>
    list.forEach((name) => {
      const s = document.createElement("span");
      s.className = "sticker";
      s.dataset.kind = kind;
      s.textContent = name;
      const bg = STICKER_COLORS[stickers.length % STICKER_COLORS.length];
      s.style.background = bg;
      s.style.color = LIGHT_TEXT.has(bg) ? "#fff" : "var(--ink)";
      s.style.rotate = (Math.random() * 16 - 8).toFixed(1) + "deg";
      board.appendChild(s);
      stickers.push(s);
    })
  );
  // scatter stickers across the whole board without overlapping
  function layoutStickers() {
    const W = board.clientWidth, H = board.clientHeight - 40;
    const placed = [];
    stickers.forEach((s) => {
      if (s.dataset.moved) return;
      const w = s.offsetWidth + 10, h = s.offsetHeight + 10;
      let best, bestHit = Infinity;
      for (let t = 0; t < 120; t++) {
        const x = 12 + Math.random() * Math.max(0, W - w - 24);
        const y = 12 + Math.random() * Math.max(0, H - h - 12);
        const hit = placed.filter((r) => x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y).length;
        if (hit < bestHit) { best = { x, y, w, h }; bestHit = hit; }
        if (!hit) break;
      }
      placed.push(best);
      s.style.left = (best.x / W) * 100 + "%";
      s.style.top = best.y + "px";
    });
  }
  let topZ = 1;
  stickers.forEach((s) => {
    s.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      s.setPointerCapture(e.pointerId);
      s.classList.add("dragging");
      s.style.zIndex = ++topZ;
      const b = board.getBoundingClientRect();
      const r = s.getBoundingClientRect();
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      const move = (ev) => {
        const x = Math.max(0, Math.min(b.width - s.offsetWidth, ev.clientX - b.left - ox));
        const y = Math.max(0, Math.min(b.height - s.offsetHeight, ev.clientY - b.top - oy));
        s.style.left = (x / b.width) * 100 + "%";
        s.style.top = y + "px";
      };
      const up = () => {
        s.classList.remove("dragging");
        s.dataset.moved = "1";
        s.style.rotate = (Math.random() * 16 - 8).toFixed(1) + "deg";
        s.removeEventListener("pointermove", move);
        s.removeEventListener("pointerup", up);
        s.removeEventListener("pointercancel", up);
        tone(midi(72 + [0, 4, 7, 12][(Math.random() * 4) | 0]), 0, 0.25, "sine");
      };
      s.addEventListener("pointermove", move);
      s.addEventListener("pointerup", up);
      s.addEventListener("pointercancel", up);
    });
  });
  document.fonts.ready.then(layoutStickers);
  let resizeT;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(layoutStickers, 150); });

  /* ───────────── Albums ───────────── */
  function albumHTML(p, i) {
    const feat = p.feat ? `feat. ${p.feat.join(", ")}` : "Solo";
    return `
      <button class="album reveal" data-i="${i}" style="--c:${p.color}" aria-haspopup="dialog">
        <span class="disc" aria-hidden="true"></span>
        ${p.badge ? `<span class="sticker-award">${esc(p.badge)}</span>` : ""}
        <span class="sleeve"><img src="${p.img}" alt="" loading="lazy" class="${p.fit === "contain" ? "contain" : ""}" /></span>
        <span class="album-meta">
          <span class="fmt">${esc(p.format)}${p.event ? " · " + esc(p.event.label) : ""}</span>
          <span class="ttl">${esc(p.title)}</span>
          <span class="by">${esc(feat)}</span>
        </span>
      </button>`;
  }
  const P = window.PROJECTS;
  $("#side-a").innerHTML = P.map((p, i) => (p.side === "a" ? albumHTML(p, i) : "")).join("");
  $("#side-b").innerHTML = P.map((p, i) => (p.side === "b" ? albumHTML(p, i) : "")).join("");

  // cover tilt
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    $$(".album").forEach((a) => {
      const sl = $(".sleeve", a);
      a.addEventListener("pointermove", (e) => {
        const r = sl.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        sl.style.setProperty("--ry", px * 14 + "deg");
        sl.style.setProperty("--rx", -py * 14 + "deg");
      });
      a.addEventListener("pointerleave", () => {
        sl.style.setProperty("--ry", "0deg");
        sl.style.setProperty("--rx", "0deg");
      });
    });
  }

  // modal
  const modal = $("#modal");
  const isExternal = (href) => /^https?:/.test(href);
  function openProject(p) {
    const media = $("#modal-media");
    media.style.setProperty("--c", p.color);
    if (p.video) {
      media.innerHTML = `<video src="${p.video}" controls playsinline preload="metadata" poster="${p.img}"></video>`;
    } else if (p.youtube) {
      media.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${p.youtube}" title="${esc(p.title)} demo" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;
    } else {
      media.innerHTML = `<img src="${p.img}" alt="${esc(p.title)} screenshot" />`;
    }
    $("#modal-kicker").innerHTML =
      esc(p.format) + (p.event ? ` · <a href="${p.event.href}" target="_blank" rel="noopener">${esc(p.event.label)} ↗</a>` : "");
    $("#modal-title").textContent = p.title;
    $("#modal-feat").textContent = p.feat ? `feat. ${p.feat.join(", ")}` : "";
    $("#modal-award").textContent = p.award || "";
    $("#modal-desc").innerHTML = p.desc.map((d) => `<p>${esc(d)}</p>`).join("");
    $("#modal-skills").textContent = "Built with → " + p.skills.join(" · ");
    $("#modal-links").innerHTML = p.links
      .map((l) => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)} ${isExternal(l.href) ? "↗" : "▶"}</a>`)
      .join("");
    modal.showModal();
    modal.scrollTop = 0;
  }
  function closeModal() {
    modal.close();
  }
  modal.addEventListener("close", () => ($("#modal-media").innerHTML = ""));
  $("#modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  $$(".album").forEach((a) => a.addEventListener("click", () => openProject(P[+a.dataset.i])));

  /* ───────────── Play: tabs, clips, songs ───────────── */
  const clipHTML = (c) => `
    <figure class="clip reveal">
      <button class="clip-frame" data-yt="${c.id}" aria-label="Play ${esc(c.title)} — ${esc(c.where)}">
        <img src="https://i.ytimg.com/vi/${c.id}/hqdefault.jpg" alt="" loading="lazy" />
        <span class="play" aria-hidden="true">▶</span>
      </button>
      <figcaption><b>${esc(c.title)}</b><span>${esc(c.where)}</span></figcaption>
    </figure>`;
  $("#set-dance").innerHTML = window.DANCE.map(clipHTML).join("");
  $("#set-choir").innerHTML = window.CHOIR.map(clipHTML).join("");
  document.addEventListener("click", (e) => {
    const f = e.target.closest(".clip-frame[data-yt]");
    if (!f) return;
    const title = f.getAttribute("aria-label").replace(/^Play /, "");
    const wrap = document.createElement("div");
    wrap.className = "clip-frame";
    wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${f.dataset.yt}?autoplay=1" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    f.replaceWith(wrap);
  });

  const SONG_COLORS = ["#ff9bd2", "#d6f54a", "#ff4d2e", "#2f4bff", "#ffb82e"];
  $("#set-songs").innerHTML = window.SONGS.map(
    (s, i) => `
    <div class="song">
      <button class="song-row" data-track="${s.track}" aria-expanded="false">
        <span class="mini-vinyl" style="--c:${SONG_COLORS[i % SONG_COLORS.length]}" aria-hidden="true"></span>
        <span class="song-title">${esc(s.title)}${s.note ? `<small>${esc(s.note)}</small>` : ""}</span>
        <span class="song-cta">Listen ▶</span>
      </button>
    </div>`
  ).join("");
  $$(".song-row").forEach((row) =>
    row.addEventListener("click", () => {
      const song = row.parentElement;
      const open = song.classList.toggle("is-open");
      row.setAttribute("aria-expanded", open);
      $(".song-cta", row).textContent = open ? "Close ✕" : "Listen ▶";
      if (open) {
        const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent("https://api.soundcloud.com/tracks/" + row.dataset.track)}&color=%23ff9bd2&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`;
        song.insertAdjacentHTML("beforeend", `<iframe src="${src}" title="${esc($(".song-title", row).firstChild.textContent)} on SoundCloud" allow="autoplay"></iframe>`);
      } else {
        $("iframe", song)?.remove();
      }
    })
  );

  const tabs = $$(".setlist-tabs [role=tab]");
  function selectTab(t) {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute("aria-selected", on);
      x.tabIndex = on ? 0 : -1;
      $("#" + x.getAttribute("aria-controls")).hidden = !on;
    });
    $$(".reveal", $("#" + t.getAttribute("aria-controls"))).forEach((el) => el.classList.add("in"));
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

  /* ───────────── Now playing + nav state ───────────── */
  const sections = $$("[data-track]").filter((el) => el.tagName === "SECTION");
  const npNum = $("#np-num"), npTitle = $("#np-title"), npProg = $("#np-progress");
  const navLinks = $$(".tracks-nav a");
  const np = $(".nowplaying");
  function onScroll() {
    const mid = innerHeight * 0.4;
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= mid) current = s;
    npNum.textContent = current.dataset.track;
    npTitle.textContent = current.dataset.title;
    navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + current.id));
    const max = document.documentElement.scrollHeight - innerHeight;
    npProg.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    np.classList.toggle("is-hidden", scrollY < 40);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ───────────── Reveal on scroll ───────────── */
  $$(".tracklist > li, .ticket, .certs li, .stickerboard, .section-head").forEach((el) => el.classList.add("reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }
})();
