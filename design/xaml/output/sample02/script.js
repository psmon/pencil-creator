/* ============================================
   AI Components Sample Page — script.js
   WAAPI + SVG + Canvas Animation Engine
   ============================================ */

// ── Global Config ──
const CONFIG = {
  lineCount: 60,
  speed: 1.0,
  staggerDelay: 40,
  activeColor: '#E4324F',
  inactiveColor: '#D8D8D8',
  midColors: ['#E55A71', '#DB1E3E'],
  duration: 3500,
  pathLength: 20.25,
  strokeWidth: 4,
  innerRadius: 105.75,
  outerRadius: 126,
  easing: 'cubic-bezier(0.333, 0, 0.667, 1)'
};

// ── Utility ──
function lerp(a, b, t) { return a + (b - a) * t; }
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// ============================================
// Section 1: Core Radial Voice Wave
// ============================================
class RadialVoiceWave {
  constructor(svgEl, config = CONFIG) {
    this.svg = svgEl;
    this.config = { ...config };
    this.lines = [];
    this.animations = [];
    this.running = true;
    this.build();
    this.animate();
  }

  build() {
    this.svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const cx = 200, cy = 200;

    // Guide rings
    [160, 120, 80].forEach((r, i) => {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', `rgba(30,41,59,${0.3 - i * 0.08})`);
      circle.setAttribute('stroke-width', '1');
      this.svg.appendChild(circle);
    });

    // Center glow
    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'radialGradient');
    grad.id = 'centerGlow';
    const s1 = document.createElementNS(ns, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', this.config.activeColor);
    s1.setAttribute('stop-opacity', '0.6');
    const s2 = document.createElementNS(ns, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', this.config.activeColor);
    s2.setAttribute('stop-opacity', '0');
    grad.append(s1, s2);
    defs.appendChild(grad);
    this.svg.appendChild(defs);

    const glowCircle = document.createElementNS(ns, 'circle');
    glowCircle.setAttribute('cx', cx);
    glowCircle.setAttribute('cy', cy);
    glowCircle.setAttribute('r', '18');
    glowCircle.setAttribute('fill', 'url(#centerGlow)');
    this.svg.appendChild(glowCircle);
    this.glowCircle = glowCircle;

    // Radial lines
    this.lines = [];
    for (let i = 0; i < this.config.lineCount; i++) {
      const angle = (i * (360 / this.config.lineCount)) * Math.PI / 180;
      const x1 = cx + Math.sin(angle) * this.config.innerRadius;
      const y1 = cy - Math.cos(angle) * this.config.innerRadius;
      const x2 = cx + Math.sin(angle) * this.config.outerRadius;
      const y2 = cy - Math.cos(angle) * this.config.outerRadius;

      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', this.config.inactiveColor);
      line.setAttribute('stroke-width', this.config.strokeWidth);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', this.config.pathLength);
      line.setAttribute('stroke-dashoffset', '18.225');
      this.svg.appendChild(line);
      this.lines.push(line);
    }
  }

  animate() {
    this.stopAnimations();
    this.animations = [];
    const totalDuration = this.config.duration / this.config.speed;

    this.lines.forEach((line, i) => {
      const delay = (i * this.config.staggerDelay) / this.config.speed;

      // Trim Path animation
      const trimAnim = line.animate([
        { strokeDashoffset: '18.225' },
        { strokeDashoffset: '0.2025', offset: 0.48 },
        { strokeDashoffset: '18.225' }
      ], {
        duration: totalDuration,
        delay: delay,
        iterations: Infinity,
        easing: this.config.easing
      });

      // Color cascade
      const colorAnim = line.animate([
        { stroke: this.config.inactiveColor },
        { stroke: this.config.midColors[0], offset: 0.28 },
        { stroke: this.config.midColors[1], offset: 0.42 },
        { stroke: this.config.activeColor, offset: 0.5 },
        { stroke: this.config.midColors[1], offset: 0.58 },
        { stroke: this.config.midColors[0], offset: 0.72 },
        { stroke: this.config.inactiveColor }
      ], {
        duration: totalDuration,
        delay: delay,
        iterations: Infinity,
        easing: this.config.easing
      });

      this.animations.push(trimAnim, colorAnim);
    });

    // Glow breathing
    if (this.glowCircle) {
      const glowAnim = this.glowCircle.animate([
        { r: '14', opacity: 0.4 },
        { r: '22', opacity: 0.8 },
        { r: '14', opacity: 0.4 }
      ], {
        duration: totalDuration * 0.8,
        iterations: Infinity,
        easing: 'ease-in-out'
      });
      this.animations.push(glowAnim);
    }
  }

  stopAnimations() {
    this.animations.forEach(a => a.cancel());
    this.animations = [];
  }

  updateConfig(key, value) {
    this.config[key] = value;
    if (key === 'lineCount' || key === 'activeColor' || key === 'inactiveColor') {
      this.build();
    }
    this.animate();
  }

  destroy() {
    this.stopAnimations();
    this.svg.innerHTML = '';
  }
}

// ============================================
// Section 2: Variant Waves
// ============================================
class GlowPulseWave {
  constructor(svgEl) {
    this.svg = svgEl;
    this.build();
  }

  build() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg.innerHTML = '';
    const cx = 160, cy = 100;

    const defs = document.createElementNS(ns, 'defs');
    // Glow gradient
    const g1 = document.createElementNS(ns, 'radialGradient');
    g1.id = 'glowGrad';
    ['#A855F7', '#A855F700'].forEach((c, i) => {
      const s = document.createElementNS(ns, 'stop');
      s.setAttribute('offset', i === 0 ? '0%' : '100%');
      s.setAttribute('stop-color', c);
      g1.appendChild(s);
    });
    defs.appendChild(g1);
    this.svg.appendChild(defs);

    // Outer glow
    const outerGlow = document.createElementNS(ns, 'circle');
    outerGlow.setAttribute('cx', cx);
    outerGlow.setAttribute('cy', cy);
    outerGlow.setAttribute('r', '70');
    outerGlow.setAttribute('fill', 'url(#glowGrad)');
    outerGlow.setAttribute('opacity', '0.3');
    this.svg.appendChild(outerGlow);

    outerGlow.animate([
      { opacity: 0.2, r: '60' },
      { opacity: 0.5, r: '80' },
      { opacity: 0.2, r: '60' }
    ], { duration: 2400, iterations: Infinity, easing: 'ease-in-out' });

    // Mini radial lines (24)
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15) * Math.PI / 180;
      const r1 = 35, r2 = 50;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx + Math.sin(angle) * r1);
      line.setAttribute('y1', cy - Math.cos(angle) * r1);
      line.setAttribute('x2', cx + Math.sin(angle) * r2);
      line.setAttribute('y2', cy - Math.cos(angle) * r2);
      line.setAttribute('stroke', '#A855F7');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', '15');
      line.setAttribute('opacity', '0.5');
      this.svg.appendChild(line);

      line.animate([
        { strokeDashoffset: '13', opacity: 0.3 },
        { strokeDashoffset: '0', opacity: 0.8 },
        { strokeDashoffset: '13', opacity: 0.3 }
      ], { duration: 2000, delay: i * 60, iterations: Infinity, easing: 'cubic-bezier(0.33,0,0.67,1)' });
    }

    // Center dot
    const center = document.createElementNS(ns, 'circle');
    center.setAttribute('cx', cx);
    center.setAttribute('cy', cy);
    center.setAttribute('r', '6');
    center.setAttribute('fill', '#E4324F');
    this.svg.appendChild(center);
    center.animate([
      { r: '4', opacity: 0.6 },
      { r: '8', opacity: 1 },
      { r: '4', opacity: 0.6 }
    ], { duration: 1200, iterations: Infinity, easing: 'ease-in-out' });
  }
}

class ParticleVoiceField {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.particles = [];
    this.waveLines = [];
    this.init();
    this.loop();
  }

  init() {
    this.canvas.width = this.canvas.offsetWidth * 2;
    this.canvas.height = this.canvas.offsetHeight * 2;
    this.ctx.scale(2, 2);
    const w = this.canvas.offsetWidth, h = this.canvas.offsetHeight;

    // Particles
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
        opacity: 0,
        targetOpacity: Math.random() * 0.5 + 0.2,
        color: ['#22D3EE', '#A855F7', '#4ECDC4'][Math.floor(Math.random() * 3)]
      });
    }

    // Wave lines (16)
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 16; i++) {
      const angle = (i * 22.5) * Math.PI / 180;
      this.waveLines.push({
        angle, cx, cy, r1: 25, r2: 40,
        phase: i * 0.15, strokeWidth: 2
      });
    }
  }

  loop() {
    const w = this.canvas.offsetWidth, h = this.canvas.offsetHeight;
    this.ctx.clearRect(0, 0, w, h);
    const t = performance.now() / 1000;

    // Draw particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.opacity = lerp(p.opacity, p.targetOpacity, 0.02);

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
    });

    // Draw wave
    this.waveLines.forEach(wl => {
      const pulse = Math.sin(t * 2.5 + wl.phase) * 0.5 + 0.5;
      const r2 = wl.r1 + (wl.r2 - wl.r1) * pulse;
      const x1 = wl.cx + Math.sin(wl.angle) * wl.r1;
      const y1 = wl.cy - Math.cos(wl.angle) * wl.r1;
      const x2 = wl.cx + Math.sin(wl.angle) * r2;
      const y2 = wl.cy - Math.cos(wl.angle) * r2;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = '#22D3EE';
      this.ctx.globalAlpha = 0.3 + pulse * 0.4;
      this.ctx.lineWidth = wl.strokeWidth;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    });

    // Center dot
    this.ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
    this.ctx.beginPath();
    this.ctx.arc(w / 2, h / 2, 5 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
    const cGrad = this.ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 8);
    cGrad.addColorStop(0, '#E4324F');
    cGrad.addColorStop(1, 'rgba(228,50,79,0)');
    this.ctx.fillStyle = cGrad;
    this.ctx.fill();

    this.ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.loop());
  }
}

class MorphingSpectrumWave {
  constructor(svgEl) {
    this.svg = svgEl;
    this.build();
  }

  build() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg.innerHTML = '';
    const cx = 160, cy = 100;

    const defs = document.createElementNS(ns, 'defs');
    // Multi-color gradient
    const bg = document.createElementNS(ns, 'linearGradient');
    bg.id = 'morphBg';
    bg.setAttribute('x1', '0%'); bg.setAttribute('y1', '0%');
    bg.setAttribute('x2', '100%'); bg.setAttribute('y2', '100%');
    [{c:'#0A0F1C',o:0},{c:'#1A0A2E',o:1}].forEach(({c,o}) => {
      const s = document.createElementNS(ns, 'stop');
      s.setAttribute('offset', o*100+'%');
      s.setAttribute('stop-color', c);
      bg.appendChild(s);
    });
    defs.appendChild(bg);
    this.svg.appendChild(defs);

    // Background rect
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', '320');
    rect.setAttribute('height', '200');
    rect.setAttribute('fill', 'url(#morphBg)');
    this.svg.appendChild(rect);

    // Morphing rings
    const colors = ['#A855F7', '#E4324F', '#22D3EE'];
    const radii = [55, 40, 25];

    colors.forEach((color, idx) => {
      const ring = document.createElementNS(ns, 'ellipse');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('rx', radii[idx]);
      ring.setAttribute('ry', radii[idx]);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', color);
      ring.setAttribute('stroke-width', '1');
      ring.setAttribute('opacity', '0.4');
      this.svg.appendChild(ring);

      // Morph animation
      ring.animate([
        { rx: radii[idx], ry: radii[idx], opacity: 0.3 },
        { rx: radii[idx] * 1.3, ry: radii[idx] * 0.7, opacity: 0.6 },
        { rx: radii[idx] * 0.8, ry: radii[idx] * 1.2, opacity: 0.4 },
        { rx: radii[idx], ry: radii[idx], opacity: 0.3 }
      ], { duration: 4000 + idx * 800, iterations: Infinity, easing: 'ease-in-out' });
    });

    // Radial lines (20) with spectrum colors
    for (let i = 0; i < 20; i++) {
      const angle = (i * 18) * Math.PI / 180;
      const r1 = 18, r2 = 30;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx + Math.sin(angle) * r1);
      line.setAttribute('y1', cy - Math.cos(angle) * r1);
      line.setAttribute('x2', cx + Math.sin(angle) * r2);
      line.setAttribute('y2', cy - Math.cos(angle) * r2);
      const hue = (i / 20) * 60 + 280;
      line.setAttribute('stroke', `hsl(${hue}, 70%, 60%)`);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', '12');
      this.svg.appendChild(line);

      line.animate([
        { strokeDashoffset: '10.8', opacity: 0.3 },
        { strokeDashoffset: '0', opacity: 0.7 },
        { strokeDashoffset: '10.8', opacity: 0.3 }
      ], { duration: 2800, delay: i * 80, iterations: Infinity, easing: 'cubic-bezier(0.33,0,0.67,1)' });
    }

    // Center gradient
    const cGrad = document.createElementNS(ns, 'radialGradient');
    cGrad.id = 'morphCenter';
    [{c:'#A855F7',o:0},{c:'#E4324F',o:50},{c:'#22D3EE',o:100}].forEach(({c,o}) => {
      const s = document.createElementNS(ns, 'stop');
      s.setAttribute('offset', o+'%');
      s.setAttribute('stop-color', c);
      s.setAttribute('stop-opacity', o === 100 ? '0' : '1');
      cGrad.appendChild(s);
    });
    defs.appendChild(cGrad);

    const cCircle = document.createElementNS(ns, 'circle');
    cCircle.setAttribute('cx', cx);
    cCircle.setAttribute('cy', cy);
    cCircle.setAttribute('r', '8');
    cCircle.setAttribute('fill', 'url(#morphCenter)');
    this.svg.appendChild(cCircle);
    cCircle.animate([
      { r: '6', opacity: 0.5 },
      { r: '10', opacity: 0.9 },
      { r: '6', opacity: 0.5 }
    ], { duration: 2000, iterations: Infinity, easing: 'ease-in-out' });
  }
}

// ============================================
// Section 3: Chatbot Wave States
// ============================================
class ChatbotWave {
  constructor(svgEl) {
    this.svg = svgEl;
    this.state = 'idle';
    this.animations = [];
    this.build();
    this.setState('processing');
  }

  build() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg.innerHTML = '';
    const cx = 18, cy = 18;
    this.lines = [];

    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const r1 = 8, r2 = 14;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx + Math.sin(angle) * r1);
      line.setAttribute('y1', cy - Math.cos(angle) * r1);
      line.setAttribute('x2', cx + Math.sin(angle) * r2);
      line.setAttribute('y2', cy - Math.cos(angle) * r2);
      line.setAttribute('stroke', CONFIG.inactiveColor);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', '6');
      line.setAttribute('stroke-dashoffset', '5.4');
      this.svg.appendChild(line);
      this.lines.push(line);
    }
  }

  setState(state) {
    this.state = state;
    this.animations.forEach(a => a.cancel());
    this.animations = [];

    const params = {
      idle: { duration: 6000, stagger: 200, color: '#A855F7', dashRange: ['5', '4'] },
      processing: { duration: 2000, stagger: 80, color: CONFIG.activeColor, dashRange: ['5.4', '0.6'] },
      speaking: { duration: 1200, stagger: 40, color: CONFIG.activeColor, dashRange: ['5.4', '0'] },
      complete: { duration: 3000, stagger: 100, color: '#71717A', dashRange: ['5.4', '4.8'] }
    }[state];

    this.lines.forEach((line, i) => {
      const a1 = line.animate([
        { strokeDashoffset: params.dashRange[0] },
        { strokeDashoffset: params.dashRange[1], offset: 0.5 },
        { strokeDashoffset: params.dashRange[0] }
      ], { duration: params.duration, delay: i * params.stagger, iterations: Infinity, easing: 'cubic-bezier(0.33,0,0.67,1)' });

      const a2 = line.animate([
        { stroke: CONFIG.inactiveColor },
        { stroke: params.color, offset: 0.5 },
        { stroke: CONFIG.inactiveColor }
      ], { duration: params.duration, delay: i * params.stagger, iterations: Infinity, easing: 'cubic-bezier(0.33,0,0.67,1)' });

      this.animations.push(a1, a2);
    });
  }
}

// ============================================
// Section 4: Agent Console Real-time Wave
// ============================================
class AgentRealtimeWave {
  constructor(svgEl) {
    this.svg = svgEl;
    this.build();
  }

  build() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg.innerHTML = '';
    const cx = 140, cy = 50;

    // Mini voice wave (16 lines)
    for (let i = 0; i < 16; i++) {
      const angle = (i * 22.5) * Math.PI / 180;
      const r1 = 15, r2 = 28;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx + Math.sin(angle) * r1);
      line.setAttribute('y1', cy - Math.cos(angle) * r1);
      line.setAttribute('x2', cx + Math.sin(angle) * r2);
      line.setAttribute('y2', cy - Math.cos(angle) * r2);
      line.setAttribute('stroke', '#22D3EE');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', '13');
      this.svg.appendChild(line);

      line.animate([
        { strokeDashoffset: '11.7', opacity: 0.2 },
        { strokeDashoffset: '1.3', opacity: 0.7, offset: 0.5 },
        { strokeDashoffset: '11.7', opacity: 0.2 }
      ], { duration: 2500, delay: i * 60, iterations: Infinity, easing: 'cubic-bezier(0.33,0,0.67,1)' });
    }

    // Center
    const center = document.createElementNS(ns, 'circle');
    center.setAttribute('cx', cx);
    center.setAttribute('cy', cy);
    center.setAttribute('r', '5');
    center.setAttribute('fill', '#E4324F');
    this.svg.appendChild(center);
    center.animate([
      { r: '3', opacity: 0.4 },
      { r: '6', opacity: 0.8 },
      { r: '3', opacity: 0.4 }
    ], { duration: 1800, iterations: Infinity, easing: 'ease-in-out' });
  }
}

// ============================================
// Section 5: Data Center Diagram Animations
// ============================================
class DataCenterAnimations {
  constructor(container) {
    this.container = container;
    this.setupPathAnimations();
    this.setupNodePulse();
    this.setupEventBusFlow();
    this.setupWaveStatus();
  }

  setupPathAnimations() {
    const paths = this.container.querySelectorAll('.dc-connection line');
    paths.forEach((line, i) => {
      const length = Math.sqrt(
        Math.pow(parseFloat(line.getAttribute('x2') || 0) - parseFloat(line.getAttribute('x1') || 0), 2) +
        Math.pow(parseFloat(line.getAttribute('y2') || 0) - parseFloat(line.getAttribute('y1') || 0), 2)
      );
      line.setAttribute('stroke-dasharray', `${length}`);
      line.animate([
        { strokeDashoffset: `${length}` },
        { strokeDashoffset: '0' }
      ], { duration: 2000 + i * 300, iterations: Infinity, easing: 'ease-in-out', direction: 'alternate' });
    });
  }

  setupNodePulse() {
    this.container.querySelectorAll('.dc-node').forEach((node, i) => {
      node.animate([
        { boxShadow: '0 0 0px rgba(168,85,247,0)' },
        { boxShadow: `0 0 20px ${node.dataset.glow || 'rgba(168,85,247,0.3)'}` },
        { boxShadow: '0 0 0px rgba(168,85,247,0)' }
      ], { duration: 3000 + i * 500, iterations: Infinity, easing: 'ease-in-out' });
    });
  }

  setupEventBusFlow() {
    const bus = this.container.querySelector('.dc-event-bus');
    if (!bus) return;
    // Pulse border
    bus.animate([
      { borderColor: 'rgba(245,158,11,0.2)' },
      { borderColor: 'rgba(245,158,11,0.5)' },
      { borderColor: 'rgba(245,158,11,0.2)' }
    ], { duration: 2000, iterations: Infinity, easing: 'ease-in-out' });
  }

  setupWaveStatus() {
    const waveEl = this.container.querySelector('.dc-wave-svg');
    if (!waveEl) return;
    const ns = 'http://www.w3.org/2000/svg';
    const cx = 20, cy = 20;

    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * Math.PI / 180;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx + Math.sin(angle) * 8);
      line.setAttribute('y1', cy - Math.cos(angle) * 8);
      line.setAttribute('x2', cx + Math.sin(angle) * 16);
      line.setAttribute('y2', cy - Math.cos(angle) * 16);
      line.setAttribute('stroke', '#E4324F');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', '8');
      waveEl.appendChild(line);

      line.animate([
        { strokeDashoffset: '7', opacity: 0.2 },
        { strokeDashoffset: '0', opacity: 0.7, offset: 0.5 },
        { strokeDashoffset: '7', opacity: 0.2 }
      ], { duration: 2000, delay: i * 100, iterations: Infinity, easing: 'cubic-bezier(0.33,0,0.67,1)' });
    }

    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', cx);
    dot.setAttribute('cy', cy);
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', '#E4324F');
    waveEl.appendChild(dot);
  }
}

// ============================================
// Particle Dots for Data Center connections
// ============================================
class ConnectionParticles {
  constructor(canvasEl, container) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.container = container;
    this.particles = [];
    this.init();
    this.loop();
  }

  init() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * 2;
    this.canvas.height = rect.height * 2;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(2, 2);
    this.w = rect.width;
    this.h = rect.height;

    // Connection paths (simplified vertical flows)
    const paths = [
      { x: 260, y1: 110, y2: 190, color: '#A855F7' },
      { x: 600, y1: 110, y2: 190, color: '#A855F7' },
      { x: 940, y1: 110, y2: 190, color: '#F59E0B' },
      { x: 230, y1: 220, y2: 300, color: '#22D3EE' },
      { x: 600, y1: 220, y2: 300, color: '#22D3EE' },
      { x: 870, y1: 220, y2: 300, color: '#22D3EE' },
      { x: 230, y1: 370, y2: 430, color: '#E4324F' },
      { x: 550, y1: 370, y2: 430, color: '#A855F7' },
      { x: 870, y1: 370, y2: 430, color: '#4ECDC4' }
    ];

    paths.forEach(p => {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: p.x,
          y: p.y1,
          yEnd: p.y2,
          yStart: p.y1,
          speed: 0.3 + Math.random() * 0.3,
          r: 2,
          color: p.color,
          opacity: 0
        });
      }
    });
  }

  loop() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    this.particles.forEach(p => {
      p.y += p.speed;
      if (p.y > p.yEnd) {
        p.y = p.yStart;
        p.opacity = 0;
      }

      const progress = (p.y - p.yStart) / (p.yEnd - p.yStart);
      p.opacity = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity * 0.6;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });

    requestAnimationFrame(() => this.loop());
  }
}

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Section 1: Core Voice Wave
  const coreWaveSvg = document.getElementById('coreWaveSvg');
  if (coreWaveSvg) {
    window.coreWave = new RadialVoiceWave(coreWaveSvg);
  }

  // Controls
  const bindSlider = (id, configKey, format) => {
    const slider = document.getElementById(id);
    const display = document.getElementById(id + 'Val');
    if (!slider || !display) return;
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      display.textContent = format(val);
      window.coreWave?.updateConfig(configKey, val);
    });
  };

  bindSlider('lineCount', 'lineCount', v => v);
  bindSlider('speed', 'speed', v => v.toFixed(1) + 'x');
  bindSlider('stagger', 'staggerDelay', v => v + 'ms');

  const colorPicker = document.getElementById('activeColor');
  const colorVal = document.getElementById('activeColorVal');
  if (colorPicker) {
    colorPicker.addEventListener('input', () => {
      colorVal.textContent = colorPicker.value.toUpperCase();
      colorVal.style.color = colorPicker.value;
      window.coreWave?.updateConfig('activeColor', colorPicker.value);
    });
  }

  // Section 2: Variants
  const glowSvg = document.getElementById('glowWaveSvg');
  if (glowSvg) new GlowPulseWave(glowSvg);

  const particleCanvas = document.getElementById('particleCanvas');
  if (particleCanvas) new ParticleVoiceField(particleCanvas);

  const morphSvg = document.getElementById('morphWaveSvg');
  if (morphSvg) new MorphingSpectrumWave(morphSvg);

  // Section 3: Chatbot Wave
  const chatWaveSvg = document.getElementById('chatWaveSvg');
  let chatbotWave;
  if (chatWaveSvg) {
    chatbotWave = new ChatbotWave(chatWaveSvg);
  }

  // State switcher
  document.querySelectorAll('.state-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.state-item').forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const state = item.dataset.state;
      chatbotWave?.setState(state);
      // Update wave indicator text
      const labels = {
        idle: 'AI가 대기 중입니다...',
        processing: 'AI가 응답을 생성하고 있습니다...',
        speaking: 'AI가 음성으로 응답하고 있습니다...',
        complete: '응답이 완료되었습니다.'
      };
      const waveLabel = document.querySelector('.chat-msg__wave-indicator span');
      if (waveLabel) waveLabel.textContent = labels[state];
    });
  });

  // Section 4: Agent Console
  const agentWaveSvg = document.getElementById('agentWaveSvg');
  if (agentWaveSvg) new AgentRealtimeWave(agentWaveSvg);

  // Sentiment bar animation
  const sentimentBar = document.querySelector('.emotion-bar__fill');
  if (sentimentBar) {
    let sentimentVal = 78;
    const sentimentDisplay = document.querySelector('.emotion-bar__val');
    setInterval(() => {
      sentimentVal = Math.max(20, Math.min(95, sentimentVal + (Math.random() - 0.45) * 8));
      sentimentBar.style.width = sentimentVal + '%';
      if (sentimentDisplay) {
        sentimentDisplay.textContent = `불만 ${Math.round(sentimentVal)}%`;
        sentimentDisplay.style.color = sentimentVal > 60 ? '#E4324F' : sentimentVal > 40 ? '#F59E0B' : '#4ADE80';
      }
    }, 2000);
  }

  // Section 5: Data Center
  const dcContainer = document.getElementById('datacenterDiagram');
  if (dcContainer) {
    new DataCenterAnimations(dcContainer);
    const dcCanvas = document.getElementById('dcParticleCanvas');
    if (dcCanvas) new ConnectionParticles(dcCanvas, dcContainer);
  }

  // Intersection Observer for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section').forEach(sec => {
    sec.style.opacity = '0';
    sec.style.transform = 'translateY(30px)';
    sec.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(sec);
  });
});
