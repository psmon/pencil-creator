/* ============================================
   globe.js — 3D Peace Globe (Three.js r128)

   Earth texture (NASA Blue Marble) +
   Gentle glowing arc connections between cities
   — NO ripples/explosions — peaceful only
   ============================================ */

(function () {
  'use strict';

  const CITIES = [
    { name: 'Seoul',    lat: 37.56,  lon: 126.97 },
    { name: 'Tokyo',    lat: 35.68,  lon: 139.69 },
    { name: 'Paris',    lat: 48.86,  lon: 2.35   },
    { name: 'New York', lat: 40.71,  lon: -74.01 },
    { name: 'Nairobi',  lat: -1.29,  lon: 36.82  },
    { name: 'Sydney',   lat: -33.87, lon: 151.21 },
    { name: 'Rio',      lat: -22.91, lon: -43.17 },
    { name: 'Mumbai',   lat: 19.08,  lon: 72.88  },
    { name: 'London',   lat: 51.51,  lon: -0.13  },
    { name: 'Cairo',    lat: 30.04,  lon: 31.24  },
    { name: 'Beijing',  lat: 39.90,  lon: 116.40 },
    { name: 'Kyiv',     lat: 50.45,  lon: 30.52  },
  ];

  const ARC_PAIRS = [
    [0, 1],  [0, 10], [2, 8],  [2, 11],
    [3, 6],  [3, 2],  [4, 9],  [7, 10],
    [5, 1],  [8, 11], [6, 4],  [9, 7],
  ];

  const R = 150;
  const DOT_R = 2.2;
  const ARC_SEGMENTS = 64;

  /* Texture from jsDelivr (GitHub raw) — reliable CORS */
  const TEX_BASE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/';

  const C_TEAL = 0x2DD4BF;
  const C_MINT = 0x7DD3A0;
  const C_LAV  = 0xA78BFA;
  const DOT_COLORS = [C_TEAL, C_MINT, C_LAV];

  let scene, camera, renderer, globe, cloudMesh;
  let dotsGroup, arcsGroup;
  let isDragging = false, prevMouse = { x: 0, y: 0 };
  let targetRotY = 0, targetRotX = 0.15;
  let autoRotate = true;
  let arcData = [];   // { curve, glowLine, progress }

  function latLonToVec3(lat, lon, r) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ===========================
     INIT
     =========================== */
  function init() {
    const container = document.getElementById('globe-container');
    if (!container || typeof THREE === 'undefined') return;

    const w = Math.min(container.clientWidth, 700);
    const h = 520;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, w / h, 1, 2000);
    camera.position.z = 420;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    globe = new THREE.Group();
    scene.add(globe);

    buildEarth();
    buildCityDots();
    buildArcs();
    buildLighting();

    container.addEventListener('mousedown', onDown);
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseup', onUp);
    container.addEventListener('mouseleave', onUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onUp);
    window.addEventListener('resize', onResize);

    animate(0);
  }

  /* ===========================
     EARTH — Textured Sphere
     =========================== */
  function buildEarth() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    const earthGeo = new THREE.SphereGeometry(R, 64, 64);

    // Load textures and apply when ready
    const earthTex = loader.load(TEX_BASE + 'earth_atmos_2048.jpg');
    const bumpTex  = loader.load(TEX_BASE + 'earth_normal_2048.jpg');
    const specTex  = loader.load(TEX_BASE + 'earth_specular_2048.jpg');

    const earthMat = new THREE.MeshPhongMaterial({
      map:         earthTex,
      bumpMap:     bumpTex,
      bumpScale:   0.6,
      specularMap: specTex,
      specular:    new THREE.Color(0x333333),
      shininess:   12,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    globe.add(earth);

    // Cloud layer
    const cloudTex = loader.load(TEX_BASE + 'earth_clouds_2048.png');
    const cloudGeo = new THREE.SphereGeometry(R + 1.2, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map:         cloudTex,
      transparent: true,
      opacity:     0.2,
      depthWrite:  false,
    });
    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globe.add(cloudMesh);

    // Soft atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(R + 10, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color:       0x88CCEE,
      transparent: true,
      opacity:     0.045,
      side:        THREE.BackSide,
    });
    globe.add(new THREE.Mesh(atmosGeo, atmosMat));
  }

  /* ===========================
     CITY DOTS — Soft glow only
     No ripples, no explosions
     =========================== */
  function buildCityDots() {
    dotsGroup = new THREE.Group();

    CITIES.forEach((city, i) => {
      const pos = latLonToVec3(city.lat, city.lon, R + 1.5);
      const color = DOT_COLORS[i % 3];

      // Small solid dot
      const dotGeo = new THREE.SphereGeometry(DOT_R, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.userData = { phase: Math.random() * Math.PI * 2 };
      dotsGroup.add(dot);

      // Gentle glow sprite (small, soft)
      const spMat = new THREE.SpriteMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const sp = new THREE.Sprite(spMat);
      sp.position.copy(pos);
      sp.scale.set(12, 12, 1);
      sp.userData = { isGlow: true, phase: dot.userData.phase };
      dotsGroup.add(sp);
    });

    globe.add(dotsGroup);
  }

  /* ===========================
     3D ARC CONNECTIONS
     Gentle flowing light — like warmth
     traveling between cities slowly
     =========================== */
  function buildArcs() {
    arcsGroup = new THREE.Group();

    ARC_PAIRS.forEach(([ai, bi], idx) => {
      const a = CITIES[ai], b = CITIES[bi];
      const start = latLonToVec3(a.lat, a.lon, R + 2);
      const end   = latLonToVec3(b.lat, b.lon, R + 2);

      // Midpoint raised gently above surface
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.normalize().multiplyScalar(R + 2 + dist * 0.22);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const allPoints = curve.getPoints(ARC_SEGMENTS);

      // Full arc line — very dim baseline
      const baseGeo = new THREE.BufferGeometry().setFromPoints(allPoints);
      const baseMat = new THREE.LineBasicMaterial({
        color: DOT_COLORS[idx % 3],
        transparent: true,
        opacity: 0.07,
      });
      arcsGroup.add(new THREE.Line(baseGeo, baseMat));

      // Animated glow segment — a portion of the arc that glows
      // and slides along the full path (like a warm wave)
      const glowMat = new THREE.LineBasicMaterial({
        color: DOT_COLORS[idx % 3],
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
      });
      const glowGeo = new THREE.BufferGeometry();
      const glowLine = new THREE.Line(glowGeo, glowMat);
      arcsGroup.add(glowLine);

      arcData.push({
        curve,
        allPoints,
        glowLine,
        color: DOT_COLORS[idx % 3],
        speed: 0.06 + Math.random() * 0.04,   // slow, peaceful
        offset: Math.random(),
        segLen: 0.25 + Math.random() * 0.1,    // 25-35% of arc glows
      });
    });

    globe.add(arcsGroup);
  }

  /* ===========================
     LIGHTING
     =========================== */
  function buildLighting() {
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(300, 200, 400);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x6699AA, 0.35);
    fill.position.set(-200, -100, -300);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0x445566, 0.5));
  }

  /* ===========================
     UPDATE: ARC GLOW ANIMATION
     A warm glowing segment slides
     along each arc — like a gentle
     wave of light connecting people
     =========================== */
  function updateArcs(time) {
    const t = time * 0.001;
    const speed = (typeof opts !== 'undefined' ? opts.speed : 1);

    arcData.forEach(arc => {
      // Progress cycles 0→1 slowly
      let p = ((t * arc.speed * speed + arc.offset) % 1);

      // Glow segment start/end on the curve
      const segStart = p;
      const segEnd   = p + arc.segLen;

      // Sample points for the glowing portion
      const pts = [];
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        let u = segStart + (segEnd - segStart) * (i / steps);
        // Wrap around
        if (u > 1) u -= 1;
        pts.push(arc.curve.getPoint(Math.max(0, Math.min(1, u))));
      }

      // Update geometry
      arc.glowLine.geometry.dispose();
      arc.glowLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);

      // Breathing opacity — gentle pulse
      const breathe = 0.25 + 0.15 * Math.sin(t * 2 + arc.offset * 10);
      arc.glowLine.material.opacity = breathe;
    });
  }

  /* ===========================
     UPDATE: DOT BREATHING
     Gentle, slow pulse — like a heartbeat
     =========================== */
  function updateDots(time) {
    const t = time * 0.001;
    dotsGroup.children.forEach(child => {
      if (!child.userData) return;
      const phase = child.userData.phase || 0;
      if (child.userData.isGlow) {
        const s = 10 + 3 * Math.sin(t * 0.8 + phase);
        child.scale.set(s, s, 1);
        child.material.opacity = 0.2 + 0.15 * Math.sin(t * 0.8 + phase);
      } else {
        const s = 1 + 0.15 * Math.sin(t * 0.8 + phase);
        child.scale.set(s, s, s);
      }
    });
  }

  /* ===========================
     INTERACTION
     =========================== */
  function onDown(e) {
    isDragging = true; autoRotate = false;
    prevMouse = { x: e.clientX, y: e.clientY };
  }
  function onMove(e) {
    if (!isDragging) return;
    targetRotY += (e.clientX - prevMouse.x) * 0.005;
    targetRotX += (e.clientY - prevMouse.y) * 0.003;
    targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX));
    prevMouse = { x: e.clientX, y: e.clientY };
  }
  function onUp() {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 2500);
  }
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    isDragging = true; autoRotate = false;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    targetRotY += (e.touches[0].clientX - prevMouse.x) * 0.005;
    targetRotX += (e.touches[0].clientY - prevMouse.y) * 0.003;
    targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX));
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onResize() {
    const c = document.getElementById('globe-container');
    if (!c) return;
    const w = Math.min(c.clientWidth, 700);
    camera.aspect = w / 520;
    camera.updateProjectionMatrix();
    renderer.setSize(w, 520);
  }

  /* ===========================
     RENDER LOOP
     =========================== */
  function animate(time) {
    requestAnimationFrame(animate);

    const speed = (typeof opts !== 'undefined' ? opts.speed : 1);
    if (autoRotate) targetRotY += 0.0012 * speed;

    globe.rotation.y += (targetRotY - globe.rotation.y) * 0.04;
    globe.rotation.x += (targetRotX - globe.rotation.x) * 0.04;

    if (cloudMesh) cloudMesh.rotation.y += 0.00015 * speed;

    updateDots(time);
    updateArcs(time);

    renderer.render(scene, camera);
  }

  /* --- Boot --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
