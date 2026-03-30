/* ============================================
   Astral Voyager — main.js
   4 Universe Scenes (Three.js r128)

   XAML→Web Mapping (from CAT15 samples 33-38):
   - CompositionTarget.Rendering → requestAnimationFrame
   - Canvas multi-layer Z-depth → THREE.Points with size/opacity by Z
   - TranslateTransform parallax → camera.position lerp
   - BlurEffect + RadialGradient → ShaderMaterial / Sprite
   - RotateTransform orbit → group.rotation.y per frame
   - DropShadowEffect glow → PointLight + AdditiveBlending
   - Path cone gradient → SpotLight + ConeGeometry
   - SineEase EaseInOut → Math.sin(t) * 0.5 + 0.5
   ============================================ */

'use strict';

/* ===========================
   SHARED STATE
   =========================== */
let activeUniverse = 'starfield';
const universes = {};
const W = () => window.innerWidth;
const H = () => window.innerHeight;

/* ===========================
   1. DEEP STARFIELD
   Infinite warp flight through layered stars
   (XAML 33: Z-depth system + XAML 34: parallax)
   =========================== */
function initStarfield() {
  const canvas = document.getElementById('cv-starfield');
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;

  let warpSpeed = 1.0;
  let density = 3000;
  let depthRange = 1000;
  let stars = [];
  let camX = 0, camY = 0, targetCX = 0, targetCY = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = W() * dpr;
    canvas.height = H() * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  function makeStars() {
    stars = [];
    for (let i = 0; i < density; i++) {
      stars.push({
        x: (Math.random() - 0.5) * W() * 3,
        y: (Math.random() - 0.5) * H() * 3,
        z: Math.random() * depthRange,
        baseZ: Math.random() * depthRange,
      });
    }
  }
  makeStars();

  // Mouse parallax
  canvas.addEventListener('mousemove', e => {
    targetCX = (e.clientX / W() - 0.5) * 100;
    targetCY = (e.clientY / H() - 0.5) * 100;
  });

  function draw() {
    if (activeUniverse !== 'starfield') return;
    const w = W(), h = H();
    ctx.clearRect(0, 0, w, h);

    // Smooth camera
    camX += (targetCX - camX) * 0.03;
    camY += (targetCY - camY) * 0.03;

    const cx = w / 2 + camX;
    const cy = h / 2 + camY;

    for (const s of stars) {
      s.z -= warpSpeed * 2;
      if (s.z <= 0) {
        s.z = depthRange;
        s.x = (Math.random() - 0.5) * w * 3;
        s.y = (Math.random() - 0.5) * h * 3;
      }

      const scale = depthRange / s.z;
      const sx = s.x * scale + cx;
      const sy = s.y * scale + cy;

      if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

      // Z-depth mapping (XAML 33): far=small/dim, near=large/bright
      const zNorm = 1 - s.z / depthRange;
      const size = 0.5 + zNorm * 3;
      const alpha = 0.05 + zNorm * 0.9;

      // Color varies by depth: far=blue, near=white/purple
      const r = 150 + zNorm * 105;
      const g = 150 + zNorm * 80;
      const b = 200 + zNorm * 55;

      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${alpha})`;
      ctx.fill();

      // Glow for near stars (XAML 33: DropShadowEffect on foreground)
      if (zNorm > 0.7) {
        ctx.beginPath();
        ctx.arc(sx, sy, size * 3, 0, Math.PI * 2);
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 3);
        grd.addColorStop(0, `rgba(${r|0},${g|0},${b|0},${alpha * 0.3})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Warp streak for fast stars
      if (warpSpeed > 1.5 && zNorm > 0.3) {
        const streak = warpSpeed * zNorm * 8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - (s.x * scale * streak * 0.001), sy - (s.y * scale * streak * 0.001));
        ctx.strokeStyle = `rgba(${r|0},${g|0},${b|0},${alpha * 0.4})`;
        ctx.lineWidth = size * 0.5;
        ctx.stroke();
      }
    }

    // HUD update
    document.getElementById('hud-x').textContent = camX.toFixed(0);
    document.getElementById('hud-y').textContent = camY.toFixed(0);
    document.getElementById('hud-z').textContent = (warpSpeed * 100).toFixed(0);
    document.getElementById('hud-fov').textContent = '60';
  }

  // Controls
  const slWarp = document.getElementById('sl-warp');
  const slDens = document.getElementById('sl-density');
  const slDepth = document.getElementById('sl-depth');
  slWarp.addEventListener('input', () => {
    warpSpeed = parseFloat(slWarp.value);
    document.getElementById('v-warp').textContent = warpSpeed.toFixed(1);
  });
  slDens.addEventListener('input', () => {
    density = parseInt(slDens.value);
    document.getElementById('v-density').textContent = density;
    makeStars();
  });
  slDepth.addEventListener('input', () => {
    depthRange = parseInt(slDepth.value);
    document.getElementById('v-depth').textContent = depthRange;
    makeStars();
  });

  window.addEventListener('resize', resize);
  universes.starfield = { draw, resize };
}

/* ===========================
   2. NEBULA SANCTUM
   Volumetric nebula clouds + light beams
   (XAML 35: nebula fog + XAML 37: volumetric light)
   =========================== */
function initNebula() {
  const container = document.getElementById('uni-nebula');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W() / H(), 1, 5000);
  camera.position.set(0, 0, 400);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.maxDistance = 1200;
  controls.minDistance = 50;

  let cloudCount = 12;
  let colorSpeed = 1.0;
  let lightIntensity = 1.0;
  const clouds = [];
  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);

  // Background stars
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(2000 * 3);
  for (let i = 0; i < 2000; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 3000;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 3000;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 3000;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.4 });
  scene.add(new THREE.Points(starGeo, starMat));

  function buildClouds() {
    while (cloudGroup.children.length) {
      const c = cloudGroup.children[0];
      c.geometry.dispose(); c.material.dispose();
      cloudGroup.remove(c);
    }
    clouds.length = 0;

    const palette = [0x8B5CF6, 0xEC4899, 0x3B82F6, 0x6366F1, 0xA78BFA, 0xF472B6];
    for (let i = 0; i < cloudCount; i++) {
      const geo = new THREE.SphereGeometry(40 + Math.random() * 80, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        transparent: true,
        opacity: 0.06 + Math.random() * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 600
      );
      mesh.scale.set(1 + Math.random(), 0.6 + Math.random() * 0.8, 1 + Math.random());
      cloudGroup.add(mesh);
      clouds.push({
        mesh, phase: Math.random() * Math.PI * 2,
        baseScale: mesh.scale.clone(),
        colorIdx: i % palette.length,
      });
    }
  }
  buildClouds();

  // Volumetric light beams (XAML 37: Path cone + gradient)
  const beamGroup = new THREE.Group();
  scene.add(beamGroup);
  for (let i = 0; i < 3; i++) {
    const coneGeo = new THREE.ConeGeometry(80 + i * 30, 400, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: [0x8B5CF6, 0x3B82F6, 0xEC4899][i],
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(-100 + i * 100, 200, -50 + i * 50);
    cone.rotation.x = Math.PI;
    beamGroup.add(cone);
  }

  // Point lights
  const pLight1 = new THREE.PointLight(0x8B5CF6, 2, 500);
  pLight1.position.set(0, 100, 0);
  scene.add(pLight1);
  const pLight2 = new THREE.PointLight(0xEC4899, 1.5, 400);
  pLight2.position.set(-100, -50, 100);
  scene.add(pLight2);

  scene.add(new THREE.AmbientLight(0x222244, 0.3));

  function animate(t) {
    if (activeUniverse !== 'nebula') return;
    const s = t * 0.001 * colorSpeed;

    // Cloud breathing (XAML 35: Scale 0.9→1.15 SineEase)
    clouds.forEach(c => {
      const breath = 0.9 + 0.25 * Math.sin(s * 0.5 + c.phase);
      c.mesh.scale.set(
        c.baseScale.x * breath,
        c.baseScale.y * breath,
        c.baseScale.z * breath
      );
      c.mesh.material.opacity = (0.04 + 0.06 * Math.sin(s * 0.3 + c.phase)) * lightIntensity;
    });

    // Light beam breathing (XAML 37: Opacity 0.3→0.8 SineEase 3s)
    beamGroup.children.forEach((beam, i) => {
      beam.material.opacity = (0.02 + 0.04 * Math.sin(s * 1.0 + i * 1.5)) * lightIntensity;
    });

    // Light pulse
    pLight1.intensity = (1.5 + Math.sin(s * 0.8) * 0.8) * lightIntensity;
    pLight2.intensity = (1.0 + Math.sin(s * 0.6 + 1) * 0.6) * lightIntensity;

    controls.update();
    renderer.render(scene, camera);

    document.getElementById('hud-x').textContent = camera.position.x.toFixed(0);
    document.getElementById('hud-y').textContent = camera.position.y.toFixed(0);
    document.getElementById('hud-z').textContent = camera.position.z.toFixed(0);
    document.getElementById('hud-fov').textContent = '60';
  }

  // Controls
  document.getElementById('sl-clouds').addEventListener('input', e => {
    cloudCount = parseInt(e.target.value);
    document.getElementById('v-clouds').textContent = cloudCount;
    buildClouds();
  });
  document.getElementById('sl-color').addEventListener('input', e => {
    colorSpeed = parseFloat(e.target.value);
    document.getElementById('v-color').textContent = colorSpeed.toFixed(1);
  });
  document.getElementById('sl-light').addEventListener('input', e => {
    lightIntensity = parseFloat(e.target.value);
    document.getElementById('v-light').textContent = lightIntensity.toFixed(1);
  });

  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });

  universes.nebula = { animate };
}

/* ===========================
   3. GALAXY ABYSS
   Spiral galaxy with orbital particles
   (XAML 36: RotateTransform orbits 6s/12s/20s)
   =========================== */
function initGalaxy() {
  const container = document.getElementById('uni-galaxy');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W() / H(), 1, 5000);
  camera.position.set(0, 250, 500);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x030712);
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;
  controls.maxDistance = 1500;
  controls.minDistance = 80;

  let rotSpeed = 1.0;
  let armCount = 4;
  let starCount = 5000;
  const galaxyGroup = new THREE.Group();
  scene.add(galaxyGroup);

  let starPoints = null;

  function buildGalaxy() {
    while (galaxyGroup.children.length) {
      const c = galaxyGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      galaxyGroup.remove(c);
    }

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const arm = i % armCount;
      const armAngle = (arm / armCount) * Math.PI * 2;
      const dist = Math.random() * 300;
      const spiral = dist * 0.02;
      const angle = armAngle + spiral + (Math.random() - 0.5) * 0.8;

      const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * (30 - dist * 0.05);
      const z = Math.sin(angle) * dist + (Math.random() - 0.5) * 20;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color: core=bright purple, outer=blue/pink
      const t = dist / 300;
      const palette = [
        [0.55, 0.36, 0.96], // purple
        [0.93, 0.28, 0.60], // pink
        [0.23, 0.51, 0.96], // blue
        [0.66, 0.55, 0.98], // lavender
      ];
      const c = palette[arm % palette.length];
      colors[i * 3] = c[0] * (1 - t * 0.3);
      colors[i * 3 + 1] = c[1] * (1 - t * 0.3);
      colors[i * 3 + 2] = c[2] * (1 - t * 0.3);

      sizes[i] = 1 + (1 - t) * 3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    starPoints = new THREE.Points(geo, mat);
    galaxyGroup.add(starPoints);

    // Center glow (XAML 36: DropShadowEffect BlurRadius 30→60 pulse)
    const coreGeo = new THREE.SphereGeometry(8, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x8B5CF6 });
    galaxyGroup.add(new THREE.Mesh(coreGeo, coreMat));

    const glowGeo = new THREE.SphereGeometry(25, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x8B5CF6, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.userData = { isGlow: true };
    galaxyGroup.add(glow);
  }
  buildGalaxy();

  // Background field
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(3000 * 3);
  for (let i = 0; i < 3000; i++) {
    bgPos[i * 3] = (Math.random() - 0.5) * 4000;
    bgPos[i * 3 + 1] = (Math.random() - 0.5) * 4000;
    bgPos[i * 3 + 2] = (Math.random() - 0.5) * 4000;
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 1, transparent: true, opacity: 0.3,
  })));

  const coreLight = new THREE.PointLight(0x8B5CF6, 3, 600);
  scene.add(coreLight);
  scene.add(new THREE.AmbientLight(0x222233, 0.2));

  function animate(t) {
    if (activeUniverse !== 'galaxy') return;
    const s = t * 0.001;

    // Galaxy rotation (XAML 36: orbits at different speeds)
    galaxyGroup.rotation.y += 0.001 * rotSpeed;

    // Center glow pulse (XAML 36: BlurRadius 30→60 4s)
    galaxyGroup.children.forEach(c => {
      if (c.userData && c.userData.isGlow) {
        const pulse = 1 + 0.4 * Math.sin(s * 1.5);
        c.scale.set(pulse, pulse, pulse);
        c.material.opacity = 0.1 + 0.1 * Math.sin(s * 1.5);
      }
    });

    coreLight.intensity = 2 + Math.sin(s * 1.5) * 1.5;

    controls.update();
    renderer.render(scene, camera);

    document.getElementById('hud-x').textContent = camera.position.x.toFixed(0);
    document.getElementById('hud-y').textContent = camera.position.y.toFixed(0);
    document.getElementById('hud-z').textContent = camera.position.z.toFixed(0);
    document.getElementById('hud-fov').textContent = '60';
  }

  document.getElementById('sl-rot').addEventListener('input', e => {
    rotSpeed = parseFloat(e.target.value);
    document.getElementById('v-rot').textContent = rotSpeed.toFixed(1);
  });
  document.getElementById('sl-arms').addEventListener('input', e => {
    armCount = parseInt(e.target.value);
    document.getElementById('v-arms').textContent = armCount;
    buildGalaxy();
  });
  document.getElementById('sl-gstars').addEventListener('input', e => {
    starCount = parseInt(e.target.value);
    document.getElementById('v-gstars').textContent = starCount;
    buildGalaxy();
  });

  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });

  universes.galaxy = { animate };
}

/* ===========================
   4. DUAL SOLAR SYSTEMS
   Real Solar System (Kepler orbital periods)
   + Fantasy Solar System (Fibonacci-harmonic orbits)
   Textures from Three.js CDN (same as sample04 globe)
   =========================== */
function initAstral() {
  const container = document.getElementById('uni-astral');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W() / H(), 1, 20000);
  camera.position.set(0, 300, 600);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x030712);
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.08;
  controls.maxDistance = 5000;
  controls.minDistance = 30;

  let timeScale = 1.0;
  let showTrails = true;
  let viewMode = 0; // 0=both, 1=real, 2=fantasy

  const TEX = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/';
  const loader = new THREE.TextureLoader();

  /* --- Background stars --- */
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(4000 * 3);
  for (let i = 0; i < 4000; i++) {
    bgPos[i*3]=(Math.random()-0.5)*8000;
    bgPos[i*3+1]=(Math.random()-0.5)*8000;
    bgPos[i*3+2]=(Math.random()-0.5)*8000;
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({
    color:0xffffff, size:1.5, transparent:true, opacity:0.35
  })));

  /* =============================
     REAL SOLAR SYSTEM (left side)
     Kepler's 3rd law: T² ∝ a³
     Orbital period in Earth-days
     ============================= */
  const realGroup = new THREE.Group();
  realGroup.position.x = -350;
  scene.add(realGroup);

  // Real planet data: [name, radiusScale, orbitRadius, periodDays, color, hasRing, tilt]
  const REAL_PLANETS = [
    ['Mercury', 1.2, 35,   87.97,  0xB0B0B0, false, 0.03],
    ['Venus',   2.8, 55,   224.7,  0xE8C07A, false, 177.4],
    ['Earth',   3.0, 80,   365.25, 0x4488FF, false, 23.4],
    ['Mars',    1.6, 105,  687.0,  0xCC4422, false, 25.2],
    ['Jupiter', 8.0, 160,  4332.6, 0xC8A060, false, 3.1],
    ['Saturn',  6.8, 220,  10759,  0xD4B896, true,  26.7],
    ['Uranus',  4.2, 290,  30687,  0x88CCDD, true,  97.8],
    ['Neptune', 4.0, 350,  60190,  0x3355BB, false, 28.3],
  ];

  // Real Sun
  const sunGeo = new THREE.SphereGeometry(15, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFDD44 });
  const realSun = new THREE.Mesh(sunGeo, sunMat);
  realGroup.add(realSun);
  const realSunLight = new THREE.PointLight(0xFFDD44, 2.5, 800);
  realGroup.add(realSunLight);
  // Sun glow
  const sunGlowGeo = new THREE.SphereGeometry(22, 32, 32);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: 0xFFDD44, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  realGroup.add(new THREE.Mesh(sunGlowGeo, sunGlowMat));

  const realPlanets = [];
  REAL_PLANETS.forEach(([name, r, orbit, period, color, hasRing, tilt]) => {
    const geo = new THREE.SphereGeometry(r, 24, 24);
    let mat;
    // Earth gets real texture
    if (name === 'Earth') {
      mat = new THREE.MeshPhongMaterial({
        map: loader.load(TEX + 'earth_atmos_2048.jpg'),
        bumpMap: loader.load(TEX + 'earth_normal_2048.jpg'),
        bumpScale: 0.3, specularMap: loader.load(TEX + 'earth_specular_2048.jpg'),
        specular: new THREE.Color(0x222222), shininess: 10
      });
    } else {
      mat = new THREE.MeshPhongMaterial({ color, shininess: 15 });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = tilt * Math.PI / 180;
    realGroup.add(mesh);

    // Saturn/Uranus rings
    if (hasRing) {
      const ringGeo = new THREE.RingGeometry(r * 1.4, r * 2.2, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: name === 'Saturn' ? 0xD4B896 : 0x88CCDD,
        transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (tilt * Math.PI / 180) * 0.3;
      mesh.add(ring);
    }

    // Orbit trail
    const trailPts = [];
    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      trailPts.push(new THREE.Vector3(Math.cos(a) * orbit, 0, Math.sin(a) * orbit));
    }
    const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts);
    const trailMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.06 });
    const trail = new THREE.Line(trailGeo, trailMat);
    realGroup.add(trail);

    // Kepler: angular velocity = 2π / T
    // T in seconds at timeScale=1 → 1 Earth year = 60 seconds on screen
    const angularVelocity = (2 * Math.PI) / (period / 365.25 * 60);

    realPlanets.push({ mesh, orbit, angularVelocity, trail, phase: Math.random() * Math.PI * 2, name });
  });

  /* =============================
     FANTASY SOLAR SYSTEM (right)
     Fibonacci-harmonic orbits:
     Period = baseT × φ^n (golden ratio)
     ============================= */
  const fantasyGroup = new THREE.Group();
  fantasyGroup.position.x = 350;
  scene.add(fantasyGroup);

  const PHI = 1.618033988749895; // Golden ratio

  // Fantasy star (purple/pink)
  const fStarGeo = new THREE.SphereGeometry(14, 32, 32);
  const fStarMat = new THREE.MeshBasicMaterial({ color: 0xCC66FF });
  fantasyGroup.add(new THREE.Mesh(fStarGeo, fStarMat));
  const fStarLight = new THREE.PointLight(0xCC66FF, 2.5, 800);
  fantasyGroup.add(fStarLight);
  const fStarGlow = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xCC66FF, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  fantasyGroup.add(fStarGlow);

  // Fantasy planets: [name, radius, orbit, colorA, colorB, hasRing]
  const FANTASY_PLANETS = [
    ['Aurion',    1.8, 30,  0xFF6699, 0xFF3366, false],
    ['Zephyra',   3.2, 55,  0x66FFCC, 0x33CC99, false],
    ['Crystallis', 2.5, 85,  0x99CCFF, 0x6699FF, true],
    ['Pyralis',   5.5, 125, 0xFF9933, 0xFF6600, false],
    ['Void Prime', 7.0, 180, 0x9966FF, 0x6633CC, true],
    ['Astralith', 4.0, 240, 0xFF66CC, 0xCC3399, false],
    ['Nebulos',   3.5, 300, 0x33FFFF, 0x00CCCC, true],
  ];

  const fantasyPlanets = [];
  FANTASY_PLANETS.forEach(([name, r, orbit, cA, cB, hasRing], idx) => {
    const geo = new THREE.SphereGeometry(r, 24, 24);
    // Gradient-like material using emissive
    const mat = new THREE.MeshPhongMaterial({
      color: cA, emissive: new THREE.Color(cB).multiplyScalar(0.15), shininess: 20
    });
    const mesh = new THREE.Mesh(geo, mat);
    fantasyGroup.add(mesh);

    if (hasRing) {
      const ringGeo = new THREE.RingGeometry(r * 1.3, r * 2.0, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cA, transparent: true, opacity: 0.35,
        side: THREE.DoubleSide, depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + 0.3;
      mesh.add(ring);
    }

    // Orbit trail
    const trailPts = [];
    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      trailPts.push(new THREE.Vector3(Math.cos(a) * orbit, 0, Math.sin(a) * orbit));
    }
    const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPts);
    const trailMat = new THREE.LineBasicMaterial({ color: cA, transparent: true, opacity: 0.06 });
    const trail = new THREE.Line(trailGeo, trailMat);
    fantasyGroup.add(trail);

    // Fibonacci-harmonic: T(n) = baseT × φ^n
    // baseT = 8 seconds for innermost, each outer = φ× slower
    const periodSec = 8 * Math.pow(PHI, idx);
    const angularVelocity = (2 * Math.PI) / periodSec;

    fantasyPlanets.push({ mesh, orbit, angularVelocity, trail, phase: Math.random() * Math.PI * 2, name });
  });

  /* --- Separator line --- */
  const sepGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -200, -400), new THREE.Vector3(0, -200, 400)
  ]);
  scene.add(new THREE.Line(sepGeo, new THREE.LineBasicMaterial({
    color: 0x8B5CF6, transparent: true, opacity: 0.08
  })));

  /* --- Labels (Sprite) --- */
  function makeLabel(text, pos, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 24px JetBrains Mono, monospace';
    ctx.fillStyle = color || '#8B5CF6';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 });
    const sp = new THREE.Sprite(mat);
    sp.position.copy(pos);
    sp.scale.set(80, 20, 1);
    return sp;
  }
  scene.add(makeLabel('☀ SOLAR SYSTEM', new THREE.Vector3(-350, 50, -380), '#FFDD44'));
  scene.add(makeLabel('✦ FANTASY SYSTEM', new THREE.Vector3(350, 50, -380), '#CC66FF'));
  scene.add(makeLabel('Kepler: T² ∝ a³', new THREE.Vector3(-350, 30, -380), '#94A3B8'));
  scene.add(makeLabel('Fibonacci: T = φⁿ', new THREE.Vector3(350, 30, -380), '#94A3B8'));

  /* --- Lighting --- */
  scene.add(new THREE.AmbientLight(0x222233, 0.4));

  /* --- Animate --- */
  function animate(t) {
    if (activeUniverse !== 'astral') return;
    const s = t * 0.001 * timeScale;

    // Visibility by view mode
    realGroup.visible = viewMode !== 2;
    fantasyGroup.visible = viewMode !== 1;

    // Real solar system: Kepler orbits
    realPlanets.forEach(p => {
      const angle = p.phase + s * p.angularVelocity;
      p.mesh.position.set(Math.cos(angle) * p.orbit, 0, Math.sin(angle) * p.orbit);
      p.mesh.rotation.y += 0.01 * timeScale; // Self-rotation
      p.trail.visible = showTrails;
    });

    // Fantasy solar system: Fibonacci-harmonic orbits
    fantasyPlanets.forEach(p => {
      const angle = p.phase + s * p.angularVelocity;
      // Slight vertical oscillation for 3D feel
      const yOsc = Math.sin(angle * 2) * 5;
      p.mesh.position.set(Math.cos(angle) * p.orbit, yOsc, Math.sin(angle) * p.orbit);
      p.mesh.rotation.y += 0.015 * timeScale;
      p.trail.visible = showTrails;
    });

    // Sun glow pulse
    realSunLight.intensity = 2.2 + Math.sin(s * 0.5) * 0.5;
    fStarLight.intensity = 2.2 + Math.sin(s * 0.7 + 1) * 0.5;

    controls.update();
    renderer.render(scene, camera);

    document.getElementById('hud-x').textContent = camera.position.x.toFixed(0);
    document.getElementById('hud-y').textContent = camera.position.y.toFixed(0);
    document.getElementById('hud-z').textContent = camera.position.z.toFixed(0);
    document.getElementById('hud-fov').textContent = '60';
  }

  /* --- Controls --- */
  document.getElementById('sl-timescale').addEventListener('input', e => {
    timeScale = parseFloat(e.target.value);
    document.getElementById('v-timescale').textContent = timeScale.toFixed(1);
  });
  document.getElementById('sl-trails').addEventListener('input', e => {
    showTrails = parseInt(e.target.value) === 1;
    document.getElementById('v-trails').textContent = showTrails ? 'On' : 'Off';
  });
  document.getElementById('sl-view').addEventListener('input', e => {
    viewMode = parseInt(e.target.value);
    document.getElementById('v-view').textContent = ['Both', 'Real Only', 'Fantasy Only'][viewMode];
  });

  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });

  universes.astral = { animate };
}

/* ===========================
   UNIVERSE SWITCHER
   =========================== */
const INFO = {
  starfield: { title: 'DEEP STARFIELD', desc: 'Infinite parallax star warp — fly through the cosmos' },
  nebula: { title: 'NEBULA SANCTUM', desc: 'Volumetric cosmic fog clouds — drift through the colors' },
  galaxy: { title: 'GALAXY ABYSS', desc: 'Spiral galaxy — orbit the swirling stellar arms' },
  astral: { title: 'DUAL SOLAR SYSTEMS', desc: 'Real (Kepler T²∝a³) + Fantasy (Fibonacci T=φⁿ) — orbit the cosmos' },
};

function switchUniverse(name) {
  activeUniverse = name;

  document.querySelectorAll('.universe').forEach(u => u.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.ctrl-panel').forEach(p => p.classList.add('hidden'));

  const uni = document.getElementById('uni-' + name);
  if (uni) uni.classList.add('active');

  const btn = document.querySelector(`.nav-btn[data-universe="${name}"]`);
  if (btn) btn.classList.add('active');

  const ctrl = document.getElementById('ctrl-' + name);
  if (ctrl) ctrl.classList.remove('hidden');

  document.getElementById('info-title').textContent = INFO[name].title;
  document.getElementById('info-desc').textContent = INFO[name].desc;
}

/* ===========================
   MAIN LOOP
   =========================== */
function mainLoop(t) {
  requestAnimationFrame(mainLoop);

  if (activeUniverse === 'starfield' && universes.starfield) {
    universes.starfield.draw();
  }
  if (activeUniverse === 'nebula' && universes.nebula) {
    universes.nebula.animate(t);
  }
  if (activeUniverse === 'galaxy' && universes.galaxy) {
    universes.galaxy.animate(t);
  }
  if (activeUniverse === 'astral' && universes.astral) {
    universes.astral.animate(t);
  }
}

/* ===========================
   INIT
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initNebula();
  initGalaxy();
  initAstral();

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchUniverse(btn.dataset.universe));
  });

  // Hide loading
  setTimeout(() => {
    document.getElementById('loading').classList.add('done');
  }, 800);

  requestAnimationFrame(mainLoop);
});
