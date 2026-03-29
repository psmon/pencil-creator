/* ===== WPF Animation Showcase — Four Seasons (app.js) ===== */

// ─── Utility ───
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function setupCanvas(c) {
  const r = c.getBoundingClientRect(), d = devicePixelRatio || 1;
  c.width = r.width * d; c.height = r.height * d;
  const ctx = c.getContext('2d'); ctx.scale(d, d);
  return { ctx, w: r.width, h: r.height };
}

// ─── Realistic petal SVG (gradient) ───
const petalCache = new Map();
function petalImg(sz, c1, c2, id) {
  const k = `${sz}_${c1}`; if (petalCache.has(k)) return petalCache.get(k);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${Math.round(sz*1.3)}" viewBox="0 0 20 26">
    <defs><radialGradient id="p${id}" cx="35%" cy="30%"><stop offset="0%" stop-color="${c1}" stop-opacity=".95"/>
    <stop offset="70%" stop-color="${c2}" stop-opacity=".85"/><stop offset="100%" stop-color="${c2}" stop-opacity=".5"/></radialGradient></defs>
    <path d="M10 0C14 3 18 10 16 18C14 23 12 25 10 26C8 25 6 23 4 18C2 10 6 3 10 0Z" fill="url(#p${id})"/>
    <path d="M10 4C12 7 14 12 13 18C12 21 11 23 10 24C9 23 8 21 7 18C6 12 8 7 10 4Z" fill="white" opacity=".15"/></svg>`;
  const img = new Image(); img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  petalCache.set(k, img); return img;
}
const GRADS = [['#FFE4EC','#FFB7C5'],['#FFF0F5','#FF91A4'],['#FFDBE5','#FFD1DC']];
let pid = 0;

// ═══ HERO: Typewriter (CAT7-1) ═══
(function() {
  const text = 'Four Seasons Animation Showcase';
  const el = document.getElementById('heroTitle');
  let i = 0;
  function type() {
    el.innerHTML = text.slice(0, i) + '<span class="cursor">|</span>';
    if (++i <= text.length) setTimeout(type, 60);
  }
  setTimeout(type, 500);
})();

// ═══ SPRING: Cherry Blossom Fall (CAT12-1) ═══
(function() {
  const c = document.getElementById('demoFall');
  if (!c) return;
  let { ctx, w, h } = setupCanvas(c);
  const petals = [];
  function mk(init) {
    const g = pick(GRADS);
    return { x: rand(0,w), y: init?rand(0,h):rand(-30,-5), sz: rand(8,16),
      vy: rand(25,60), vx: rand(-12,12), rot: rand(0,360), rs: rand(30,90)*(Math.random()>.5?1:-1),
      op: rand(.4,.85), img: petalImg(Math.round(rand(8,16)),g[0],g[1],pid++), phase: rand(0,6.28) };
  }
  for (let i=0;i<15;i++) petals.push(mk(true));
  let lt = performance.now();
  (function anim(now) {
    const dt = (now-lt)/1000; lt = now;
    ctx.clearRect(0,0,w,h);
    for (const p of petals) {
      const t = (now*.001+p.phase);
      p.y += p.vy*dt*(1+Math.pow(p.y/h,2)*.5); // QuadraticEase acceleration
      p.x += p.vx*dt + Math.sin(t)*0.3;
      p.rot += p.rs*dt;
      if (p.y > h+20) Object.assign(p, mk(false));
      if (p.img.complete) {
        ctx.save(); ctx.globalAlpha=p.op*(1-p.y/h*.5);
        ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.drawImage(p.img,-p.sz/2,-p.sz*.65,p.sz,p.sz*1.3);
        ctx.restore();
      }
    }
    requestAnimationFrame(anim);
  })(performance.now());
  window.addEventListener('resize',()=>({ctx,w,h}=setupCanvas(c)));
})();

// ═══ SPRING: Petal Scatter Wind (CAT12-2) ═══
(function() {
  const c = document.getElementById('demoWind');
  if (!c) return;
  let { ctx, w, h } = setupCanvas(c);
  const ps = []; let sp = 0;
  function mk() {
    const g = pick(GRADS);
    return { x:-10, y:rand(h*.1,h*.85), sx:-10, sy:rand(h*.1,h*.85), sz:rand(10,20),
      dur:rand(3,6), age:0, rot:rand(0,360), rt:rand(360,720)*(Math.random()>.5?1:-1),
      dy:rand(-60,80), op:rand(.5,.9), img:petalImg(Math.round(rand(10,20)),g[0],g[1],pid++), tp:rand(0,6.28) };
  }
  let lt = performance.now();
  (function anim(now) {
    const dt=(now-lt)/1000; lt=now;
    ctx.clearRect(0,0,w,h);
    sp+=dt; while(sp>.18){ps.push(mk());sp-=.18}
    for(let i=ps.length-1;i>=0;i--){
      const p=ps[i]; p.age+=dt; const t=Math.min(p.age/p.dur,1);
      p.x=p.sx+t*(w+40); p.y=p.sy+t*p.dy+Math.sin(p.age*3+p.tp)*12;
      p.rot+=(p.rt/p.dur)*dt;
      const sc=1-t*.7, op=p.op*(1-t);
      if(t>=1){ps.splice(i,1);continue}
      const ds=p.sz*sc;
      if(p.img.complete){ctx.save();ctx.globalAlpha=op;ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.drawImage(p.img,-ds/2,-ds*.65,ds,ds*1.3);ctx.restore()}
    }
    if(ps.length>100)ps.splice(0,ps.length-100);
    requestAnimationFrame(anim);
  })(performance.now());
  window.addEventListener('resize',()=>({ctx,w,h}=setupCanvas(c)));
})();

// ═══ SPRING: Breeze Sway (CAT12-3) ═══
(function() {
  const stage = document.getElementById('demoSway');
  if (!stage) return;
  const W = stage.offsetWidth, colors = ['#FFB7C5','#FF91A4','#FFD1DC'];
  const leafC = ['#4ADE80','#86EFAC'];
  let css = '';
  for (let i = 0; i < 3; i++) {
    const x = (W/(4))*(i+1), sh = rand(80,130), bc = pick(colors), lc = pick(leafC);
    const dur = rand(2,3.5), angle = rand(5,10), delay = rand(0,2);
    const cx = 50, tot = sh+30;
    css += `@keyframes sw${i}{0%,100%{transform:rotate(${-angle}deg)}50%{transform:rotate(${angle}deg)}}`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width',100); svg.setAttribute('height',tot);
    svg.setAttribute('viewBox',`0 0 100 ${tot}`);
    svg.style.cssText = `position:absolute;bottom:0;left:${x-50}px;transform-origin:50px ${tot}px;animation:sw${i} ${dur}s ease-in-out ${delay}s infinite alternate`;
    svg.innerHTML = `<path d="M${cx} ${tot} Q${cx-2} ${tot-sh*.5} ${cx+1} ${30}" fill="none" stroke="${lc}" stroke-width="3" stroke-linecap="round"/>
      <path d="M${cx-2} ${tot-sh*.35} Q${cx-22} ${tot-sh*.35-12} ${cx-32} ${tot-sh*.35-4} Q${cx-20} ${tot-sh*.35+4} ${cx-2} ${tot-sh*.35}Z" fill="${lc}"/>
      <path d="M${cx+2} ${tot-sh*.6} Q${cx+20} ${tot-sh*.6-10} ${cx+30} ${tot-sh*.6-3} Q${cx+18} ${tot-sh*.6+5} ${cx+2} ${tot-sh*.6}Z" fill="${lc}" opacity=".8"/>
      <g transform="translate(${cx},24)">${[0,72,144,216,288].map(a=>`<path d="M0-3Q4-14 2-22Q0-25-2-22Q-4-14 0-3Z" fill="${bc}" transform="rotate(${a})" opacity=".9"/>`).join('')}<circle r="4" fill="#FFE66D"/><circle r="2" fill="#FFA94D"/></g>`;
    stage.appendChild(svg);
  }
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
})();

// ═══ SPRING: Floating Particles (CAT4-2) ═══
(function() {
  const c = document.getElementById('demoDots');
  if (!c) return;
  let { ctx, w, h } = setupCanvas(c);
  const dots = [];
  const dotColors = ['#FFB7C5','#FF91A4','#4ADE80','#86EFAC','#FFD1DC'];
  for (let i=0;i<10;i++) dots.push({x:rand(0,w),y:rand(0,h),vy:rand(-15,-30),vx:rand(-5,5),r:rand(2,5),op:rand(.3,.7),c:pick(dotColors),phase:rand(0,6.28)});
  let lt=performance.now();
  (function anim(now){
    const dt=(now-lt)/1000;lt=now;ctx.clearRect(0,0,w,h);
    for(const d of dots){
      d.y+=d.vy*dt; d.x+=d.vx*dt+Math.sin(now*.001+d.phase)*.3;
      if(d.y<-10){d.y=h+10;d.x=rand(0,w)}
      ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fillStyle=d.c;ctx.globalAlpha=d.op*(1-Math.abs(d.y-h/2)/(h/2)*.5);ctx.fill();ctx.globalAlpha=1;
    }
    requestAnimationFrame(anim);
  })(performance.now());
  window.addEventListener('resize',()=>({ctx,w,h}=setupCanvas(c)));
})();

// ═══ SPRING: Glow dots (CAT4-3) ═══
(function() {
  const el = document.getElementById('demoGlow');
  if (!el) return;
  const colors = ['#FFB7C5','#FF91A4','#4ADE80','#86EFAC','#FFD1DC'];
  colors.forEach((c,i) => {
    const d = document.createElement('div');
    d.className = 'glow-dot'; d.style.background = c; d.style.color = c;
    d.style.animationDelay = `${i*0.3}s`;
    el.appendChild(d);
  });
})();

// ═══ SPRING: Wave (CAT10-1) ═══
(function() {
  const el = document.getElementById('demoWave');
  if (!el) return;
  el.innerHTML = '<div class="wave"></div><div class="wave"></div>';
})();

// ═══ SPRING: Breathing (CAT10-2) ═══
(function() {
  const el = document.getElementById('demoBreathe');
  if (!el) return;
  [0, 0.5, 1, 1.5].forEach((d,i) => {
    const c = document.createElement('div');
    c.className = 'breathe-circle';
    c.style.animationDelay = `${d}s`;
    c.style.opacity = 0.4 + i * 0.15;
    el.appendChild(c);
  });
})();

// ═══ SPRING: Marching Ants (CAT10-3) ═══
(function() {
  const el = document.getElementById('demoAnts');
  if (!el) return;
  el.innerHTML = '<div class="ants-box">Marching Border</div>';
})();

// ═══ SUMMER: ComboBox (CAT1-2) ═══
(function() {
  const cb = document.getElementById('comboBox');
  if (!cb) return;
  const sel = cb.querySelector('.combo-selected');
  sel.addEventListener('click', () => cb.classList.toggle('open'));
  cb.querySelectorAll('.combo-option').forEach(opt => {
    opt.addEventListener('click', () => {
      sel.innerHTML = opt.textContent + ' <span class="combo-arrow">&#9662;</span>';
      cb.classList.remove('open');
    });
  });
  document.addEventListener('click', e => { if (!cb.contains(e.target)) cb.classList.remove('open'); });
})();

// ═══ SUMMER: Snackbar (CAT2-1) ═══
(function() {
  const btn = document.getElementById('snackBtn'), sb = document.getElementById('snackbar');
  if (!btn) return;
  btn.addEventListener('click', () => {
    sb.classList.add('show');
    setTimeout(() => sb.classList.remove('show'), 3000);
  });
})();

// ═══ SUMMER: Progress Bar (CAT2-2) ═══
(function() {
  const fill = document.getElementById('progressFill');
  if (!fill) return;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { fill.style.width = '100%'; }
  }, { threshold: 0.5 });
  observer.observe(fill.parentElement);
})();

// ═══ SUMMER: Badge Pop (CAT2-3) ═══
(function() {
  const btn = document.getElementById('badgeBtn'), badge = document.getElementById('badgeCount');
  if (!btn) return;
  let count = 3;
  btn.addEventListener('click', () => {
    count++; badge.textContent = count;
    badge.classList.remove('pop');
    void badge.offsetWidth; // reflow
    badge.classList.add('pop');
  });
})();

// ═══ SUMMER: Ripple Button (CAT8-1) ═══
document.querySelectorAll('.ripple-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const sz = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-rect.left-sz/2}px;top:${e.clientY-rect.top-sz/2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
});

// ═══ SUMMER: Accordion (CAT8-2) ═══
document.querySelectorAll('.accordion-header').forEach(h => {
  h.addEventListener('click', () => h.parentElement.classList.toggle('open'));
});

// ═══ AUTUMN: Page Transition (CAT3-1) ═══
(function() {
  const pages = document.querySelectorAll('.page-content');
  const btns = document.querySelectorAll('.page-btn');
  if (!btns.length) return;
  let cur = 0;
  btns[0].classList.add('active');
  btns.forEach(b => b.addEventListener('click', () => {
    const to = +b.dataset.to;
    if (to === cur) return;
    pages[cur].classList.remove('active');
    pages[cur].classList.add('exit-left');
    setTimeout(() => pages[cur].classList.remove('exit-left'), 400);
    pages[to].classList.add('active');
    btns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    cur = to;
  }));
})();

// ═══ AUTUMN: Tab Slide (CAT3-2) ═══
(function() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  const indicator = document.querySelector('.tab-indicator');
  if (!tabs.length || !indicator) return;
  function updateIndicator(tab) {
    indicator.style.left = tab.offsetLeft + 'px';
    indicator.style.width = tab.offsetWidth + 'px';
  }
  updateIndicator(tabs[0]);
  tabs.forEach(t => t.addEventListener('click', () => {
    const idx = +t.dataset.tab;
    tabs.forEach(x => x.classList.remove('active'));
    panels.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    panels[idx].classList.add('active');
    updateIndicator(t);
  }));
})();

// ═══ AUTUMN: Hamburger Toggle (CAT3-3) ═══
(function() {
  const h = document.getElementById('hamburger');
  if (!h) return;
  h.addEventListener('click', () => h.classList.toggle('open'));
})();

// ═══ AUTUMN: Path Follower (CAT6-1) ═══
(function() {
  const path = document.getElementById('followPath');
  const follower = document.getElementById('follower');
  if (!path || !follower) return;
  const len = path.getTotalLength();
  let progress = 0, dir = 1;
  (function anim() {
    progress += dir * 0.005;
    if (progress >= 1 || progress <= 0) dir *= -1;
    const pt = path.getPointAtLength(progress * len);
    follower.setAttribute('cx', pt.x);
    follower.setAttribute('cy', pt.y);
    requestAnimationFrame(anim);
  })();
})();

// ═══ AUTUMN: Parallax (CAT6-2) ═══
(function() {
  const demo = document.getElementById('parallaxDemo');
  if (!demo) return;
  const layers = demo.querySelectorAll('.parallax-layer');
  demo.addEventListener('mousemove', e => {
    const rect = demo.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    layers.forEach(l => {
      const speed = +l.dataset.speed;
      l.style.transform = `translate(${x*50*speed}px, ${y*30*speed}px)`;
    });
  });
})();

// ═══ AUTUMN: Drag & Drop (CAT6-3) ═══
(function() {
  const item = document.getElementById('dragItem'), zone = document.getElementById('dropZone');
  if (!item || !zone) return;
  item.addEventListener('dragstart', e => e.dataTransfer.setData('text','drag'));
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('over'); zone.classList.add('dropped');
    zone.textContent = 'Dropped!';
    setTimeout(() => { zone.classList.remove('dropped'); zone.textContent = 'Drop here'; }, 1500);
  });
})();

// ═══ AUTUMN: Circular Progress (CAT9-2) — IntersectionObserver trigger ═══
(function() {
  const circle = document.querySelector('.circular-fill');
  const text = document.getElementById('circularText');
  if (!circle) return;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      const target = 75;
      const circumference = 251;
      circle.style.transition = 'stroke-dashoffset 2s cubic-bezier(.4,0,.2,1)';
      circle.style.strokeDashoffset = circumference * (1 - target / 100);
      let cur = 0;
      const interval = setInterval(() => {
        cur += 1; text.textContent = cur + '%';
        if (cur >= target) clearInterval(interval);
      }, 2000 / target);
    }
  }, { threshold: 0.5 });
  observer.observe(circle);
})();

// ═══ AUTUMN: Bar Chart (CAT9-3) — staggered entrance ═══
(function() {
  const bars = document.querySelectorAll('.bar');
  if (!bars.length) return;
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      bars.forEach((b, i) => {
        setTimeout(() => { b.style.height = b.dataset.value + '%'; }, i * 150);
      });
    }
  }, { threshold: 0.3 });
  observer.observe(document.getElementById('barChart'));
})();

// ═══ WINTER: Flip Card (CAT5-1) ═══
(function() {
  const card = document.getElementById('flipCard');
  if (!card) return;
  card.addEventListener('click', () => card.classList.toggle('flipped'));
})();

// ═══ WINTER: Morphing Shape (CAT5-2) ═══
(function() {
  const path = document.getElementById('morphPath');
  if (!path) return;
  const shapes = [
    'M60 10 L110 90 L10 90 Z',           // triangle
    'M20 20 L100 20 L100 100 L20 100 Z',  // square
    'M60 10 C90 10 110 40 110 60 C110 90 90 110 60 110 C30 110 10 90 10 60 C10 40 30 10 60 10 Z', // circle
    'M60 5 L75 40 L115 45 L85 70 L95 110 L60 90 L25 110 L35 70 L5 45 L45 40 Z', // star
  ];
  let idx = 0;
  path.style.transition = 'd 0.6s cubic-bezier(.4,0,.2,1)';
  path.parentElement.addEventListener('click', () => {
    idx = (idx + 1) % shapes.length;
    path.setAttribute('d', shapes[idx]);
  });
})();

// ═══ WINTER: Elastic Spring (CAT5-3) ═══
(function() {
  const ball = document.getElementById('springBall');
  if (!ball) return;
  ball.addEventListener('click', () => {
    ball.classList.remove('bounce'); void ball.offsetWidth;
    ball.classList.add('bounce');
    setTimeout(() => ball.classList.remove('bounce'), 800);
  });
})();

// ═══ WINTER: Typewriter (CAT7-1 detail) ═══
(function() {
  const el = document.getElementById('typewriter');
  const btn = document.getElementById('typeBtn');
  if (!el) return;
  const text = 'WPF Storyboard Animation';
  function type() {
    el.textContent = '';
    let i = 0;
    (function t() { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(t, 80); })();
  }
  type();
  if (btn) btn.addEventListener('click', type);
})();

// ═══ WINTER: Staggered List (CAT7-3) ═══
(function() {
  const items = document.querySelectorAll('.stagger-item');
  const btn = document.getElementById('staggerBtn');
  if (!items.length) return;
  function play() {
    items.forEach(it => it.classList.remove('in'));
    items.forEach((it, i) => setTimeout(() => it.classList.add('in'), i * 150));
  }
  // trigger on scroll
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) play();
  }, { threshold: 0.3 });
  observer.observe(items[0].parentElement);
  if (btn) btn.addEventListener('click', play);
})();

// ═══ WINTER: Confetti Burst (CAT11-1) ═══
(function() {
  const btn = document.getElementById('confettiBtn');
  const canvas = document.getElementById('confettiCanvas');
  if (!btn || !canvas) return;
  btn.addEventListener('click', () => {
    let { ctx, w, h } = setupCanvas(canvas);
    const colors = ['#FF6B6B','#FFE66D','#4ECDC4','#FFB7C5','#8B5CF6','#22D3EE','#FF91A4','#A78BFA'];
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: w/2, y: h/2, vx: rand(-8,8), vy: rand(-12,-2),
        r: rand(2,5), c: pick(colors), gravity: 0.15, life: 1, decay: rand(.01,.025)
      });
    }
    (function anim() {
      ctx.clearRect(0,0,w,h);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= p.decay;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x-p.r/2, p.y-p.r/2, p.r, p.r * 1.5);
      }
      ctx.globalAlpha = 1;
      if (alive) requestAnimationFrame(anim);
    })();
  });
})();

// ═══ WINTER: Zoom (CAT11-2) ═══
(function() {
  const target = document.getElementById('zoomTarget');
  const btns = document.querySelectorAll('.zoom-btn');
  if (!target) return;
  let scale = 1;
  btns.forEach(b => b.addEventListener('click', () => {
    scale = b.dataset.zoom === 'in' ? Math.min(scale + 0.3, 2.5) : Math.max(scale - 0.3, 0.5);
    target.style.transform = `scale(${scale})`;
  }));
})();
