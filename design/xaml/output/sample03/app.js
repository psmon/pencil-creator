/* ============================================================
   CYBERPUNK HUD PANEL — Animation Engine
   WPF → Web Mapping (WAAPI + CSS + Canvas)
   ============================================================ */

// --- State ---
const state = {
  theme: 'cybertic',
  effects: {
    glitch:   { enabled: true, speed: 1.0, intensity: 1.0 },
    neon:     { enabled: true, speed: 1.5, intensity: 1.0 },
    rgb:      { enabled: true, speed: 3.0, intensity: 1.0 },
    scanline: { enabled: true, speed: 2.5 },
    matrix:   { enabled: true, speed: 1.0, density: 1.0 },
    holo:     { enabled: true, speed: 2.0 }
  }
};

// --- Theme Switcher ---
function setTheme(name) {
  state.theme = name;
  document.documentElement.setAttribute('data-theme', name);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === name);
  });
  // Update status bar theme display
  const themeDisplay = document.getElementById('theme-display');
  if (themeDisplay) themeDisplay.textContent = name.toUpperCase();
  // Re-init matrix rain with new theme colors
  initMatrixRain();
}

// --- Toggle & Slider Handlers ---
function initControls() {
  // Toggles
  document.querySelectorAll('[data-toggle]').forEach(el => {
    const key = el.dataset.toggle;
    el.addEventListener('click', () => {
      state.effects[key].enabled = !state.effects[key].enabled;
      el.querySelector('.toggle-switch').classList.toggle('on', state.effects[key].enabled);
      applyEffectState(key);
    });
  });

  // Sliders
  document.querySelectorAll('[data-slider]').forEach(el => {
    const [key, prop] = el.dataset.slider.split('.');
    el.addEventListener('input', () => {
      const val = parseFloat(el.value);
      state.effects[key][prop] = val;
      el.previousElementSibling.querySelector('span').textContent = val.toFixed(1);
      applySliderValue(key, prop, val);
    });
  });

  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });
}

function applyEffectState(key) {
  const containers = {
    glitch:   '.glitch-container',
    neon:     '.neon-container',
    rgb:      '.rgb-container',
    scanline: '.scanline-container',
    matrix:   '.matrix-container',
    holo:     '.holo-container'
  };
  const sel = containers[key];
  if (!sel) return;
  const el = document.querySelector(sel);
  if (!el) return;
  const cls = key + '-active';
  const parent = el.closest('.hud-panel') || el;
  if (state.effects[key].enabled) {
    parent.classList.add(cls);
    el.classList.add(cls);
    if (key === 'matrix') initMatrixRain();
  } else {
    parent.classList.remove(cls);
    el.classList.remove(cls);
    if (key === 'matrix') stopMatrixRain();
  }
}

function applySliderValue(key, prop, val) {
  const root = document.documentElement;
  if (key === 'glitch' && prop === 'speed') {
    root.style.setProperty('--glitch-speed', val + 's');
  } else if (key === 'neon' && prop === 'speed') {
    root.style.setProperty('--neon-speed', val + 's');
  } else if (key === 'rgb' && prop === 'speed') {
    root.style.setProperty('--rgb-speed', val + 's');
  } else if (key === 'scanline' && prop === 'speed') {
    root.style.setProperty('--scan-speed', val + 's');
  } else if (key === 'holo' && prop === 'speed') {
    root.style.setProperty('--holo-speed', val + 's');
  } else if (key === 'matrix' && prop === 'speed') {
    initMatrixRain();
  } else if (key === 'matrix' && prop === 'density') {
    initMatrixRain();
  }
}

// --- Matrix Rain (Canvas + rAF) ---
// WPF mapping: TranslateTransform Y 0→800, staggered BeginTime, RepeatBehavior=Forever
let matrixRafId = null;

function getThemeColor(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function initMatrixRain() {
  stopMatrixRain();
  const canvas = document.querySelector('.matrix-canvas');
  if (!canvas) return;
  if (!state.effects.matrix.enabled) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;

  const matrixColor = getThemeColor('--matrix-color') || '#22D3EE';
  const bgColor = getThemeColor('--bg-card') || '#0F172A';

  const fontSize = 12;
  const density = state.effects.matrix.density;
  const cols = Math.floor((w / fontSize) * density);
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>{}[]|/\\';

  // Stagger: each column starts at different Y (WPF BeginTime mapping)
  const drops = Array.from({ length: cols }, () => Math.random() * -50);
  // Varied speeds per column (WPF Duration 3.2s–5.0s mapping → pixel speed variation)
  const speeds = Array.from({ length: cols }, () => 0.3 + Math.random() * 0.7);
  // Opacity per column (WPF: columns 1-2 have opacity fade)
  const opacities = Array.from({ length: cols }, (_, i) => i < 2 ? 0.8 : 0.5 + Math.random() * 0.3);

  const speedMul = state.effects.matrix.speed;

  function draw() {
    ctx.fillStyle = bgColor + '18';
    ctx.fillRect(0, 0, w, h);

    ctx.font = fontSize + 'px "JetBrains Mono", monospace';

    for (let i = 0; i < cols; i++) {
      const x = (i / density) * fontSize;
      const y = drops[i] * fontSize;
      const char = chars[Math.floor(Math.random() * chars.length)];

      // Head character (brighter)
      ctx.fillStyle = matrixColor;
      ctx.globalAlpha = opacities[i];
      ctx.fillText(char, x, y);

      // Trail character (dimmer)
      if (drops[i] > 1) {
        ctx.globalAlpha = opacities[i] * 0.3;
        const trailChar = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(trailChar, x, y - fontSize * 2);
      }

      ctx.globalAlpha = 1;

      drops[i] += speeds[i] * speedMul;

      if (y > h && Math.random() > 0.98) {
        drops[i] = 0;
      }
    }

    matrixRafId = requestAnimationFrame(draw);
  }

  draw();
}

function stopMatrixRain() {
  if (matrixRafId) {
    cancelAnimationFrame(matrixRafId);
    matrixRafId = null;
  }
}

// --- Glitch Jitter (WAAPI enhancement) ---
// WPF mapping: DiscreteDoubleKeyFrame, 1.0s cycle, burst at 0-0.2s and 0.8-0.95s
function initGlitchWAAPI() {
  const el = document.querySelector('.glitch-text');
  if (!el) return;

  // Additional subtle ScaleX distortion via WAAPI
  // WPF: ScaleX 1→1.03→0.97→1 (Discrete)
  el.animate([
    { transform: 'scaleX(1)',    offset: 0 },
    { transform: 'scaleX(1.03)', offset: 0.05 },
    { transform: 'scaleX(0.97)', offset: 0.10 },
    { transform: 'scaleX(1)',    offset: 0.20 },
    { transform: 'scaleX(1)',    offset: 0.80 },
    { transform: 'scaleX(1.02)', offset: 0.90 },
    { transform: 'scaleX(1)',    offset: 1 }
  ], {
    duration: 1000,
    iterations: Infinity,
    easing: 'steps(1)'
  });
}

// --- Neon Color Cycle (WAAPI) ---
// WPF: ColorAnimation #22D3EE→#E040FB, 3.0s, SineEase EaseInOut, AutoReverse
function initNeonColorCycle() {
  document.querySelectorAll('.neon-box').forEach((box, i) => {
    box.animate([
      { color: 'var(--accent-1)', textShadow: '0 0 10px var(--accent-1)' },
      { color: 'var(--accent-2)', textShadow: '0 0 20px var(--accent-2)' },
      { color: 'var(--accent-1)', textShadow: '0 0 10px var(--accent-1)' }
    ], {
      duration: 3000,
      delay: i * 300,
      iterations: Infinity,
      easing: 'ease-in-out'
    });
  });
}

// --- Scanline Extra: CRT Flicker via WAAPI ---
function initScanlineExtra() {
  const container = document.querySelector('.scanline-container');
  if (!container) return;
  container.animate([
    { opacity: 1 },
    { opacity: 0.97 },
    { opacity: 1 },
    { opacity: 0.98 },
    { opacity: 1 }
  ], {
    duration: 200,
    iterations: Infinity
  });
}

// --- Holographic Gradient Offset Sweep (WAAPI) ---
// WPF: DoubleAnimation Offset 0.2→0.8, 3.0s, SineEase
function initHoloSweep() {
  document.querySelectorAll('.holo-card').forEach((card, i) => {
    card.animate([
      { backgroundPosition: '0% 50%' },
      { backgroundPosition: '100% 50%' },
      { backgroundPosition: '0% 50%' }
    ], {
      duration: 3000,
      delay: i * 500,
      iterations: Infinity,
      easing: 'ease-in-out'
    });
  });
}

// --- FPS Counter ---
let fpsFrames = 0;
let fpsLast = performance.now();

function initFPS() {
  const el = document.getElementById('fps-value');
  if (!el) return;

  function tick() {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsLast >= 1000) {
      el.textContent = fpsFrames;
      fpsFrames = 0;
      fpsLast = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// --- Init ---
function init() {
  setTheme('cybertic');
  initControls();

  // Apply initial states
  Object.keys(state.effects).forEach(key => applyEffectState(key));

  // WAAPI enhancements
  initGlitchWAAPI();
  initNeonColorCycle();
  initScanlineExtra();
  initHoloSweep();
  initFPS();

  // Window resize → re-init canvas
  window.addEventListener('resize', () => {
    if (state.effects.matrix.enabled) initMatrixRain();
  });
}

document.addEventListener('DOMContentLoaded', init);
