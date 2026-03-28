/* ===== Spring Animation Playground — Vanilla JS (v2) ===== */

// ─── Realistic Petal SVGs with gradient fills ───
function createRealisticPetalSVG(size, color1, color2, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size*1.3)}" viewBox="0 0 20 26">
    <defs><radialGradient id="pg${id}" cx="35%" cy="30%">
      <stop offset="0%" stop-color="${color1}" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="${color2}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${color2}" stop-opacity="0.5"/>
    </radialGradient></defs>
    <path d="M10 0 C14 3 18 10 16 18 C14 23 12 25 10 26 C8 25 6 23 4 18 C2 10 6 3 10 0Z" fill="url(#pg${id})"/>
    <path d="M10 4 C12 7 14 12 13 18 C12 21 11 23 10 24 C9 23 8 21 7 18 C6 12 8 7 10 4Z" fill="white" opacity="0.15"/>
  </svg>`;
}

const PETAL_GRADIENTS = [
  ['#FFE4EC', '#FFB7C5'], ['#FFF0F5', '#FF91A4'], ['#FFDBE5', '#FFD1DC'],
  ['#FFE8EE', '#FFC8D6'], ['#FFF5F7', '#FFAEC0'],
];

// ─── Easing Functions (WPF → JS) ───
function quadraticEaseIn(t) { return t * t; }
function sineEaseInOut(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }
function elasticOut(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

// ─── Utility ───
function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function lerp(a, b, t) { return a + (b - a) * t; }

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}

// ─── Cached realistic petal images ───
const petalImageCache = new Map();
let petalIdCounter = 0;

function getRealisticPetal(size, gradientPair) {
  const key = `${size}_${gradientPair[0]}_${gradientPair[1]}`;
  if (petalImageCache.has(key)) return petalImageCache.get(key);
  const id = petalIdCounter++;
  const svgStr = createRealisticPetalSVG(size, gradientPair[0], gradientPair[1], id);
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  petalImageCache.set(key, img);
  return img;
}


// ═══════════════════════════════════════════════
// Section 0: Background Floating Petals
// ═══════════════════════════════════════════════
(function initBgPetals() {
  const canvas = document.getElementById('bgPetals');
  let { ctx, w, h } = setupCanvas(canvas);
  const petals = [];

  function createBgPetal(init) {
    return {
      x: rand(0, w), y: init ? rand(0, h) : rand(-40, -10),
      size: rand(8, 14), speedY: rand(12, 28), speedX: rand(-8, 8),
      rotation: rand(0, 360), rotSpeed: rand(20, 60) * (Math.random() > 0.5 ? 1 : -1),
      opacity: rand(0.12, 0.3), grad: pick(PETAL_GRADIENTS),
    };
  }
  for (let i = 0; i < 12; i++) petals.push(createBgPetal(true));

  let lastTime = performance.now();
  function animate(now) {
    const dt = (now - lastTime) / 1000; lastTime = now;
    ctx.clearRect(0, 0, w, h);
    for (const p of petals) {
      p.y += p.speedY * dt;
      p.x += p.speedX * dt + Math.sin(now * 0.0008 + p.rotation) * 0.25;
      p.rotation += p.rotSpeed * dt;
      if (p.y > h + 20) Object.assign(p, createBgPetal(false));
      const img = getRealisticPetal(Math.round(p.size), p.grad);
      if (img.complete) {
        ctx.save(); ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
        ctx.drawImage(img, -p.size/2, -p.size*0.65, p.size, p.size*1.3);
        ctx.restore();
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('resize', () => { ({ ctx, w, h } = setupCanvas(canvas)); });
})();


// ═══════════════════════════════════════════════
// Section 0.5: Hero Canvas — fix: no initial tremble
// Start petals already mid-fall, smooth fade-in
// ═══════════════════════════════════════════════
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  let { ctx, w, h } = setupCanvas(canvas);
  const petals = [];
  let globalFade = 0; // smooth fade-in over 1.5s

  function createHeroPetal(init) {
    return {
      x: rand(-20, w + 20), y: init ? rand(0, h) : rand(-50, -10),
      size: rand(10, 22), speedY: rand(30, 70), speedX: rand(-15, 15),
      rotation: rand(0, 360), rotSpeed: rand(30, 80) * (Math.random() > 0.5 ? 1 : -1),
      opacity: rand(0.2, 0.5), grad: pick(PETAL_GRADIENTS),
      wobblePhase: rand(0, Math.PI * 2), wobbleFreq: rand(1.5, 3),
    };
  }
  for (let i = 0; i < 20; i++) petals.push(createHeroPetal(true));

  const startTime = performance.now();
  let lastTime = startTime;
  function animate(now) {
    const dt = (now - lastTime) / 1000; lastTime = now;
    // Smooth fade-in: no tremble on load
    globalFade = Math.min(1, (now - startTime) / 1500);
    ctx.clearRect(0, 0, w, h);
    for (const p of petals) {
      p.y += p.speedY * dt;
      // Gentle sine wobble (not abrupt)
      p.x += p.speedX * dt + Math.sin(now * 0.001 * p.wobbleFreq + p.wobblePhase) * 0.4;
      p.rotation += p.rotSpeed * dt;
      if (p.y > h + 30) Object.assign(p, createHeroPetal(false));
      const img = getRealisticPetal(Math.round(p.size), p.grad);
      if (img.complete) {
        ctx.save(); ctx.globalAlpha = p.opacity * globalFade;
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
        ctx.drawImage(img, -p.size/2, -p.size*0.65, p.size, p.size*1.3);
        ctx.restore();
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('resize', () => { ({ ctx, w, h } = setupCanvas(canvas)); });
})();


// ═══════════════════════════════════════════════
// Section 1: Cherry Blossom Petal Fall
// ═══════════════════════════════════════════════
(function initFallSection() {
  const canvas = document.getElementById('fallCanvas');
  let { ctx, w, h } = setupCanvas(canvas);
  let petals = [];
  const countSlider = document.getElementById('fallCount');
  const speedSlider = document.getElementById('fallSpeed');
  const driftSlider = document.getElementById('fallDrift');
  const countVal = document.getElementById('fallCountVal');
  const speedVal = document.getElementById('fallSpeedVal');
  const driftVal = document.getElementById('fallDriftVal');
  const resetBtn = document.getElementById('fallReset');

  function getConfig() {
    return { count: +countSlider.value, speed: +speedSlider.value, drift: +driftSlider.value };
  }

  function createFallPetal(cfg, init) {
    return {
      x: rand(0, w), y: init ? rand(-h*0.3, h) : rand(-50, -10), startY: 0,
      size: rand(12, 22), duration: rand(3, 7) * (100 / cfg.speed),
      driftX: rand(-cfg.drift, cfg.drift),
      rotation: rand(0, 360), rotSpeed: rand(40, 120) * (Math.random() > 0.5 ? 1 : -1),
      opacity: rand(0.4, 0.9), grad: pick(PETAL_GRADIENTS),
      wobblePhase: rand(0, Math.PI*2), wobbleFreq: rand(1, 2.5),
      stagger: rand(0, 2.5), age: init ? rand(1, 5) : 0,
    };
  }

  function rebuild() {
    const cfg = getConfig(); petals = [];
    for (let i = 0; i < cfg.count; i++) petals.push(createFallPetal(cfg, true));
  }
  countSlider.oninput = () => { countVal.textContent = countSlider.value; rebuild(); };
  speedSlider.oninput = () => { speedVal.textContent = speedSlider.value; };
  driftSlider.oninput = () => { driftVal.textContent = driftSlider.value; };
  resetBtn.onclick = () => {
    countSlider.value=30; speedSlider.value=80; driftSlider.value=40;
    countVal.textContent='30'; speedVal.textContent='80'; driftVal.textContent='40';
    rebuild();
  };
  rebuild();

  let lastTime = performance.now();
  function animate(now) {
    const dt = (now - lastTime) / 1000; lastTime = now;
    const cfg = getConfig();
    ctx.clearRect(0, 0, w, h);
    drawGrass(ctx, w, h, now);
    for (const p of petals) {
      p.age += dt;
      if (p.age < p.stagger) continue;
      const elapsed = p.age - p.stagger;
      const progress = Math.min(elapsed / p.duration, 1);
      const easedY = quadraticEaseIn(progress);
      p.y = p.startY + easedY * (h + 60);
      p.x += p.driftX * dt + Math.sin(now*0.001*p.wobbleFreq + p.wobblePhase) * 0.4;
      p.rotation += p.rotSpeed * dt;
      const currentOpacity = p.opacity * (1 - progress * 0.75);
      if (p.y > h + 30 || progress >= 1) { Object.assign(p, createFallPetal(cfg, false)); continue; }
      const img = getRealisticPetal(Math.round(p.size), p.grad);
      if (img.complete) {
        ctx.save(); ctx.globalAlpha = currentOpacity;
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
        ctx.drawImage(img, -p.size/2, -p.size*0.65, p.size, p.size*1.3);
        ctx.restore();
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('resize', () => { ({ ctx, w, h } = setupCanvas(canvas)); });
})();


// ═══════════════════════════════════════════════
// Section 2: Petal Scatter Wind
// ═══════════════════════════════════════════════
(function initWindSection() {
  const canvas = document.getElementById('windCanvas');
  let { ctx, w, h } = setupCanvas(canvas);
  let petals = []; let spawnTimer = 0;
  const forceSlider = document.getElementById('windForce');
  const spawnSlider = document.getElementById('windSpawn');
  const turbSlider = document.getElementById('windTurb');
  const forceVal = document.getElementById('windForceVal');
  const spawnVal = document.getElementById('windSpawnVal');
  const turbVal = document.getElementById('windTurbVal');
  const resetBtn = document.getElementById('windReset');

  function getConfig() {
    return { force: +forceSlider.value, spawnRate: +spawnSlider.value, turbulence: +turbSlider.value };
  }
  function createWindPetal() {
    return {
      x: rand(-30, -5), y: rand(h*0.1, h*0.85), startX: -20,
      startY: rand(h*0.1, h*0.85), size: rand(14, 26), duration: rand(4, 8),
      age: 0, rotation: rand(0, 360),
      rotTarget: rand(360, 900) * (Math.random() > 0.5 ? 1 : -1),
      driftY: rand(-100, 120), opacity: rand(0.5, 0.9),
      grad: pick(PETAL_GRADIENTS), turbOffset: rand(0, Math.PI*2),
    };
  }
  forceSlider.oninput = () => { forceVal.textContent = forceSlider.value; };
  spawnSlider.oninput = () => { spawnVal.textContent = spawnSlider.value; };
  turbSlider.oninput = () => { turbVal.textContent = turbSlider.value; };
  resetBtn.onclick = () => {
    forceSlider.value=80; spawnSlider.value=6; turbSlider.value=40;
    forceVal.textContent='80'; spawnVal.textContent='6'; turbVal.textContent='40';
    petals=[];
  };

  function drawWindStreaks(now, force) {
    const streakCount = Math.floor(force / 20);
    ctx.save(); ctx.setLineDash([12, 8]);
    for (let i = 0; i < streakCount; i++) {
      const y = h*0.15 + h*0.7*(i/streakCount) + Math.sin(now*0.001+i)*15;
      const offset = (now*0.15*(force/80)) % (w+200) - 100;
      ctx.strokeStyle = `rgba(255,183,197,${0.12 + 0.08*Math.sin(now*0.002+i)})`;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(offset, y);
      ctx.lineTo(offset+rand(60,130), y-3); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
  }

  let lastTime = performance.now();
  function animate(now) {
    const dt = (now - lastTime) / 1000; lastTime = now;
    const cfg = getConfig();
    ctx.clearRect(0, 0, w, h);
    drawWindStreaks(now, cfg.force);
    spawnTimer += dt;
    const interval = 1 / cfg.spawnRate;
    while (spawnTimer >= interval) { petals.push(createWindPetal()); spawnTimer -= interval; }
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i]; p.age += dt;
      const progress = Math.min(p.age / p.duration, 1);
      p.x = p.startX + progress * (w+60) * (cfg.force/80);
      const turbAmt = cfg.turbulence / 100;
      p.y = p.startY + progress*p.driftY + Math.sin(p.age*3+p.turbOffset)*20*turbAmt;
      p.rotation += (p.rotTarget/p.duration)*dt;
      const scale = 1 - progress*0.7;
      const currentOpacity = p.opacity * (1 - progress);
      if (progress >= 1) { petals.splice(i, 1); continue; }
      const drawSize = p.size * scale;
      const img = getRealisticPetal(Math.round(p.size), p.grad);
      if (img.complete) {
        ctx.save(); ctx.globalAlpha = currentOpacity;
        ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
        ctx.drawImage(img, -drawSize/2, -drawSize*0.65, drawSize, drawSize*1.3);
        ctx.restore();
      }
    }
    if (petals.length > 200) petals.splice(0, petals.length - 200);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('resize', () => { ({ ctx, w, h } = setupCanvas(canvas)); });
})();


// ═══════════════════════════════════════════════
// Section 3: Spring Breeze Sway — UNIFIED SVG flowers
// Each flower = single SVG with stem+leaves+bloom connected
// ═══════════════════════════════════════════════
(function initSwaySection() {
  const stage = document.getElementById('swayStage');
  const angleSlider = document.getElementById('swayAngle');
  const durationSlider = document.getElementById('swayDuration');
  const flowersSlider = document.getElementById('swayFlowers');
  const angleVal = document.getElementById('swayAngleVal');
  const durationVal = document.getElementById('swayDurationVal');
  const flowersVal = document.getElementById('swayFlowersVal');
  const resetBtn = document.getElementById('swayReset');
  let styleEl = null;

  function getConfig() {
    return { angle: +angleSlider.value, duration: +durationSlider.value / 10, flowers: +flowersSlider.value };
  }

  function buildFlowers() {
    const cfg = getConfig();
    stage.innerHTML = '';
    if (styleEl) styleEl.remove();
    styleEl = document.createElement('style');
    let css = '';
    const stageW = stage.offsetWidth;
    const stageH = stage.offsetHeight;
    const spacing = stageW / (cfg.flowers + 1);

    for (let i = 0; i < cfg.flowers; i++) {
      const x = spacing * (i + 1) + rand(-25, 25);
      const stemH = rand(180, 340);
      const totalH = stemH + 60;
      const bloomColor = pick(['#FFB7C5', '#FF91A4', '#FFD1DC', '#FFC8D6']);
      const bloomColor2 = pick(['#FFE4EC', '#FFF0F5']);
      const leafColor = pick(['#4ADE80', '#86EFAC', '#22C55E']);
      const leafColor2 = pick(['#86EFAC', '#A7F3D0']);
      const dur = cfg.duration + rand(-0.3, 0.3);
      const angle = cfg.angle + rand(-2, 2);
      const delay = rand(0, cfg.duration);
      const id = `sf${i}`;

      // Unified sway: the whole SVG sways from bottom
      css += `
        @keyframes sway-${id} {
          0%, 100% { transform: rotate(${-angle}deg); }
          50%      { transform: rotate(${angle}deg); }
        }
      `;

      // Build single SVG with stem + leaves + bloom
      const svgW = 120;
      const cx = svgW / 2;
      const stemTop = totalH - stemH;

      // Leaf positions along stem
      const leaf1Y = totalH - stemH * rand(0.3, 0.45);
      const leaf2Y = totalH - stemH * rand(0.55, 0.7);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', svgW);
      svg.setAttribute('height', totalH);
      svg.setAttribute('viewBox', `0 0 ${svgW} ${totalH}`);
      svg.classList.add('sway-flower-svg');
      svg.style.left = `${x - svgW/2}px`;
      svg.style.height = `${totalH}px`;
      svg.style.transformOrigin = `${cx}px ${totalH}px`;
      svg.style.animation = `sway-${id} ${dur}s ease-in-out ${delay}s infinite alternate`;

      svg.innerHTML = `
        <defs>
          <radialGradient id="bg${id}" cx="30%" cy="30%">
            <stop offset="0%" stop-color="${bloomColor2}"/>
            <stop offset="60%" stop-color="${bloomColor}"/>
            <stop offset="100%" stop-color="${bloomColor}" stop-opacity="0.7"/>
          </radialGradient>
          <radialGradient id="lg${id}" cx="30%" cy="40%">
            <stop offset="0%" stop-color="${leafColor2}"/>
            <stop offset="100%" stop-color="${leafColor}"/>
          </radialGradient>
        </defs>
        <!-- Stem (curved) -->
        <path d="M${cx} ${totalH} Q${cx-3} ${totalH-stemH*0.4} ${cx+1} ${stemTop+10}"
              fill="none" stroke="${leafColor}" stroke-width="3" stroke-linecap="round"/>
        <!-- Left leaf -->
        <path d="M${cx-2} ${leaf1Y} Q${cx-30} ${leaf1Y-18} ${cx-42} ${leaf1Y-8}
                 Q${cx-28} ${leaf1Y+4} ${cx-2} ${leaf1Y}Z" fill="url(#lg${id})"/>
        <line x1="${cx-2}" y1="${leaf1Y}" x2="${cx-36}" y2="${leaf1Y-5}"
              stroke="${leafColor}" stroke-width="0.5" opacity="0.3"/>
        <!-- Right leaf -->
        <path d="M${cx+2} ${leaf2Y} Q${cx+28} ${leaf2Y-16} ${cx+40} ${leaf2Y-6}
                 Q${cx+26} ${leaf2Y+5} ${cx+2} ${leaf2Y}Z" fill="url(#lg${id})" opacity="0.85"/>
        <line x1="${cx+2}" y1="${leaf2Y}" x2="${cx+34}" y2="${leaf2Y-4}"
              stroke="${leafColor}" stroke-width="0.5" opacity="0.3"/>
        <!-- Bloom (5-petal flower) -->
        <g transform="translate(${cx+1}, ${stemTop+6})">
          ${[0, 72, 144, 216, 288].map(a =>
            `<path d="M0 -3 Q5 -18 2 -28 Q0 -32 -2 -28 Q-5 -18 0 -3Z"
                   fill="url(#bg${id})" transform="rotate(${a})" opacity="0.9"/>`
          ).join('')}
          <circle r="5" fill="#FFE66D"/>
          <circle r="2.5" fill="#FFA94D"/>
        </g>
      `;
      stage.appendChild(svg);
    }
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  angleSlider.oninput = () => { angleVal.textContent = angleSlider.value; buildFlowers(); };
  durationSlider.oninput = () => {
    durationVal.textContent = (+durationSlider.value / 10).toFixed(1); buildFlowers();
  };
  flowersSlider.oninput = () => { flowersVal.textContent = flowersSlider.value; buildFlowers(); };
  resetBtn.onclick = () => {
    angleSlider.value=8; durationSlider.value=25; flowersSlider.value=5;
    angleVal.textContent='8'; durationVal.textContent='2.5'; flowersVal.textContent='5';
    buildFlowers();
  };
  buildFlowers();
  window.addEventListener('resize', buildFlowers);
})();


// ═══════════════════════════════════════════════
// Section 4: AI Bloom — "AI가 꽃을 피우는"
// Uses: CAT5 ScaleTransform, CAT7 Stagger,
//       CAT10 Glow, CAT11 Confetti, CAT6 Path
// ═══════════════════════════════════════════════
(function initBloomSection() {
  const playBtn = document.getElementById('bloomPlay');
  const resetBtn = document.getElementById('bloomReset');
  const speedSlider = document.getElementById('bloomSpeed');
  const speedVal = document.getElementById('bloomSpeedVal');
  const steps = document.querySelectorAll('.bloom-step');

  speedSlider.oninput = () => {
    speedVal.textContent = (+speedSlider.value / 10).toFixed(1);
  };

  let isPlaying = false;

  function setStep(idx) {
    steps.forEach((s, i) => {
      s.classList.remove('active', 'done');
      if (i < idx) s.classList.add('done');
      else if (i === idx) s.classList.add('active');
    });
  }

  function getSpeed() { return +speedSlider.value / 10; }

  // Helper: animate SVG element with WAAPI
  function anim(el, keyframes, opts) {
    return el.animate(keyframes, opts).finished;
  }

  function resetAll() {
    isPlaying = false;
    playBtn.disabled = false;
    setStep(0);
    // Reset SVG elements
    const stem = document.getElementById('bloomStem');
    const leafL = document.getElementById('bloomLeafL');
    const leafR = document.getElementById('bloomLeafR');
    const leafL2 = document.getElementById('bloomLeafL2');
    const petals = document.querySelectorAll('.bloom-petal');
    const center = document.getElementById('bloomCenter');
    const centerInner = document.getElementById('bloomCenterInner');
    const cursor = document.getElementById('bloomCursor');
    const particles = document.getElementById('bloomParticles');
    const stageText = document.getElementById('bloomStageText');

    stem.style.opacity = '0';
    stem.style.strokeDasharray = '';
    stem.style.strokeDashoffset = '';
    leafL.style.opacity = '0'; leafL.style.transform = 'translate(385px, 350px) scale(0)';
    leafR.style.opacity = '0'; leafR.style.transform = 'translate(415px, 300px) scale(0)';
    leafL2.style.opacity = '0'; leafL2.style.transform = 'translate(390px, 240px) scale(0)';
    petals.forEach(p => { p.style.opacity = '0'; p.style.transform = `rotate(${p.dataset.angle}deg) scale(0)`; });
    center.setAttribute('r', '0'); center.style.opacity = '0';
    centerInner.setAttribute('r', '0'); centerInner.style.opacity = '0';
    cursor.style.opacity = '0';
    particles.innerHTML = '';
    stageText.style.opacity = '0';
    stageText.textContent = '';
  }

  async function playBloom() {
    if (isPlaying) return;
    isPlaying = true;
    playBtn.disabled = true;
    resetAll();
    const speed = getSpeed();
    const dur = (ms) => ms / speed;

    const stem = document.getElementById('bloomStem');
    const leafL = document.getElementById('bloomLeafL');
    const leafR = document.getElementById('bloomLeafR');
    const leafL2 = document.getElementById('bloomLeafL2');
    const petals = document.querySelectorAll('.bloom-petal');
    const center = document.getElementById('bloomCenter');
    const centerInner = document.getElementById('bloomCenterInner');
    const cursor = document.getElementById('bloomCursor');
    const particles = document.getElementById('bloomParticles');
    const stageText = document.getElementById('bloomStageText');

    // ── Stage 0: Seed (AI cursor appears) ──
    setStep(0);
    stageText.textContent = 'Planting seed...';
    await anim(stageText, [{ opacity: 0 }, { opacity: 1 }], { duration: dur(400), fill: 'forwards' });
    await anim(cursor, [
      { opacity: 0, transform: 'scale(0)' },
      { opacity: 1, transform: 'scale(1.3)' },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: dur(800), fill: 'forwards', easing: 'ease-out' });

    // Pulse glow (CAT10: Pulsing Glow)
    cursor.animate([
      { filter: 'drop-shadow(0 0 4px #FFB7C5)' },
      { filter: 'drop-shadow(0 0 16px #FFB7C5)' },
      { filter: 'drop-shadow(0 0 4px #FFB7C5)' },
    ], { duration: dur(1200), iterations: 2 });
    await new Promise(r => setTimeout(r, dur(1000)));

    // ── Stage 1: Stem grows (CAT6: Path Animation) ──
    setStep(1);
    stageText.textContent = 'Growing stem...';
    stem.style.opacity = '1';
    const stemLen = stem.getTotalLength();
    stem.style.strokeDasharray = stemLen;
    stem.style.strokeDashoffset = stemLen;
    await anim(stem, [
      { strokeDashoffset: stemLen },
      { strokeDashoffset: 0 },
    ], { duration: dur(1800), fill: 'forwards', easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' });

    // Cursor follows stem up
    await anim(cursor, [
      { transform: 'translate(0, 0)' },
      { transform: 'translate(0, -370px)' },
    ], { duration: dur(1800), fill: 'forwards', easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' });

    // ── Stage 2: Leaves unfold (CAT5: ScaleTransform morph) ──
    setStep(2);
    stageText.textContent = 'Unfolding leaves...';

    // Left leaf with elastic ease
    leafL.style.transformOrigin = '385px 350px';
    await anim(leafL, [
      { opacity: 0, transform: 'translate(385px, 350px) scale(0) rotate(30deg)' },
      { opacity: 1, transform: 'translate(385px, 350px) scale(1.15) rotate(-5deg)' },
      { opacity: 1, transform: 'translate(385px, 350px) scale(1) rotate(0deg)' },
    ], { duration: dur(700), fill: 'forwards' });

    // Right leaf
    leafR.style.transformOrigin = '415px 300px';
    await anim(leafR, [
      { opacity: 0, transform: 'translate(415px, 300px) scale(0) rotate(-30deg)' },
      { opacity: 1, transform: 'translate(415px, 300px) scale(1.1) rotate(5deg)' },
      { opacity: 1, transform: 'translate(415px, 300px) scale(1) rotate(0deg)' },
    ], { duration: dur(700), fill: 'forwards' });

    // Small leaf
    leafL2.style.transformOrigin = '390px 240px';
    await anim(leafL2, [
      { opacity: 0, transform: 'translate(390px, 240px) scale(0)' },
      { opacity: 0.8, transform: 'translate(390px, 240px) scale(1.05)' },
      { opacity: 0.8, transform: 'translate(390px, 240px) scale(1)' },
    ], { duration: dur(500), fill: 'forwards' });

    // ── Stage 3: Petals bloom one by one (CAT7: Stagger) ──
    setStep(3);
    stageText.textContent = 'Blooming...';

    // Hide cursor
    anim(cursor, [{ opacity: 1 }, { opacity: 0 }], { duration: dur(300), fill: 'forwards' });

    // Staggered petal bloom (CAT5: ElasticEase + CAT7: BeginTime stagger)
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      const angle = +p.dataset.angle;
      anim(p, [
        { opacity: 0, transform: `rotate(${angle}deg) scale(0)` },
        { opacity: 1, transform: `rotate(${angle}deg) scale(1.2)` },
        { opacity: 0.9, transform: `rotate(${angle}deg) scale(1)` },
      ], { duration: dur(600), fill: 'forwards', easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
      await new Promise(r => setTimeout(r, dur(200))); // stagger 0.2s
    }

    // Center pistil
    await anim(center, [
      { r: 0, opacity: 0 }, { r: 10, opacity: 1 }, { r: 8, opacity: 1 },
    ], { duration: dur(500), fill: 'forwards' });
    center.setAttribute('r', '8'); center.style.opacity = '1';

    await anim(centerInner, [
      { r: 0, opacity: 0 }, { r: 5, opacity: 1 }, { r: 4, opacity: 1 },
    ], { duration: dur(400), fill: 'forwards' });
    centerInner.setAttribute('r', '4'); centerInner.style.opacity = '1';

    // Bloom glow pulse (CAT10)
    const petalGroup = document.getElementById('bloomPetals');
    petalGroup.animate([
      { filter: 'drop-shadow(0 0 0px transparent)' },
      { filter: 'drop-shadow(0 0 12px #FFB7C5)' },
      { filter: 'drop-shadow(0 0 4px #FFB7C5)' },
    ], { duration: dur(800), fill: 'forwards' });

    await new Promise(r => setTimeout(r, dur(500)));

    // ── Stage 4: Celebration (CAT11: Confetti Burst) ──
    setStep(4);
    stageText.textContent = 'Celebrating!';

    // Spawn confetti particles
    const colors = ['#FFB7C5','#FF91A4','#FFD1DC','#FFE66D','#4ADE80','#86EFAC','#8B5CF6','#22D3EE'];
    for (let i = 0; i < 40; i++) {
      const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const angle = rand(0, Math.PI * 2);
      const dist = rand(60, 200);
      const endX = 400 + Math.cos(angle) * dist;
      const endY = 130 + Math.sin(angle) * dist;
      const r = rand(2, 5);
      particle.setAttribute('cx', '400');
      particle.setAttribute('cy', '130');
      particle.setAttribute('r', r);
      particle.setAttribute('fill', pick(colors));
      particles.appendChild(particle);

      anim(particle, [
        { cx: 400, cy: 130, opacity: 1, r: r },
        { cx: endX, cy: endY, opacity: 0.7, r: r * 1.2, offset: 0.6 },
        { cx: endX + rand(-20,20), cy: endY + rand(30,80), opacity: 0, r: r * 0.3 },
      ], { duration: dur(1200 + rand(0, 800)), fill: 'forwards', easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' });
    }

    // Gentle sway after bloom (CAT12: SineEase sway)
    petalGroup.animate([
      { transform: 'translate(400px, 130px) rotate(-3deg)' },
      { transform: 'translate(400px, 130px) rotate(3deg)' },
    ], { duration: dur(2500), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });

    // Falling petals from the bloom
    await new Promise(r => setTimeout(r, dur(1500)));
    for (let i = 0; i < 8; i++) {
      const petal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      petal.setAttribute('d', 'M0 -2 Q3 -10 1 -16 Q0 -18 -1 -16 Q-3 -10 0 -2Z');
      petal.setAttribute('fill', pick(['#FFB7C5','#FF91A4','#FFD1DC']));
      const startX = 400 + rand(-20, 20);
      const startY = 130 + rand(-10, 10);
      petal.setAttribute('transform', `translate(${startX}, ${startY})`);
      petal.style.opacity = '0.8';
      particles.appendChild(petal);

      const endX = startX + rand(-80, 80);
      const endY = startY + rand(200, 380);
      const rot = rand(-180, 180);
      anim(petal, [
        { transform: `translate(${startX}px, ${startY}px) rotate(0deg) scale(1)`, opacity: 0.8 },
        { transform: `translate(${endX}px, ${endY}px) rotate(${rot}deg) scale(0.4)`, opacity: 0 },
      ], { duration: dur(2500 + rand(0, 1500)), fill: 'forwards', easing: 'ease-in' });
    }

    stageText.textContent = 'AI bloomed a flower!';
    await new Promise(r => setTimeout(r, dur(3000)));
    isPlaying = false;
    playBtn.disabled = false;
  }

  playBtn.addEventListener('click', playBloom);
  resetBtn.addEventListener('click', resetAll);
  resetAll();
})();


// ─── Shared: Draw grass tufts at bottom ───
function drawGrass(ctx, w, h, now) {
  ctx.save();
  const grassY = h - 30;
  for (let x = 0; x < w; x += 8) {
    const sway = Math.sin(now * 0.002 + x * 0.05) * 3;
    const bladeH = 15 + Math.sin(x * 0.3) * 10;
    ctx.beginPath(); ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + sway, grassY - bladeH, x + 2, grassY);
    ctx.quadraticCurveTo(x + 2 - sway*0.5, grassY - bladeH*0.6, x + 4, h);
    ctx.fillStyle = `rgba(74,222,128,${0.3 + Math.sin(x*0.1)*0.15})`;
    ctx.fill();
  }
  ctx.restore();
}
