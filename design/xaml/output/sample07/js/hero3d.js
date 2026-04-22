/* ============================================
   hero3d.js — Design System Orbit (Three.js r128)

   중앙 코어(Blumnai) + 궤도상의 12개 컴포넌트 노드.
   마우스 드래그 자동회전 + 방사형 arc glow.
   sample04 globe.js 패턴 응용.
   ============================================ */

(function () {
  'use strict';

  const COMPONENTS = [
    { name: 'Button',    color: 0xEC4899 },
    { name: 'Input',     color: 0x8B5CF6 },
    { name: 'DataGrid',  color: 0x22D3EE },
    { name: 'Dialog',    color: 0xF59E0B },
    { name: 'Select',    color: 0x10B981 },
    { name: 'Tabs',      color: 0x6366F1 },
    { name: 'Card',      color: 0xEC4899 },
    { name: 'Toast',     color: 0x8B5CF6 },
    { name: 'Sidebar',   color: 0x22D3EE },
    { name: 'Avatar',    color: 0xF59E0B },
    { name: 'Chart',     color: 0x10B981 },
    { name: 'Editor',    color: 0x6366F1 },
  ];

  const R_CORE = 18;
  const R_ORBIT = 90;
  const R_NODE = 5.5;

  let scene, camera, renderer;
  let root, coreMesh, coreGlow;
  let nodesGroup, arcsGroup;
  let nodes = [];
  let arcs = [];
  let targetRotX = 0.25, targetRotY = 0;
  let curRotX = 0.25, curRotY = 0;
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let autoRotate = true;
  let autoResumeTimer = null;

  function boot() {
    if (typeof THREE === 'undefined') {
      setTimeout(boot, 80);
      return;
    }
    init();
  }

  function init() {
    const container = document.getElementById('orbit-container');
    if (!container) return;

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 400;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, w / h, 1, 2000);
    camera.position.set(0, 20, 260);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    root = new THREE.Group();
    scene.add(root);

    buildLights();
    buildCore();
    buildNodes();
    buildArcs();
    buildBackdrop();

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

  function buildLights() {
    scene.add(new THREE.AmbientLight(0x6B5B95, 0.7));

    const key = new THREE.DirectionalLight(0xEC4899, 0.9);
    key.position.set(120, 80, 200);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x22D3EE, 0.5);
    fill.position.set(-150, -50, 100);
    scene.add(fill);

    const rim = new THREE.PointLight(0x8B5CF6, 1.2, 400);
    rim.position.set(0, 0, 150);
    scene.add(rim);
  }

  function buildCore() {
    // Core sphere — gradient-like through emissive
    const geo = new THREE.IcosahedronGeometry(R_CORE, 2);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x8B5CF6,
      emissive: 0x8B5CF6,
      emissiveIntensity: 0.45,
      shininess: 80,
      specular: 0xFBCFE8,
      flatShading: true,
    });
    coreMesh = new THREE.Mesh(geo, mat);
    root.add(coreMesh);

    // Inner wireframe for structural detail
    const wireGeo = new THREE.IcosahedronGeometry(R_CORE * 1.02, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xEC4899,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    root.add(new THREE.Mesh(wireGeo, wireMat));

    // Glow halo — BackSide sphere
    const haloGeo = new THREE.SphereGeometry(R_CORE * 1.8, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xEC4899,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    coreGlow = new THREE.Mesh(haloGeo, haloMat);
    root.add(coreGlow);
  }

  function orbitPos(i, total, tiltRad = 0.4) {
    const angle = (i / total) * Math.PI * 2;
    const x = Math.cos(angle) * R_ORBIT;
    const z = Math.sin(angle) * R_ORBIT;
    const y = Math.sin(angle * 2) * 18; // wave orbit
    // rotate by tilt
    const ry = y * Math.cos(tiltRad) - z * Math.sin(tiltRad);
    const rz = y * Math.sin(tiltRad) + z * Math.cos(tiltRad);
    return new THREE.Vector3(x, ry, rz);
  }

  function buildNodes() {
    nodesGroup = new THREE.Group();
    nodes = [];

    const geo = new THREE.OctahedronGeometry(R_NODE, 0);

    COMPONENTS.forEach((c, i) => {
      const pos = orbitPos(i, COMPONENTS.length);

      const mat = new THREE.MeshPhongMaterial({
        color: c.color,
        emissive: c.color,
        emissiveIntensity: 0.6,
        shininess: 40,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.userData.baseScale = 1;
      mesh.userData.phase = i * 0.5;

      // Point light per node (soft glow)
      const light = new THREE.PointLight(c.color, 0.7, 50);
      light.position.copy(pos);

      nodesGroup.add(mesh);
      nodesGroup.add(light);

      nodes.push({ mesh, light, color: c.color, basePos: pos.clone(), phase: i * 0.5 });
    });

    root.add(nodesGroup);
  }

  function buildArcs() {
    arcsGroup = new THREE.Group();
    arcs = [];

    // Connect every node to the core + a few cross-connects
    const total = COMPONENTS.length;

    COMPONENTS.forEach((c, i) => {
      const pos = orbitPos(i, total);
      const start = new THREE.Vector3(0, 0, 0);
      const end = pos.clone();
      const mid = end.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 12, 0));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(40);

      // Base dim line
      const baseGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const baseMat = new THREE.LineBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: 0.12,
      });
      arcsGroup.add(new THREE.Line(baseGeo, baseMat));

      // Animated glow segment
      const glowMat = new THREE.LineBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const glowGeo = new THREE.BufferGeometry();
      const glowLine = new THREE.Line(glowGeo, glowMat);
      arcsGroup.add(glowLine);

      arcs.push({
        curve,
        glowLine,
        speed: 0.12 + Math.random() * 0.08,
        offset: Math.random(),
        segLen: 0.18 + Math.random() * 0.08,
      });
    });

    // Cross-connects between every 4th node pair
    for (let i = 0; i < total; i += 4) {
      const a = orbitPos(i, total);
      const b = orbitPos((i + 4) % total, total);
      const mid = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, -8, 0));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(40);
      const baseGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const baseMat = new THREE.LineBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.05,
      });
      arcsGroup.add(new THREE.Line(baseGeo, baseMat));
    }

    root.add(arcsGroup);
  }

  function buildBackdrop() {
    // Particle cloud
    const particleCount = 180;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color(0xEC4899),
      new THREE.Color(0x8B5CF6),
      new THREE.Color(0x22D3EE),
    ];

    for (let i = 0; i < particleCount; i++) {
      const r = 140 + Math.random() * 100;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(p) * Math.cos(t);
      positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      positions[i * 3 + 2] = r * Math.cos(p);
      const col = palette[i % 3];
      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geo, mat);
    root.add(particles);
  }

  function updateArcs(time) {
    const t = time * 0.001;
    arcs.forEach(arc => {
      let p = (t * arc.speed + arc.offset) % 1;
      const segStart = p;
      const segEnd = p + arc.segLen;
      const pts = [];
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        let u = segStart + (segEnd - segStart) * (i / steps);
        if (u > 1) u -= 1;
        pts.push(arc.curve.getPoint(Math.max(0, Math.min(1, u))));
      }
      arc.glowLine.geometry.dispose();
      arc.glowLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      arc.glowLine.material.opacity = 0.45 + 0.3 * Math.sin(t * 3 + arc.offset * 10);
    });
  }

  function updateNodes(time) {
    const t = time * 0.001;
    nodes.forEach((n, i) => {
      // Pulsing scale
      const beat = Math.sin(t * 1.6 + n.phase) * 0.18 + 1;
      n.mesh.scale.set(beat, beat, beat);
      // Gentle wobble in Y
      n.mesh.position.y = n.basePos.y + Math.sin(t * 0.8 + i) * 3;
      n.light.position.copy(n.mesh.position);
      // Rotate each octahedron
      n.mesh.rotation.x += 0.008;
      n.mesh.rotation.y += 0.012;
    });
  }

  function updateCore(time) {
    if (!coreMesh) return;
    coreMesh.rotation.x += 0.003;
    coreMesh.rotation.y += 0.005;
    if (coreGlow) {
      const t = time * 0.001;
      const s = 1 + Math.sin(t * 1.5) * 0.06;
      coreGlow.scale.set(s, s, s);
    }
  }

  function onDown(e) {
    isDragging = true; autoRotate = false;
    if (autoResumeTimer) { clearTimeout(autoResumeTimer); autoResumeTimer = null; }
    prevMouse.x = e.clientX; prevMouse.y = e.clientY;
  }
  function onMove(e) {
    if (!isDragging) return;
    targetRotY += (e.clientX - prevMouse.x) * 0.006;
    targetRotX += (e.clientY - prevMouse.y) * 0.004;
    targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
    prevMouse.x = e.clientX; prevMouse.y = e.clientY;
  }
  function onUp() {
    isDragging = false;
    if (autoResumeTimer) clearTimeout(autoResumeTimer);
    autoResumeTimer = setTimeout(() => { autoRotate = true; }, 2000);
  }
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    isDragging = true; autoRotate = false;
    if (autoResumeTimer) { clearTimeout(autoResumeTimer); autoResumeTimer = null; }
    prevMouse.x = e.touches[0].clientX; prevMouse.y = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    targetRotY += (e.touches[0].clientX - prevMouse.x) * 0.006;
    targetRotX += (e.touches[0].clientY - prevMouse.y) * 0.004;
    targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
    prevMouse.x = e.touches[0].clientX; prevMouse.y = e.touches[0].clientY;
  }

  function onResize() {
    const c = document.getElementById('orbit-container');
    if (!c || !renderer || !camera) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate(time) {
    requestAnimationFrame(animate);

    if (autoRotate) targetRotY += 0.002;

    // Smooth lerp
    curRotY += (targetRotY - curRotY) * 0.05;
    curRotX += (targetRotX - curRotX) * 0.05;
    root.rotation.y = curRotY;
    root.rotation.x = curRotX;

    updateCore(time);
    updateNodes(time);
    updateArcs(time);

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
