// A tiny floating garden, seen from above. Every building is a section of the site.
import * as THREE from "three";

const canvas = document.getElementById("garden");
const labelsEl = document.getElementById("labels");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────── Palette ───────────── */
const C = {
  grass: "#a3ba88", grassDark: "#93ab7a", dirt: "#b08b66", dirtDark: "#8f6f52",
  stone: "#ece4d2", stone2: "#dfd6c2", stone3: "#f3ede0", plaster: "#f0e7d3",
  wood: "#bd8e62", woodDark: "#8a5d3b", woodLight: "#d4ab7e", terracotta: "#c0765a", sage: "#86a172",
  leaf1: "#6f8d58", leaf2: "#7fa066", leaf3: "#5f7d50", pine: "#557350", trunk: "#8a6445",
  glass: "#dcefe9", frame: "#3f5446", water: "#a4d0cd", red: "#c2503f", ink: "#3a3430",
  window: "#cfe0de", glow: "#ffe2a8",
};
const BLOOMS = ["#a08bd0", "#f0afc2", "#f3d67f", "#f8f4ea", "#eb957c", "#c9b8e4"];

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    canvas.remove();
    document.body.classList.add("no-webgl");
    return;
  }
  const small = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 800);

  /* ───────────── Light ───────────── */
  scene.add(new THREE.HemisphereLight("#f7f3e8", "#7d8f6c", 1.6));
  const sun = new THREE.DirectionalLight("#fff3dd", 2.4);
  sun.position.set(-20, 34, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 5, far: 90 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  /* ───────────── Helpers ───────────── */
  const mats = new Map();
  const mat = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, ...extra }));
    return mats.get(key);
  };
  function mesh(geo, color, parent, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true, m } = {}) {
    const o = new THREE.Mesh(geo, m || mat(color));
    o.position.set(x, y, z);
    o.rotation.set(rx, ry, rz);
    o.castShadow = cast;
    o.receiveShadow = receive;
    parent.add(o);
    return o;
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
  function prismGeo(w, h, d) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }
  // painted textures (signs, screens, a painting); text redraws once Nunito has loaded
  const canvasTextures = [];
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    draw(x, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.userData.redraw = () => { x.clearRect(0, 0, w, h); draw(x, w, h); t.needsUpdate = true; };
    canvasTextures.push(t);
    return t;
  }
  document.fonts?.load("900 60px Nunito").then(() => canvasTextures.forEach((t) => t.userData.redraw()));
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const range = (a, b) => a + rnd() * (b - a);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const glowM = mat(C.glow, { emissive: "#ffcf7a", emissiveIntensity: 0.8 });

  const world = new THREE.Group();
  scene.add(world);
  const animated = []; // (t, dt) => void

  /* ───────────── The island ───────────── */
  const R = 22;
  mesh(cyl(R, R - 0.3, 1.2, 72), C.grass, world, { y: -0.6, cast: false });
  {
    const g = cyl(R - 0.15, R * 0.84, 4.4, 44);
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > 2.1) continue; // keep the rim clean
      const k = 1 + (rnd() - 0.5) * 0.08;
      p.setXYZ(i, p.getX(i) * k, p.getY(i) + (rnd() - 0.5) * 0.4, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    mesh(g, C.dirt, world, { y: -3.4, cast: false });
    const tip = new THREE.ConeGeometry(R * 0.84, 9, 30, 3);
    const q = tip.getAttribute("position");
    for (let i = 0; i < q.count; i++) {
      if (q.getY(i) > 4.4) continue;
      const k = 1 + (rnd() - 0.5) * 0.22;
      q.setXYZ(i, q.getX(i) * k, q.getY(i), q.getZ(i) * k);
    }
    tip.computeVertexNormals();
    mesh(tip, C.dirtDark, world, { y: -10.1, rx: Math.PI, cast: false });
  }
  // softer grass patches
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (R - 3);
    mesh(new THREE.CircleGeometry(range(1.2, 3), 7), C.grassDark, world, { x: Math.cos(a) * r, y: 0.012, z: Math.sin(a) * r, rx: -Math.PI / 2, rz: rnd() * 6, cast: false });
  }

  /* ───────────── Landmarks ───────────── */
  const LANDMARKS = [
    { id: "about", name: "Cottage", sub: "About", pos: [-9, -7.5], h: 7.4, r: 3.8 },
    { id: "experience", name: "Workshop", sub: "Experience", pos: [-12.5, 4.5], h: 5.2, r: 3.8 },
    { id: "work", name: "Greenhouse", sub: "Projects", pos: [9.5, -8], h: 6.2, r: 4.6 },
    { id: "studies", name: "Reading nook", sub: "Education", pos: [-5.5, 11.5], h: 7.4, r: 3.4 },
    { id: "play", name: "Gazebo", sub: "Play", pos: [12, 5], h: 6.8, r: 3.6 },
    { id: "contact", name: "Mailbox", sub: "Contact", pos: [5.5, 15.8], h: 5, r: 1.8 },
  ];
  const byId = {};
  LANDMARKS.forEach((L) => {
    const g = new THREE.Group();
    g.position.set(L.pos[0], 0, L.pos[1]);
    g.rotation.y = Math.atan2(-L.pos[0], -L.pos[1]) * 0.55; // turn gently toward the fountain
    g.userData.id = L.id;
    world.add(g);
    L.group = g;
    L.lift = 0;
    L.baseScale = L.id === "contact" ? 1.35 : 1;
    byId[L.id] = L;
  });

  // Cottage — about
  {
    const g = byId.about.group;
    mesh(box(5.8, 0.4, 4.8), C.stone2, g, { y: 0.2 });
    mesh(box(5, 2.8, 4), C.plaster, g, { y: 1.8 });
    mesh(prismGeo(5.9, 2.3, 4.7), C.terracotta, g, { y: 3.2 });
    mesh(box(0.95, 1.65, 0.12), C.woodDark, g, { y: 1.22, z: 2.02 });
    mesh(new THREE.SphereGeometry(0.07, 6, 4), C.glow, g, { x: 0.3, y: 1.2, z: 2.1 });
    [-1.6, 1.6].forEach((x) => {
      mesh(box(0.98, 0.98, 0.08), "#ffffff", g, { x, y: 2.1, z: 2.02 });
      mesh(box(0.8, 0.8, 0.1), null, g, { x, y: 2.1, z: 2.03, m: mat(C.window, { emissive: "#6f8a86", emissiveIntensity: 0.15 }) });
      mesh(box(1.1, 0.25, 0.4), C.woodDark, g, { x, y: 1.5, z: 2.2 });
      for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry(0.14, 0), pick(BLOOMS), g, { x: x - 0.4 + i * 0.27, y: 1.72, z: 2.25 });
    });
    [-1.2, 1.2].forEach((z) => mesh(box(0.08, 0.8, 0.8), C.window, g, { x: 2.52, y: 2.1, z }));
    mesh(box(0.65, 1.8, 0.65), "#a8866b", g, { x: 1.4, y: 4.3, z: -0.9 });
    // chimney smoke
    const puffs = Array.from({ length: 5 }, (_, i) => {
      const m = new THREE.MeshStandardMaterial({ color: "#f7f4ec", flatShading: true, transparent: true, depthWrite: false });
      const p = mesh(new THREE.IcosahedronGeometry(0.35, 0), null, g, { m, cast: false, receive: false });
      return { p, m, phase: i / 5 };
    });
    animated.push((t) => puffs.forEach(({ p, m, phase }) => {
      const k = (t * 0.18 + phase) % 1;
      p.position.set(1.4 + Math.sin(k * 4 + phase * 6) * 0.3 + k * 0.8, 5.3 + k * 3, -0.9 - k * 0.6);
      p.scale.setScalar(0.5 + k * 1.3);
      m.opacity = Math.sin(k * Math.PI) * 0.75;
    }));
    // a little picket fence
    for (let i = 0; i < 7; i++) mesh(box(0.14, 0.7, 0.14), C.plaster, g, { x: -3.1 + i * 0.5, y: 0.35, z: 3.4 });
    mesh(box(3.2, 0.1, 0.08), C.plaster, g, { x: -1.6, y: 0.55, z: 3.4 });
  }

  // Workshop — experience
  {
    const g = byId.experience.group;
    mesh(box(6, 0.3, 4.4), C.wood, g, { y: 0.15 });
    [[-2.8, -2], [2.8, -2], [-2.8, 2], [2.8, 2]].forEach(([x, z]) => mesh(cyl(0.12, 0.14, 3, 6), C.woodDark, g, { x, y: 1.65, z }));
    [-2, 2].forEach((z) => mesh(box(6.6, 0.22, 0.22), C.woodDark, g, { y: 3.2, z }));
    for (let i = 0; i < 11; i++) mesh(box(0.16, 0.16, 5), C.woodLight, g, { x: -3 + i * 0.6, y: 3.39 });
    // a vine across the beams
    for (let i = 0; i < 9; i++) mesh(new THREE.IcosahedronGeometry(range(0.22, 0.38), 0), pick([C.leaf1, C.leaf2]), g, { x: range(-3, 3), y: 3.55, z: pick([-2, 2]) + range(-0.3, 0.3) });
    mesh(box(5.8, 2.6, 0.18), "#a57a52", g, { y: 1.6, z: -2.05 });
    // pegboard tools
    for (let i = 0; i < 6; i++) mesh(box(0.08, range(0.5, 0.9), 0.08), pick([C.red, C.frame, "#c9a24f", C.ink]), g, { x: -2 + i * 0.5, y: 2.2, z: -1.9, rz: range(-0.3, 0.3) });
    // workbench with a laptop
    mesh(box(3.2, 0.18, 1.3), C.woodLight, g, { y: 1.15, z: -1.1 });
    [[-1.45, -1.6], [1.45, -1.6], [-1.45, -0.6], [1.45, -0.6]].forEach(([x, z]) => mesh(box(0.14, 1.05, 0.14), C.woodDark, g, { x, y: 0.6, z }));
    mesh(box(1, 0.05, 0.68), "#cfd4d8", g, { x: -0.4, y: 1.27, z: -1 });
    mesh(box(1, 0.66, 0.05), "#cfd4d8", g, { x: -0.4, y: 1.6, z: -1.34, rx: -0.2 });
    // the screen: an AI canvas mid-generation
    const screenTex = canvasTex(256, 160, (x, w, h) => {
      const bg = x.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#1d1b2e");
      bg.addColorStop(1, "#2c2447");
      x.fillStyle = bg;
      x.fillRect(0, 0, w, h);
      [["#f5b38a", 18, 22], ["#9fb8f0", 96, 22], ["#c9a2e8", 174, 22], ["#8fd1c0", 18, 88], ["#f2d38a", 96, 88]].forEach(([c, px, py]) => {
        const gr = x.createLinearGradient(px, py, px + 64, py + 52);
        gr.addColorStop(0, c);
        gr.addColorStop(1, "#ffffff55");
        x.fillStyle = gr;
        x.beginPath();
        x.roundRect(px, py, 64, 52, 8);
        x.fill();
      });
      x.strokeStyle = "#ffffff88";
      x.lineWidth = 3;
      x.setLineDash([8, 6]);
      x.beginPath();
      x.roundRect(174, 88, 64, 52, 8);
      x.stroke();
    });
    mesh(box(0.88, 0.54, 0.02), null, g, { x: -0.4, y: 1.6, z: -1.3, rx: -0.2, m: new THREE.MeshStandardMaterial({ map: screenTex, emissive: "#ffffff", emissiveMap: screenTex, emissiveIntensity: 0.55, roughness: 0.5 }) });
    // a camera on a tripod, pointed at the bench
    const cam = new THREE.Group();
    cam.position.set(-2.2, 0.3, 0.6);
    cam.rotation.y = -0.6;
    g.add(cam);
    [0, 2.1, 4.2].forEach((a) => mesh(cyl(0.03, 0.03, 1.5, 4), C.ink, cam, { x: Math.sin(a) * 0.3, y: 0.7, z: Math.cos(a) * 0.3, rx: Math.cos(a) * 0.22, rz: -Math.sin(a) * 0.22 }));
    mesh(box(0.5, 0.34, 0.3), "#34323a", cam, { y: 1.55 });
    mesh(cyl(0.12, 0.14, 0.26, 10), "#1f1e24", cam, { y: 1.55, z: 0.26, rx: Math.PI / 2 });
    mesh(new THREE.SphereGeometry(0.05, 6, 4), "#e05a4f", cam, { x: 0.18, y: 1.76, z: 0.08, cast: false, m: mat("#e05a4f", { emissive: "#e05a4f", emissiveIntensity: 0.9 }) });
    mesh(cyl(0.12, 0.1, 0.24, 8), C.plaster, g, { x: 0.6, y: 1.36, z: -0.9 });
    mesh(cyl(0.2, 0.15, 0.3, 7), C.terracotta, g, { x: 1.2, y: 1.39, z: -1.2 });
    mesh(new THREE.IcosahedronGeometry(0.3, 0), C.leaf2, g, { x: 1.2, y: 1.72, z: -1.2 });
    // crates and a stool
    mesh(box(0.9, 0.8, 0.9), C.woodLight, g, { x: 2.1, y: 0.7, z: 1.1, ry: 0.3 });
    mesh(box(0.7, 0.6, 0.7), C.wood, g, { x: 2.3, y: 1.4, z: 1.1, ry: -0.2 });
    mesh(cyl(0.35, 0.35, 0.12, 10), C.woodDark, g, { x: -0.4, y: 0.95, z: 0.1 });
    mesh(cyl(0.07, 0.07, 0.65, 5), C.woodDark, g, { x: -0.4, y: 0.6, z: 0.1 });
  }

  // Greenhouse — projects
  {
    const g = byId.work.group;
    mesh(box(7.4, 0.4, 5.4), C.stone2, g, { y: 0.2 });
    const glassM = new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.26, roughness: 0.2, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
    const wallsM = mesh(box(7, 2.6, 5), null, g, { y: 1.7, m: glassM, cast: false, receive: false });
    // ridge runs the long way
    const roofM = mesh(prismGeo(5, 2.1, 7).rotateY(Math.PI / 2), null, g, { y: 3, m: glassM, cast: false, receive: false });
    const lineM = new THREE.LineBasicMaterial({ color: C.frame });
    [wallsM, roofM].forEach((o) => {
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry), lineM);
      l.position.copy(o.position);
      g.add(l);
    });
    for (let i = -2.1; i <= 2.1; i += 1.4) {
      [2.5, -2.5].forEach((z) => mesh(box(0.06, 2.6, 0.06), C.frame, g, { x: i, y: 1.7, z, cast: false }));
      // rafters
      [1, -1].forEach((s) => mesh(box(0.06, 0.06, 3.3), C.frame, g, { x: i, y: 4.05, z: s * 1.25, rx: s * 0.7, cast: false }));
    }
    mesh(box(1.1, 2, 0.08), null, g, { y: 1.4, z: 2.52, m: new THREE.MeshStandardMaterial({ color: C.frame, transparent: true, opacity: 0.5 }), cast: false });
    // planters of growing things
    [-1.6, 1.6].forEach((z) => {
      mesh(box(6, 0.55, 1.1), C.woodDark, g, { y: 0.68, z });
      for (let i = 0; i < 7; i++) {
        const x = -2.6 + i * 0.86;
        if (i % 3 === 1) mesh(new THREE.ConeGeometry(0.28, range(0.9, 1.4), 6), C.leaf3, g, { x, y: 1.4, z });
        else mesh(new THREE.IcosahedronGeometry(range(0.3, 0.42), 0), pick([C.leaf1, C.leaf2, C.leaf3]), g, { x, y: 1.25, z });
        if (i % 2 === 0) mesh(new THREE.IcosahedronGeometry(0.12, 0), pick(BLOOMS), g, { x: x + 0.15, y: 1.6, z: z + 0.1 });
      }
    });
    mesh(cyl(0.1, 0.14, 1.4, 6), C.trunk, g, { y: 1.1 });
    mesh(new THREE.IcosahedronGeometry(0.8, 0), C.leaf2, g, { y: 2.2 });
    // watering can outside
    mesh(cyl(0.25, 0.28, 0.45, 8), "#7f9aa8", g, { x: 3.2, y: 0.62, z: -3.3 });
    mesh(cyl(0.04, 0.05, 0.5, 5), "#7f9aa8", g, { x: 3.5, y: 0.75, z: -3.3, rz: -0.9 });
  }

  // Reading nook — education
  {
    const g = byId.studies.group;
    mesh(cyl(0.4, 0.55, 3.6, 7), C.trunk, g, { x: -1.8, y: 1.8, z: -2.2 });
    const crown = new THREE.Group();
    crown.position.set(-1.8, 4.4, -2.4);
    crown.scale.setScalar(0.75);
    g.add(crown);
    [[0, 0, 0, 2.3, C.leaf1], [1.4, -0.5, 0.6, 1.6, C.leaf2], [-1.3, -0.3, 0.4, 1.7, C.leaf2], [0.2, 0.9, -0.8, 1.6, C.leaf3]].forEach(([x, y, z, r, c]) =>
      mesh(new THREE.IcosahedronGeometry(r, 0), c, crown, { x, y, z }));
    animated.push((t) => (crown.rotation.z = Math.sin(t * 0.7) * 0.025));
    // blanket, bench and books
    mesh(box(2.6, 0.05, 1.8), "#e2bfa6", g, { x: 1, y: 0.03, z: 1.1, ry: 0.2, cast: false });
    mesh(box(2.4, 0.12, 0.7), C.wood, g, { x: -1, y: 0.75, z: 1.3 });
    mesh(box(2.4, 0.6, 0.1), C.wood, g, { x: -1, y: 1.1, z: 0.98 });
    [-2, 0].forEach((x) => mesh(box(0.12, 0.7, 0.6), C.woodDark, g, { x, y: 0.35, z: 1.3 }));
    ["#c0765a", "#6b8458", "#d8b56a", "#5c6f86", "#a08bd0"].forEach((c, i) =>
      mesh(box(0.8 - i * 0.04, 0.16, 0.6), c, g, { x: 1.2, y: 0.12 + i * 0.16, z: 0.8, ry: range(-0.3, 0.3) }));
    mesh(box(0.5, 0.03, 0.7), "#faf6ec", g, { x: 0.6, y: 0.08, z: 1.6, rz: 0.12, ry: 0.4 });
    mesh(box(0.5, 0.03, 0.7), "#faf6ec", g, { x: 1.08, y: 0.08, z: 1.72, rz: -0.12, ry: 0.4 });
    mesh(cyl(0.2, 0.12, 0.25, 8), C.plaster, g, { x: 1.9, y: 0.14, z: 1.7 });
    // lamp
    mesh(cyl(0.07, 0.09, 2.6, 6), C.ink, g, { x: 1.8, y: 1.3, z: -0.4 });
    mesh(box(0.4, 0.5, 0.4), null, g, { x: 1.8, y: 2.8, z: -0.4, m: glowM });
    mesh(new THREE.ConeGeometry(0.35, 0.3, 4), C.ink, g, { x: 1.8, y: 3.2, z: -0.4, ry: Math.PI / 4 });
  }

  // Gazebo — play
  {
    const g = byId.play.group;
    mesh(cyl(3.2, 3.35, 0.45, 8), C.stone3, g, { y: 0.22 });
    mesh(box(1.6, 0.22, 0.8), C.stone2, g, { y: 0.11, z: 3.4 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      mesh(cyl(0.1, 0.12, 2.9, 6), C.plaster, g, { x: Math.cos(a) * 2.8, y: 1.9, z: Math.sin(a) * 2.8 });
    }
    mesh(new THREE.ConeGeometry(3.5, 2.6, 8), C.terracotta, g, { y: 4.65, ry: Math.PI / 8 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      mesh(new THREE.SphereGeometry(0.28, 6, 4), C.plaster, g, { x: Math.cos(a) * 3.3, y: 3.3, z: Math.sin(a) * 3.3, cast: false });
    }
    mesh(cyl(3.4, 3.4, 0.2, 8), C.plaster, g, { y: 3.35, ry: Math.PI / 8 });
    mesh(new THREE.SphereGeometry(0.22, 8, 6), C.plaster, g, { y: 6 });
    // string lights
    const bulbM = mat(C.glow, { emissive: "#ffcf7a", emissiveIntensity: 1 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      mesh(new THREE.SphereGeometry(0.08, 6, 4), null, g, { x: Math.cos(a) * 3.35, y: 3.1 - (i % 2) * 0.1, z: Math.sin(a) * 3.35, m: bulbM, cast: false });
    }
    // a little upright piano and stool
    mesh(box(1.8, 1.25, 0.65), C.ink, g, { y: 1.07, z: -0.9 });
    mesh(box(1.7, 0.06, 0.3), "#f6f2e8", g, { y: 1.02, z: -0.45 });
    mesh(box(1.8, 0.1, 0.4), C.ink, g, { y: 0.97, z: -0.42 });
    mesh(cyl(0.3, 0.3, 0.12, 10), "#6d4a3a", g, { y: 0.9, z: 0.5 });
    mesh(cyl(0.06, 0.06, 0.5, 5), C.ink, g, { y: 0.62, z: 0.5 });
    // floating notes
    const notes = [0, 1, 2].map((i) => {
      const n = new THREE.Group();
      mesh(new THREE.SphereGeometry(0.2, 8, 6), C.ink, n, { cast: false }).scale.set(1.2, 0.85, 1);
      mesh(box(0.05, 0.75, 0.05), C.ink, n, { x: 0.2, y: 0.38, cast: false });
      if (i !== 1) mesh(box(0.28, 0.07, 0.05), C.ink, n, { x: 0.33, y: 0.72, rz: -0.4, cast: false });
      g.add(n);
      return n;
    });
    animated.push((t) => notes.forEach((n, i) => {
      const k = (t * 0.12 + i / 3) % 1;
      n.position.set(Math.sin(t * 0.6 + i * 2) * 1.2 + (i - 1) * 0.8, 6.4 + k * 2.4, Math.cos(t * 0.5 + i) * 0.6);
      n.rotation.y = Math.sin(t + i) * 0.6;
      n.scale.setScalar(Math.sin(k * Math.PI) * 1.1);
    }));
  }

  // Mailbox — contact
  {
    const g = byId.contact.group;
    mesh(box(0.22, 1.5, 0.22), C.woodDark, g, { y: 0.75 });
    mesh(box(0.9, 0.55, 1.2), C.red, g, { y: 1.72 });
    mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12, 1, false, 0, Math.PI), C.red, g, { y: 2, rz: Math.PI / 2, ry: Math.PI / 2 });
    mesh(box(0.8, 0.5, 0.04), "#9a3a30", g, { y: 1.85, z: 0.61 });
    const flag = new THREE.Group();
    flag.position.set(0.48, 1.8, -0.2);
    g.add(flag);
    mesh(box(0.05, 0.7, 0.07), C.woodLight, flag, { y: 0.35 });
    mesh(box(0.05, 0.25, 0.35), C.red, flag, { y: 0.6, z: 0.17 });
    const letter = new THREE.Group();
    g.add(letter);
    mesh(box(0.7, 0.04, 0.46), "#fbf7ee", letter, {});
    mesh(new THREE.ConeGeometry(0.1, 0.02, 3), C.terracotta, letter, { y: 0.03, rx: Math.PI });
    animated.push((t) => {
      flag.rotation.z = -0.1 + Math.sin(t * 1.3) * 0.08;
      letter.position.set(0, 3 + Math.sin(t * 1.1) * 0.25, 0.2);
      letter.rotation.set(0.5 + Math.sin(t * 0.9) * 0.15, t * 0.4, Math.sin(t * 0.7) * 0.2);
    });
    for (let i = 0; i < 8; i++) mesh(new THREE.IcosahedronGeometry(0.13, 0), pick(BLOOMS), g, { x: range(-0.6, 0.6), y: 0.12, z: range(-0.6, 0.6) });
  }

  /* ───────────── Fountain ───────────── */
  {
    const g = new THREE.Group();
    world.add(g);
    mesh(cyl(3, 3.2, 0.6, 14), C.stone2, g, { y: 0.3 });
    const waterM = mat(C.water, { roughness: 0.3 });
    mesh(cyl(2.6, 2.6, 0.1, 28), null, g, { y: 0.56, m: waterM });
    mesh(cyl(0.35, 0.45, 1.7, 8), C.stone3, g, { y: 1.3 });
    mesh(cyl(1.1, 0.55, 0.4, 12), C.stone2, g, { y: 2.2 });
    mesh(cyl(0.95, 0.95, 0.05, 20), null, g, { y: 2.38, m: waterM });
    mesh(new THREE.SphereGeometry(0.22, 8, 6), C.stone3, g, { y: 2.6 });
    const dropM = mat("#d8eeee", { roughness: 0.3 });
    const drops = Array.from({ length: 14 }, () => mesh(new THREE.SphereGeometry(0.06, 5, 4), null, g, { m: dropM, cast: false }));
    animated.push((t) => drops.forEach((d, i) => {
      const k = (t * 0.55 + i / drops.length) % 1;
      const a = (i / drops.length) * Math.PI * 2;
      const r = 0.95 + k * 1.2;
      d.position.set(Math.cos(a) * r, 2.35 + k * 0.5 - k * k * 2.3, Math.sin(a) * r);
    }));
  }

  /* ───────────── Paths ───────────── */
  const RING = 5.4;
  const segs = [];
  LANDMARKS.forEach((L) => {
    const d = new THREE.Vector2(L.pos[0], L.pos[1]);
    const n = d.clone().normalize();
    segs.push([n.clone().multiplyScalar(RING), d.clone().sub(n.clone().multiplyScalar(L.r * 0.85))]);
  });
  segs.push([new THREE.Vector2(0, RING), new THREE.Vector2(0, R - 0.8)]);
  const distToSeg = (p, [a, b]) => {
    const ab = b.clone().sub(a);
    const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq()));
    return p.distanceTo(a.clone().add(ab.multiplyScalar(t)));
  };
  const nearPath = (x, z, pad = 1) => {
    const p = new THREE.Vector2(x, z);
    if (Math.abs(p.length() - RING) < pad) return true;
    return segs.some((s) => distToSeg(p, s) < pad);
  };
  const reserved = []; // story props placed on the lawn: { x, z, r }
  const nearLandmark = (x, z, pad = 1) =>
    LANDMARKS.some((L) => Math.hypot(x - L.pos[0], z - L.pos[1]) < L.r + pad) ||
    Math.hypot(x, z) < 3.8 + pad ||
    reserved.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + pad);

  {
    const spots = [];
    segs.forEach(([a, b]) => {
      const len = a.distanceTo(b);
      const dir = b.clone().sub(a).normalize();
      const perp = new THREE.Vector2(-dir.y, dir.x);
      for (let s = 0; s < len; s += 0.85) {
        const p = a.clone().add(dir.clone().multiplyScalar(s)).add(perp.clone().multiplyScalar(range(-0.3, 0.3)));
        spots.push([p.x, p.y, range(0.75, 1.05)]);
      }
    });
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * Math.PI * 2;
      spots.push([Math.cos(a) * RING, Math.sin(a) * RING, range(0.8, 1.05)]);
    }
    const inst = new THREE.InstancedMesh(cyl(0.5, 0.55, 0.12, 7), mat("#ffffff"), spots.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), col = new THREE.Color();
    spots.forEach(([x, z, k], i) => {
      q.setFromEuler(new THREE.Euler(0, rnd() * 6, 0));
      s.set(k, 1, k * range(0.8, 1));
      m4.compose(new THREE.Vector3(x, 0.03, z), q, s);
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, col.set(pick([C.stone, C.stone2, C.stone3])));
    });
    inst.receiveShadow = true;
    world.add(inst);
  }

  /* ───────────── Zoe's story: small details around the garden ───────────── */
  // a wooden sign with painted text
  function sign(text, w, h, { bg = "#f3e6c9", ink = "#3a3430", sub = "" } = {}) {
    const tex = canvasTex(Math.round(w * 160), Math.round(h * 160), (x, cw, ch) => {
      x.fillStyle = bg;
      x.fillRect(0, 0, cw, ch);
      x.strokeStyle = "rgba(90, 60, 30, 0.25)";
      x.lineWidth = ch * 0.06;
      x.strokeRect(0, 0, cw, ch);
      x.fillStyle = ink;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.font = `900 ${ch * (sub ? 0.46 : 0.56)}px Nunito, system-ui, sans-serif`;
      x.fillText(text, cw / 2, ch * (sub ? 0.4 : 0.54), cw * 0.9);
      if (sub) {
        x.font = `800 ${ch * 0.25}px Nunito, system-ui, sans-serif`;
        x.globalAlpha = 0.65;
        x.fillText(sub, cw / 2, ch * 0.76);
        x.globalAlpha = 1;
      }
    });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const wood = mat(C.woodLight);
    return new THREE.Mesh(box(w, h, 0.1), [wood, wood, wood, wood, face, wood]);
  }
  function place(obj, x, z, r, ry = 0) {
    obj.position.set(x, 0, z);
    obj.rotation.y = ry;
    world.add(obj);
    reserved.push({ x, z, r });
    return obj;
  }

  // A signpost of milestones where the entrance path meets the fountain
  {
    const g = new THREE.Group();
    mesh(cyl(0.1, 0.13, 3.3, 6), C.woodDark, g, { y: 1.65 });
    mesh(new THREE.ConeGeometry(0.16, 0.25, 6), C.woodDark, g, { y: 3.42 });
    [
      ["Luma AI", "2026 — now", -0.55, 2.85],
      ["Meta", "2024 — 26", 0.5, 2.35],
      ["Apple Maps", "2023", -0.35, 1.85],
      ["Berkeley · USC", "M.Eng '24 · B.S. '23", 0.3, 1.35],
    ].forEach(([t, sub, ry, y], i) => {
      const arm = new THREE.Group();
      arm.position.y = y;
      arm.rotation.y = ry;
      g.add(arm);
      const dir = i % 2 ? -1 : 1;
      const b = sign(t, 1.7, 0.42, { sub, bg: i === 0 ? "#f6d9a8" : "#f3e6c9" });
      b.position.x = dir * 0.85;
      b.castShadow = true;
      arm.add(b);
      mesh(prismGeo(0.42, 0.26, 0.1), C.woodLight, arm, { x: dir * 1.83, rz: -dir * Math.PI / 2 });
    });
    g.scale.setScalar(1.55);
    place(g, -2.4, 7.9, 2, 0.3);
  }

  // Dad's easel: a small landscape in progress, for the Jiuye gallery
  {
    const g = new THREE.Group();
    [-0.42, 0.42].forEach((x) => mesh(box(0.08, 2.3, 0.08), C.wood, g, { x, y: 1.1, rz: -x * 0.2 }));
    mesh(box(0.08, 2.1, 0.08), C.wood, g, { y: 1, z: -0.5, rx: 0.3 });
    mesh(box(1.2, 0.08, 0.14), C.woodDark, g, { y: 0.9, z: 0.08 });
    const painting = canvasTex(220, 170, (x, w, h) => {
      const sky = x.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, "#8fbfe6");
      sky.addColorStop(1, "#e8f1f4");
      x.fillStyle = sky;
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#b4c9a0";
      x.beginPath();
      x.moveTo(0, h * 0.6);
      x.quadraticCurveTo(w * 0.35, h * 0.38, w * 0.7, h * 0.55);
      x.quadraticCurveTo(w * 0.85, h * 0.6, w, h * 0.5);
      x.lineTo(w, h);
      x.lineTo(0, h);
      x.fill();
      x.fillStyle = "#c2654a";
      x.fillRect(w * 0.55, h * 0.44, w * 0.2, h * 0.08);
      x.fillStyle = "#f3efe6";
      x.fillRect(w * 0.56, h * 0.5, w * 0.18, h * 0.08);
      x.fillStyle = "#6f9a4e";
      x.fillRect(0, h * 0.68, w, h * 0.32);
      for (let i = 0; i < 70; i++) {
        x.fillStyle = i % 3 ? "#f0c43a" : "#f6dc6a";
        x.beginPath();
        x.arc(Math.random() * w, h * 0.72 + Math.random() * h * 0.28, 2 + Math.random() * 3, 0, Math.PI * 2);
        x.fill();
      }
    });
    const canvasFace = new THREE.MeshStandardMaterial({ map: painting, roughness: 0.95 });
    const cream = mat("#fbf7ee");
    mesh(box(1.1, 0.85, 0.05), null, g, { y: 1.4, z: 0.1, rx: -0.12, m: [cream, cream, cream, cream, canvasFace, cream] });
    mesh(cyl(0.22, 0.22, 0.03, 12), "#e9dcc4", g, { x: 0.9, y: 0.02, z: 0.5 });
    ["#c2654a", "#f0c43a", "#6f9a4e", "#8fbfe6"].forEach((c, i) => mesh(new THREE.SphereGeometry(0.04, 6, 4), c, g, { x: 0.83 + (i % 2) * 0.12, y: 0.05, z: 0.44 + (i > 1 ? 0.12 : 0) }));
    place(g, -4.4, -11.4, 1.1, 0.35);
  }

  // A picnic by the cottage: a bamboo steamer of dumplings (fuelled by dumplings)
  {
    const g = new THREE.Group();
    mesh(box(2.3, 0.1, 1.1), C.wood, g, { y: 0.78 });
    [-0.95, 0.95].forEach((x) => [-0.4, 0.4].forEach((z) => mesh(box(0.1, 0.76, 0.1), C.woodDark, g, { x, y: 0.38, z })));
    [-0.9, 0.9].forEach((z) => mesh(box(2.3, 0.08, 0.34), C.woodLight, g, { y: 0.45, z }));
    mesh(box(1.4, 0.02, 0.8), "#e8b9a6", g, { y: 0.84, cast: false });
    mesh(cyl(0.38, 0.38, 0.2, 14), "#d9b877", g, { x: -0.3, y: 0.95 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const d = mesh(new THREE.SphereGeometry(0.1, 8, 6), "#f7efe0", g, { x: -0.3 + Math.cos(a) * 0.2, y: 1.08, z: Math.sin(a) * 0.2 });
      d.scale.set(1, 0.72, 1);
    }
    mesh(new THREE.SphereGeometry(0.1, 8, 6), "#f7efe0", g, { x: -0.3, y: 1.08 }).scale.set(1, 0.72, 1);
    mesh(cyl(0.39, 0.38, 0.06, 14), "#c9a45f", g, { x: 0.35, y: 0.86, z: 0.12, rz: 0.15 });
    [-0.07, 0.07].forEach((z) => mesh(cyl(0.012, 0.012, 0.7, 4), "#b08b5a", g, { x: 0.45, y: 0.88, z: -0.25 + z, rz: Math.PI / 2 - 0.08 }));
    mesh(cyl(0.1, 0.08, 0.16, 8), C.plaster, g, { x: 0.75, y: 0.9, z: -0.2 });
    place(g, -14.2, -4.8, 1.6, 1.2);
  }

  // The greenhouse grows the projects: a row of keepsakes on little pedestals by its door
  {
    const g = byId.work.group;
    const pedestal = (x) => {
      mesh(cyl(0.5, 0.58, 0.8, 8), C.stone3, g, { x, y: 0.6, z: 3.8 });
      const top = new THREE.Group();
      top.position.set(x, 1.02, 3.8);
      top.scale.setScalar(1.9);
      g.add(top);
      return top;
    };
    // Nombook: an open recipe book
    {
      const t = pedestal(-3.2);
      [-1, 1].forEach((k) => mesh(box(0.34, 0.03, 0.44), "#fbf5e8", t, { x: k * 0.17, y: 0.06, rz: -k * 0.12 }));
      mesh(box(0.72, 0.04, 0.48), "#d8744f", t, { y: 0.02 });
      mesh(new THREE.SphereGeometry(0.08, 8, 6), "#f2c14e", t, { x: -0.17, y: 0.12 });
    }
    // Harmony Blocks: a VR headset
    {
      const t = pedestal(-1.75);
      mesh(box(0.5, 0.26, 0.26), "#f4f2f7", t, { y: 0.2 });
      mesh(box(0.44, 0.2, 0.04), "#2f2c3a", t, { y: 0.2, z: 0.14 });
      mesh(new THREE.TorusGeometry(0.22, 0.03, 5, 16), "#6c61b8", t, { y: 0.2, z: -0.15 });
    }
    // Muse: a glowing music note
    {
      const t = pedestal(1.75);
      const glow = mat("#b98ae6", { emissive: "#9f6be0", emissiveIntensity: 0.6 });
      mesh(new THREE.SphereGeometry(0.1, 8, 6), null, t, { x: -0.06, y: 0.13, m: glow }).scale.set(1.3, 0.9, 1);
      mesh(box(0.04, 0.5, 0.04), null, t, { x: 0.06, y: 0.36, m: glow });
      mesh(box(0.18, 0.05, 0.04), null, t, { x: 0.14, y: 0.59, rz: -0.4, m: glow });
    }
    // Wheel of Dinner: a spinning wheel
    {
      const t = pedestal(3.2);
      const wheel = new THREE.Group();
      wheel.position.y = 0.34;
      t.add(wheel);
      ["#e36b4f", "#f7efe0", "#f2c14e", "#f7efe0", "#7fae63", "#f7efe0"].forEach((c, i) =>
        mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 6, 1, false, (i / 6) * Math.PI * 2, Math.PI / 3), c, wheel, { rx: Math.PI / 2 }));
      mesh(box(0.04, 0.3, 0.04), C.woodDark, t, { y: 0.12 });
      animated.push((time) => (wheel.rotation.z = time * 0.8));
    }
  }

  // The reading nook remembers two schools: pennants on a string and a graduation cap
  {
    const g = byId.studies.group;
    const from = new THREE.Vector3(-1.4, 2.9, -1.4), to = new THREE.Vector3(1.8, 2.6, -0.4);
    const cols = [["#003262", "#fdb515"], ["#990000", "#ffcc00"]];
    for (let i = 0; i < 6; i++) {
      const k = (i + 0.5) / 6;
      const p = from.clone().lerp(to, k);
      p.y -= Math.sin(k * Math.PI) * 0.35;
      const [a, b] = cols[i % 2];
      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 3), mat(a));
      flag.position.copy(p).add(new THREE.Vector3(0, -0.24, 0));
      flag.rotation.set(Math.PI, 0.35, 0);
      flag.castShadow = true;
      g.add(flag);
      mesh(new THREE.SphereGeometry(0.035, 5, 4), b, g, { x: p.x, y: p.y - 0.46, z: p.z, cast: false });
    }
    const line = new THREE.CatmullRomCurve3([from, from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, -0.35, 0)), to]);
    mesh(new THREE.TubeGeometry(line, 16, 0.012, 4), C.ink, g, { cast: false });
    // cap on the book stack
    const cap = new THREE.Group();
    cap.position.set(1.2, 0.98, 0.8);
    cap.scale.setScalar(1.6);
    cap.rotation.y = 0.5;
    g.add(cap);
    mesh(box(0.62, 0.04, 0.62), C.ink, cap, { y: 0.14 });
    mesh(cyl(0.2, 0.22, 0.14, 8), C.ink, cap, { y: 0.06 });
    mesh(cyl(0.012, 0.012, 0.3, 4), "#fdb515", cap, { x: 0.28, y: 0.02, z: 0.1 });
  }

  // The gazebo is ready for a show: a microphone and a choir music stand on the front steps
  {
    const g = byId.play.group;
    const mic = new THREE.Group();
    mic.position.set(1.3, 0.22, 3.9);
    mic.scale.setScalar(1.5);
    g.add(mic);
    mesh(cyl(0.2, 0.24, 0.06, 10), C.ink, mic, { y: 0.03 });
    mesh(cyl(0.03, 0.03, 1.4, 5), C.ink, mic, { y: 0.72 });
    mesh(cyl(0.02, 0.02, 0.4, 5), C.ink, mic, { y: 1.44, z: 0.12, rx: 0.9 });
    mesh(new THREE.SphereGeometry(0.1, 8, 6), "#b9bcc4", mic, { y: 1.56, z: 0.28 });
    const stand = new THREE.Group();
    stand.position.set(-1.3, 0.22, 3.9);
    stand.rotation.y = 0.3;
    stand.scale.setScalar(1.5);
    g.add(stand);
    mesh(cyl(0.03, 0.03, 1.1, 5), C.ink, stand, { y: 0.55 });
    [0, 2.1, 4.2].forEach((r) => mesh(cyl(0.02, 0.02, 0.4, 4), C.ink, stand, { x: Math.sin(r) * 0.15, y: 0.08, z: Math.cos(r) * 0.15, rx: Math.cos(r) * 1.2, rz: -Math.sin(r) * 1.2 }));
    mesh(box(0.7, 0.46, 0.04), C.ink, stand, { y: 1.2, rx: -0.4 });
    [-0.16, 0.16].forEach((x) => mesh(box(0.3, 0.4, 0.01), "#fbf7ee", stand, { x, y: 1.22, z: 0.03, rx: -0.4 }));
  }

  /* ───────────── Gate ───────────── */
  {
    const g = new THREE.Group();
    g.position.set(0, 0, R - 1.2);
    world.add(g);
    [-2.4, 2.4].forEach((x) => {
      mesh(box(0.9, 3.4, 0.9), C.plaster, g, { x, y: 1.7 });
      mesh(box(1.1, 0.25, 1.1), C.stone2, g, { x, y: 3.5 });
      mesh(box(0.35, 0.45, 0.35), null, g, { x: x * 1.25, y: 2.2, z: 0.2, m: glowM });
    });
    mesh(new THREE.TorusGeometry(2.4, 0.42, 6, 18, Math.PI), C.plaster, g, { y: 3.5 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 11) * Math.PI;
      mesh(new THREE.IcosahedronGeometry(range(0.2, 0.35), 0), pick([C.leaf1, C.leaf2]), g, { x: Math.cos(a) * 2.4, y: 3.5 + Math.sin(a) * 2.4, z: range(-0.3, 0.3) });
      if (i % 3 === 0) mesh(new THREE.IcosahedronGeometry(0.13, 0), "#f0afc2", g, { x: Math.cos(a) * 2.5, y: 3.6 + Math.sin(a) * 2.5, z: 0.35 });
    }
  }

  /* ───────────── Trees, bushes, lamps, benches ───────────── */
  const sway = [];
  const obstacles = [...reserved]; // things the cat walks around: { x, z, r }
  function tree(x, z, type, s, parent = world) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rnd() * 6;
    parent.add(g);
    const crown = new THREE.Group();
    g.add(crown);
    if (type === "round") {
      mesh(cyl(0.18 * s, 0.26 * s, 1.6 * s, 6), C.trunk, g, { y: 0.8 * s });
      mesh(new THREE.IcosahedronGeometry(1.25 * s, 0), pick([C.leaf1, C.leaf2]), crown, { y: 2.1 * s });
      mesh(new THREE.IcosahedronGeometry(0.8 * s, 0), pick([C.leaf2, C.leaf3]), crown, { x: 0.6 * s, y: 2.7 * s, z: 0.3 * s });
    } else if (type === "pine") {
      mesh(cyl(0.15 * s, 0.2 * s, 1 * s, 5), C.trunk, g, { y: 0.5 * s });
      [[1.35, 1.9, 1.6], [1.05, 1.6, 2.5], [0.72, 1.3, 3.3]].forEach(([r, h, y]) =>
        mesh(new THREE.ConeGeometry(r * s, h * s, 7), C.pine, crown, { y: y * s }));
    } else if (type === "blossom") {
      mesh(cyl(0.16 * s, 0.24 * s, 1.8 * s, 6), "#7a5540", g, { y: 0.9 * s });
      [[0, 2.3, 0, 1.1], [0.8, 2.0, 0.3, 0.8], [-0.7, 2.1, -0.3, 0.85]].forEach(([x, y, z, r]) =>
        mesh(new THREE.IcosahedronGeometry(r * s, 0), pick(["#f2bfcc", "#eeb0c0", "#f7d3dc"]), crown, { x: x * s, y: y * s, z: z * s }));
    } else {
      mesh(cyl(0.12 * s, 0.16 * s, 0.8 * s, 5), C.trunk, g, { y: 0.4 * s });
      mesh(new THREE.SphereGeometry(0.8 * s, 7, 5), C.leaf3, crown, { y: 2.3 * s }).scale.set(1, 2.1, 1);
    }
    if (parent === world) {
      sway.push({ crown, phase: rnd() * 6, amp: range(0.015, 0.03) });
      obstacles.push({ x, z, r: 0.75 * s });
    }
    return g;
  }
  for (let a = 0; a < Math.PI * 2; a += 0.21) {
    const r = range(18, 20.6);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (nearLandmark(x, z, 1.8) || nearPath(x, z, 2) || (Math.abs(x) < 4 && z > 0)) continue;
    tree(x, z, pick(["round", "round", "pine", "pine", "cypress", "blossom"]), range(0.85, 1.25));
  }
  [[-2.5, -12.5], [3, -15.5], [-15.5, -3], [16, -1.5], [-17, 9.5], [2.5, 10.5], [-13, -12]].forEach(([x, z]) => {
    if (!nearLandmark(x, z, 1.2) && !nearPath(x, z, 1.6)) tree(x, z, pick(["round", "pine", "cypress", "blossom"]), range(0.8, 1.1));
  });
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, r = range(6.5, 20);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (nearLandmark(x, z, 0.6) || nearPath(x, z, 1.1)) continue;
    mesh(new THREE.IcosahedronGeometry(range(0.45, 0.8), 0), pick([C.leaf1, C.leaf2, C.leaf3]), world, { x, y: 0.3, z, ry: rnd() * 6 });
  }
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, r = range(8, 20.5);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (nearLandmark(x, z, 0.4) || nearPath(x, z, 1)) continue;
    mesh(new THREE.DodecahedronGeometry(range(0.3, 0.6), 0), pick(["#c9c2b4", "#b7b0a2"]), world, { x, y: 0.15, z, rx: rnd(), ry: rnd() * 6 });
  }
  [[1.3, 9], [-1.3, 13], [1.3, 17]].forEach(([x, z]) => {
    mesh(cyl(0.06, 0.08, 2.2, 6), C.ink, world, { x, y: 1.1, z });
    mesh(box(0.34, 0.4, 0.34), null, world, { x, y: 2.35, z, m: glowM });
    mesh(new THREE.ConeGeometry(0.3, 0.25, 4), C.ink, world, { x, y: 2.68, z, ry: Math.PI / 4 });
  });
  [0.8, 2.35, 3.9, 5.45].forEach((a) => {
    const x = Math.cos(a) * 7.2, z = Math.sin(a) * 7.2;
    if (nearPath(x, z, 1.4)) return;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = -a - Math.PI / 2;
    world.add(g);
    mesh(box(1.8, 0.1, 0.55), C.wood, g, { y: 0.5 });
    mesh(box(1.8, 0.45, 0.08), C.wood, g, { y: 0.8, z: -0.25 });
    [-0.75, 0.75].forEach((bx) => mesh(box(0.08, 0.5, 0.5), C.ink, g, { x: bx, y: 0.25 }));
  });

  /* ───────────── Flowers & grass ───────────── */
  {
    const beds = [[-5, -3], [4.5, -3.5], [-6.8, 2.6], [6.6, 1.5], [-2.8, 7], [3.2, 7.4], [-14.5, -2.5], [15, -3.5], [-3.5, -13.5], [4.5, -13.2], [0, -17], [13.5, 11.5], [-12, 12.5], [9.5, 16], [-9, 16.5], [16.5, -8.5], [-16.5, -9], [-10, 0.5], [1, -9]];
    const blooms = [], spikes = [], tufts = [];
    beds.forEach(([bx, bz]) => {
      const main = pick(BLOOMS);
      for (let i = 0; i < 34; i++) {
        const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 1.7;
        const x = bx + Math.cos(a) * r, z = bz + Math.sin(a) * r;
        if (nearLandmark(x, z, 0.3) || nearPath(x, z, 0.6)) continue;
        if (rnd() < 0.3) spikes.push([x, z]);
        else blooms.push([x, z, rnd() < 0.7 ? main : pick(BLOOMS)]);
      }
    });
    for (let i = 0; i < 380; i++) {
      const a = rnd() * 6.28, r = Math.sqrt(rnd()) * (R - 1);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!nearLandmark(x, z, 0.2) && !nearPath(x, z, 0.6)) tufts.push([x, z]);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), col = new THREE.Color();
    const bloomI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.17, 0), mat("#ffffff"), blooms.length);
    blooms.forEach(([x, z, c], i) => {
      m4.compose(v.set(x, range(0.18, 0.4), z), q.setFromEuler(new THREE.Euler(rnd(), rnd(), rnd())), s.setScalar(range(0.7, 1.2)));
      bloomI.setMatrixAt(i, m4);
      bloomI.setColorAt(i, col.set(c));
    });
    bloomI.castShadow = true;
    world.add(bloomI);
    const spikeI = new THREE.InstancedMesh(new THREE.ConeGeometry(0.1, 0.62, 5), mat("#ffffff"), spikes.length);
    spikes.forEach(([x, z], i) => {
      const k = range(0.8, 1.3);
      m4.compose(v.set(x, 0.3 * k, z), q.setFromEuler(new THREE.Euler(range(-0.15, 0.15), 0, range(-0.15, 0.15))), s.setScalar(k));
      spikeI.setMatrixAt(i, m4);
      spikeI.setColorAt(i, col.set(pick(["#8c75c0", "#9d86c9", "#7a66ad"])));
    });
    spikeI.castShadow = true;
    world.add(spikeI);
    const tuftI = new THREE.InstancedMesh(new THREE.ConeGeometry(0.08, 0.45, 4), mat("#ffffff"), tufts.length * 3);
    let n = 0;
    tufts.forEach(([x, z]) => {
      for (let j = 0; j < 3; j++) {
        m4.compose(v.set(x + range(-0.12, 0.12), 0.2, z + range(-0.12, 0.12)), q.setFromEuler(new THREE.Euler(range(-0.35, 0.35), 0, range(-0.35, 0.35))), s.setScalar(range(0.7, 1.2)));
        tuftI.setMatrixAt(n, m4);
        tuftI.setColorAt(n++, col.set(pick([C.leaf1, C.leaf3, "#86a06d"])));
      }
    });
    world.add(tuftI);
  }

  /* ───────────── Life: a cat, butterflies, clouds ───────────── */
  {
    // a little black cat, head toward +x
    const cat = new THREE.Group();
    world.add(cat);
    const fur = "#2e2c33", eye = "#e8d36a";
    const bodyG = new THREE.Group(); // everything above the legs bobs together
    cat.add(bodyG);
    mesh(box(0.95, 0.42, 0.42), fur, bodyG, { y: 0.52 });
    const head = new THREE.Group();
    head.position.set(0.56, 0.78, 0);
    bodyG.add(head);
    mesh(box(0.42, 0.38, 0.4), fur, head, {});
    [-0.12, 0.12].forEach((z) => mesh(new THREE.ConeGeometry(0.09, 0.2, 4), fur, head, { x: 0.04, y: 0.26, z }));
    [0.1, -0.1].forEach((z) => mesh(box(0.06, 0.07, 0.06), null, head, { x: 0.2, y: 0.03, z, cast: false, m: mat(eye, { emissive: eye, emissiveIntensity: 0.35 }) }));
    const tail = mesh(cyl(0.05, 0.07, 0.7, 5).translate(0, 0.35, 0), fur, bodyG, { x: -0.44, y: 0.62, rz: 0.7 });
    // legs swing from the hip, not the middle
    const legGeo = box(0.12, 0.34, 0.12).translate(0, -0.17, 0);
    const legs = [[0.32, 0.14], [0.32, -0.14], [-0.32, 0.14], [-0.32, -0.14]].map(([x, z]) => mesh(legGeo, fur, cat, { x, y: 0.34, z }));
    // wanders the whole island: picks a spot, strolls there around anything in the way,
    // then sits a moment and looks about before choosing the next one
    const avoid = [
      { x: 0, z: 0, r: 3.4 }, // fountain
      ...LANDMARKS.map((L) => ({ x: L.pos[0], z: L.pos[1], r: L.r * 0.9 })),
      { x: -2.4, z: R - 1.2, r: 0.7 }, { x: 2.4, z: R - 1.2, r: 0.7 }, // gate pillars
      ...obstacles,
    ];
    const EDGE = R - 2.2;
    const free = (x, z, pad) => Math.hypot(x, z) < EDGE - pad && avoid.every((o) => Math.hypot(x - o.x, z - o.z) > o.r + pad);
    function pickTarget() {
      for (let i = 0; i < 60; i++) {
        const ang = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * EDGE;
        const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
        if (free(x, z, 1) && Math.hypot(x - pos.x, z - pos.y) > 4) return new THREE.Vector2(x, z);
      }
      return new THREE.Vector2(RING, 0);
    }
    const pos = new THREE.Vector2(RING, 0.5);
    let heading = Math.PI / 2, target = pickTarget(), rest = 0, walk = 1, stride = 0, best = Infinity, stuck = 0;
    const want = new THREE.Vector2(), away = new THREE.Vector2();
    animated.push((t, dt) => {
      if (rest > 0) {
        rest -= dt;
        if (rest <= 0) { target = pickTarget(); best = Infinity; stuck = 0; }
      }
      walk += ((rest > 0 ? 0 : 1) - walk) * Math.min(1, dt * 2);

      want.subVectors(target, pos);
      const d = want.length();
      if (rest <= 0 && d < 0.5) rest = 2 + Math.random() * 5;
      want.normalize();
      // gently push away from anything close
      avoid.forEach((o) => {
        away.set(pos.x - o.x, pos.y - o.z);
        const gap = away.length() - o.r;
        if (gap < 1.4) want.addScaledVector(away.normalize(), (1.4 - gap) * 1.6);
      });
      const fromCentre = pos.length();
      if (fromCentre > EDGE - 1.5) want.addScaledVector(away.copy(pos).normalize(), -(fromCentre - EDGE + 1.5) * 2);
      // turn smoothly toward where it wants to go
      let turn = Math.atan2(want.y, want.x) - heading;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      heading += Math.sign(turn) * Math.min(Math.abs(turn), dt * 2.4 * walk);
      const speed = 0.75 * walk * (0.55 + 0.45 * Math.max(0, Math.cos(turn))); // slow down for sharp turns
      pos.x += Math.cos(heading) * speed * dt;
      pos.y += Math.sin(heading) * speed * dt;
      // if it can't get any closer for a while, choose somewhere else
      if (rest <= 0) {
        if (d < best - 0.05) { best = d; stuck = 0; } else if ((stuck += dt) > 5) { target = pickTarget(); best = Infinity; stuck = 0; }
      }

      stride += dt * 7 * walk;
      cat.position.set(pos.x, 0.06, pos.y);
      cat.rotation.y = -heading; // head (+x) points along the heading
      // diagonal pairs move together, like a real trot
      legs.forEach((l, i) => (l.rotation.z = Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 * walk));
      bodyG.position.y = Math.abs(Math.sin(stride)) * 0.03 * walk;
      head.rotation.y = Math.sin(t * 0.7) * 0.45 * (1 - walk);
      tail.rotation.x = Math.sin(t * 1.6) * (0.25 + 0.2 * (1 - walk));
    });
  }
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Group();
    world.add(b);
    const wingGeo = new THREE.PlaneGeometry(0.34, 0.26).translate(0.17, 0, 0).rotateX(-Math.PI / 2);
    const wm = new THREE.MeshStandardMaterial({ color: pick(["#f3d77e", "#f2f0ea", "#f0afc2", "#b9a6de"]), side: THREE.DoubleSide, flatShading: true });
    const w1 = mesh(wingGeo, null, b, { m: wm, cast: false });
    const w2 = mesh(wingGeo, null, b, { m: wm, cast: false, ry: Math.PI });
    const cx = range(-12, 12), cz = range(-10, 12), r1 = range(2, 4), r2 = range(2, 4), sp = range(0.18, 0.3), ph = rnd() * 6;
    animated.push((t) => {
      const k = t * sp + ph;
      b.position.set(cx + Math.cos(k) * r1, 1.4 + Math.sin(k * 2.3) * 0.5, cz + Math.sin(k * 1.3) * r2);
      b.rotation.y = -k;
      const f = Math.sin(t * 14 + ph) * 0.9;
      w1.rotation.z = f;
      w2.rotation.z = -f;
    });
  }
  const clouds = [];
  const cloudM = new THREE.MeshStandardMaterial({ color: "#fbfaf4", flatShading: true, transparent: true, opacity: 0.94 });
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group();
    [[0, 0, 0, 1.6], [1.5, -0.2, 0.3, 1.2], [-1.4, -0.3, -0.2, 1.1], [0.4, 0.6, -0.4, 1]].forEach(([x, y, z, r]) =>
      mesh(new THREE.IcosahedronGeometry(r, 1), null, c, { x, y, z, m: cloudM, receive: false }));
    c.scale.setScalar(range(0.9, 1.3));
    c.userData = { a: (i / 3) * Math.PI * 2 + 0.6, r: range(29, 33), y: range(-2, 4) };
    world.add(c);
    clouds.push(c);
  }
  animated.push((t, dt) => {
    clouds.forEach((c) => {
      const u = c.userData;
      u.a += dt * 0.012;
      c.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.3 + u.r) * 0.4, Math.sin(u.a) * u.r * 0.8);
    });
    sway.forEach(({ crown, phase, amp }) => (crown.rotation.z = Math.sin(t * 0.8 + phase) * amp));
  });

  /* ───────────── Keepsakes: 3D pieces for the section pages ───────────── */
  // Small props built from the same shapes as the garden. They're rendered once into
  // images that decorate the pages, and a second renderer shows each section's building
  // on a little turning island in the page header.
  function flowerClump(g, n = 16, r = 0.8) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r;
      if (rnd() < 0.3) mesh(new THREE.ConeGeometry(0.1, 0.62, 5), pick(["#8c75c0", "#9d86c9"]), g, { x: Math.cos(a) * d, y: 0.31, z: Math.sin(a) * d });
      else mesh(new THREE.IcosahedronGeometry(0.17, 0), pick(BLOOMS), g, { x: Math.cos(a) * d, y: range(0.2, 0.4), z: Math.sin(a) * d, rx: rnd() });
    }
    for (let i = 0; i < 8; i++) mesh(new THREE.ConeGeometry(0.08, 0.45, 4), pick([C.leaf1, C.leaf3]), g, { x: range(-r, r), y: 0.2, z: range(-r, r), rz: range(-0.3, 0.3) });
  }
  const PROPS = {
    round: (g) => tree(0, 0, "round", 1, g),
    pine: (g) => tree(0, 0, "pine", 1, g),
    blossom: (g) => tree(0, 0, "blossom", 1, g),
    cypress: (g) => tree(0, 0, "cypress", 1, g),
    flowers: (g) => flowerClump(g, 22, 0.9),
    bush: (g) => {
      [[0, 0.5, 0, 0.7], [0.6, 0.4, 0.2, 0.5], [-0.55, 0.38, 0.1, 0.5]].forEach(([x, y, z, r]) => mesh(new THREE.IcosahedronGeometry(r, 0), pick([C.leaf1, C.leaf2]), g, { x, y, z }));
      for (let i = 0; i < 5; i++) mesh(new THREE.IcosahedronGeometry(0.12, 0), pick(BLOOMS), g, { x: range(-0.8, 0.8), y: range(0.5, 0.9), z: 0.55 });
    },
    pot: (g) => {
      mesh(cyl(0.45, 0.33, 0.6, 9), C.terracotta, g, { y: 0.3 });
      mesh(cyl(0.5, 0.5, 0.12, 9), "#c98468", g, { y: 0.62 });
      mesh(new THREE.IcosahedronGeometry(0.5, 0), C.leaf2, g, { y: 1.05 });
      mesh(new THREE.IcosahedronGeometry(0.34, 0), C.leaf1, g, { x: 0.3, y: 1.35, z: 0.1 });
      mesh(new THREE.IcosahedronGeometry(0.13, 0), "#f0afc2", g, { x: -0.2, y: 1.45, z: 0.3 });
    },
    sprout: (g) => {
      mesh(cyl(0.38, 0.3, 0.5, 8), "#d8b56a", g, { y: 0.25 });
      mesh(cyl(0.03, 0.03, 0.7, 4), C.leaf3, g, { y: 0.8 });
      [[-1, 0.5], [1, -0.5]].forEach(([k, r]) => mesh(new THREE.SphereGeometry(0.22, 6, 4), C.leaf2, g, { x: k * 0.2, y: 1.15, rz: r }).scale.set(1.4, 0.5, 0.8));
    },
    books: (g) => {
      ["#c0765a", "#6b8458", "#d8b56a", "#5c6f86", "#a08bd0"].forEach((c, i) => mesh(box(1.1 - i * 0.06, 0.2, 0.8), c, g, { y: 0.1 + i * 0.2, ry: range(-0.35, 0.35) }));
      mesh(cyl(0.16, 0.12, 0.25, 8), C.plaster, g, { x: 0.25, y: 1.12 });
    },
    lantern: (g) => {
      mesh(cyl(0.07, 0.09, 2.4, 6), C.ink, g, { y: 1.2 });
      mesh(box(0.42, 0.52, 0.42), null, g, { y: 2.6, m: glowM });
      mesh(new THREE.ConeGeometry(0.36, 0.3, 4), C.ink, g, { y: 3.0, ry: Math.PI / 4 });
      flowerClump(g, 8, 0.5);
    },
    cat: (g) => {
      const fur = "#2e2c33", pale = "#4a4750";
      mesh(cyl(0.3, 0.44, 0.72, 7), fur, g, { y: 0.36 });
      mesh(cyl(0.2, 0.28, 0.5, 7), pale, g, { y: 0.34, z: 0.2 });
      mesh(new THREE.SphereGeometry(0.34, 8, 6), fur, g, { y: 0.95 }).scale.set(1.08, 0.92, 1);
      [-0.17, 0.17].forEach((x) => mesh(new THREE.ConeGeometry(0.11, 0.24, 4), fur, g, { x, y: 1.3, ry: Math.PI / 4 }));
      [-0.12, 0.12].forEach((x) => mesh(new THREE.SphereGeometry(0.05, 6, 4), null, g, { x, y: 0.99, z: 0.3, m: mat("#e8d36a", { emissive: "#e8d36a", emissiveIntensity: 0.35 }) }));
      mesh(new THREE.ConeGeometry(0.04, 0.05, 3), "#e89aa6", g, { y: 0.91, z: 0.33, rx: Math.PI / 2 });
      mesh(new THREE.TorusGeometry(0.42, 0.07, 5, 12, Math.PI * 1.1), fur, g, { y: 0.06, rx: -Math.PI / 2, rz: 0.2 });
      [-0.14, 0.14].forEach((x) => mesh(new THREE.SphereGeometry(0.1, 6, 4), pale, g, { x, y: 0.06, z: 0.36 }));
    },
    letter: (g) => {
      const e = new THREE.Group();
      e.rotation.set(0.95, -0.35, 0.12);
      g.add(e);
      mesh(box(1.3, 0.05, 0.86), "#fbf7ee", e, {});
      const flap = prismGeo(1.3, 0.5, 0.02).rotateX(Math.PI / 2);
      mesh(flap, null, e, { y: 0.035, z: -0.43, m: mat("#efe7d6") });
      mesh(new THREE.SphereGeometry(0.1, 8, 6), C.red, e, { y: 0.06, z: 0.05 }).scale.set(1, 0.4, 1);
    },
    note: (g) => {
      mesh(new THREE.SphereGeometry(0.26, 10, 8), C.ink, g, {}).scale.set(1.25, 0.85, 1);
      mesh(box(0.06, 1, 0.06), C.ink, g, { x: 0.28, y: 0.5 });
      mesh(box(0.36, 0.09, 0.06), C.ink, g, { x: 0.44, y: 0.95, rz: -0.45 });
    },
  };

  function keepsakeLights(sc) {
    sc.add(new THREE.HemisphereLight("#f7f3e8", "#7d8f6c", 1.75));
    const d = new THREE.DirectionalLight("#fff3dd", 2.3);
    d.position.set(-8, 14, 10);
    sc.add(d);
    return d;
  }

  function cropped(src) {
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const x = c.getContext("2d");
    x.drawImage(src, 0, 0);
    const { data, width, height } = x.getImageData(0, 0, c.width, c.height);
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    for (let y = 0; y < height; y++) for (let i = 0; i < width; i++) {
      if (data[(y * width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < x0) return src.toDataURL("image/png");
    const pad = 4, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    out.getContext("2d").drawImage(c, x0 - pad, y0 - pad, w, h, 0, 0, w, h);
    return out.toDataURL("image/png");
  }
  // render every prop into an image, once, when the browser has a quiet moment
  const propImages = {};
  function renderProps() {
    let r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch { return; }
    r.setPixelRatio(2);
    Object.entries(PROPS).forEach(([name, build]) => {
      const sc = new THREE.Scene();
      keepsakeLights(sc);
      const g = new THREE.Group();
      sc.add(g);
      build(g);
      const sphere = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
      const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
      const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(13))) * 0.98;
      const az = 0.65, el = 0.38;
      cam.position.set(sphere.center.x + Math.sin(az) * Math.cos(el) * dist, sphere.center.y + Math.sin(el) * dist, sphere.center.z + Math.cos(az) * Math.cos(el) * dist);
      cam.lookAt(sphere.center);
      r.setSize(220, 220, false);
      r.render(sc, cam);
      propImages[name] = cropped(r.domElement);
    });
    r.dispose();
    r.forceContextLoss();
    decoratePages();
  }
  function prop(name, cls) {
    const img = document.createElement("img");
    img.src = propImages[name];
    img.alt = "";
    img.className = "keepsake " + (cls || "");
    img.setAttribute("aria-hidden", "true");
    return img;
  }
  function decoratePages() {
    // a hedge of trees and flowers along the foot of the page header
    const hedge = document.getElementById("hedge");
    if (hedge) {
      [["blossom", 3, 84], ["round", 8.5, 70], ["flowers", 13, 58], ["bush", 17, 50], ["sprout", 44, 22], ["flowers", 80, 54], ["cypress", 86, 34], ["round", 91, 66], ["pine", 96.5, 56]].forEach(([n, x, w]) => {
        const img = prop(n, "hedge-item");
        img.style.left = x + "%";
        img.style.width = w + "px";
        hedge.appendChild(img);
      });
    }
    const foot = document.getElementById("foot-garnish");
    if (foot) ["flowers", "cat", "pot"].forEach((n) => foot.appendChild(prop(n, "foot-" + n)));
    const cycle = ["pot", "lantern", "books", "sprout", "flowers"];
    document.querySelectorAll(".xp-group > h3").forEach((h, i) => h.appendChild(prop(cycle[i % cycle.length], "group-prop")));
    const inline = { studies: ["books", "letter"], play: ["flowers", "note", "note"] };
    Object.entries(inline).forEach(([sec, names]) =>
      document.querySelectorAll(`[data-section="${sec}"] h3`).forEach((h, i) => h.prepend(prop(names[i % names.length], "h3-prop"))));
    const lede = document.querySelector('[data-section="contact"] .contact-links');
    if (lede) lede.before(prop("letter", "contact-letter"));
  }
  (window.requestIdleCallback || ((f) => setTimeout(f, 1200)))(renderProps, { timeout: 2500 });

  // the turning island in each page header
  const vignette = (() => {
    const vc = document.getElementById("vignette");
    if (!vc) return null;
    let vr;
    try { vr = new THREE.WebGLRenderer({ canvas: vc, antialias: true, alpha: true }); } catch { vc.remove(); return null; }
    vr.setPixelRatio(Math.min(devicePixelRatio, 2));
    vr.shadowMap.enabled = true;
    vr.shadowMap.type = THREE.PCFSoftShadowMap;
    const vs = new THREE.Scene();
    const dl = keepsakeLights(vs);
    dl.castShadow = true;
    dl.shadow.mapSize.set(1024, 1024);
    Object.assign(dl.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
    dl.shadow.normalBias = 0.03;
    const vcam = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
    const holder = new THREE.Group();
    vs.add(holder);
    mesh(cyl(6.2, 6, 0.7, 44), C.grass, holder, { y: -0.35, cast: false });
    mesh(cyl(6, 4.4, 1.9, 30), C.dirt, holder, { y: -1.65, cast: false });
    mesh(new THREE.ConeGeometry(4.4, 3.4, 20, 2), C.dirtDark, holder, { y: -4.3, rx: Math.PI, cast: false });
    tree(-4.3, -2.6, "round", 0.75, holder);
    tree(4.4, -2.4, "pine", 0.7, holder);
    tree(-3.9, 3, "blossom", 0.6, holder);
    const clump = new THREE.Group();
    clump.position.set(4, 0, 2.8);
    holder.add(clump);
    flowerClump(clump, 16, 0.9);
    [[1.2, 4.8], [2.1, 5.3], [0.3, 5.4]].forEach(([x, z]) => mesh(cyl(0.45, 0.5, 0.1, 7), C.stone, holder, { x, y: 0.03, z }));
    const stage = new THREE.Group();
    holder.add(stage);

    let spin = 0.35, vel = 0, drag = null, t = 0;
    function show(id) {
      stage.clear();
      const L = byId[id];
      if (!L) return;
      const c = L.group.clone(true);
      c.position.set(0, 0, 0);
      c.rotation.set(0, 0, 0);
      c.scale.setScalar(1);
      const size = new THREE.Box3().setFromObject(c).getSize(new THREE.Vector3());
      c.scale.setScalar(Math.min(2.2, 6.4 / Math.max(size.x, size.z)));
      stage.add(c);
      spin = 0.35;
    }
    function resize() {
      const w = vc.clientWidth, h = vc.clientHeight;
      if (!w || !h) return;
      vr.setSize(w, h, false);
      vcam.aspect = w / h;
      vcam.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(vc);
    vc.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, spin }; vc.setPointerCapture(e.pointerId); vc.classList.add("dragging"); });
    vc.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const next = drag.spin + (e.clientX - drag.x) * 0.012;
      vel = next - spin;
      spin = next;
    });
    const end = () => { drag = null; vc.classList.remove("dragging"); };
    vc.addEventListener("pointerup", end);
    vc.addEventListener("pointercancel", end);
    addEventListener("garden:focus", (e) => show(e.detail));
    return {
      tick(dt) {
        t += dt;
        if (!drag) {
          vel *= 1 - Math.min(1, dt * 2.5);
          spin += vel + (reduceMotion ? 0 : dt * 0.16);
        }
        holder.rotation.y = spin;
        holder.position.y = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.15;
        const el = 0.5, dist = 7.6 / Math.tan(THREE.MathUtils.degToRad(13)) / Math.min(1, vcam.aspect);
        vcam.position.set(0, 1 + Math.sin(el) * dist, Math.cos(el) * dist);
        vcam.lookAt(0, 0.4, 0);
        vr.render(vs, vcam);
      },
    };
  })();

  /* ───────────── Labels ───────────── */
  let hoverFromUI = null;
  LANDMARKS.forEach((L) => {
    const b = document.createElement("button");
    b.className = "label";
    b.type = "button";
    b.tabIndex = -1; // the dock is the keyboard route
    b.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-${L.id}" /></svg><b>${L.name}</b><span>${L.sub}</span>`;
    b.dataset.id = L.id;
    b.addEventListener("pointerenter", () => (hoverFromUI = L.id));
    b.addEventListener("pointerleave", () => (hoverFromUI = null));
    labelsEl.appendChild(b);
    L.label = b;
    L.anchor = new THREE.Vector3(L.pos[0], L.h, L.pos[1]);
  });

  /* ───────────── Camera ───────────── */
  const view = { target: new THREE.Vector3(), dist: 90, el: 1.05, az: -0.35 };
  const goal = { target: new THREE.Vector3(), dist: 0, el: 0, az: 0 };
  let userAz = 0, userEl = 0;
  let mode = "overview";
  let focusId = null;

  function fitDist() {
    // keep the whole island in frame on narrow screens too
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(27 / halfH, (R * 1.18) / halfW);
  }
  function setGoal() {
    if (mode === "overview") {
      goal.target.set(0, -3, 1.5);
      goal.dist = fitDist();
      goal.el = 0.74;
      goal.az = 0;
    } else {
      // glide down toward the building; the page then rises over the scene
      const L = byId[focusId];
      goal.target.set(L.pos[0], 1.5, L.pos[1]);
      goal.dist = innerWidth < 700 ? Math.max(40, fitDist() * 0.4) : 30;
      goal.el = 0.8;
      goal.az = Math.max(-0.5, Math.min(0.5, Math.atan2(L.pos[0], 30) * 0.6));
    }
  }
  function placeCamera() {
    const az = view.az + userAz, el = Math.max(0.45, Math.min(1.35, view.el + userEl));
    camera.position.set(
      view.target.x + Math.sin(az) * Math.cos(el) * view.dist,
      view.target.y + Math.sin(el) * view.dist,
      view.target.z + Math.cos(az) * Math.cos(el) * view.dist
    );
    camera.lookAt(view.target);
  }

  addEventListener("garden:focus", (e) => { mode = "focus"; focusId = e.detail; userAz *= 0.3; userEl = 0; setGoal(); });
  addEventListener("garden:overview", () => { mode = "overview"; focusId = null; setGoal(); });
  addEventListener("garden:hover", (e) => (hoverFromUI = e.detail));

  /* ───────────── Pointer: hover, click, gentle drag ───────────── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoverFromScene = null;
  let drag = null;
  const pickables = LANDMARKS.map((L) => L.group);
  function landmarkAt(x, y) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, true)[0];
    let o = hit?.object;
    while (o && !o.userData.id) o = o.parent;
    return o?.userData.id || null;
  }
  // A drag can start on the garden or on a building's label. The canvas captures the
  // pointer so the whole gesture stays ours, and default actions are prevented so the
  // browser never starts selecting (and then natively dragging) label text mid-gesture.
  function startDrag(e, labelId = null) {
    if (e.button !== 0) return;
    e.preventDefault();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, az: userAz, el: userEl, moved: false, labelId };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  }
  function endDrag() {
    if (!drag) return;
    const wasDrag = drag.moved;
    drag = null;
    canvas.classList.remove("dragging");
    document.body.classList.remove("dragging-view");
    return wasDrag;
  }
  canvas.addEventListener("pointerdown", (e) => startDrag(e));
  labelsEl.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".label");
    if (b) startDrag(e, b.dataset.id);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      if (e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        canvas.classList.add("dragging");
        document.body.classList.add("dragging-view");
        hoverFromScene = null;
      }
      if (drag.moved) {
        userAz = Math.max(-0.7, Math.min(0.7, drag.az - dx * 0.004));
        userEl = Math.max(-0.35, Math.min(0.3, drag.el + dy * 0.003));
      }
      return;
    }
    if (e.pointerType === "touch") return;
    hoverFromScene = landmarkAt(e.clientX, e.clientY);
    canvas.classList.toggle("hovering", !!hoverFromScene);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const labelId = drag.labelId;
    if (endDrag()) return;
    const id = labelId || landmarkAt(e.clientX, e.clientY);
    if (id) window.garden.open(id);
    else if (mode === "focus") window.garden.close();
  });
  // the browser can take the pointer away (a system gesture, a lost window focus):
  // always let go instead of staying stuck in a drag
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);
  addEventListener("blur", endDrag);
  canvas.addEventListener("pointerleave", () => { hoverFromScene = null; canvas.classList.remove("hovering"); });

  /* ───────────── Resize & loop ───────────── */
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    setGoal();
  }
  addEventListener("resize", resize);
  resize();
  // start a little higher and turned, then settle in
  Object.assign(view, { dist: goal.dist * 1.3, el: goal.el + 0.18, az: goal.az - 0.35 });
  view.target.copy(goal.target);

  const v = new THREE.Vector3();
  const dockButtons = [...document.querySelectorAll(".dock button")];
  let last = performance.now();
  let t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (vignette && document.body.classList.contains("is-open")) vignette.tick(dt);
    // a page fully covers the garden: rest until it's back
    if (document.body.classList.contains("page-shown")) {
      requestAnimationFrame(frame);
      return;
    }
    t += reduceMotion ? dt * 0.25 : dt;
    animated.forEach((f) => f(t, dt));

    const k = 1 - Math.exp(-dt * (reduceMotion ? 8 : 2.2));
    const breathe = mode === "focus" || reduceMotion ? 0 : Math.sin(t * 0.08) * 0.05;
    view.target.lerp(goal.target, k);
    view.dist += (goal.dist - view.dist) * k;
    view.el += (goal.el - view.el) * k;
    view.az += (goal.az + breathe - view.az) * k;
    placeCamera();

    // hover lift, and labels that follow their buildings
    const hot = hoverFromUI || hoverFromScene;
    LANDMARKS.forEach((L) => {
      const want = L.id === hot || L.id === focusId ? 1 : 0;
      L.lift += (want - L.lift) * Math.min(1, dt * 8);
      L.group.position.y = L.lift * 0.35;
      L.group.scale.setScalar(L.baseScale * (1 + L.lift * 0.04));
      L.label.classList.toggle("is-hot", L.id === hot);
      v.copy(L.anchor);
      v.y += L.lift * 0.35;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
      L.label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    });
    dockButtons.forEach((b) => b.classList.toggle("is-hot", b.dataset.open === hot));

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init();
