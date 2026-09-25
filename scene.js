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
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
    mesh(box(0.88, 0.54, 0.02), null, g, { x: -0.4, y: 1.6, z: -1.3, rx: -0.2, m: mat("#d7ecf7", { emissive: "#9ec7e6", emissiveIntensity: 0.6 }) });
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
    mesh(cyl(0.25, 0.28, 0.45, 8), "#7f9aa8", g, { x: 3.2, y: 0.62, z: 3.2 });
    mesh(cyl(0.04, 0.05, 0.5, 5), "#7f9aa8", g, { x: 3.5, y: 0.75, z: 3.2, rz: -0.9 });
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
  const nearLandmark = (x, z, pad = 1) => LANDMARKS.some((L) => Math.hypot(x - L.pos[0], z - L.pos[1]) < L.r + pad) || Math.hypot(x, z) < 3.8 + pad;

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
  function tree(x, z, type, s) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rnd() * 6;
    world.add(g);
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
    sway.push({ crown, phase: rnd() * 6, amp: range(0.015, 0.03) });
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
    const cat = new THREE.Group();
    world.add(cat);
    const fur = "#df9a5a";
    const body = mesh(box(0.95, 0.42, 0.42), fur, cat, { y: 0.52 });
    mesh(box(0.42, 0.38, 0.4), fur, cat, { x: 0.56, y: 0.78 });
    [-0.12, 0.12].forEach((z) => mesh(new THREE.ConeGeometry(0.09, 0.2, 4), fur, cat, { x: 0.6, y: 1.04, z }));
    [0.1, -0.1].forEach((z) => mesh(box(0.06, 0.06, 0.06), C.ink, cat, { x: 0.78, y: 0.8, z, cast: false }));
    const tail = mesh(cyl(0.05, 0.07, 0.7, 5), fur, cat, { x: -0.62, y: 0.85, rz: 0.7 });
    const legs = [[0.32, 0.14], [0.32, -0.14], [-0.32, 0.14], [-0.32, -0.14]].map(([x, z]) => mesh(box(0.12, 0.34, 0.12), fur, cat, { x, y: 0.17, z }));
    let a = 1;
    animated.push((t, dt) => {
      // strolls around the fountain, pausing now and then
      const walking = Math.sin(t * 0.13) > -0.55;
      if (walking) a += dt * 0.12;
      cat.position.set(Math.cos(a) * RING, 0.06, Math.sin(a) * RING);
      cat.rotation.y = -a - Math.PI;
      legs.forEach((l, i) => (l.rotation.z = walking ? Math.sin(t * 7 + ((i + (i > 1 ? 1 : 0)) % 2) * Math.PI) * 0.45 : 0));
      body.position.y = 0.52 + (walking ? Math.abs(Math.sin(t * 7)) * 0.03 : 0);
      tail.rotation.x = Math.sin(t * 1.6) * 0.35;
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

  /* ───────────── Labels ───────────── */
  let hoverFromUI = null;
  LANDMARKS.forEach((L) => {
    const b = document.createElement("button");
    b.className = "label";
    b.type = "button";
    b.tabIndex = -1; // the dock is the keyboard route
    b.innerHTML = `<b>${L.name}</b><span>${L.sub}</span>`;
    b.addEventListener("click", () => window.garden.open(L.id));
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
  let mode = document.body.classList.contains("is-intro") ? "intro" : "overview";
  let focusId = null;

  function fitDist() {
    // keep the whole island in frame on narrow screens too
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(27 / halfH, (R * 1.18) / halfW);
  }
  function setGoal() {
    if (mode === "intro") {
      goal.target.set(0, -3, -13);
      goal.dist = fitDist() * 1.3;
      goal.el = 0.78;
      goal.az = -0.3;
    } else if (mode === "overview") {
      goal.target.set(0, -3, 1.5);
      goal.dist = fitDist();
      goal.el = 0.74;
      goal.az = 0;
    } else {
      const L = byId[focusId];
      const narrow = innerWidth < 700;
      goal.dist = narrow ? Math.max(44, fitDist() * 0.45) : 38;
      goal.el = 0.82;
      goal.az = Math.max(-0.5, Math.min(0.5, Math.atan2(L.pos[0], 30) * 0.6));
      // pan so the building sits beside the panel rather than under it
      const halfH = goal.dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const right = new THREE.Vector3(Math.cos(goal.az), 0, -Math.sin(goal.az));
      const fwd = new THREE.Vector3(-Math.sin(goal.az), 0, -Math.cos(goal.az));
      goal.target.set(L.pos[0], 1.5, L.pos[1]);
      if (narrow) goal.target.addScaledVector(fwd, (-halfH * 0.6) / Math.sin(goal.el));
      else goal.target.addScaledVector(right, halfH * camera.aspect * Math.min(0.55, 530 / innerWidth));
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

  addEventListener("garden:enter", () => { mode = "overview"; setGoal(); });
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
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, az: userAz, el: userEl, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        canvas.classList.add("dragging");
      }
      if (drag.moved && mode !== "intro") {
        userAz = Math.max(-0.7, Math.min(0.7, drag.az - dx * 0.004));
        userEl = Math.max(-0.35, Math.min(0.3, drag.el + dy * 0.003));
      }
      return;
    }
    if (mode === "intro" || e.pointerType === "touch") return;
    hoverFromScene = landmarkAt(e.clientX, e.clientY);
    canvas.classList.toggle("hovering", !!hoverFromScene);
  });
  canvas.addEventListener("pointerup", (e) => {
    const wasDrag = drag?.moved;
    drag = null;
    canvas.classList.remove("dragging");
    if (wasDrag) return;
    if (mode === "intro") return document.getElementById("enter").click();
    const id = landmarkAt(e.clientX, e.clientY);
    if (id) window.garden.open(id);
    else if (mode === "focus") window.garden.close();
  });
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
