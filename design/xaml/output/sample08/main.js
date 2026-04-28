'use strict';

const hud = {
  speed: document.getElementById('speedValue'),
  speedBar: document.getElementById('speedBar'),
  integrity: document.getElementById('integrityValue'),
  integrityBar: document.getElementById('integrityBar'),
  artifacts: document.getElementById('artifactValue'),
  artifactBar: document.getElementById('artifactBar'),
  mission: document.getElementById('missionText'),
  missionState: document.getElementById('missionState'),
  console: document.getElementById('consoleText'),
  progress: document.getElementById('missionProgress'),
  sector: document.getElementById('sectorName'),
  stageTitle: document.getElementById('stageTitle'),
  goalText: document.getElementById('goalText'),
  goalValue: document.getElementById('goalValue'),
  treasureToast: document.getElementById('treasureToast'),
  treasureName: document.getElementById('treasureName'),
  boostBtn: document.getElementById('boostBtn'),
  scanBtn: document.getElementById('scanBtn'),
  resetBtn: document.getElementById('resetBtn'),
};

const stages = [
  {
    sector: 'Jordan-05 Drift',
    title: 'STAGE 1',
    goal: '별빛 항로 개척',
    artifacts: 2,
    distance: 420,
    treasure: 'Petra Starlight',
    mission: '소행성 장막을 통과하며 페트라 별빛 보물을 2개 회수하세요.',
  },
  {
    sector: 'Petra Nebula Gate',
    title: 'STAGE 2',
    goal: '페트라 성운문 진입',
    artifacts: 4,
    distance: 900,
    treasure: 'Nebula Seal',
    mission: '워프 게이트를 활용해 성운문까지 진입하고 보물 신호를 추적하세요.',
  },
  {
    sector: 'Wadi Rum Belt',
    title: 'STAGE 3',
    goal: '와디럼 벨트 돌파',
    artifacts: 6,
    distance: 1360,
    treasure: 'Wadi Rum Prism',
    mission: '밀집 소행성대를 회피하며 와디럼 프리즘 조각을 확보하세요.',
  },
  {
    sector: 'Aqaba Blue Rift',
    title: 'FINAL',
    goal: '아카바 블루 리프트',
    artifacts: 7,
    distance: 1800,
    treasure: 'Jordan Crown Core',
    mission: '마지막 왕관 코어를 획득하고 요르단 항로를 완성하세요.',
  },
];

const state = {
  shipX: 0,
  shipY: 0,
  targetX: 0,
  targetY: 0,
  speed: 1,
  boost: false,
  scan: false,
  integrity: 100,
  artifacts: 0,
  distance: 0,
  stageIndex: 0,
  complete: false,
  lastHit: 0,
  treasureToastTimer: 0,
};

const keys = new Set();
let app;
let world;
let starLayer;
let objectLayer;
let fxLayer;
let uiLayer;
let ship;
let engineFlame;
let shieldRing;
const stars = [];
const objects = [];
const lanes = [];
const maxArtifacts = 7;

const palette = {
  cyan: 0x38d5ff,
  green: 0x5df2a8,
  amber: 0xf5bf4f,
  rose: 0xff5c93,
  violet: 0xa78bfa,
  blue: 0x3b82f6,
  white: 0xf4f7fb,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function project(x, y, z) {
  const w = app.renderer.width;
  const h = app.renderer.height;
  const depth = 920;
  const scale = depth / (depth + z);
  return {
    x: w * 0.5 + (x - state.shipX * 0.36) * scale,
    y: h * 0.5 + (y - state.shipY * 0.22) * scale,
    scale,
  };
}

function makeGlowCircle(radius, color, alpha) {
  const g = new PIXI.Graphics();
  g.circle(0, 0, radius * 2.3).fill({ color, alpha: alpha * 0.12 });
  g.circle(0, 0, radius * 1.35).fill({ color, alpha: alpha * 0.22 });
  g.circle(0, 0, radius).fill({ color, alpha });
  return g;
}

function makeShip() {
  const c = new PIXI.Container();
  c.eventMode = 'none';

  const aura = new PIXI.Graphics();
  aura.ellipse(0, 14, 72, 92).fill({ color: palette.cyan, alpha: 0.055 });
  aura.ellipse(0, 24, 48, 70).fill({ color: palette.violet, alpha: 0.05 });

  const wingGlow = new PIXI.Graphics();
  wingGlow.poly([-24, 17, -80, 58, -28, 42]).fill({ color: palette.cyan, alpha: 0.12 });
  wingGlow.poly([24, 17, 80, 58, 28, 42]).fill({ color: palette.cyan, alpha: 0.12 });
  wingGlow.poly([-11, 34, -25, 78, -4, 50, 0, 40]).fill({ color: palette.rose, alpha: 0.16 });
  wingGlow.poly([11, 34, 25, 78, 4, 50, 0, 40]).fill({ color: palette.rose, alpha: 0.16 });

  const body = new PIXI.Graphics();
  body.poly([0, -58, 22, -14, 34, 38, 0, 24, -34, 38, -22, -14]).fill({ color: 0xdff7ff, alpha: 0.98 });
  body.poly([0, -47, 13, -8, 8, 17, 0, 10, -8, 17, -13, -8]).fill({ color: palette.cyan, alpha: 0.34 });
  body.poly([0, -55, 8, -18, 0, -25, -8, -18]).fill({ color: palette.white, alpha: 0.3 });
  body.poly([-21, -4, -67, 37, -82, 64, -29, 46]).fill({ color: 0x34536f, alpha: 0.98 });
  body.poly([21, -4, 67, 37, 82, 64, 29, 46]).fill({ color: 0x34536f, alpha: 0.98 });
  body.poly([-31, 33, -65, 54, -34, 47]).fill({ color: palette.amber, alpha: 0.22 });
  body.poly([31, 33, 65, 54, 34, 47]).fill({ color: palette.amber, alpha: 0.22 });
  body.poly([-16, 31, -35, 72, -8, 48, 0, 32]).fill({ color: 0x263447, alpha: 0.98 });
  body.poly([16, 31, 35, 72, 8, 48, 0, 32]).fill({ color: 0x263447, alpha: 0.98 });
  body.circle(-18, 18, 4).fill({ color: palette.green, alpha: 0.86 });
  body.circle(18, 18, 4).fill({ color: palette.green, alpha: 0.86 });
  body.moveTo(0, -58).lineTo(0, 26).stroke({ color: 0x8ee8ff, width: 1.2, alpha: 0.42 });
  body.stroke({ color: palette.cyan, width: 1.7, alpha: 0.82 });

  engineFlame = new PIXI.Graphics();
  engineFlame.poly([-20, 38, 0, 100, 20, 38]).fill({ color: palette.amber, alpha: 0.74 });
  engineFlame.poly([-10, 39, 0, 76, 10, 39]).fill({ color: palette.rose, alpha: 0.9 });
  engineFlame.poly([-4, 39, 0, 58, 4, 39]).fill({ color: palette.white, alpha: 0.82 });

  shieldRing = new PIXI.Graphics();
  shieldRing.ellipse(0, 8, 86, 96).stroke({ color: palette.cyan, width: 1.5, alpha: 0.32 });
  shieldRing.ellipse(0, 8, 102, 116).stroke({ color: palette.green, width: 1, alpha: 0.16 });

  c.addChild(aura, shieldRing, wingGlow, engineFlame, body);
  return c;
}

function makeStar() {
  const depthBand = Math.random();
  const radius = depthBand > 0.9 ? rand(1.5, 2.8) : rand(0.5, 1.6);
  const color = pick([palette.white, palette.cyan, palette.violet, palette.amber]);
  const sprite = makeGlowCircle(radius, color, rand(0.42, 0.9));
  starLayer.addChild(sprite);
  return {
    sprite,
    x: rand(-app.renderer.width, app.renderer.width),
    y: rand(-app.renderer.height, app.renderer.height),
    z: rand(120, 2200),
    radius,
    color,
    drift: rand(-0.2, 0.2),
    pulse: rand(0, Math.PI * 2),
  };
}

function drawCrystal(g) {
  g.poly([0, -32, 22, 0, 0, 38, -22, 0]).fill({ color: palette.amber, alpha: 0.86 });
  g.poly([0, -32, 22, 0, 0, 6]).fill({ color: palette.white, alpha: 0.22 });
  g.poly([0, 6, 22, 0, 0, 38]).fill({ color: palette.rose, alpha: 0.28 });
  g.stroke({ color: palette.amber, width: 2, alpha: 0.75 });
}

function drawAsteroid(g, seed) {
  const pts = [];
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 28 + Math.sin(seed + i * 1.7) * 8 + Math.random() * 5;
    pts.push(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  g.poly(pts).fill({ color: 0x6d5f73, alpha: 0.95 });
  g.poly(pts).stroke({ color: 0xc4b5fd, width: 1.2, alpha: 0.34 });
  g.circle(-8, -7, 5).fill({ color: 0x241b2d, alpha: 0.34 });
  g.circle(10, 9, 4).fill({ color: 0x241b2d, alpha: 0.28 });
}

function drawGate(g) {
  g.circle(0, 0, 48).stroke({ color: palette.cyan, width: 4, alpha: 0.72 });
  g.circle(0, 0, 64).stroke({ color: palette.violet, width: 2, alpha: 0.36 });
  g.circle(0, 0, 27).stroke({ color: palette.amber, width: 2, alpha: 0.52 });
  g.moveTo(-58, 0).lineTo(58, 0).stroke({ color: palette.cyan, width: 1, alpha: 0.26 });
  g.moveTo(0, -58).lineTo(0, 58).stroke({ color: palette.cyan, width: 1, alpha: 0.26 });
}

function createObject(type) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  const glow = new PIXI.Graphics();
  const seed = Math.random() * 20;
  c.addChild(glow, g);
  objectLayer.addChild(c);

  if (type === 'crystal') {
    glow.circle(0, 0, 54).fill({ color: palette.amber, alpha: 0.12 });
    drawCrystal(g);
  } else if (type === 'gate') {
    glow.circle(0, 0, 82).fill({ color: palette.cyan, alpha: 0.08 });
    drawGate(g);
  } else {
    glow.circle(0, 0, 44).fill({ color: palette.violet, alpha: 0.08 });
    drawAsteroid(g, seed);
  }

  return {
    container: c,
    type,
    seed,
    x: rand(-720, 720),
    y: rand(-420, 320),
    z: rand(900, 2500),
    rot: rand(-0.03, 0.03),
    radius: type === 'gate' ? 82 : type === 'crystal' ? 44 : 50,
    active: true,
  };
}

function resetObject(obj, far) {
  obj.x = rand(-740, 740);
  obj.y = rand(-430, 330);
  obj.z = far ? rand(1500, 2800) : rand(980, 2300);
  obj.active = true;
  obj.container.visible = true;
  obj.container.alpha = 1;
}

function makeLane(index) {
  const g = new PIXI.Graphics();
  fxLayer.addChild(g);
  return { g, offset: index * 240 };
}

function drawLanes(time) {
  const w = app.renderer.width;
  const h = app.renderer.height;
  lanes.forEach((lane, index) => {
    const g = lane.g;
    const side = index < 3 ? -1 : 1;
    const n = index % 3;
    const x = side * (160 + n * 160 + Math.sin(time * 0.0004 + n) * 20);
    g.clear();
    const a = 0.08 + (state.scan ? 0.12 : 0);
    for (let z = 240; z < 1900; z += 260) {
      const p1 = project(x, 370, z + lane.offset % 260);
      const p2 = project(x * 0.25, -220, z + 360 + lane.offset % 260);
      g.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({
        color: index % 2 ? palette.cyan : palette.amber,
        width: Math.max(1, 4 * p1.scale),
        alpha: a * (1 - p1.scale * 0.2),
      });
    }
    lane.offset = (lane.offset + state.speed * 5) % 260;
  });
}

function buildWorld() {
  world = new PIXI.Container();
  starLayer = new PIXI.Container();
  fxLayer = new PIXI.Container();
  objectLayer = new PIXI.Container();
  uiLayer = new PIXI.Container();
  app.stage.addChild(world);
  world.addChild(starLayer, fxLayer, objectLayer, uiLayer);

  for (let i = 0; i < 420; i += 1) {
    stars.push(makeStar());
  }
  for (let i = 0; i < 6; i += 1) {
    lanes.push(makeLane(i));
  }
  for (let i = 0; i < 18; i += 1) {
    objects.push(createObject(i % 5 === 0 ? 'crystal' : i % 7 === 0 ? 'gate' : 'asteroid'));
  }

  ship = makeShip();
  uiLayer.addChild(ship);
}

function updateInput() {
  let x = 0;
  let y = 0;
  if (keys.has('arrowleft') || keys.has('a')) x -= 1;
  if (keys.has('arrowright') || keys.has('d')) x += 1;
  if (keys.has('arrowup') || keys.has('w')) y -= 1;
  if (keys.has('arrowdown') || keys.has('s')) y += 1;
  state.targetX = clamp(state.targetX + x * 20, -360, 360);
  state.targetY = clamp(state.targetY + y * 16, -210, 210);
  state.boost = state.boost || keys.has(' ');
}

function updateStars(delta, time) {
  const w = app.renderer.width;
  const h = app.renderer.height;
  const travel = (10 + state.speed * 18) * delta;

  for (const star of stars) {
    star.z -= travel;
    star.x += star.drift * delta;
    if (star.z < 30) {
      star.x = rand(-w, w);
      star.y = rand(-h, h);
      star.z = rand(1300, 2400);
    }
    const p = project(star.x, star.y, star.z);
    const twinkle = 0.72 + Math.sin(time * 0.003 + star.pulse) * 0.28;
    star.sprite.position.set(p.x, p.y);
    star.sprite.scale.set(clamp(p.scale * 2.2, 0.18, 2.9));
    star.sprite.alpha = clamp(twinkle * (1.22 - star.z / 2400), 0.12, 1);
  }
}

function objectCollision(obj, p) {
  const shipX = app.renderer.width * 0.5 + state.shipX * 0.55;
  const shipY = app.renderer.height * 0.66 + state.shipY * 0.33;
  const dx = p.x - shipX;
  const dy = p.y - shipY;
  const near = obj.z < 230;
  return near && Math.sqrt(dx * dx + dy * dy) < obj.radius * p.scale + 42;
}

function updateObjects(delta, time) {
  const travel = (9 + state.speed * 20) * delta;
  for (const obj of objects) {
    obj.z -= travel * (obj.type === 'gate' ? 0.76 : 1);
    obj.container.rotation += obj.rot * delta + (obj.type === 'gate' ? 0.01 * delta : 0);
    obj.container.alpha = obj.active ? 1 : lerp(obj.container.alpha, 0, 0.08);

    if (obj.z < 40) {
      resetObject(obj, true);
    }

    const p = project(obj.x, obj.y, obj.z);
    const scale = clamp(p.scale * (obj.type === 'gate' ? 1.5 : 1.05), 0.05, 2.2);
    obj.container.position.set(p.x, p.y);
    obj.container.scale.set(scale);
    obj.container.visible = p.x > -180 && p.x < app.renderer.width + 180 && p.y > -180 && p.y < app.renderer.height + 180;

    if (state.scan && obj.type !== 'asteroid') {
      obj.container.alpha = 0.76 + Math.sin(time * 0.01) * 0.24;
    }

    if (state.integrity > 0 && !state.complete && obj.active && objectCollision(obj, p)) {
      obj.active = false;
      if (obj.type === 'crystal') {
        state.artifacts = Math.min(maxArtifacts, state.artifacts + 1);
        showTreasureToast(currentStage().treasure);
        hud.console.textContent = `요르단의 보물획득: ${currentStage().treasure}. 다음 목표까지 ${Math.max(0, currentStage().artifacts - state.artifacts)}개.`;
      } else if (obj.type === 'gate') {
        state.distance += 180;
        hud.console.textContent = 'Warp gate aligned. Route compression successful.';
      } else if (performance.now() - state.lastHit > 650) {
        state.integrity = Math.max(0, state.integrity - 13);
        state.lastHit = performance.now();
        hud.console.textContent = 'Asteroid impact. Shield matrix compensating.';
      }
      setTimeout(() => resetObject(obj, true), 420);
    }
  }
}

function updateShip(delta, time) {
  state.shipX = lerp(state.shipX, state.targetX, 0.08 * delta);
  state.shipY = lerp(state.shipY, state.targetY, 0.08 * delta);
  const cx = app.renderer.width * 0.5 + state.shipX * 0.55;
  const cy = app.renderer.height * 0.66 + state.shipY * 0.33;
  ship.position.set(cx, cy);
  ship.rotation = lerp(ship.rotation, state.shipX * 0.0009, 0.08);
  const flameScale = state.boost ? 1.35 : 0.82 + Math.sin(time * 0.018) * 0.16;
  engineFlame.scale.set(1, flameScale);
  engineFlame.alpha = state.boost ? 1 : 0.72;
  shieldRing.rotation += 0.012 * delta;
  shieldRing.alpha = state.scan ? 0.85 : 0.42 + Math.sin(time * 0.004) * 0.14;
}

function currentStage() {
  return stages[state.stageIndex];
}

function previousStage() {
  return stages[state.stageIndex - 1] || { artifacts: 0, distance: 0 };
}

function stageProgress() {
  const stage = currentStage();
  const prev = previousStage();
  const artifactSpan = Math.max(1, stage.artifacts - prev.artifacts);
  const distanceSpan = Math.max(1, stage.distance - prev.distance);
  const artifactProgress = clamp((state.artifacts - prev.artifacts) / artifactSpan, 0, 1);
  const distanceProgress = clamp((state.distance - prev.distance) / distanceSpan, 0, 1);
  return {
    artifactProgress,
    distanceProgress,
    value: (artifactProgress + distanceProgress) / 2,
  };
}

function showTreasureToast(name) {
  hud.treasureName.textContent = name;
  hud.treasureToast.classList.add('show');
  clearTimeout(state.treasureToastTimer);
  state.treasureToastTimer = setTimeout(() => {
    hud.treasureToast.classList.remove('show');
  }, 1400);
}

function advanceStageIfReady() {
  const stage = currentStage();
  if (state.integrity <= 0 || state.complete) return;
  if (state.artifacts < stage.artifacts || state.distance < stage.distance) return;

  if (state.stageIndex >= stages.length - 1) {
    state.complete = true;
    hud.console.textContent = '요르단 우주여행 완료. 모든 보물과 항로 기록을 확보했습니다.';
    showTreasureToast('Jordan Crown Core Complete');
    return;
  }

  state.stageIndex += 1;
  const next = currentStage();
  hud.console.textContent = `${next.sector} 진입. 새 목표: ${next.goal}.`;
  showTreasureToast(`${next.title} UNLOCKED`);
}

function updateHud() {
  const stage = currentStage();
  const progress = stageProgress();
  hud.speed.textContent = state.speed.toFixed(1);
  hud.speedBar.style.width = `${clamp((state.speed / 3.2) * 100, 0, 100)}%`;
  hud.integrity.textContent = Math.round(state.integrity);
  hud.integrityBar.style.width = `${state.integrity}%`;
  hud.artifacts.textContent = `${state.artifacts}`;
  hud.artifactBar.style.width = `${(state.artifacts / maxArtifacts) * 100}%`;
  hud.progress.style.width = `${progress.value * 100}%`;
  hud.sector.textContent = stage.sector;
  hud.stageTitle.textContent = stage.title;
  hud.goalText.textContent = stage.goal;
  hud.goalValue.textContent = `보물 ${Math.min(state.artifacts, stage.artifacts)}/${stage.artifacts} · 항로 ${Math.round(progress.distanceProgress * 100)}%`;

  if (state.integrity <= 0) {
    hud.missionState.textContent = 'RECOVER';
    hud.missionState.style.color = 'var(--rose)';
    hud.mission.textContent = '선체 복구가 필요합니다. Reset으로 항로를 재시작하세요.';
  } else if (state.complete) {
    hud.missionState.textContent = 'CLEAR';
    hud.missionState.style.color = 'var(--amber)';
    hud.mission.textContent = '요르단의 모든 보물을 획득했습니다. 항로 기록 완료.';
  } else if (state.scan) {
    hud.missionState.textContent = 'SCANNING';
    hud.missionState.style.color = 'var(--cyan)';
    hud.mission.textContent = '스캔 모드: 유물과 워프 게이트 신호가 강조됩니다.';
  } else {
    hud.missionState.textContent = 'ACTIVE';
    hud.missionState.style.color = 'var(--green)';
    hud.mission.textContent = stage.mission;
  }
}

function tick(ticker) {
  const delta = Math.min(ticker.deltaTime || 1, 2.5);
  const time = performance.now();
  const playable = state.integrity > 0 && !state.complete;
  if (playable) updateInput();
  state.speed = lerp(state.speed, playable ? (state.boost ? 3.2 : 1.05) : 0.55, 0.08);
  if (playable) state.distance += state.speed * delta * 0.9;
  state.boost = false;

  drawLanes(time);
  updateStars(delta, time);
  if (playable) updateObjects(delta, time);
  else updateObjects(delta * 0.35, time);
  updateShip(delta, time);
  advanceStageIfReady();
  updateHud();
}

function bindControls() {
  window.addEventListener('keydown', (event) => {
    keys.add(event.key.toLowerCase());
    if (event.key === ' ') event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });

  let dragging = false;
  const targetFromPointer = (event) => {
    const rect = app.canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width - 0.5) * 760;
    const py = ((event.clientY - rect.top) / rect.height - 0.56) * 470;
    state.targetX = clamp(px, -370, 370);
    state.targetY = clamp(py, -230, 230);
  };

  app.canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    targetFromPointer(event);
  });
  window.addEventListener('pointermove', (event) => {
    if (dragging) targetFromPointer(event);
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
  });

  hud.boostBtn.addEventListener('pointerdown', () => {
    state.boost = true;
    hud.boostBtn.classList.add('active');
  });
  hud.boostBtn.addEventListener('pointerup', () => hud.boostBtn.classList.remove('active'));
  hud.scanBtn.addEventListener('click', () => {
    state.scan = !state.scan;
    hud.scanBtn.classList.toggle('active', state.scan);
    hud.console.textContent = state.scan ? 'Long-range scan overlay enabled.' : 'Scan overlay disabled.';
  });
  hud.resetBtn.addEventListener('click', resetMission);
}

function resetMission() {
  state.shipX = 0;
  state.shipY = 0;
  state.targetX = 0;
  state.targetY = 0;
  state.speed = 1;
  state.integrity = 100;
  state.artifacts = 0;
  state.distance = 0;
  state.stageIndex = 0;
  state.complete = false;
  state.scan = false;
  hud.scanBtn.classList.remove('active');
  hud.treasureToast.classList.remove('show');
  hud.console.textContent = 'Jordan navigation core online. Entering asteroid veil.';
  objects.forEach((obj) => resetObject(obj, true));
}

async function init() {
  const mount = document.getElementById('pixi-stage');
  if (!window.PIXI) {
    mount.innerHTML = '<div style="padding:24px;color:white;font-family:sans-serif">PixiJS failed to load.</div>';
    return;
  }

  app = new PIXI.Application();
  await app.init({
    resizeTo: mount,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
    powerPreference: 'high-performance',
  });
  mount.appendChild(app.canvas);

  buildWorld();
  bindControls();
  app.ticker.add(tick);
}

init();
