/* ============================================
   effects.js — Interactive effects layer
   Ripple, particle burst, number counter, shimmer
   ============================================ */

(function () {
  'use strict';

  /* ============================================
     Ripple button — WPF style EllipseGeometry burst
     ============================================ */
  function attachRipple(btn) {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const el = document.createElement('span');
      el.className = 'ripple';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      btn.appendChild(el);
      setTimeout(() => el.remove(), 650);
    });
  }

  function initRipples() {
    document.querySelectorAll('.ripple-btn').forEach(attachRipple);
  }

  /* ============================================
     Count-up animation — WPF DoubleAnimation on Text
     cubic-out easing for smooth deceleration
     ============================================ */
  function countUp(el, target, duration = 1600) {
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic-out
      const val = Math.floor(start + (target - start) * eased);
      el.textContent = val.toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el.dataset.counted === '1') return;
          el.dataset.counted = '1';
          countUp(el, parseInt(el.dataset.count, 10));
        }
      });
    }, { threshold: 0.4 });

    document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
  }

  /* ============================================
     Typed code — typing + syntax highlighting
     ============================================ */
  const CODE_LINES = [
    ['tok-comment', '// 1. 설치 — GitHub Packages'],
    ['',            "npm install @blumnai-studio/blumnai-design-system"],
    ['',            ''],
    ['tok-comment', '// 2. 스타일 한 번만 임포트'],
    [null, [
      ['tok-keyword', 'import '],
      ['tok-string',  "'@blumnai-studio/blumnai-design-system/styles'"],
      ['',            ';']
    ]],
    ['',            ''],
    ['tok-comment', '// 3. 컴포넌트 사용 — 서브패스 권장'],
    [null, [
      ['tok-keyword', 'import '],
      ['',            '{ '],
      ['tok-var',     'Button'],
      ['',            ', '],
      ['tok-var',     'Input'],
      ['',            ', '],
      ['tok-var',     'Icon'],
      ['',            " } "],
      ['tok-keyword', 'from '],
      ['tok-string',  "'@blumnai-studio/blumnai-design-system'"],
      ['',            ';']
    ]],
    ['',            ''],
    [null, [
      ['tok-keyword', 'export default function '],
      ['tok-fn',      'App'],
      ['',            '() {']
    ]],
    [null, [
      ['',            '  '],
      ['tok-keyword', 'return '],
      ['',            '<'],
      ['tok-var',     'Button'],
      ['',            ' variant='],
      ['tok-string',  '"primary"'],
      ['',            '>시작하기</'],
      ['tok-var',     'Button'],
      ['',            '>;']
    ]],
    ['',            '}'],
  ];

  function renderCode() {
    const target = document.getElementById('typed-code');
    if (!target) return;

    // Build full HTML first, then reveal progressively
    const htmlPerLine = CODE_LINES.map(line => {
      const [cls, content] = line;
      if (cls === null && Array.isArray(content)) {
        return content.map(([c, txt]) => c ? `<span class="${c}">${escape(txt)}</span>` : escape(txt)).join('');
      }
      if (cls) return `<span class="${cls}">${escape(content)}</span>`;
      return escape(content);
    });

    const fullText = htmlPerLine.join('\n');
    // Split into characters but preserve tags
    typeByLine(target, htmlPerLine);
  }

  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function typeByLine(target, lines) {
    target.innerHTML = '';
    const caret = document.createElement('span');
    caret.className = 'tok-caret';
    target.appendChild(caret);

    let li = 0;
    function nextLine() {
      if (li >= lines.length) {
        return;
      }
      const lineEl = document.createElement('span');
      lineEl.style.opacity = '0';
      lineEl.innerHTML = lines[li];
      target.insertBefore(lineEl, caret);
      target.insertBefore(document.createTextNode('\n'), caret);
      // Fade in
      requestAnimationFrame(() => {
        lineEl.style.transition = 'opacity 0.28s ease';
        lineEl.style.opacity = '1';
      });
      li++;
      setTimeout(nextLine, 180);
    }

    // Delay start until the window is visible
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !target.dataset.typed) {
          target.dataset.typed = '1';
          nextLine();
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(target);
  }

  /* ============================================
     Terminal — staged command run
     WAAPI-style sequential promise chain
     ============================================ */
  const TERM_LINES = [
    { type: 'prompt-cmd', prompt: '❯', cmd: 'harness run component-full-audit Button', delay: 400 },
    { type: 'out',   text: '• Loading harness config... ',   ok: 'OK', delay: 600 },
    { type: 'out',   text: '• Spawning 6 evaluation agents... ', ok: 'OK', delay: 500 },
    { type: 'info',  text: '',
      rows: [
        '  ✓ tamer                        baseline passed',
        '  ✓ a11y-auditor                 L5 · 98% WCAG AA',
        '  ✓ token-consistency-inspector  0 drift',
        '  ✓ figma-drift-detector         pixel Δ < 1px',
        '  ✓ type-api-reviewer            7 props · consistent',
        '  ✓ ds-release-curator           CHANGELOG ready'
      ],
      delay: 1400,
    },
    { type: 'out', text: '• Computing composite score... ', ok: 'OK', delay: 500 },
    { type: 'result', text: '', delay: 400 },
    { type: 'prompt-done' },
  ];

  function runTerminal() {
    const el = document.getElementById('term-body');
    if (!el) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !el.dataset.ran) {
          el.dataset.ran = '1';
          playTerminal(el);
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(el);
  }

  function playTerminal(el) {
    el.innerHTML = '';
    let i = 0;
    const caret = document.createElement('span');
    caret.className = 'term-caret';

    function step() {
      if (i >= TERM_LINES.length) {
        el.appendChild(document.createElement('br'));
        const p = document.createElement('span');
        p.className = 'term-line';
        p.innerHTML = `<span class="term-prompt">❯</span> <span class="term-cmd"></span>`;
        el.appendChild(p);
        p.querySelector('.term-cmd').appendChild(caret);
        return;
      }
      const item = TERM_LINES[i];
      const line = document.createElement('span');
      line.className = 'term-line';
      line.style.opacity = '0';

      if (item.type === 'prompt-cmd') {
        line.innerHTML = `<span class="term-prompt">${item.prompt}</span> <span class="term-cmd">${item.cmd}</span>`;
      } else if (item.type === 'out') {
        line.innerHTML = `<span class="term-out">${item.text}</span>` + (item.ok ? `<span class="term-ok">[${item.ok}]</span>` : '');
      } else if (item.type === 'info') {
        line.innerHTML = item.rows.map(r => `<span class="term-info">${escape(r)}</span>`).join('<br/>');
      } else if (item.type === 'result') {
        line.innerHTML = `  <span class="term-ok">▸ Composite Score: </span><strong style="color:#F5F5F7">94.5 / 100</strong>  <span class="term-warn">grade: A</span>`;
      }

      el.appendChild(line);
      el.appendChild(document.createElement('br'));

      requestAnimationFrame(() => {
        line.style.transition = 'opacity 0.3s ease';
        line.style.opacity = '1';
      });

      i++;
      setTimeout(step, item.delay || 400);
    }
    step();
  }

  /* ============================================
     Gauge + bar sequential "fill" animation on reveal
     ============================================ */
  function initAxisFill() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        if (card.dataset.filled === '1') return;
        card.dataset.filled = '1';

        // Cascade fill for bars
        card.querySelectorAll('.ab').forEach((bar, idx) => {
          const h = bar.style.getPropertyValue('--h');
          bar.style.height = '0%';
          setTimeout(() => {
            bar.style.transition = 'height 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
            bar.style.height = h;
          }, idx * 120);
        });

        // Gauge segments
        card.querySelectorAll('.gauge-seg').forEach((seg, idx) => {
          seg.style.opacity = '0.25';
          setTimeout(() => {
            seg.style.transition = 'opacity 0.4s';
            seg.style.opacity = '1';
          }, idx * 140);
        });
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.axis-card').forEach(c => obs.observe(c));
  }

  /* ============================================
     Boot
     ============================================ */
  function boot() {
    initRipples();
    initCounters();
    renderCode();
    runTerminal();
    initAxisFill();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
