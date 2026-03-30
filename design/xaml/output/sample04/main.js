/* ============================================
   Peace Homepage — main.js
   Animation Engine: WAAPI (Web Animations API)

   WPF→Web Mapping (from XAML samples 28-32):
   - ScaleTransform → transform: scale()
   - SineEase EaseInOut → cubic-bezier(0.445,0.05,0.55,0.95)
   - PowerEase P=3 EaseOut → cubic-bezier(0.215,0.61,0.355,1)
   - AutoReverse+Forever → iterations:Infinity, direction:'alternate'
   - BeginTime stagger → delay (ms)
   - DoubleAnimation Duration → duration (ms)
   - ColorAnimation → CSS custom properties + rAF
   ============================================ */

const SINE_EASE = 'cubic-bezier(0.445, 0.05, 0.55, 0.95)';
const POWER3_OUT = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

/* ===========================
   OPTIONS STATE
   =========================== */
const opts = {
  speed: 1.0,
  featherCount: 8,
  rippleIntensity: 1.0,
  breathingEnabled: true,
  rippleEnabled: true,
  featherEnabled: true,
  auroraEnabled: true,
  cascadeEnabled: true,
};

let allAnimations = [];
let featherAnimationId = null;
let auroraAnimationId = null;

/* ===========================
   1. AURORA GRADIENT (XAML 31)
   4-stop LinearGradient cycling
   ColorAnimation 8s SineEase AutoReverse Forever
   Offset oscillation 6s SineEase
   =========================== */
function initAurora() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let t = 0;
  const colors = [
    { from: [30,58,95], to: [45,212,191] },
    { from: [45,212,191], to: [125,211,160] },
    { from: [125,211,160], to: [167,139,250] },
    { from: [167,139,250], to: [30,58,95] },
  ];

  function lerp(a, b, p) { return a + (b - a) * p; }
  function sineEase(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }

  function animateAurora() {
    if (!opts.auroraEnabled) { auroraAnimationId = requestAnimationFrame(animateAurora); return; }
    t += (0.002 * opts.speed);
    if (t > 2) t -= 2;
    const p = t <= 1 ? sineEase(t) : sineEase(2 - t);

    const c = colors.map(({ from, to }) => {
      const r = Math.round(lerp(from[0], to[0], p));
      const g = Math.round(lerp(from[1], to[1], p));
      const b = Math.round(lerp(from[2], to[2], p));
      return `rgb(${r},${g},${b})`;
    });

    const off2 = lerp(20, 50, p);
    const off3 = lerp(50, 80, p);

    hero.style.background = `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} ${off2}%, ${c[2]} ${off3}%, ${c[3]} 100%)`;
    auroraAnimationId = requestAnimationFrame(animateAurora);
  }
  auroraAnimationId = requestAnimationFrame(animateAurora);
}

/* ===========================
   2. BREATHING CIRCLE (XAML 28)
   Outer: Scale 0.6→1.4, SineEase, 4s, AutoReverse Forever
   Mid:   Scale 0.7→1.3, delay 300ms
   Inner: Scale 0.8→1.2, Opacity 0.3→1.0
   =========================== */
function initBreathingCircle() {
  const outer = document.querySelector('.ring.outer');
  const mid = document.querySelector('.ring.mid');
  const inner = document.querySelector('.ring.inner');
  if (!outer || !mid || !inner) return;

  const base = { easing: SINE_EASE, iterations: Infinity, direction: 'alternate' };

  const a1 = outer.animate([
    { transform: 'translate(-50%,-50%) scale(0.6)' },
    { transform: 'translate(-50%,-50%) scale(1.4)' }
  ], { ...base, duration: 4000 / opts.speed });

  const a2 = mid.animate([
    { transform: 'translate(-50%,-50%) scale(0.7)' },
    { transform: 'translate(-50%,-50%) scale(1.3)' }
  ], { ...base, duration: 4000 / opts.speed, delay: 300 });

  const a3 = inner.animate([
    { transform: 'translate(-50%,-50%) scale(0.8)', opacity: 0.3, boxShadow: '0 0 30px rgba(255,255,255,0.2), 0 0 60px rgba(45,212,191,0.1)' },
    { transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1, boxShadow: '0 0 80px rgba(255,255,255,0.6), 0 0 160px rgba(45,212,191,0.4)' }
  ], { ...base, duration: 4000 / opts.speed });

  allAnimations.push(a1, a2, a3);
  return [a1, a2, a3];
}

/* ===========================
   3. WATER RIPPLE (XAML 29)
   Scale 0→8, Opacity 1→0, 3s Forever
   Stagger: 0s, 0.8s, 1.6s
   =========================== */
function createRippleSet(container, color = 'rgba(45,212,191,0.6)', count = 3) {
  if (!opts.rippleEnabled) return [];
  const anims = [];
  for (let i = 0; i < count; i++) {
    const ring = document.createElement('div');
    ring.className = 'ripple-ring';
    ring.style.width = '20px';
    ring.style.height = '20px';
    ring.style.borderColor = color;
    container.appendChild(ring);

    const a = ring.animate([
      { transform: 'translate(-50%,-50%) scale(0)', opacity: opts.rippleIntensity },
      { transform: 'translate(-50%,-50%) scale(8)', opacity: 0 }
    ], {
      duration: 3000 / opts.speed,
      delay: (i * 800) / opts.speed,
      iterations: Infinity,
      easing: 'linear'
    });
    anims.push(a);
    allAnimations.push(a);
  }
  return anims;
}

/* ===========================
   4. FLOATING FEATHER (XAML 30)
   TranslateX: sin(t)*30, SineEase, 3s, AutoReverse Forever
   TranslateY: 0→viewportH, 8s, Forever
   Rotate: -15→15, SineEase, 2.5s, AutoReverse Forever
   Opacity: 0.8→0.1
   =========================== */
function initFeathers() {
  const canvas = document.querySelector('.feather-canvas');
  if (!canvas) return;
  canvas.innerHTML = '';

  if (!opts.featherEnabled) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const featherColors = [
    ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.2)'],
    ['rgba(45,212,191,0.6)', 'rgba(45,212,191,0.15)'],
    ['rgba(125,211,160,0.6)', 'rgba(125,211,160,0.15)'],
    ['rgba(167,139,250,0.5)', 'rgba(167,139,250,0.1)'],
  ];

  for (let i = 0; i < opts.featherCount; i++) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute;pointer-events:none;';
    const startX = Math.random() * 100;
    const startY = -(Math.random() * 20 + 5);
    wrapper.style.left = startX + '%';
    wrapper.style.top = startY + '%';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '50');
    svg.setAttribute('viewBox', '0 0 24 50');
    svg.style.overflow = 'visible';

    const defs = document.createElementNS(svgNS, 'defs');
    const grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', `fg${i}`);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    const colorPair = featherColors[i % featherColors.length];
    const s1 = document.createElementNS(svgNS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', colorPair[0]);
    const s2 = document.createElementNS(svgNS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', colorPair[1]);
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M12,0 C10,10 4,22 6,35 C7.5,42 10,45 12,48 C14,45 16.5,42 18,35 C20,22 14,10 12,0 Z');
    path.setAttribute('fill', `url(#fg${i})`);
    svg.appendChild(path);

    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', '12'); line.setAttribute('y1', '2');
    line.setAttribute('x2', '12'); line.setAttribute('y2', '46');
    line.setAttribute('stroke', colorPair[0]); line.setAttribute('stroke-width', '0.5');
    svg.appendChild(line);

    wrapper.appendChild(svg);
    canvas.appendChild(wrapper);

    const dur = (6000 + Math.random() * 6000) / opts.speed;
    const swayDur = (2500 + Math.random() * 1500) / opts.speed;
    const swayAmp = 25 + Math.random() * 40;
    const rotAmp = 12 + Math.random() * 10;
    const delayMs = Math.random() * 4000;

    const a1 = wrapper.animate([
      { transform: `translateY(0)`, opacity: 0.8 },
      { transform: `translateY(110vh)`, opacity: 0.05 }
    ], { duration: dur, delay: delayMs, iterations: Infinity, easing: 'linear' });

    const a2 = wrapper.animate([
      { transform: `translateX(-${swayAmp}px) rotate(-${rotAmp}deg)` },
      { transform: `translateX(${swayAmp}px) rotate(${rotAmp}deg)` }
    ], { duration: swayDur, delay: delayMs, iterations: Infinity, direction: 'alternate', easing: SINE_EASE, composite: 'add' });

    allAnimations.push(a1, a2);
  }
}

/* ===========================
   5. ZEN FADE CASCADE (XAML 32)
   Opacity 0→1, PowerEase P=3 EaseOut, 1.2s
   BeginTime stagger +500ms
   + translateY for extra polish
   =========================== */
function initCascade() {
  if (!opts.cascadeEnabled) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.dataset.cascadeDelay || '0', 10);
        const a = el.animate([
          { opacity: 0, transform: 'translateY(30px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], {
          duration: 1200 / opts.speed,
          delay: delay / opts.speed,
          easing: POWER3_OUT,
          fill: 'forwards'
        });
        allAnimations.push(a);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-cascade]').forEach(el => {
    observer.observe(el);
  });
}

/* ===========================
   6. HERO RIPPLE DECORATIONS
   =========================== */
function initHeroRipples() {
  const positions = [
    { top: '20%', left: '15%' },
    { top: '70%', left: '80%' },
    { top: '85%', left: '25%' },
  ];
  const hero = document.querySelector('.hero');
  if (!hero) return;

  positions.forEach(pos => {
    const container = document.createElement('div');
    container.className = 'ripple-container';
    container.style.top = pos.top;
    container.style.left = pos.left;
    container.style.width = '0';
    container.style.height = '0';
    hero.appendChild(container);
    createRippleSet(container, 'rgba(255,255,255,0.2)', 3);
  });
}

/* ===========================
   7. PEACE MAP — 3D Globe (Three.js)
   Moved to globe.js
   =========================== */

/* ===========================
   8. CARD RIPPLE BACKGROUNDS
   =========================== */
function initCardRipples() {
  document.querySelectorAll('.card-ripple').forEach(container => {
    for (let i = 0; i < 2; i++) {
      const rp = document.createElement('div');
      rp.className = 'rp';
      rp.style.width = '30px';
      rp.style.height = '30px';
      container.appendChild(rp);
      const a = rp.animate([
        { transform: 'translate(-50%,-50%) scale(0)', opacity: 0.3 },
        { transform: 'translate(-50%,-50%) scale(10)', opacity: 0 }
      ], {
        duration: 4000 / opts.speed,
        delay: i * 1500,
        iterations: Infinity,
        easing: 'linear'
      });
      allAnimations.push(a);
    }
  });
}

/* ===========================
   9. BUTTON HOVER RIPPLE (CAT8)
   =========================== */
function initButtonEffects() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-3px) scale(1.03)' }
      ], { duration: 300, easing: POWER3_OUT, fill: 'forwards' });
    });
    btn.addEventListener('mouseleave', () => {
      btn.animate([
        { transform: 'translateY(-3px) scale(1.03)' },
        { transform: 'translateY(0) scale(1)' }
      ], { duration: 300, easing: SINE_EASE, fill: 'forwards' });
    });
  });
}

/* ===========================
   OPTIONS PANEL
   =========================== */
function initOptionsPanel() {
  const panel = document.querySelector('.options-panel');
  const toggle = panel.querySelector('h3');
  toggle.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
  });

  // Speed
  const speedSlider = document.getElementById('opt-speed');
  const speedVal = document.getElementById('opt-speed-val');
  speedSlider.addEventListener('input', () => {
    opts.speed = parseFloat(speedSlider.value);
    speedVal.textContent = opts.speed.toFixed(1) + 'x';
    updateAllPlaybackRates();
  });

  // Feather Count
  const featherSlider = document.getElementById('opt-feather');
  const featherVal = document.getElementById('opt-feather-val');
  featherSlider.addEventListener('input', () => {
    opts.featherCount = parseInt(featherSlider.value, 10);
    featherVal.textContent = opts.featherCount;
    initFeathers();
  });

  // Ripple Intensity
  const rippleSlider = document.getElementById('opt-ripple');
  const rippleVal = document.getElementById('opt-ripple-val');
  rippleSlider.addEventListener('input', () => {
    opts.rippleIntensity = parseFloat(rippleSlider.value);
    rippleVal.textContent = opts.rippleIntensity.toFixed(1);
  });

  // Toggles
  const toggles = {
    'tog-breathing': 'breathingEnabled',
    'tog-ripple': 'rippleEnabled',
    'tog-feather': 'featherEnabled',
    'tog-aurora': 'auroraEnabled',
    'tog-cascade': 'cascadeEnabled',
  };
  Object.entries(toggles).forEach(([id, key]) => {
    const cb = document.getElementById(id);
    if (cb) {
      cb.checked = opts[key];
      cb.addEventListener('change', () => {
        opts[key] = cb.checked;
        if (key === 'featherEnabled') initFeathers();
      });
    }
  });
}

function updateAllPlaybackRates() {
  allAnimations.forEach(a => {
    if (a.playState !== 'finished') {
      try { a.playbackRate = opts.speed; } catch(e) {}
    }
  });
}

/* (World map moved to globe.js — 3D Three.js globe) */

/* ===========================
   INIT
   =========================== */
/* ===========================
   10. SCROLL-AWARE LANG TOGGLE
   =========================== */
function initLangToggleScroll() {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  const hero = document.querySelector('.hero');
  const footer = document.querySelector('.footer');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
    const footerTop = footer ? footer.offsetTop : Infinity;
    const isOnDark = y < heroBottom - 60 || y > footerTop - 60;
    toggle.classList.toggle('on-light', !isOnDark);
  }, { passive: true });
}

/* ===========================
   INIT
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  initAurora();
  initBreathingCircle();
  initFeathers();
  initHeroRipples();
  initCascade();
  initCardRipples();
  initButtonEffects();
  initOptionsPanel();
  initLangToggleScroll();
});
