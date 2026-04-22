/* ============================================
   main.js — Orchestration: nav, cascade, gallery tabs
   ============================================ */

(function () {
  'use strict';

  /* ============================================
     Unified scroll handler — nav state, progress bar,
     parallax on hero bg, rAF-throttled
     ============================================ */
  function initScroll() {
    const nav = document.getElementById('nav');
    const progress = document.getElementById('scroll-progress');
    const heroBg = document.querySelector('.hero-bg');
    const hGridGlow = document.querySelector('.h-grid-glow');

    let ticking = false;
    let lastY = window.scrollY;

    function update() {
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? Math.min(y / docH, 1) : 0;

      // Nav state
      if (nav) nav.classList.toggle('scrolled', y > 24);

      // Progress bar — width + hue shift based on scroll pct
      if (progress) {
        progress.style.width = (pct * 100).toFixed(2) + '%';
        progress.style.filter = `hue-rotate(${(pct * 90).toFixed(1)}deg)`;
      }

      // Hero parallax — pulse rings move slightly, fade out
      if (heroBg && y < window.innerHeight * 1.2) {
        const heroPct = Math.min(y / window.innerHeight, 1);
        heroBg.style.transform = `translateY(${y * 0.3}px)`;
        heroBg.style.opacity = String(1 - heroPct * 0.5);
      }

      // Harness section accent glow tracks scroll
      if (hGridGlow) {
        const harnessEl = document.getElementById('harness');
        if (harnessEl) {
          const rect = harnessEl.getBoundingClientRect();
          const inView = rect.top < window.innerHeight && rect.bottom > 0;
          hGridGlow.style.opacity = inView ? '1' : '0';
        }
      }

      ticking = false;
      lastY = y;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* ============================================
     Cascade reveal — initial hero (immediate)
     ============================================ */
  function initHeroCascade() {
    document.querySelectorAll('.hero [data-cascade]').forEach(el => {
      const delay = parseInt(el.dataset.cascadeDelay || '0', 10);
      setTimeout(() => el.classList.add('in'), delay);
    });
  }

  /* ============================================
     Reveal on scroll — pillars, axes, wfs
     ============================================ */
  function initReveal() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(entry.target.parentNode.children).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('in');
          }, idx * 90);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  /* ============================================
     Section-based [data-cascade] below hero
     ============================================ */
  function initSectionCascade() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.cascadeDelay || '0', 10);
          setTimeout(() => entry.target.classList.add('in'), delay);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('section:not(.hero) [data-cascade]').forEach(el => obs.observe(el));
  }

  /* ============================================
     Gallery tabs
     ============================================ */
  function initGalleryTabs() {
    const tabs = document.querySelectorAll('.gt');
    const panes = document.querySelectorAll('.gpane');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.cat;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panes.forEach(p => p.classList.toggle('active', p.dataset.pane === cat));
      });
    });
  }

  /* ============================================
     CTA smooth scroll
     ============================================ */
  function initCTAs() {
    const map = {
      'cta-primary':    '#design-system',
      'cta-secondary':  '#harness',
      'cta-scroll-top': '#hero',
    };
    Object.entries(map).forEach(([id, target]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Nav links smooth scroll
    document.querySelectorAll('.nav-links a, .nav-brand').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const el = document.querySelector(href);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ============================================
     Boot
     ============================================ */
  function boot() {
    initScroll();
    initHeroCascade();
    initReveal();
    initSectionCascade();
    initGalleryTabs();
    initCTAs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
