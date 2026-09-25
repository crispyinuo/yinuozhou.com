// A still sea under ink-wash mountains. Scrolling moves the day along:
// dawn → morning → golden afternoon → dusk → night. Touching the water leaves a ripple.
import * as THREE from "three";

const canvas = document.getElementById("scene");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch {
    canvas.remove();
    document.body.classList.add("no-webgl");
    return;
  }
  // colors below are authored in sRGB and written straight out
  THREE.ColorManagement.enabled = false;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 7000);

  /* ───────────── Times of day ───────────── */
  const dir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const KEYS = [
    // dawn
    { top: "#b8c3d2", hor: "#f0d8c3", sun: "#ffe3c4", sunAz: 0.36, sunEl: 0.03, water: "#8795a3", deep: "#56647a", mtn: "#8f97a6", night: 0, motes: 0.25 },
    // morning
    { top: "#9db4ca", hor: "#e6e3dc", sun: "#e8dcc8", sunAz: 0.3, sunEl: 0.42, water: "#7e96aa", deep: "#4c6479", mtn: "#8d9bab", night: 0, motes: 0.15 },
    // golden afternoon
    { top: "#a6b0bf", hor: "#eed6b8", sun: "#ffd8a0", sunAz: 0.3, sunEl: 0.075, water: "#7d8794", deep: "#4a5361", mtn: "#7c8490", night: 0, motes: 0.3 },
    // dusk
    { top: "#2c3453", hor: "#d99d82", sun: "#ffa872", sunAz: 0.32, sunEl: -0.005, water: "#3b4259", deep: "#1d2236", mtn: "#353850", night: 0.35, motes: 1 },
    // night
    { top: "#060a16", hor: "#1b2440", sun: "#ff9a66", sunAz: 0.32, sunEl: -0.12, water: "#121828", deep: "#080c17", mtn: "#10152a", night: 1, motes: 1 },
  ].map((k) => ({
    ...k,
    top: new THREE.Color(k.top), hor: new THREE.Color(k.hor), sun: new THREE.Color(k.sun),
    water: new THREE.Color(k.water), deep: new THREE.Color(k.deep), mtn: new THREE.Color(k.mtn),
  }));

  const U = {
    uTime: { value: 0 },
    uTop: { value: new THREE.Color() },
    uHor: { value: new THREE.Color() },
    uSun: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3() },
    uSunVis: { value: 1 },
    uMoonDir: { value: dir(0.4, 0.2) },
    uNight: { value: 0 },
    uWater: { value: new THREE.Color() },
    uDeep: { value: new THREE.Color() },
    uMtn: { value: new THREE.Color() },
    uMotes: { value: 0 },
    uRip: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -100, 0)) },
    uPx: { value: renderer.getPixelRatio() },
  };

  const SKY_GLSL = /* glsl */ `
    uniform vec3 uTop, uHor, uSun, uSunDir, uMoonDir;
    uniform float uSunVis, uNight;
    vec3 skyColor(vec3 d, bool withDiscs) {
      float h = max(d.y, 0.0);
      vec3 col = mix(uHor, uTop, pow(smoothstep(0.0, 0.62, h), 0.75));
      float sd = max(dot(d, uSunDir), 0.0);
      col += uSun * (pow(sd, 6.0) * 0.18 + pow(sd, 60.0) * 0.35) * uSunVis;
      float md = max(dot(d, uMoonDir), 0.0);
      col += vec3(0.75, 0.78, 0.85) * pow(md, 90.0) * 0.18 * uNight;
      if (withDiscs) {
        col = mix(col, uSun * 1.08 + 0.06, smoothstep(0.99955, 0.99972, sd) * uSunVis);
        col = mix(col, vec3(0.94, 0.93, 0.88), smoothstep(0.99975, 0.99985, md) * uNight);
      }
      return col;
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  `;

  /* ───────────── Sky ───────────── */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(3000, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: U,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        ${SKY_GLSL}
        varying vec3 vDir;
        void main() {
          vec3 col = skyColor(normalize(vDir), true);
          col += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // dither away banding
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  sky.renderOrder = -2;
  scene.add(sky);

  /* ───────────── Stars ───────────── */
  {
    const N = 1400;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const az = Math.random() * Math.PI * 2;
      const el = Math.asin(0.04 + Math.random() * 0.96);
      const d = dir(az, el).multiplyScalar(2800);
      pos.set([d.x, d.y, d.z], i * 3);
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const stars = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: U,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime, uPx, uNight;
        varying float vA;
        void main() {
          vec3 d = normalize(position);
          float tw = 0.65 + 0.35 * sin(uTime * (0.6 + seed * 1.8) + seed * 40.0);
          vA = uNight * uNight * tw * smoothstep(0.02, 0.2, d.y) * (0.35 + 0.65 * seed);
          gl_PointSize = (0.8 + seed * seed * 2.2) * uPx;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(vec3(1.0, 0.97, 0.9), vA * smoothstep(0.5, 0.0, r));
        }`,
    }));
    stars.renderOrder = -1;
    scene.add(stars);
  }

  /* ───────────── Mountains: layered, misty ridges ───────────── */
  const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  function noise1D(seedOffset) {
    const table = Array.from({ length: 512 }, rand);
    return (x) => {
      x += seedOffset;
      const i = Math.floor(x), f = x - i;
      const u = f * f * (3 - 2 * f);
      const a = table[((i % 512) + 512) % 512], b = table[(((i + 1) % 512) + 512) % 512];
      return a + (b - a) * u;
    };
  }
  const LAYERS = [
    { z: -2400, amp: 230, base: 30, freq: 1 / 560, haze: 0.66 },
    { z: -1800, amp: 165, base: 8, freq: 1 / 400, haze: 0.46 },
    { z: -1200, amp: 105, base: -6, freq: 1 / 280, haze: 0.26 },
  ];
  LAYERS.forEach((L, li) => {
    const n = noise1D(li * 97.3);
    const N = 1400, W = 7000;
    const pos = [], hgt = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const x = -W / 2 + (W * i) / N;
      let y = 0, a = 1, f = L.freq;
      for (let o = 0; o < 6; o++) { y += (n(x * f) - 0.5) * a; a *= 0.5; f *= 2.1; }
      // leave a quiet opening near the centre where the sun sits
      const sunX = 0.34 * -L.z;
      const open = 0.2 + 0.8 * THREE.MathUtils.smoothstep(Math.abs(x - sunX), 150, 1000);
      y = L.base + (y * 1.6 + 0.55) * L.amp * open;
      pos.push(x, -30, L.z, x, Math.max(y, 2), L.z);
      hgt.push(0, 1);
      if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("h", new THREE.Float32BufferAttribute(hgt, 1));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { ...U, uHaze: { value: L.haze } },
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        attribute float h;
        varying float vH;
        varying vec3 vW;
        void main() {
          vH = h;
          vW = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uMtn, uHor, uSun, uSunDir;
        uniform float uHaze, uSunVis;
        varying float vH;
        varying vec3 vW;
        void main() {
          // mist gathers at the foot of each ridge
          float mist = smoothstep(90.0, -10.0, vW.y);
          vec3 col = mix(uMtn, uHor, clamp(uHaze + mist * 0.55, 0.0, 1.0));
          // faint warm rim where the sun is behind
          vec3 d = normalize(vW - cameraPosition);
          col += uSun * pow(max(dot(d, uSunDir), 0.0), 30.0) * 0.18 * uSunVis;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    scene.add(m);
  });

  /* ───────────── Water ───────────── */
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(9000, 9000, 1, 1).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() {
          vW = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        ${SKY_GLSL}
        uniform float uTime;
        uniform vec3 uWater, uDeep;
        uniform vec4 uRip[8];
        varying vec3 vW;

        float ripples(vec2 p) {
          float h = 0.0;
          for (int i = 0; i < 8; i++) {
            vec4 r = uRip[i];
            float age = uTime - r.z;
            if (age < 0.0 || age > 9.0) continue;
            float d = distance(p, r.xy);
            float w = d - age * 2.1;
            h += r.w * sin(w * 3.6) * exp(-w * w * 0.35) * exp(-age * 0.42) / (1.0 + d * 0.25);
          }
          return h;
        }
        float swell(vec2 p, float t) {
          float h = 0.0;
          h += 0.060 * sin(dot(p, vec2(0.28, 0.96)) * 0.32 + t * 0.55);
          h += 0.040 * sin(dot(p, vec2(-0.70, 0.71)) * 0.53 + t * 0.75);
          h += 0.024 * sin(dot(p, vec2(0.92, 0.38)) * 1.05 + t * 1.05);
          h += 0.012 * sin(dot(p, vec2(-0.24, -0.97)) * 2.2 + t * 1.45);
          h += 0.006 * sin(dot(p, vec2(0.62, -0.78)) * 4.0 + t * 1.9);
          return h;
        }
        float height(vec2 p) { return swell(p, uTime) + ripples(p); }

        void main() {
          vec2 p = vW.xz;
          float dist = length(cameraPosition - vW);
          float e = 0.08 + dist * 0.004;
          float h0 = height(p);
          float hx = height(p + vec2(e, 0.0));
          float hz = height(p + vec2(0.0, e));
          float detail = 1.0 / (1.0 + dist * 0.035);
          vec3 n = normalize(vec3(-(hx - h0) / e * detail, 1.0, -(hz - h0) / e * detail));

          vec3 V = normalize(cameraPosition - vW);
          vec3 R = reflect(-V, n);
          R.y = abs(R.y);
          vec3 refl = skyColor(normalize(R), false);
          float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
          vec3 body = mix(uDeep, uWater, smoothstep(0.0, 160.0, dist));
          vec3 col = mix(body, refl, clamp(fres * 0.92 + 0.08, 0.0, 1.0));

          float s = max(dot(R, uSunDir), 0.0);
          col += uSun * (pow(s, 700.0) * 5.0 + pow(s, 60.0) * 0.22) * uSunVis;
          float m = max(dot(R, uMoonDir), 0.0);
          col += vec3(0.9, 0.9, 0.86) * (pow(m, 2400.0) * 1.1 + pow(m, 120.0) * 0.08) * uNight;

          // soft crest light on ripples
          col += (uSun * 0.5 + 0.2) * max(ripples(p), 0.0) * 0.5;

          col = mix(col, uHor, smoothstep(250.0, 2600.0, dist));
          col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  scene.add(water);

  /* ───────────── Floating motes (dust by day, lanterns by night) ───────────── */
  const MOTES = 90;
  {
    const pos = new Float32Array(MOTES * 3);
    const seed = new Float32Array(MOTES);
    for (let i = 0; i < MOTES; i++) {
      pos.set([(Math.random() - 0.5) * 140, Math.random() * 14, -8 - Math.random() * 150], i * 3);
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const motes = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: U,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime, uPx, uMotes, uNight;
        varying float vA;
        void main() {
          vec3 p = position;
          float rise = mod(p.y + uTime * (0.12 + seed * 0.25), 14.0);
          p.y = 0.4 + rise;
          p.x += sin(uTime * 0.2 + seed * 30.0) * 2.0;
          p.z += cos(uTime * 0.15 + seed * 20.0) * 1.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float flicker = 0.7 + 0.3 * sin(uTime * (1.0 + seed * 2.0) + seed * 12.0);
          vA = uMotes * flicker * smoothstep(0.0, 2.0, rise) * smoothstep(14.0, 9.0, rise) * mix(0.25, 1.0, uNight);
          gl_PointSize = (1.6 + seed * 2.4) * uPx * (60.0 / -mv.z) * mix(0.6, 1.0, uNight);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uNight;
        varying float vA;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          vec3 warm = mix(vec3(1.0, 0.97, 0.9), vec3(1.0, 0.78, 0.48), uNight);
          gl_FragColor = vec4(warm, vA * smoothstep(0.5, 0.0, r));
        }`,
    }));
    scene.add(motes);
  }

  /* ───────────── Scroll → time of day ───────────── */
  const sections = [...document.querySelectorAll("main > section")];
  let tops = [];
  function measure() {
    tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
    tops.push(document.documentElement.scrollHeight);
  }
  // key k (dawn, morning, …) is fully reached as section k's top rises to 90% of the viewport,
  // so a section's light arrives just before its first words do
  function targetPhase() {
    const stops = tops.slice(0, KEYS.length).map((t, k) => (k === 0 ? 0 : Math.max(1, t - innerHeight * 0.9)));
    const y = scrollY;
    for (let k = 0; k < stops.length - 1; k++) {
      if (y < stops[k + 1]) return k + Math.max(0, (y - stops[k]) / (stops[k + 1] - stops[k]));
    }
    return stops.length - 1;
  }
  const smooth = (x) => x * x * (3 - 2 * x);
  function applyPhase(t) {
    t = Math.min(KEYS.length - 1, Math.max(0, t));
    const i = Math.min(KEYS.length - 2, Math.floor(t));
    const f = smooth(t - i);
    const a = KEYS[i], b = KEYS[i + 1];
    const mix = (k) => a[k] + (b[k] - a[k]) * f;
    U.uTop.value.copy(a.top).lerp(b.top, f);
    U.uHor.value.copy(a.hor).lerp(b.hor, f);
    U.uSun.value.copy(a.sun).lerp(b.sun, f);
    U.uWater.value.copy(a.water).lerp(b.water, f);
    U.uDeep.value.copy(a.deep).lerp(b.deep, f);
    U.uMtn.value.copy(a.mtn).lerp(b.mtn, f);
    const el = mix("sunEl");
    U.uSunDir.value.copy(dir(mix("sunAz"), el));
    U.uSunVis.value = THREE.MathUtils.smoothstep(el, -0.04, 0.01);
    U.uNight.value = mix("night");
    U.uMotes.value = mix("motes");
  }

  /* ───────────── Touch the water ───────────── */
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  let ripIdx = 0;
  function addRipple(x, z, strength) {
    U.uRip.value[ripIdx].set(x, z, U.uTime.value, strength);
    ripIdx = (ripIdx + 1) % U.uRip.value.length;
  }
  const INTERACTIVE = "a, button, summary, input, textarea, select, dialog, .paper, .work, .play-item, .topbar";
  addEventListener("pointerdown", (e) => {
    if (e.target.closest(INTERACTIVE)) return;
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return;
    const d = hit.distanceTo(camera.position);
    if (d > 600) return;
    addRipple(hit.x, hit.z, 0.12 + Math.min(d, 120) * 0.004);
    window.chime?.(e.clientX / innerWidth, Math.min(1, d / 140));
  });

  /* ───────────── Camera ───────────── */
  const mouse = new THREE.Vector2();
  const look = new THREE.Vector2();
  addEventListener("pointermove", (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    // keep the horizon composed on tall phone screens too
    camera.fov = camera.aspect < 0.8 ? 62 : 50;
    camera.updateProjectionMatrix();
    measure();
  }
  addEventListener("resize", resize);
  new ResizeObserver(measure).observe(document.body);
  resize();

  let phase = targetPhase();
  applyPhase(phase);
  let last = performance.now();
  let nextAmbient = 2;
  const target = new THREE.Vector3();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    U.uTime.value += dt * (reduceMotion ? 0.3 : 1);

    phase += (targetPhase() - phase) * Math.min(1, dt * 2.2);
    applyPhase(phase);
    const tone = phase > 2.55 ? "light" : "ink";
    if (document.body.dataset.tone !== tone) document.body.dataset.tone = tone;

    // now and then, a fish or a raindrop
    if (!reduceMotion && U.uTime.value > nextAmbient) {
      addRipple((Math.random() - 0.5) * 60, -12 - Math.random() * 70, 0.06 + Math.random() * 0.05);
      nextAmbient = U.uTime.value + 3 + Math.random() * 5;
    }

    const docP = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    look.lerp(mouse, Math.min(1, dt * 1.5));
    camera.position.set(look.x * 1.2, 2.6 - docP * 0.9, 14 - docP * 26);
    target.set(look.x * 14, camera.position.y + 3.2 - look.y * 3, camera.position.z - 100);
    camera.lookAt(target);
    sky.position.copy(camera.position);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.sceneTone = true;
}

init();
