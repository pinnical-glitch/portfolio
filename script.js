(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* =========================================================
     SPA ROUTING — each numbered section is its own page
     ========================================================= */
  const pages = document.querySelectorAll('.page');
  const pageMap = {};
  pages.forEach(p => { pageMap[p.dataset.page] = p; });

  const ROUTES = {
    'intro': 'intro', 'process': 'process', 'work': 'work',
    'toolkit': 'toolkit', 'journey': 'journey', 'contact': 'contact',
    'project-kelvin': 'project-kelvin', 'project-energy': 'project-energy', 'project-budget': 'project-budget',
  };

  function showPage(pageName) {
    pages.forEach(p => p.classList.remove('is-active'));
    if (pageMap[pageName]) pageMap[pageName].classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function navigate(hash) {
    const clean = hash.replace('#', '');
    const route = ROUTES[clean] || 'intro';
    showPage(route);
    document.querySelectorAll('.nav__links a').forEach(a => a.classList.remove('is-active'));
    const match = document.querySelector(`.nav__links a[href="${hash}"]`);
    if (match) match.classList.add('is-active');
  }

  function handleHash() {
    const hash = location.hash || '#intro';
    navigate(hash);
  }

  window.addEventListener('hashchange', handleHash);
  if (!location.hash) {
    history.replaceState(null, '', '#intro');
  }
  handleHash();

  /* =========================================================
     LERP HELPER
     ========================================================= */
  const lerp = (a, b, t) => a + (b - a) * t;

  /* =========================================================
     CUSTOM CURSOR
     ========================================================= */
  if (isFinePointer && !reduceMotion) {
    document.body.classList.add('cursor-ready');
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my, dx = mx, dy = my;

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    const interactive = 'a, button, .pcard, .chip, [data-cursor-hover]';
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest(interactive)) ring.classList.add('is-active');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest(interactive)) ring.classList.remove('is-active');
    });

    function tickCursor() {
      dx = lerp(dx, mx, 0.55);
      dy = lerp(dy, my, 0.55);
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tickCursor);
    }
    requestAnimationFrame(tickCursor);
  }

  /* =========================================================
     BACKGROUND STARFIELD
     ========================================================= */
  (function initStars() {
    const canvas = document.getElementById('starsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, stars = [];

    function buildStars() {
      const count = Math.round((w * h) / 2600);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        depth: Math.random() * 0.6 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0012 + 0.0006,
      }));
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      if (reduceMotion) drawFrame(0, window.scrollY);
    }

    function drawFrame(ts, scrollY) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(239, 231, 210, 1)';
      stars.forEach(s => {
        const twinkle = reduceMotion ? 0.72 : (Math.sin(ts * s.speed + s.phase) * 0.35 + 0.65);
        let y = s.y;
        if (!reduceMotion) {
          const offsetY = (scrollY * s.depth * 0.06) % h;
          y = s.y - offsetY;
          if (y < -4) y += h;
          if (y > h + 4) y -= h;
        }
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    resize();
    window.addEventListener('resize', resize);

    const docEl = document.documentElement;
    let starsRunning = false;
    function starsFrame(ts) {
      if (docEl.getAttribute('data-theme') === 'workshop') {
        ctx.clearRect(0, 0, w, h);
        starsRunning = false;
        return;
      }
      drawFrame(ts, window.scrollY);
      requestAnimationFrame(starsFrame);
    }
    function starsStart() {
      if (reduceMotion) { drawFrame(0, 0); return; }
      if (!starsRunning && docEl.getAttribute('data-theme') !== 'workshop') {
        starsRunning = true;
        requestAnimationFrame(starsFrame);
      }
    }
    starsStart();
    new MutationObserver(starsStart).observe(docEl, { attributes: true, attributeFilter: ['data-theme'] });
  })();

  /* =========================================================
     NAV: scroll state + mobile menu
     ========================================================= */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  const onScrollNav = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* =========================================================
     THEME
     ========================================================= */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      const isWorkshop = theme === 'workshop';
      themeToggle.setAttribute('aria-pressed', String(isWorkshop));
      themeToggle.setAttribute(
        'aria-label',
        isWorkshop ? 'Switch to observatory (night) mode' : 'Switch to workshop (day) mode'
      );
    }
  };

  let stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  const initialTheme = stored
    || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'workshop' : 'observatory');
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'workshop' ? 'observatory' : 'workshop';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* =========================================================
     PARCHMENT BACKGROUND
     ========================================================= */
  (function initParchment() {
    const canvas = document.getElementById('parchmentCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) draw(0);
    }

    function draw(ts) {
      ctx.clearRect(0, 0, w, h);
      const gap = 46;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(29, 26, 19, 0.05)';
      ctx.beginPath();
      for (let x = 0; x <= w; x += gap) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += gap) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      const cols = ['rgba(138,93,34,0.10)', 'rgba(14,123,117,0.08)'];
      const motifs = 5;
      for (let i = 0; i < motifs; i++) {
        const speed = 0.00004 + i * 0.00001;
        const ang = (i * 2.39) + (reduceMotion ? 0 : ts * speed);
        const cx = w * (0.2 + 0.6 * ((i * 0.37) % 1)) + Math.cos(ang) * 30;
        const cy = h * (0.15 + 0.7 * ((i * 0.53) % 1)) + Math.sin(ang) * 30;
        const r = 70 + i * 46;
        ctx.strokeStyle = cols[i % 2];
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2); ctx.stroke();
      }
    }

    resize();
    window.addEventListener('resize', resize);
    const docEl = document.documentElement;
    let parchmentRunning = false;
    function parchmentFrame(ts) {
      if (docEl.getAttribute('data-theme') !== 'workshop') {
        parchmentRunning = false;
        return;
      }
      draw(ts);
      requestAnimationFrame(parchmentFrame);
    }
    function parchmentStart() {
      if (docEl.getAttribute('data-theme') !== 'workshop') { ctx.clearRect(0, 0, w, h); return; }
      if (reduceMotion) { draw(0); return; }
      if (!parchmentRunning) { parchmentRunning = true; requestAnimationFrame(parchmentFrame); }
    }
    parchmentStart();
    new MutationObserver(parchmentStart).observe(docEl, { attributes: true, attributeFilter: ['data-theme'] });
  })();

  /* =========================================================
     CONTACT FORM
     ========================================================= */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const status = document.getElementById('contactStatus');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.elements.name.value.trim();
      const email = contactForm.elements.email.value.trim();
      const message = contactForm.elements.message.value.trim();
      let firstInvalid = null;
      [['name', name], ['email', email], ['message', message]].forEach(([k, v]) => {
        const el = contactForm.elements[k];
        const bad = !v || (k === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
        el.setAttribute('aria-invalid', String(bad));
        if (bad && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) {
        status.textContent = 'Please complete the highlighted fields.';
        status.setAttribute('data-error', 'true');
        firstInvalid.focus();
        return;
      }
      const subject = encodeURIComponent(`Portfolio thread — ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:hello@andrew.dev?subject=${subject}&body=${body}`;
      status.removeAttribute('data-error');
      status.textContent = 'Opening your mail client…';
      contactForm.reset();
    });
  }

  /* =========================================================
     NAV ACTIVE STATE — follow current hash
     ========================================================= */
  function updateActiveNav() {
    const hash = location.hash || '#intro';
    document.querySelectorAll('.nav__links a').forEach(a => {
      a.classList.toggle('is-active', a.getAttribute('href') === hash);
    });
  }
  window.addEventListener('hashchange', updateActiveNav);
  updateActiveNav();

  /* =========================================================
     SCROLL DIAL
     ========================================================= */
  const dial = document.getElementById('dial');
  const dialPct = document.getElementById('dialPct');
  const dialNeedle = document.getElementById('dialNeedle');
  const dialProgress = document.getElementById('dialProgress');
  const dialTicks = document.getElementById('dialTicks');

  const DIAL_R = 42;
  const DIAL_CIRC = 2 * Math.PI * DIAL_R;

  if (dial && dialNeedle) {
    if (dialTicks) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const N = 12;
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2;
        const major = i % 3 === 0;
        const rIn = major ? 36 : 39;
        const x1 = 50 + Math.cos(ang) * rIn;
        const y1 = 50 + Math.sin(ang) * rIn;
        const x2 = 50 + Math.cos(ang) * 44;
        const y2 = 50 + Math.sin(ang) * 44;
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1.toFixed(2));
        line.setAttribute('y1', y1.toFixed(2));
        line.setAttribute('x2', x2.toFixed(2));
        line.setAttribute('y2', y2.toFixed(2));
        line.setAttribute('class', 'dial__tick');
        dialTicks.appendChild(line);
      }
    }

    if (dialProgress) {
      dialProgress.setAttribute('transform', 'rotate(-90 50 50)');
      dialProgress.style.strokeDasharray = `${DIAL_CIRC.toFixed(2)}`;
      dialProgress.style.strokeDashoffset = `${DIAL_CIRC.toFixed(2)}`;
    }

    let dialTarget = 0;
    let dialShown = 0;
    let dialRaf = null;

    const paintDial = () => {
      const deg = dialShown * 360;
      dialNeedle.setAttribute('transform', `rotate(${deg.toFixed(2)} 50 50)`);
      if (dialProgress) {
        dialProgress.style.strokeDashoffset = (DIAL_CIRC * (1 - dialShown)).toFixed(2);
      }
      if (dialPct) dialPct.textContent = String(Math.round(dialShown * 100));
    };

    const spinDial = () => {
      if (dialRaf) return;
      const step = () => {
        dialShown = lerp(dialShown, dialTarget, 0.12);
        paintDial();
        if (Math.abs(dialShown - dialTarget) > 0.0005) {
          dialRaf = requestAnimationFrame(step);
        } else {
          dialShown = dialTarget;
          paintDial();
          dialRaf = null;
        }
      };
      dialRaf = requestAnimationFrame(step);
    };

    const readProgress = () => {
      const s = document.scrollingElement || document.documentElement;
      const max = s.scrollHeight - s.clientHeight;
      dialTarget = max > 0 ? Math.min(1, Math.max(0, s.scrollTop / max)) : 0;
      if (reduceMotion) { dialShown = dialTarget; paintDial(); }
      else spinDial();
    };
    readProgress();
    window.addEventListener('scroll', readProgress, { passive: true });
    window.addEventListener('resize', readProgress);

    const toTop = () => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    dial.addEventListener('click', toTop);
    dial.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toTop(); }
    });
  }

  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */
  let revealIo = null;
  function initReveal() {
    if (revealIo) revealIo.disconnect();
    const revealEls = document.querySelectorAll('.page.is-active [data-reveal]');
    if ('IntersectionObserver' in window) {
      revealIo = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = Math.min(i * 40, 200);
            setTimeout(() => el.classList.add('is-visible'), delay);
            revealIo.unobserve(el);
          }
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(el => revealIo.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }
    setTimeout(() => {
      document.querySelectorAll('.page.is-active [data-reveal]').forEach(el => el.classList.add('is-visible'));
    }, 1600);
  }

  initReveal();

  window.addEventListener('hashchange', () => {
    setTimeout(initReveal, 50);
  });

  /* =========================================================
     HERO — TEAR REVEAL + PARALLAX
     ========================================================= */
  const heroStage = document.getElementById('heroStage');
  const artOver = document.getElementById('artOver');
  const artUnder = document.getElementById('artUnder');
  const hero = document.querySelector('.hero');

  if (heroStage && artOver && artUnder && hero) {
    let heroProgress = 0;
    let targetProgress = 0;
    let px = 0, py = 0, tpx = 0, tpy = 0;

    function computeHeroProgress() {
      const rect = hero.getBoundingClientRect();
      const total = rect.height;
      const scrolledPast = Math.min(Math.max(-rect.top, 0), total);
      targetProgress = total > 0 ? scrolledPast / total : 0;
    }
    computeHeroProgress();
    window.addEventListener('scroll', computeHeroProgress, { passive: true });
    window.addEventListener('resize', computeHeroProgress);

    if (isFinePointer && !reduceMotion) {
      hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        tpx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        tpy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      });
      hero.addEventListener('pointerleave', () => { tpx = 0; tpy = 0; });
    }

    function wedgeClipPath(p) {
      const reach = 140;
      const x = -20 + p * reach;
      const y = 120 - p * reach;
      return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${Math.max(0, y)}%, ${Math.min(100, x)}% 100%)`;
    }

    function tickHero() {
      heroProgress = lerp(heroProgress, targetProgress, reduceMotion ? 1 : 0.08);
      px = lerp(px, tpx, 0.06);
      py = lerp(py, tpy, 0.06);

      if (!reduceMotion) {
        artOver.style.clipPath = wedgeClipPath(Math.min(heroProgress * 1.6, 1));
        const parallaxOver = heroProgress * -40;
        const parallaxUnder = heroProgress * -14;
        artOver.style.transform = `translate(calc(-50% + ${px * 10}px), calc(-50% + ${parallaxOver}px + ${py * 8}px)) scale(${1 + heroProgress * 0.04})`;
        artUnder.style.transform = `translate(calc(-50% + ${px * 5}px), calc(-50% + ${parallaxUnder}px + ${py * 4}px)) scale(${1 + heroProgress * 0.02})`;
        heroStage.style.opacity = String(1 - Math.max(0, heroProgress - 0.75) * 4);
      }
      requestAnimationFrame(tickHero);
    }
    requestAnimationFrame(tickHero);
  }

  /* =========================================================
     KELVIN WATER DROPPER
     ========================================================= */
  function initKdrop(prefix) {
    const trigger = document.getElementById('kdropTrigger' + prefix);
    const fill = document.getElementById('chargeFill' + prefix);
    const readout = document.getElementById('chargeReadout' + prefix);
    const kdrop = document.getElementById('kdrop' + prefix);
    const dropIds = ['dropL1', 'dropL2', 'dropR1', 'dropR2'].map(id => document.getElementById(id + prefix));
    const ringL = document.getElementById('ringL' + prefix);
    const ringR = document.getElementById('ringR' + prefix);
    const ballL = document.getElementById('ballL' + prefix);
    const ballR = document.getElementById('ballR' + prefix);
    const glowL = document.getElementById('glowL' + prefix);
    const glowR = document.getElementById('glowR' + prefix);
    const sparkBolt = document.getElementById('sparkBolt' + prefix);

    if (!trigger || !fill || !readout || !kdrop) return;

    let kdropRunning = false;
    let charge = 0;
    let dropClock = 0;
    let rafId = null;

    function setDropPosition(el, index, t) {
      const startY = 112, endY = 235;
      const y = lerp(startY, endY, t);
      el.setAttribute('cy', y.toFixed(1));
      el.style.opacity = t < 0.02 || t > 0.98 ? '0' : '1';
    }

    function fireSpark() {
      sparkBolt.style.opacity = '1';
      const x1 = 190, x2 = 290, y = 233;
      const mid = (x1 + x2) / 2;
      sparkBolt.innerHTML = `<path d="M${x1},${y} L${mid - 6},${y - 9} L${mid + 4},${y + 7} L${x2},${y}" fill="none"/>`;
      setTimeout(() => { sparkBolt.style.opacity = '0'; }, 160);
      ballL.style.fill = 'var(--spark)';
      ballR.style.fill = 'var(--spark)';
      setTimeout(() => { ballL.style.fill = ''; ballR.style.fill = ''; }, 220);
    }

    function stepKdrop(dt) {
      dropClock += dt;
      const cycle = 900;
      const phase = (dropClock % cycle) / cycle;
      setDropPosition(dropIds[0], 0, phase);
      setDropPosition(dropIds[2], 2, phase);
      const phase2 = ((dropClock + cycle * 0.5) % cycle) / cycle;
      setDropPosition(dropIds[1], 1, phase2);
      setDropPosition(dropIds[3], 3, phase2);

      if (charge < 1) {
        charge = Math.min(1, charge + dt / 5200);
      }

      const pct = Math.round(charge * 100);
      fill.style.width = `${pct}%`;
      readout.textContent = `${pct}%`;

      const ringPulse = 0.85 + Math.sin(dropClock / 260) * 0.06 * charge;
      ringL.style.opacity = String(0.4 + charge * 0.6 * ringPulse);
      ringR.style.opacity = String(0.4 + charge * 0.6 * ringPulse);

      glowL.style.opacity = String(charge * 0.55);
      glowR.style.opacity = String(charge * 0.55);

      if (charge >= 1) {
        fireSpark();
        charge = 0;
      }
    }

    let lastTs = 0;
    function loop(ts) {
      if (!kdropRunning) return;
      const dt = lastTs ? ts - lastTs : 16;
      lastTs = ts;
      stepKdrop(Math.min(dt, 48));
      rafId = requestAnimationFrame(loop);
    }

    function startKdrop() {
      if (kdropRunning) return;
      kdropRunning = true;
      lastTs = 0;
      const span = trigger.querySelector('span');
      if (span) span.textContent = 'Flowing…';
      rafId = requestAnimationFrame(loop);
    }

    trigger.addEventListener('click', startKdrop);
    kdrop.addEventListener('click', (e) => {
      if (!e.target.closest('.kdrop__trigger' + prefix)) startKdrop();
    });

    if (!reduceMotion && 'IntersectionObserver' in window) {
      const kio = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startKdrop();
            kio.unobserve(kdrop);
          }
        });
      }, { threshold: 0.4 });
      kio.observe(kdrop);
    }
  }

  initKdrop('-detail');

  /* =========================================================
     PROJECT CARD TILT
     ========================================================= */
  if (isFinePointer && !reduceMotion) {
    document.querySelectorAll('.pcard').forEach(card => {
      let tx = 0, ty = 0, cx = 0, cy = 0;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 6;
        ty = ((e.clientY - r.top) / r.height - 0.5) * -6;
      });
      card.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
      function tiltTick() {
        cx = lerp(cx, tx, 0.12);
        cy = lerp(cy, ty, 0.12);
        card.style.transform = `rotateX(${cy}deg) rotateY(${cx}deg) translateZ(0)`;
        requestAnimationFrame(tiltTick);
      }
      requestAnimationFrame(tiltTick);
    });
  }

  /* =========================================================
     PROJECT CARD MOTIF CANVASES
     ========================================================= */
  function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return { ctx, resize };
  }

  const styles = getComputedStyle(document.documentElement);
  const COL = {
    ink: styles.getPropertyValue('--ink').trim(),
    ink2: styles.getPropertyValue('--ink-2').trim(),
    ink3: styles.getPropertyValue('--ink-3').trim(),
    parchment: styles.getPropertyValue('--parchment').trim(),
    parchmentDim: styles.getPropertyValue('--parchment-dim').trim(),
    brass: styles.getPropertyValue('--brass').trim(),
    spark: styles.getPropertyValue('--spark').trim(),
  };

  const motifDrawers = {
    energy(ctx, w, h, t) {
      ctx.clearRect(0, 0, w, h);
      const bars = 7;
      const gap = w / (bars + 1);
      for (let i = 0; i < bars; i++) {
        const x = gap * (i + 1);
        const wave = Math.sin(t / 900 + i * 0.7) * 0.5 + 0.5;
        const bh = h * (0.18 + wave * 0.55);
        const grad = ctx.createLinearGradient(0, h - bh, 0, h);
        grad.addColorStop(0, COL.spark);
        grad.addColorStop(1, COL.brass);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.85;
        const bw = gap * 0.4;
        roundRect(ctx, x - bw / 2, h - bh, bw, bh, 4);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(239,231,210,0.14)';
      ctx.beginPath(); ctx.moveTo(0, h - 1); ctx.lineTo(w, h - 1); ctx.stroke();
    },
    budget(ctx, w, h, t) {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = COL.spark;
      ctx.beginPath();
      const pts = 24;
      for (let i = 0; i <= pts; i++) {
        const x = (w / pts) * i;
        const n = Math.sin(i * 0.6 + t / 1100) * 0.5 + Math.sin(i * 0.21 - t / 1700) * 0.5;
        const y = h * 0.55 - n * h * 0.28 - Math.sin(t/2600) * 6;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(201,154,83,0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const x = (w / pts) * i;
        const n = Math.sin(i * 0.4 - t / 1400) * 0.5;
        const y = h * 0.72 - n * h * 0.16;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    clinic(ctx, w, h, t) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const pulse = Math.sin(t / 700) * 0.5 + 0.5;
      const r = Math.min(w, h) * (0.14 + pulse * 0.02);
      ctx.strokeStyle = COL.spark;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, cy);
      ctx.lineTo(cx + r * 0.45, cy);
      ctx.moveTo(cx, cy - r * 0.45);
      ctx.lineTo(cx, cy + r * 0.45);
      ctx.strokeStyle = COL.brass;
      ctx.stroke();
      for (let ring = 1; ring <= 2; ring++) {
        ctx.globalAlpha = 0.18 / ring;
        ctx.beginPath();
        ctx.arc(cx, cy, r + ring * 22 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = COL.parchmentDim;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    atelier(ctx, w, h, t) {
      ctx.clearRect(0, 0, w, h);
      const lines = 5;
      for (let i = 0; i < lines; i++) {
        const y = (h / (lines + 1)) * (i + 1);
        const drift = Math.sin(t / 1600 + i) * 8;
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(239,231,210,0.35)' : 'rgba(201,154,83,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0 + drift, y);
        ctx.bezierCurveTo(w * 0.33, y - 14, w * 0.66, y + 14, w + drift, y);
        ctx.stroke();
      }
    },
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const canvases = document.querySelectorAll('.pcard__canvas');
  const canvasStates = [];
  canvases.forEach(canvas => {
    const motif = canvas.dataset.motif;
    const drawer = motifDrawers[motif];
    if (!drawer) return;
    const { ctx, resize } = setupCanvas(canvas);
    canvasStates.push({ canvas, ctx, drawer, resize, visible: false });
  });

  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const state = canvasStates.find(s => s.canvas === entry.target);
        if (state) state.visible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    canvasStates.forEach(s => cio.observe(s.canvas));
  } else {
    canvasStates.forEach(s => s.visible = true);
  }

  function motifLoop(ts) {
    canvasStates.forEach(s => {
      if (!s.visible) return;
      const r = s.canvas.getBoundingClientRect();
      s.drawer(s.ctx, r.width, r.height, reduceMotion ? 0 : ts);
    });
    requestAnimationFrame(motifLoop);
  }
  requestAnimationFrame(motifLoop);

  /* =========================================================
     MAGNETIC BUTTONS
     ========================================================= */
  if (isFinePointer && !reduceMotion) {
    document.querySelectorAll('.btn--solid, .btn--ghost').forEach(btn => {
      let bx = 0, by = 0, tx = 0, ty = 0;
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * 0.25;
        ty = (e.clientY - r.top - r.height / 2) * 0.35;
      });
      btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
      function magTick() {
        bx = lerp(bx, tx, 0.18);
        by = lerp(by, ty, 0.18);
        btn.style.transform = `translate(${bx}px, ${by}px)`;
        requestAnimationFrame(magTick);
      }
      requestAnimationFrame(magTick);
    });
  }

})();
