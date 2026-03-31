/* ============================================================
   요르단의 반지 (Ring of Jordan) — Animation Engine
   WPF→Web Mapping: CAT16/17/23/27/33/36/38 + Particle System
   ============================================================ */

// ── Starfield Background (CAT33: depth layers 6-20s linear) ──

class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.layers = [
      { count: 120, speed: 0.15, sizeRange: [0.5, 1.2], opacity: 0.4 },  // background 20s
      { count: 80,  speed: 0.4,  sizeRange: [1.0, 2.0], opacity: 0.6 },  // midground 12s
      { count: 40,  speed: 0.8,  sizeRange: [1.5, 3.0], opacity: 0.9 },  // foreground 6s
    ];
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.stars = [];
    this.layers.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]),
          speed: layer.speed * (0.7 + Math.random() * 0.6),
          opacity: layer.opacity * (0.5 + Math.random() * 0.5),
          twinkleSpeed: 0.5 + Math.random() * 2,
          twinkleOffset: Math.random() * Math.PI * 2,
          layer: li,
        });
      }
    });
  }

  draw(time) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const t = time * 0.001;

    this.stars.forEach(star => {
      // Horizontal drift (CAT33: Canvas.Left translate)
      star.x -= star.speed;
      if (star.x < -5) {
        star.x = this.canvas.width + 5;
        star.y = Math.random() * this.canvas.height;
      }

      // Twinkle (SineEase oscillation)
      const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.opacity * twinkle;

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(239, 191, 4, ${alpha * 0.6})`;
      this.ctx.fill();

      // Glow halo for foreground stars
      if (star.layer === 2 && twinkle > 0.7) {
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(239, 191, 4, ${alpha * 0.15})`;
        this.ctx.fill();
      }
    });
  }
}

// ── Magic Particle System (CAT16 particles + CAT16 floating dots 5-8s) ──

class MagicParticles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', e => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    const colors = [
      { r: 239, g: 191, b: 4 },    // gold
      { r: 167, g: 139, b: 250 },   // purple
      { r: 34,  g: 211, b: 238 },   // cyan
      { r: 201, g: 168, b: 76 },    // dim gold
    ];

    for (let i = 0; i < 60; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 2 + Math.random() * 4,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.2 - Math.random() * 0.5, // rise upward
        color,
        opacity: 0.2 + Math.random() * 0.6,
        fadeSpeed: 0.3 + Math.random() * 0.5,
        fadeOffset: Math.random() * Math.PI * 2,
        life: Math.random(),
        // Staggered starts (CAT16: BeginTime 0-4.5s)
        delay: Math.random() * 4500,
        born: performance.now(),
      });
    }
  }

  draw(time) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const t = time * 0.001;

    this.particles.forEach(p => {
      // Stagger delay
      if (time - p.born < p.delay) return;

      // Movement with mouse influence
      const dx = this.mouseX - p.x;
      const dy = this.mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / 300) * 0.02;

      p.x += p.speedX + dx * influence;
      p.y += p.speedY;

      // Wrap around
      if (p.y < -10) { p.y = this.canvas.height + 10; p.x = Math.random() * this.canvas.width; }
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;

      // Fade oscillation (CAT16: Opacity 0.4→0.9 SineEase)
      const fade = 0.4 + 0.5 * Math.sin(t * p.fadeSpeed + p.fadeOffset);
      const alpha = p.opacity * fade;

      // Glow (DropShadowEffect blur)
      const { r, g, b } = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`;
      this.ctx.fill();

      // Core
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      this.ctx.fill();
    });
  }
}

// ── 3D Ring Renderer (CAT36: Galaxy Swirl 360° + CAT17 Glow) ──

class Ring3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationZ = 0;
    this.autoRotate = true;
    this.speedMultiplier = 1;
    this.glowIntensity = 1;
    this.runeCount = 12;
    this.ringSegments = 64;
    this.time = 0;

    // Mouse interaction
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
    this.momentum = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.autoRotate = false;
    this.lastMouse = { x: e.offsetX, y: e.offsetY };
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.offsetX - this.lastMouse.x;
    const dy = e.offsetY - this.lastMouse.y;
    this.momentum = { x: dy * 0.01, y: dx * 0.01 };
    this.rotationX += dy * 0.01;
    this.rotationY += dx * 0.01;
    this.lastMouse = { x: e.offsetX, y: e.offsetY };
  }

  onMouseUp() {
    this.isDragging = false;
    setTimeout(() => { this.autoRotate = true; }, 2000);
  }

  project(x, y, z) {
    const fov = 500;
    const scale = fov / (fov + z);
    return {
      x: x * scale + this.canvas.width / 2,
      y: y * scale + this.canvas.height / 2,
      scale,
    };
  }

  rotatePoint(x, y, z) {
    // Rotate Y
    let x1 = x * Math.cos(this.rotationY) - z * Math.sin(this.rotationY);
    let z1 = x * Math.sin(this.rotationY) + z * Math.cos(this.rotationY);
    // Rotate X
    let y1 = y * Math.cos(this.rotationX) - z1 * Math.sin(this.rotationX);
    let z2 = y * Math.sin(this.rotationX) + z1 * Math.cos(this.rotationX);
    // Rotate Z
    let x2 = x1 * Math.cos(this.rotationZ) - y1 * Math.sin(this.rotationZ);
    let y2 = x1 * Math.sin(this.rotationZ) + y1 * Math.cos(this.rotationZ);
    return { x: x2, y: y2, z: z2 };
  }

  drawRing(radius, thickness, color, glowColor, tiltX, tiltY) {
    const points = [];
    for (let i = 0; i <= this.ringSegments; i++) {
      const angle = (i / this.ringSegments) * Math.PI * 2;
      let x = Math.cos(angle) * radius;
      let y = Math.sin(angle) * radius;
      let z = 0;

      // Apply ring tilt
      const cosT = Math.cos(tiltX), sinT = Math.sin(tiltX);
      const y2 = y * cosT - z * sinT;
      const z2 = y * sinT + z * cosT;
      const cosP = Math.cos(tiltY), sinP = Math.sin(tiltY);
      const x2 = x * cosP - z2 * sinP;
      const z3 = x * sinP + z2 * cosP;

      const rotated = this.rotatePoint(x2, y2, z3);
      const projected = this.project(rotated.x, rotated.y, rotated.z);
      points.push({ ...projected, z: rotated.z });
    }

    // Draw glow trail
    this.ctx.beginPath();
    this.ctx.lineWidth = thickness * 3;
    this.ctx.strokeStyle = glowColor;
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 20 * this.glowIntensity;
    points.forEach((p, i) => {
      if (i === 0) this.ctx.moveTo(p.x, p.y);
      else this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.stroke();

    // Draw solid ring
    this.ctx.beginPath();
    this.ctx.lineWidth = thickness;
    this.ctx.strokeStyle = color;
    this.ctx.shadowBlur = 10 * this.glowIntensity;
    points.forEach((p, i) => {
      if (i === 0) this.ctx.moveTo(p.x, p.y);
      else this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    return points;
  }

  drawRunes(radius, tiltX, tiltY) {
    const runes = ['', '', '', '', '', '', '', '', '', '', '', ''];

    for (let i = 0; i < this.runeCount; i++) {
      const angle = (i / this.runeCount) * Math.PI * 2 + this.time * 0.3;
      let x = Math.cos(angle) * radius;
      let y = Math.sin(angle) * radius;
      let z = 0;

      const cosT = Math.cos(tiltX), sinT = Math.sin(tiltX);
      const y2 = y * cosT - z * sinT;
      const z2 = y * sinT + z * cosT;
      const cosP = Math.cos(tiltY), sinP = Math.sin(tiltY);
      const x2 = x * cosP - z2 * sinP;
      const z3 = x * sinP + z2 * cosP;

      const rotated = this.rotatePoint(x2, y2, z3);
      const projected = this.project(rotated.x, rotated.y, rotated.z);

      const alpha = 0.3 + 0.7 * ((rotated.z + 200) / 400);
      const size = 14 * projected.scale;

      this.ctx.font = `${size}px serif`;
      this.ctx.fillStyle = `rgba(239, 191, 4, ${Math.max(0.1, alpha)})`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = 'rgba(239, 191, 4, 0.5)';
      this.ctx.shadowBlur = 8 * this.glowIntensity;
      this.ctx.fillText(runes[i % runes.length], projected.x, projected.y);
      this.ctx.shadowBlur = 0;
    }
  }

  draw(time) {
    this.time = time * 0.001;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    // Auto-rotation (CAT36: inner 6s, mid 12s, outer 20s)
    if (this.autoRotate) {
      this.rotationY += 0.008 * this.speedMultiplier;
      this.rotationX = Math.sin(this.time * 0.2) * 0.3;
      this.rotationZ = Math.sin(this.time * 0.15) * 0.1;
    } else {
      // Apply momentum
      this.rotationX += this.momentum.x;
      this.rotationY += this.momentum.y;
      this.momentum.x *= 0.95;
      this.momentum.y *= 0.95;
    }

    // Core glow (CAT36: BlurRadius 30→60, 4s SineEase)
    const coreGlow = 0.3 + 0.3 * Math.sin(this.time * 1.57); // ~4s period
    const grad = this.ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 120);
    grad.addColorStop(0, `rgba(239, 191, 4, ${coreGlow * this.glowIntensity})`);
    grad.addColorStop(0.5, `rgba(167, 139, 250, ${coreGlow * 0.3 * this.glowIntensity})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Draw three ring bands (outer→inner for correct overlap)
    // Outer ring (20s orbit)
    this.drawRing(160, 2.5, 'rgba(239,191,4,0.9)', 'rgba(239,191,4,0.3)', 0, 0);
    // Mid ring tilted (12s orbit)
    this.drawRing(130, 2, 'rgba(167,139,250,0.7)', 'rgba(167,139,250,0.2)', Math.PI * 0.35, 0);
    // Inner ring tilted perpendicular (6s orbit)
    this.drawRing(100, 1.5, 'rgba(34,211,238,0.6)', 'rgba(34,211,238,0.15)', 0, Math.PI * 0.35);

    // Rune symbols orbiting
    this.drawRunes(145, 0.1, 0);

    // Center gem
    const gemGlow = 0.5 + 0.5 * Math.sin(this.time * 2);
    const gemGrad = this.ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 25);
    gemGrad.addColorStop(0, `rgba(239, 191, 4, ${0.8 * gemGlow})`);
    gemGrad.addColorStop(0.6, `rgba(239, 191, 4, ${0.3 * gemGlow})`);
    gemGrad.addColorStop(1, 'rgba(239, 191, 4, 0)');
    this.ctx.fillStyle = gemGrad;
    this.ctx.beginPath();
    this.ctx.arc(w/2, h/2, 25, 0, Math.PI * 2);
    this.ctx.fill();

    // Center rune symbol
    this.ctx.font = '28px serif';
    this.ctx.fillStyle = `rgba(239, 191, 4, ${0.7 + 0.3 * gemGlow})`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(239, 191, 4, 0.8)';
    this.ctx.shadowBlur = 15 * this.glowIntensity;
    this.ctx.fillText('', w/2, h/2);
    this.ctx.shadowBlur = 0;
  }
}

// ── Puzzle Board Interactive ──

class PuzzleBoard {
  constructor(container) {
    this.container = container;
    this.symbols = ['', '', '', '', '', '', '', ''];
    this.tiles = [];
    this.matchedPairs = 0;
    this.selected = null;
    this.locked = false;
    this.init();
  }

  init() {
    // Create pairs + 0 empty tiles for 4x4 = 16
    const pairs = [...this.symbols, ...this.symbols];
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    this.container.innerHTML = '';
    const types = ['rune', 'crystal', 'magic', 'fire'];

    pairs.forEach((symbol, index) => {
      const tile = document.createElement('div');
      tile.className = `puzzle-tile ${types[index % types.length]}`;
      tile.dataset.symbol = symbol;
      tile.dataset.index = index;
      tile.textContent = '?';
      tile.style.fontSize = '24px';
      tile.style.color = 'rgba(239,191,4,0.5)';

      tile.addEventListener('click', () => this.onTileClick(tile));
      this.container.appendChild(tile);
      this.tiles.push(tile);
    });

    // Auto-demo: reveal tiles briefly
    setTimeout(() => this.peekAll(), 500);
  }

  peekAll() {
    this.tiles.forEach((tile, i) => {
      setTimeout(() => {
        tile.textContent = tile.dataset.symbol;
        tile.style.fontSize = '28px';
        tile.style.color = '#fff';
        tile.style.transform = 'scale(1.05)';
      }, i * 60);
    });

    setTimeout(() => {
      this.tiles.forEach((tile, i) => {
        if (!tile.classList.contains('matched-done')) {
          setTimeout(() => {
            tile.textContent = '?';
            tile.style.fontSize = '24px';
            tile.style.color = 'rgba(239,191,4,0.5)';
            tile.style.transform = 'scale(1)';
          }, i * 40);
        }
      });
    }, 2000);
  }

  onTileClick(tile) {
    if (this.locked || tile.classList.contains('matched-done')) return;
    if (tile === this.selected) return;

    // Reveal
    tile.textContent = tile.dataset.symbol;
    tile.style.fontSize = '28px';
    tile.style.color = '#fff';

    if (!this.selected) {
      this.selected = tile;
      return;
    }

    this.locked = true;
    const first = this.selected;
    const second = tile;

    if (first.dataset.symbol === second.dataset.symbol) {
      // Match!
      setTimeout(() => {
        first.classList.add('matched', 'matched-done');
        second.classList.add('matched', 'matched-done');
        first.style.color = '#efbf04';
        second.style.color = '#efbf04';
        first.style.boxShadow = '0 0 20px rgba(239,191,4,0.4)';
        second.style.boxShadow = '0 0 20px rgba(239,191,4,0.4)';
        this.matchedPairs++;
        this.selected = null;
        this.locked = false;

        if (this.matchedPairs === this.symbols.length) {
          setTimeout(() => this.onWin(), 500);
        }
      }, 300);
    } else {
      // No match — hide after delay
      setTimeout(() => {
        first.textContent = '?';
        first.style.fontSize = '24px';
        first.style.color = 'rgba(239,191,4,0.5)';
        second.textContent = '?';
        second.style.fontSize = '24px';
        second.style.color = 'rgba(239,191,4,0.5)';
        this.selected = null;
        this.locked = false;
      }, 800);
    }
  }

  onWin() {
    this.container.style.boxShadow = '0 0 60px rgba(239,191,4,0.4)';
    // Celebrate animation
    this.tiles.forEach((tile, i) => {
      tile.animate([
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(1.15) rotate(5deg)', offset: 0.5 },
        { transform: 'scale(1) rotate(0deg)' },
      ], {
        duration: 600,
        delay: i * 50,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      });
    });

    setTimeout(() => {
      this.matchedPairs = 0;
      this.selected = null;
      this.container.style.boxShadow = '';
      this.init();
    }, 3000);
  }
}

// ── WAAPI Hero Card Entrance (Hologram fade-in: PowerEase=3 EaseOut) ──

function animateHeroCards() {
  const cards = document.querySelectorAll('.hero-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const index = Array.from(cards).indexOf(card);

        // WAAPI cascade (CAT38: Opacity 0→1, 0.8s, PowerEase=3 EaseOut)
        card.animate([
          { opacity: 0, transform: 'translateY(40px) scale(0.95)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ], {
          duration: 800,
          delay: index * 200, // stagger
          easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)', // PowerEase=3 EaseOut
          fill: 'forwards',
        });

        observer.unobserve(card);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
  });
}

// ── Scroll Fade-in (WAAPI) ──

function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
}

// ── Crowdfunding Counter Animation ──

function animateCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Cubic ease-out
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(target * eased);
          el.textContent = prefix + current.toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));
}

// ── Progress Bar Animation ──

function animateProgressBar() {
  const fill = document.querySelector('.progress-fill');
  if (!fill) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => { fill.style.width = '73%'; }, 300);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  observer.observe(fill.parentElement);
}

// ── 3D Ring Controls ──

function initRingControls(ring3d) {
  const speedSlider = document.getElementById('ring-speed');
  const glowSlider = document.getElementById('ring-glow');
  const runeSlider = document.getElementById('ring-runes');

  if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
      ring3d.speedMultiplier = parseFloat(e.target.value);
    });
  }
  if (glowSlider) {
    glowSlider.addEventListener('input', (e) => {
      ring3d.glowIntensity = parseFloat(e.target.value);
    });
  }
  if (runeSlider) {
    runeSlider.addEventListener('input', (e) => {
      ring3d.runeCount = parseInt(e.target.value, 10);
    });
  }
}

// ── Navigation smooth scroll ──

function initNavigation() {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Nav background on scroll
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.borderBottomColor = 'rgba(239, 191, 4, 0.3)';
      nav.style.background = 'rgba(10, 5, 16, 0.95)';
    } else {
      nav.style.borderBottomColor = 'rgba(239, 191, 4, 0.15)';
      nav.style.background = 'rgba(10, 5, 16, 0.85)';
    }
  });
}

// ── Main Initialization ──

document.addEventListener('DOMContentLoaded', () => {
  // Starfield background (CAT33)
  const starCanvas = document.getElementById('starfield-canvas');
  const starfield = new Starfield(starCanvas);

  // Magic particles overlay (CAT16)
  const particleCanvas = document.getElementById('particle-canvas');
  const particles = new MagicParticles(particleCanvas);

  // 3D Ring (CAT36)
  const ringCanvas = document.getElementById('ring-3d-canvas');
  let ring3d = null;
  if (ringCanvas) {
    ringCanvas.width = 500;
    ringCanvas.height = 500;
    ring3d = new Ring3D(ringCanvas);
    initRingControls(ring3d);
  }

  // Puzzle board
  const puzzleContainer = document.querySelector('.puzzle-board');
  if (puzzleContainer) {
    new PuzzleBoard(puzzleContainer);
  }

  // Animation loop
  function loop(time) {
    starfield.draw(time);
    particles.draw(time);
    if (ring3d) ring3d.draw(time);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // UI animations
  animateHeroCards();
  initScrollAnimations();
  animateCounters();
  animateProgressBar();
  initNavigation();
});
