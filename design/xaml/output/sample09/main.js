'use strict';

const mount = document.getElementById('pixi-root');

const palette = {
  ink: 0x090812,
  void: 0x11101c,
  panel: 0x161827,
  panel2: 0x202238,
  line: 0x3c4165,
  text: 0xf8fafc,
  dim: 0x8992b3,
  purple: 0xa855f7,
  cyan: 0x22d3ee,
  red: 0xe4324f,
  amber: 0xf59e0b,
  green: 0x4ade80,
  pink: 0xf43f5e,
  white: 0xffffff,
};

const modes = [
  { id: 'core', label: 'CORE WAVE', accent: palette.purple },
  { id: 'chat', label: 'CHATBOT', accent: palette.cyan },
  { id: 'agent', label: 'AGENT OPS', accent: palette.amber },
  { id: 'data', label: 'DATA CENTER', accent: palette.green },
];

const state = {
  mode: 0,
  voice: 0.74,
  speed: 1,
  scan: true,
  noise: true,
  messageStep: 0,
  lastLayoutKey: '',
  textDirty: true,
  textTimer: 0,
  pointer: { x: 0, y: 0 },
};

const hitAreas = [];
const stars = [];
const particles = [];
const textRefs = {};

let app;
let bg;
let wave;
let ui;
let textLayer;
let overlay;

const fontBase = {
  fontFamily: '"Cascadia Mono", Consolas, "Courier New", monospace',
  fill: palette.text,
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function snap(v) {
  return Math.round(v / 4) * 4;
}

function colorMix(c1, c2, t) {
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return (r << 16) + (g << 8) + b;
}

function addText(key, text, x, y, size = 12, color = palette.text, weight = '400') {
  let node = textRefs[key];
  if (!node) {
    node = new PIXI.Text({
      text,
      style: {
        ...fontBase,
        fontSize: size,
        fill: color,
        fontWeight: weight,
        letterSpacing: 0,
      },
    });
    node.roundPixels = true;
    textLayer.addChild(node);
    textRefs[key] = node;
  }
  node.text = text;
  node.style.fontSize = size;
  node.style.fill = color;
  node.style.fontWeight = weight;
  node.position.set(snap(x), snap(y));
  node.visible = true;
  return node;
}

function hideUnusedText(activeKeys) {
  const active = new Set(activeKeys);
  Object.entries(textRefs).forEach(([key, node]) => {
    node.visible = active.has(key);
  });
}

function rect(g, x, y, w, h, color, alpha = 1) {
  g.rect(snap(x), snap(y), snap(w), snap(h)).fill({ color, alpha });
}

function strokeRect(g, x, y, w, h, color, width = 2, alpha = 1) {
  g.rect(snap(x), snap(y), snap(w), snap(h)).stroke({ color, width, alpha });
}

function pixelPanel(g, x, y, w, h, accent = palette.cyan, title = '') {
  rect(g, x, y, w, h, palette.panel, 0.94);
  rect(g, x + 4, y + 4, w - 8, h - 8, palette.void, 0.58);
  strokeRect(g, x, y, w, h, palette.line, 2, 0.9);
  rect(g, x, y, w, 4, accent, 0.76);
  rect(g, x, y + h - 4, w, 4, 0x000000, 0.18);
  rect(g, x + w - 12, y + 8, 4, 4, accent, 0.9);
  rect(g, x + w - 20, y + 8, 4, 4, accent, 0.52);
  if (title) rect(g, x + 12, y + 14, 34, 4, accent, 0.7);
}

function pixelButton(g, id, x, y, w, h, label, active, accent, activeKeys, index) {
  rect(g, x, y, w, h, active ? accent : palette.panel2, active ? 0.92 : 0.82);
  strokeRect(g, x, y, w, h, active ? palette.white : palette.line, 2, active ? 0.58 : 0.9);
  rect(g, x + 4, y + h - 6, w - 8, 2, 0x000000, 0.28);
  const key = `btn-${id}`;
  addText(key, label, x + 12, y + 9, 11, active ? palette.ink : palette.text, '700');
  activeKeys.push(key);
  hitAreas.push({ id, x, y, w, h, index });
}

function gauge(g, x, y, w, h, value, color) {
  rect(g, x, y, w, h, palette.void, 1);
  strokeRect(g, x, y, w, h, palette.line, 2, 0.8);
  const blocks = Math.floor((w - 8) / 10);
  const lit = Math.round(blocks * clamp(value, 0, 1));
  for (let i = 0; i < blocks; i += 1) {
    rect(g, x + 4 + i * 10, y + 4, 7, h - 8, i < lit ? color : palette.panel2, i < lit ? 0.95 : 0.55);
  }
}

function setMode(index) {
  state.mode = index;
  state.textDirty = true;
}

function nudgeVoice(delta) {
  state.voice = clamp(state.voice + delta, 0.2, 1.25);
  state.textDirty = true;
}

function seedField() {
  stars.length = 0;
  particles.length = 0;
  for (let i = 0; i < 130; i += 1) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 1.2 + 0.2,
      tw: Math.random() * Math.PI * 2,
    });
  }
  for (let i = 0; i < 54; i += 1) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      s: 3 + Math.floor(Math.random() * 3) * 2,
      c: [palette.cyan, palette.purple, palette.red, palette.green][i % 4],
      p: Math.random() * Math.PI * 2,
    });
  }
}

function drawBackground(time) {
  const w = app.renderer.width;
  const h = app.renderer.height;
  bg.clear();
  rect(bg, 0, 0, w, h, palette.ink, 1);

  for (let y = 0; y < h; y += 24) {
    rect(bg, 0, y, w, 1, palette.panel2, 0.35);
  }
  for (let x = 0; x < w; x += 24) {
    rect(bg, x, 0, 1, h, palette.panel2, 0.22);
  }

  stars.forEach((s, i) => {
    const drift = time * 0.000018 * s.z;
    const x = ((s.x + drift) % 1) * w;
    const y = s.y * h;
    const pulse = 0.35 + Math.sin(time * 0.003 + s.tw) * 0.22;
    const color = i % 7 === 0 ? palette.cyan : i % 11 === 0 ? palette.purple : palette.dim;
    rect(bg, x, y, s.z > 1 ? 4 : 2, s.z > 1 ? 4 : 2, color, clamp(pulse, 0.12, 0.7));
  });
}

function drawShell(time) {
  const w = app.renderer.width;
  const h = app.renderer.height;
  const activeKeys = [];
  hitAreas.length = 0;
  ui.clear();
  overlay.clear();

  const accent = modes[state.mode].accent;
  pixelPanel(ui, 24, 20, w - 48, 84, accent);
  rect(ui, 44, 78, 210, 4, accent, 0.85);
  addText('titleA', 'PIXEL VOICE LAB', 44, 34, 24, palette.text, '800');
  addText('titleB', 'sample02 AI Voice Components -> PixiJS pixel-art UI reconstruction', 44, 68, 12, palette.dim, '600');
  addText('modeName', modes[state.mode].label, w - 232, 38, 18, accent, '800');
  addText('clock', `TICK ${Math.floor(time / 100) % 10000}`.padStart(9, '0'), w - 232, 68, 11, palette.dim, '600');
  activeKeys.push('titleA', 'titleB', 'modeName', 'clock');

  const navY = 128;
  modes.forEach((m, i) => {
    pixelButton(ui, `mode-${i}`, 24, navY + i * 52, 178, 38, `${String(i + 1).padStart(2, '0')} ${m.label}`, state.mode === i, m.accent, activeKeys, i);
  });

  pixelPanel(ui, 24, h - 188, 178, 164, accent);
  addText('ctrlTitle', 'PIXEL PARAMS', 40, h - 168, 12, accent, '800');
  addText('ctrlVoice', `VOICE LV ${Math.round(state.voice * 100)}%`, 40, h - 140, 11, palette.text, '700');
  gauge(ui, 40, h - 116, 146, 22, state.voice / 1.25, accent);
  pixelButton(ui, 'voice-down', 40, h - 82, 42, 30, '-LV', false, palette.panel2, activeKeys);
  pixelButton(ui, 'voice-up', 90, h - 82, 42, 30, '+LV', false, accent, activeKeys);
  pixelButton(ui, 'scan', 140, h - 82, 46, 30, state.scan ? 'SCAN' : 'OFF', state.scan, palette.green, activeKeys);
  pixelButton(ui, 'noise', 40, h - 44, 146, 26, state.noise ? 'CRT NOISE ON' : 'CRT NOISE OFF', state.noise, palette.pink, activeKeys);
  activeKeys.push('ctrlTitle', 'ctrlVoice');

  const contentX = 224;
  const contentY = 128;
  const contentW = w - contentX - 24;
  const contentH = h - contentY - 24;
  pixelPanel(ui, contentX, contentY, contentW, contentH, accent);

  if (state.mode === 0) drawCore(contentX, contentY, contentW, contentH, time, activeKeys);
  if (state.mode === 1) drawChat(contentX, contentY, contentW, contentH, time, activeKeys);
  if (state.mode === 2) drawAgent(contentX, contentY, contentW, contentH, time, activeKeys);
  if (state.mode === 3) drawDataCenter(contentX, contentY, contentW, contentH, time, activeKeys);

  if (state.noise) {
    for (let y = 0; y < h; y += 6) {
      rect(overlay, 0, y, w, 2, palette.white, y % 18 === 0 ? 0.045 : 0.018);
    }
    for (let i = 0; i < 80; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      rect(overlay, x, y, 2, 2, palette.white, 0.09);
    }
  }

  hideUnusedText(activeKeys);
}

function drawRadialPixelWave(g, cx, cy, radius, lines, time, accent, block = 6) {
  for (let i = 0; i < lines; i += 1) {
    const a = (i / lines) * Math.PI * 2;
    const wavePhase = (time * 0.0012 * state.speed + i * 0.085) % (Math.PI * 2);
    const amp = (Math.sin(wavePhase) * 0.5 + 0.5) * state.voice;
    const length = 4 + Math.floor(amp * 7);
    for (let j = 0; j < length; j += 1) {
      const r = radius + j * (block + 2);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const t = j / Math.max(1, length - 1);
      const color = colorMix(palette.dim, t > 0.55 ? accent : palette.red, amp);
      rect(g, x, y, block, block, color, 0.35 + amp * 0.58);
    }
  }
  rect(g, cx - 16, cy - 16, 32, 32, palette.void, 1);
  strokeRect(g, cx - 16, cy - 16, 32, 32, accent, 2, 0.9);
  rect(g, cx - 6, cy - 6, 12, 12, palette.red, 0.95);
}

function drawCore(x, y, w, h, time, activeKeys) {
  const accent = palette.purple;
  addText('coreEyebrow', '+ CORE PIXEL COMPONENT', x + 28, y + 28, 12, accent, '800');
  addText('coreTitle', '01  RADIAL VOICE WAVE / PIXEL BLOCK VARIANT', x + 28, y + 54, 20, palette.text, '800');
  addText('coreDesc', '60-line TrimPath wave is rebuilt as square blocks, grid pulses, and palette-cascaded pixels.', x + 28, y + 84, 12, palette.dim, '600');
  activeKeys.push('coreEyebrow', 'coreTitle', 'coreDesc');

  const cx = x + Math.min(360, w * 0.34);
  const cy = y + h * 0.53;
  for (let r = 80; r <= 220; r += 40) {
    strokeRect(ui, cx - r, cy - r, r * 2, r * 2, palette.panel2, 1, 0.36);
  }
  drawRadialPixelWave(wave, cx, cy, 82, 60, time, accent, 6);

  const sx = x + w * 0.58;
  pixelPanel(ui, sx, y + 132, Math.max(300, w * 0.34), 210, accent);
  addText('specTitle', 'ANIMATION SPEC // PIXELIZED', sx + 20, y + 154, 12, accent, '800');
  const rows = [
    ['LINES', '60 BLOCK RAYS'],
    ['DURATION', `${(3.5 / state.speed).toFixed(1)}S LOOP`],
    ['TRIM', '90% -> 1% -> 90%'],
    ['COLOR', 'GRAY -> RED -> PURPLE'],
    ['STAGGER', '40MS / RAY'],
  ];
  rows.forEach((row, i) => {
    addText(`specL${i}`, row[0], sx + 20, y + 186 + i * 28, 11, palette.dim, '700');
    addText(`specR${i}`, row[1], sx + 128, y + 186 + i * 28, 11, i === 2 ? palette.cyan : palette.text, '700');
    activeKeys.push(`specL${i}`, `specR${i}`);
  });
  activeKeys.push('specTitle');

  pixelPanel(ui, sx, y + 368, Math.max(300, w * 0.34), 120, palette.cyan);
  addText('paramTitle', 'REALTIME BLOCK CONTROLS', sx + 20, y + 390, 12, palette.cyan, '800');
  addText('paramA', 'VOICE LEVEL', sx + 20, y + 422, 11, palette.dim, '700');
  gauge(ui, sx + 128, y + 418, 150, 22, state.voice / 1.25, palette.red);
  addText('paramB', 'SCAN MODE', sx + 20, y + 458, 11, palette.dim, '700');
  addText('paramBV', state.scan ? 'ACTIVE GRID OVERLAY' : 'IDLE', sx + 128, y + 458, 11, state.scan ? palette.green : palette.dim, '700');
  activeKeys.push('paramTitle', 'paramA', 'paramB', 'paramBV');
}

function drawChat(x, y, w, h, time, activeKeys) {
  const accent = palette.cyan;
  addText('chatEyebrow', '+ CUSTOMER CHATBOT', x + 28, y + 28, 12, accent, '800');
  addText('chatTitle', '02  PIXEL CHAT ASSISTANT / WAITING RESPONSE STATE', x + 28, y + 54, 20, palette.text, '800');
  addText('chatDesc', 'sample02 chat bubble UX is rebuilt as tile bubbles, mini voice waves, and cursor ticks.', x + 28, y + 84, 12, palette.dim, '600');
  activeKeys.push('chatEyebrow', 'chatTitle', 'chatDesc');

  const chatX = x + 32;
  const chatY = y + 132;
  const chatW = Math.min(560, w * 0.52);
  const chatH = h - 176;
  pixelPanel(ui, chatX, chatY, chatW, chatH, accent);
  rect(ui, chatX + 16, chatY + 18, 20, 20, accent, 0.9);
  addText('chatHeader', 'AI ASSISTANT // ONLINE', chatX + 48, chatY + 20, 13, palette.text, '800');
  activeKeys.push('chatHeader');

  drawBubble(chatX + chatW - 286, chatY + 76, 248, 52, '상품 반품 절차를 알려주세요', palette.cyan, true, 'bubbleUser', activeKeys);
  drawBubble(chatX + 32, chatY + 150, 360, 76, '주문 번호를 확인해 주시면 반품 가능 여부와 수거 일정을 바로 안내합니다.', palette.purple, false, 'bubbleAi', activeKeys);

  const waveY = chatY + 258;
  rect(ui, chatX + 32, waveY, 360, 64, palette.panel2, 0.86);
  strokeRect(ui, chatX + 32, waveY, 360, 64, palette.line, 2, 0.9);
  drawMiniWave(wave, chatX + 72, waveY + 32, time, accent);
  addText('chatTyping', 'AI가 응답을 생성하고 있습니다' + '.'.repeat(1 + Math.floor(time / 350) % 3), chatX + 118, waveY + 22, 12, palette.text, '700');
  activeKeys.push('chatTyping');

  rect(ui, chatX + 32, chatY + chatH - 72, chatW - 64, 38, palette.void, 1);
  strokeRect(ui, chatX + 32, chatY + chatH - 72, chatW - 64, 38, palette.line, 2, 0.9);
  addText('inputHint', '메시지를 입력하세요 _', chatX + 48, chatY + chatH - 60, 12, palette.dim, '700');
  rect(ui, chatX + chatW - 74, chatY + chatH - 64, 26, 22, accent, 0.9);
  activeKeys.push('inputHint');

  const sideX = chatX + chatW + 28;
  pixelPanel(ui, sideX, chatY, w - (sideX - x) - 32, 236, accent);
  addText('statesTitle', 'CHATBOT STATES', sideX + 20, chatY + 22, 12, accent, '800');
  const states = [
    ['IDLE', palette.green, 'slow breathing pixels'],
    ['PROCESSING', palette.purple, 'radial trim pulse'],
    ['SPEAKING', palette.red, 'full cascade output'],
    ['COMPLETE', palette.dim, 'fade-out converge'],
  ];
  states.forEach((s, i) => {
    rect(ui, sideX + 20, chatY + 58 + i * 40, 12, 12, s[1], 0.95);
    addText(`state${i}`, `${s[0]} - ${s[2]}`, sideX + 44, chatY + 54 + i * 40, 11, i === 1 ? palette.text : palette.dim, '700');
    activeKeys.push(`state${i}`);
  });
  activeKeys.push('statesTitle');

  pixelPanel(ui, sideX, chatY + 264, w - (sideX - x) - 32, 164, palette.red);
  addText('techTitle', 'TECHNIQUES USED', sideX + 20, chatY + 286, 12, palette.red, '800');
  ['Pulsing Glow -> pixel halo', 'Trim Path Pulse -> block burst', 'Color Cascade -> palette swap', 'Ripple Effect -> tile flash'].forEach((t, i) => {
    addText(`tech${i}`, t, sideX + 20, chatY + 320 + i * 28, 11, palette.dim, '700');
    activeKeys.push(`tech${i}`);
  });
  activeKeys.push('techTitle');
}

function drawBubble(x, y, w, h, text, color, right, key, activeKeys) {
  rect(ui, x, y, w, h, color, right ? 0.32 : 0.22);
  strokeRect(ui, x, y, w, h, color, 2, 0.82);
  rect(ui, right ? x + w - 18 : x + 10, y + h, 18, 10, color, right ? 0.32 : 0.22);
  addText(key, text, x + 14, y + 16, 12, palette.text, '600');
  activeKeys.push(key);
}

function drawMiniWave(g, cx, cy, time, accent) {
  for (let i = 0; i < 20; i += 1) {
    const a = (i / 20) * Math.PI * 2;
    const amp = 0.5 + Math.sin(time * 0.006 + i * 0.55) * 0.5;
    const r = 16 + amp * 13 * state.voice;
    rect(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, 5, i % 3 === 0 ? palette.red : accent, 0.4 + amp * 0.55);
  }
  rect(g, cx - 5, cy - 5, 10, 10, palette.white, 0.9);
}

function drawAgent(x, y, w, h, time, activeKeys) {
  const accent = palette.amber;
  addText('agentEyebrow', '+ AI AGENT CONSOLE', x + 28, y + 28, 12, accent, '800');
  addText('agentTitle', '03  상담사 AI상담 채팅창 / PIXEL OPERATIONS', x + 28, y + 54, 20, palette.text, '800');
  addText('agentDesc', 'Realtime sentiment, recommendation, and voice-analysis panels are drawn as block UI inside PixiJS.', x + 28, y + 84, 12, palette.dim, '600');
  activeKeys.push('agentEyebrow', 'agentTitle', 'agentDesc');

  const leftW = Math.min(500, w * 0.44);
  pixelPanel(ui, x + 32, y + 132, leftW, h - 176, accent);
  addText('agentChatTitle', 'CUSTOMER #2847 // SENTIMENT: ANGRY', x + 52, y + 154, 12, palette.red, '800');
  activeKeys.push('agentChatTitle');
  drawBubble(x + 64, y + 214, leftW - 108, 64, '배송이 일주일이나 지났는데 아직 안왔어요. 너무 화나네요.', palette.red, false, 'agentMsg1', activeKeys);
  drawBubble(x + 96, y + 302, leftW - 108, 64, '정말 불편을 드려 죄송합니다. 바로 확인해 드리겠습니다.', accent, true, 'agentMsg2', activeKeys);

  const waveX = x + 64;
  const waveY = y + 398;
  rect(ui, waveX, waveY, leftW - 108, 92, palette.void, 1);
  strokeRect(ui, waveX, waveY, leftW - 108, 92, palette.line, 2, 0.88);
  for (let i = 0; i < 36; i += 1) {
    const amp = Math.sin(time * 0.004 + i * 0.42) * 0.5 + 0.5;
    const bh = 12 + amp * 48 * state.voice;
    rect(wave, waveX + 18 + i * 9, waveY + 72 - bh, 5, bh, colorMix(palette.cyan, palette.red, amp), 0.84);
  }
  addText('voiceSignal', 'VOICE EMOTION SIGNAL', waveX + 18, waveY + 16, 11, palette.dim, '700');
  activeKeys.push('voiceSignal');

  const rx = x + leftW + 60;
  const rw = w - leftW - 92;
  pixelPanel(ui, rx, y + 132, rw, 166, palette.red);
  addText('sentTitle', 'SENTIMENT ANALYSIS', rx + 20, y + 154, 12, palette.red, '800');
  addText('sentA', 'ANGER', rx + 20, y + 190, 11, palette.dim, '700');
  gauge(ui, rx + 112, y + 184, rw - 142, 24, 0.82, palette.red);
  addText('sentB', 'URGENCY', rx + 20, y + 230, 11, palette.dim, '700');
  gauge(ui, rx + 112, y + 224, rw - 142, 24, 0.68, palette.amber);
  activeKeys.push('sentTitle', 'sentA', 'sentB');

  pixelPanel(ui, rx, y + 326, rw, 184, palette.green);
  addText('recTitle', 'RECOMMENDED RESPONSE', rx + 20, y + 348, 12, palette.green, '800');
  const recs = ['1. 사과 먼저 출력', '2. 배송 추적 API 조회', '3. 보상 쿠폰 조건 확인', '4. 상담사 승인 후 전송'];
  recs.forEach((r, i) => {
    rect(ui, rx + 20, y + 384 + i * 30, 10, 10, i < 2 ? palette.green : palette.dim, 0.9);
    addText(`rec${i}`, r, rx + 40, y + 378 + i * 30, 11, palette.text, '700');
    activeKeys.push(`rec${i}`);
  });
  activeKeys.push('recTitle');
}

function drawDataCenter(x, y, w, h, time, activeKeys) {
  const accent = palette.green;
  addText('dataEyebrow', '+ DATA CENTER VOICE FIELD', x + 28, y + 28, 12, accent, '800');
  addText('dataTitle', '04  PIXEL SERVER NODES / VOICE WAVE NETWORK', x + 28, y + 54, 20, palette.text, '800');
  addText('dataDesc', 'sample02 data-center diagram becomes a pixel node map with packet pulses and server-rack telemetry.', x + 28, y + 84, 12, palette.dim, '600');
  activeKeys.push('dataEyebrow', 'dataTitle', 'dataDesc');

  const mapX = x + 32;
  const mapY = y + 132;
  const mapW = w - 64;
  const mapH = h - 176;
  pixelPanel(ui, mapX, mapY, mapW, mapH, accent);

  const nodes = [
    [0.16, 0.24, 'CHAT'],
    [0.38, 0.18, 'ASR'],
    [0.62, 0.28, 'LLM'],
    [0.82, 0.22, 'TTS'],
    [0.25, 0.68, 'CRM'],
    [0.52, 0.62, 'VOICE'],
    [0.78, 0.72, 'AGENT'],
  ];

  const pts = nodes.map(([nx, ny, label]) => ({
    x: mapX + nx * mapW,
    y: mapY + ny * mapH,
    label,
  }));

  const edges = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [2, 5], [3, 6]];
  edges.forEach(([a, b], i) => {
    const p1 = pts[a];
    const p2 = pts[b];
    ui.moveTo(snap(p1.x), snap(p1.y)).lineTo(snap(p2.x), snap(p2.y)).stroke({ color: palette.line, width: 2, alpha: 0.82 });
    const t = (time * 0.00035 * state.speed + i * 0.17) % 1;
    const px = lerp(p1.x, p2.x, t);
    const py = lerp(p1.y, p2.y, t);
    rect(wave, px - 4, py - 4, 8, 8, i % 2 ? palette.cyan : palette.red, 0.92);
  });

  pts.forEach((p, i) => {
    const pulse = 0.55 + Math.sin(time * 0.004 + i) * 0.3;
    rect(ui, p.x - 28, p.y - 22, 56, 44, palette.panel2, 1);
    strokeRect(ui, p.x - 28, p.y - 22, 56, 44, i === 5 ? palette.red : accent, 2, 0.88);
    rect(wave, p.x - 18, p.y + 2, 36, 6, i === 5 ? palette.red : accent, pulse);
    addText(`node${i}`, p.label, p.x - 20, p.y - 12, 10, palette.text, '800');
    activeKeys.push(`node${i}`);
  });

  for (let i = 0; i < 7; i += 1) {
    const rackX = mapX + 40 + i * 42;
    const rackY = mapY + mapH - 112;
    rect(ui, rackX, rackY, 28, 84, palette.void, 1);
    strokeRect(ui, rackX, rackY, 28, 84, palette.line, 2, 0.8);
    for (let j = 0; j < 7; j += 1) {
      rect(ui, rackX + 6, rackY + 8 + j * 10, 16, 4, (i + j) % 3 === 0 ? accent : palette.panel2, 0.86);
    }
  }

  addText('packetTitle', 'PACKET FLOW: CHAT -> ASR -> LLM -> TTS -> AGENT', mapX + 36, mapY + mapH - 32, 12, palette.dim, '700');
  activeKeys.push('packetTitle');
}

function handlePointerDown(event) {
  const rectBounds = app.canvas.getBoundingClientRect();
  const x = (event.clientX - rectBounds.left) * (app.renderer.width / rectBounds.width);
  const y = (event.clientY - rectBounds.top) * (app.renderer.height / rectBounds.height);
  const hit = hitAreas.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
  if (!hit) return;

  if (hit.id.startsWith('mode-')) setMode(hit.index);
  if (hit.id === 'voice-down') nudgeVoice(-0.1);
  if (hit.id === 'voice-up') nudgeVoice(0.1);
  if (hit.id === 'scan') {
    state.scan = !state.scan;
    state.textDirty = true;
  }
  if (hit.id === 'noise') {
    state.noise = !state.noise;
    state.textDirty = true;
  }
}

function frame(ticker) {
  const time = performance.now();
  wave.clear();
  drawBackground(time);
  drawShell(time);
}

async function init() {
  if (!window.PIXI) {
    mount.textContent = 'PixiJS failed to load.';
    return;
  }

  app = new PIXI.Application();
  await app.init({
    resizeTo: mount,
    backgroundColor: palette.ink,
    antialias: false,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
  });
  app.stage.roundPixels = true;
  mount.appendChild(app.canvas);
  app.canvas.style.imageRendering = 'pixelated';

  bg = new PIXI.Graphics();
  wave = new PIXI.Graphics();
  ui = new PIXI.Graphics();
  textLayer = new PIXI.Container();
  overlay = new PIXI.Graphics();
  app.stage.addChild(bg, wave, ui, textLayer, overlay);

  seedField();
  app.canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '4') setMode(Number(event.key) - 1);
    if (event.key === '-' || event.key === '_') nudgeVoice(-0.1);
    if (event.key === '=' || event.key === '+') nudgeVoice(0.1);
    if (event.key.toLowerCase() === 's') state.scan = !state.scan;
  });
  app.ticker.add(frame);
}

init();
