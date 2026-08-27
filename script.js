/* ================================================================
   ABHINAV TRIVEDI — PORTFOLIO 3.0 — script.js
   Cyber Neural · Deep Space · Electric Neon
   ================================================================ */
'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp  = (a, b, t) => a + (b - a) * t;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice  = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

/* ================================================================
   1. PAGE LOADER
   ================================================================ */
function initLoader() {
  const loader = $('#page-loader');
  if (!loader) return;
  const minDuration = 1100;
  const startTime   = Date.now();
  function hide() {
    const delay = Math.max(0, minDuration - (Date.now() - startTime));
    setTimeout(() => { loader.classList.add('loaded'); document.body.style.overflow = ''; }, delay);
  }
  document.readyState === 'complete' ? hide() : window.addEventListener('load', hide, { once: true });
}

/* ================================================================
   2. SCROLL PROGRESS
   ================================================================ */
function initScrollProgress() {
  const bar = $('#scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
}

/* ================================================================
   3. CUSTOM CURSOR
   ================================================================ */
function initCursor() {
  if (isTouchDevice()) return;
  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  let mx = -200, my = -200, rx = -200, ry = -200;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  }, { passive: true });
  document.addEventListener('mousedown', () => ring.classList.add('clicking'));
  document.addEventListener('mouseup',   () => ring.classList.remove('clicking'));
  (function loop() {
    rx = lerp(rx, mx, 0.13); ry = lerp(ry, my, 0.13);
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();
  const targets = 'a, button, .tech-bubble, .cert-item, .proj-col, .achievement-card, input, textarea';
  document.addEventListener('mouseover', e => { if (e.target.closest(targets)) ring.classList.add('hovered'); });
  document.addEventListener('mouseout',  e => { if (e.target.closest(targets)) ring.classList.remove('hovered'); });
}

/* ================================================================
   4. CURSOR AMBIENT LIGHT
   ================================================================ */
function initCursorLight() {
  if (isTouchDevice() || prefersReduced) return;
  const light = document.createElement('div');
  light.className = 'cursor-light';
  document.body.appendChild(light);
  let lx = window.innerWidth / 2, ly = window.innerHeight / 2, tlx = lx, tly = ly;
  document.addEventListener('mousemove', e => { tlx = e.clientX; tly = e.clientY; }, { passive: true });
  (function loop() {
    lx = lerp(lx, tlx, 0.06); ly = lerp(ly, tly, 0.06);
    light.style.left = lx + 'px'; light.style.top = ly + 'px';
    requestAnimationFrame(loop);
  })();
}

/* ================================================================
   5. BINARY RAIN RAILS (side decoration)
   ================================================================ */
function initBinaryRails() {
  if (prefersReduced) return;
  const chars = '01アイウエオカキクケコABCDEF{}[]()';
  ['left', 'right'].forEach(side => {
    const rail = document.createElement('div');
    rail.className = `binary-rail ${side}`;
    for (let i = 0; i < 30; i++) {
      const span = document.createElement('span');
      span.textContent = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('\n');
      span.style.animationDelay = (Math.random() * -12) + 's';
      rail.appendChild(span);
    }
    document.body.appendChild(rail);
  });
}

/* ================================================================
   6. HUD CORNER DECORATIONS
   ================================================================ */
function initHudCorners() {
  ['hud-tl', 'hud-tr', 'hud-bl', 'hud-br'].forEach(cls => {
    const el = document.createElement('div');
    el.className = `hud-corner ${cls}`;
    document.body.appendChild(el);
  });
}

/* ================================================================
   7. NEURAL NETWORK PARTICLE CANVAS — Main Background
   ================================================================ */
function initNeuralCanvas() {
  // Create and insert canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'neural-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);

  // Create vignette overlay
  const vignette = document.createElement('div');
  vignette.className = 'bg-vignette';
  vignette.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(vignette, canvas.nextSibling);

  // Create scanlines overlay
  const scanlines = document.createElement('div');
  scanlines.className = 'scanlines';
  scanlines.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(scanlines, vignette.nextSibling);

  if (prefersReduced) { canvas.style.display = 'none'; return; }

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── Particle configuration ───────────────────────────────────
  const NODE_COUNT    = 100;
  const CONNECT_DIST  = 140;    // max distance to draw a connection
  const MOUSE_RADIUS  = 160;    // repulsion radius
  const MOUSE_FORCE   = 0.55;
  const PULSE_CHANCE  = 0.22;   // % of nodes that "fire" periodically

  // Colour palette — purple, violet, magenta, white
  const COLORS = [
    { r: 192, g: 132, b: 252 },  // purple (primary)
    { r: 192, g: 132, b: 252 },  // purple (weighted higher)
    { r: 168, g:  85, b: 247 },  // violet
    { r: 240, g: 171, b: 252 },  // magenta-pink
    { r: 216, g: 180, b: 254 },  // pale lavender
  ];

  // Mouse position
  let mouseX = -1000, mouseY = -1000;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

  // Build particles
  const particles = Array.from({ length: NODE_COUNT }, () => {
    const col   = COLORS[Math.floor(Math.random() * COLORS.length)];
    const speed = 0.15 + Math.random() * 0.35;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r:  1.2 + Math.random() * 2.2,
      col,
      alpha: 0.35 + Math.random() * 0.55,
      isPulser: Math.random() < PULSE_CHANCE,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.018 + Math.random() * 0.025,
      pulseActive: false,
    };
  });

  // Randomly trigger pulse "firing" events
  function firePulse() {
    const p = particles.filter(n => n.isPulser);
    const chosen = p[Math.floor(Math.random() * p.length)];
    if (chosen) { chosen.pulseActive = true; setTimeout(() => { chosen.pulseActive = false; }, 600); }
    setTimeout(firePulse, 1200 + Math.random() * 2500);
  }
  firePulse();

  // ── Draw loop ────────────────────────────────────────────────
  let t = 0;
  function draw() {
    t++;
    ctx.clearRect(0, 0, W, H);

    // ── Draw connections first (behind nodes) ──
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b    = particles[j];
        const dx   = b.x - a.x;
        const dy   = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist > CONNECT_DIST) continue;

        const proximity = 1 - dist / CONNECT_DIST;
        const lineAlpha = proximity * 0.30;

        // Pulse: connections near a firing node glow briefly
        const pulseMult = (a.pulseActive || b.pulseActive) ? 3.5 : 1;

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(${a.col.r},${a.col.g},${a.col.b},${lineAlpha * pulseMult})`);
        grad.addColorStop(1, `rgba(${b.col.r},${b.col.g},${b.col.b},${lineAlpha * pulseMult})`);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = proximity * 1.2;
        ctx.stroke();
      }
    }

    // ── Draw nodes ──
    particles.forEach(p => {
      p.pulsePhase += p.pulseSpeed;
      const pulseFactor = p.isPulser ? 1 + Math.sin(p.pulsePhase) * 0.4 : 1;
      const glowFactor  = p.pulseActive ? 4 : 1;

      const r     = p.r * pulseFactor;
      const alpha = p.alpha * pulseFactor;

      // Outer glow ring
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5 * glowFactor);
      glow.addColorStop(0,   `rgba(${p.col.r},${p.col.g},${p.col.b},${0.18 * glowFactor})`);
      glow.addColorStop(0.4, `rgba(${p.col.r},${p.col.g},${p.col.b},${0.06 * glowFactor})`);
      glow.addColorStop(1,   `rgba(${p.col.r},${p.col.g},${p.col.b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 5 * glowFactor, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core node
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.col.r},${p.col.g},${p.col.b},${alpha})`;
      ctx.fill();

      // ── Move ──
      // Mouse repulsion
      const mdx  = p.x - mouseX;
      const mdy  = p.y - mouseY;
      const mdist = Math.hypot(mdx, mdy);
      if (mdist < MOUSE_RADIUS && mdist > 0.01) {
        const force = (MOUSE_RADIUS - mdist) / MOUSE_RADIUS * MOUSE_FORCE;
        p.vx += (mdx / mdist) * force * 0.12;
        p.vy += (mdy / mdist) * force * 0.12;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Drag
      p.vx *= 0.998;
      p.vy *= 0.998;

      // Maintain minimum speed
      const spd = Math.hypot(p.vx, p.vy);
      if (spd < 0.12) { const s = 0.12 / (spd || 0.001); p.vx *= s; p.vy *= s; }
      if (spd > 1.8)  { const s = 1.8  / spd;            p.vx *= s; p.vy *= s; }

      // Wrap edges (particles teleport to opposite side)
      if (p.x < -20)    p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
      if (p.y < -20)    p.y = H + 20;
      if (p.y > H + 20) p.y = -20;
    });

    requestAnimationFrame(draw);
  }
  draw();
}

/* ================================================================
   8. NAVBAR
   ================================================================ */
function initNavbar() {
  const navbar = $('#navbar');
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 300) current = s.id; });
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  }, { passive: true });
}

/* ================================================================
   9. SMOOTH SCROLL
   ================================================================ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ================================================================
   10. HERO ROLE TYPER
   ================================================================ */
function initRoleTyper() {
  const roles  = ['SOFTWARE DEV', 'CS STUDENT', 'AI ENGINEER', 'CYBER DEFENDER'];
  let idx = 0;
  const el = $('#heroRole');
  if (!el) return;
  el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  setInterval(() => {
    idx = (idx + 1) % roles.length;
    el.style.opacity = '0'; el.style.transform = 'translateY(16px)';
    setTimeout(() => { el.textContent = roles[idx]; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 320);
  }, 2800);
}

/* ================================================================
   11. COUNTER ANIMATION
   ================================================================ */
function initCounters() {
  const counters = $$('.counter');
  if (!counters.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const end = +el.dataset.target;
      if (prefersReduced) { el.textContent = end; obs.unobserve(el); return; }
      const duration = 1200;
      const startTime = performance.now();
      (function update(now) {
        const p = Math.min((now - startTime) / duration, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * end);
        if (p < 1) requestAnimationFrame(update);
        else el.textContent = end;
      })(performance.now());
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

/* ================================================================
   12. MAGNETIC ELEMENTS
   ================================================================ */
function initMagneticElements() {
  if (isTouchDevice() || prefersReduced) return;
  const targets = $$('.hero-link, .underline-link, .view-all-link, .proj-action, .social-big-link, .nav-logo, .quick-form button, .cert-cred-link');
  targets.forEach(el => {
    let bounds;
    el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
    el.addEventListener('mousemove', e => {
      if (!bounds) return;
      const dx = (e.clientX - (bounds.left + bounds.width / 2)) * 0.28;
      const dy = (e.clientY - (bounds.top  + bounds.height / 2)) * 0.28;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'transform 0.1s ease';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = ''; el.style.transition = 'transform 0.4s var(--ease-out-expo)'; bounds = null;
    });
  });
}

/* ================================================================
   13. 3D CARD TILT
   ================================================================ */
function initCardTilt() {
  if (isTouchDevice() || prefersReduced) return;
  $$('.proj-col, .achievement-card').forEach(card => {
    let bounds;
    card.addEventListener('mouseenter', () => {
      bounds = card.getBoundingClientRect();
      card.style.transition = 'background 0.5s, box-shadow 0.5s, transform 0.1s';
    });
    card.addEventListener('mousemove', e => {
      if (!bounds) return;
      const tiltX = clamp(-((e.clientY - bounds.top  - bounds.height / 2) / bounds.height) * 4, -4, 4);
      const tiltY = clamp(  (e.clientX - bounds.left - bounds.width  / 2) / bounds.width  * 4, -4, 4);
      card.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'background 0.5s, box-shadow 0.5s, transform 0.5s var(--ease-out-expo)';
      card.style.transform  = ''; bounds = null;
    });
  });
}

/* ================================================================
   14. HERO PARALLAX
   ================================================================ */
function initHeroParallax() {
  if (isTouchDevice() || prefersReduced) return;
  const avatar = $('.hero-avatar');
  if (!avatar) return;
  document.addEventListener('mousemove', e => {
    const dx = (e.clientX - window.innerWidth  / 2) / window.innerWidth;
    const dy = (e.clientY - window.innerHeight / 2) / window.innerHeight;
    avatar.style.transform = `translateY(var(--float-y, 0px)) translate(${dx * -7}px, ${dy * -5}px)`;
  }, { passive: true });
}

/* ================================================================
   15. REVEAL ANIMATIONS
   ================================================================ */
function initRevealAnimations() {
  const els = $$('.reveal, .reveal-stagger');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ================================================================
   16. CERT DRAG SCROLL
   ================================================================ */
function initCertDrag() {
  const track = $('#certScrollTrack');
  if (!track) return;
  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', e => { isDown = true; startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; });
  track.addEventListener('mouseleave', () => { isDown = false; });
  track.addEventListener('mouseup',   () => { isDown = false; });
  track.addEventListener('mousemove', e => {
    if (!isDown) return; e.preventDefault();
    track.scrollLeft = scrollLeft - (e.pageX - track.offsetLeft - startX) * 1.5;
  });
}

/* ================================================================
   17. CONTACT FORM
   ================================================================ */
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = $('#contactSubmitBtn');
    btn.textContent = 'Sent ✓';
    btn.style.borderColor = 'rgba(0,212,255,0.6)';
    btn.style.color       = 'var(--accent)';
    btn.style.boxShadow   = 'var(--neon-cyan)';
    form.reset();
    setTimeout(() => { btn.textContent = 'Send →'; btn.style.borderColor = ''; btn.style.color = ''; btn.style.boxShadow = ''; }, 3500);
  });
}

/* ================================================================
   18. CERT & ACHIEVEMENT SHEENS
   ================================================================ */
function initSheens() {
  $$('.cert-item, .achievement-card').forEach(el => {
    if (!el.querySelector('.cert-sheen, .ach-sheen')) {
      const sheen = document.createElement('div');
      sheen.className = el.classList.contains('achievement-card') ? 'ach-sheen' : 'cert-sheen';
      el.insertBefore(sheen, el.firstChild);
    }
  });
}

/* ================================================================
   19. PHYSICS BUBBLES — Glass Neural Spheres
   ================================================================ */
function initPhysicsBubbles() {
  const arena = $('#bubblesArena');
  if (!arena) return;
  const TECH = [
    { name: 'Python',     icon: 'fab fa-python',       fg: '#c8e4fc', r: 48 },
    { name: 'Java',       icon: 'fab fa-java',          fg: '#f4a76d', r: 42 },
    { name: 'JavaScript', icon: 'fab fa-js',            fg: '#f7df90', r: 46 },
    { name: 'HTML5',      icon: 'fab fa-html5',         fg: '#f09080', r: 38 },
    { name: 'CSS3',       icon: 'fab fa-css3-alt',      fg: '#90c4f5', r: 36 },
    { name: 'FastAPI',    icon: 'fas fa-bolt',          fg: '#7de8d8', r: 38 },
    { name: 'MySQL',      icon: 'fas fa-database',      fg: '#90c4f4', r: 40 },
    { name: 'Git',        icon: 'fab fa-git-alt',       fg: '#f08a70', r: 38 },
    { name: 'GitHub',     icon: 'fab fa-github',        fg: '#d8d8e4', r: 40 },
    { name: 'Linux',      icon: 'fab fa-linux',         fg: '#f0c870', r: 38 },
    { name: 'Gen AI',     icon: 'fas fa-brain',         fg: '#00d4ff', r: 44 },
    { name: 'Security',   icon: 'fas fa-shield-alt',    fg: '#86efac', r: 38 },
    { name: 'Networks',   icon: 'fas fa-network-wired', fg: '#7dd3fc', r: 40 },
    { name: 'ML',         icon: 'fas fa-robot',         fg: '#a855f7', r: 42 },
  ];
  let W = arena.clientWidth, H = arena.clientHeight;
  let mouseX = W / 2, mouseY = H / 2, mouseInArena = false;
  arena.addEventListener('mousemove', e => {
    const rect = arena.getBoundingClientRect();
    mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top; mouseInArena = true;
  }, { passive: true });
  arena.addEventListener('mouseleave', () => { mouseInArena = false; });

  const bubbles = TECH.map(t => {
    const diam = t.r * 2;
    const x = t.r + 20 + Math.random() * Math.max(0, W - diam - 40);
    const y = t.r + 20 + Math.random() * Math.max(0, H - diam - 40);
    const angle = Math.random() * Math.PI * 2;
    const el = document.createElement('div');
    el.className = 'tech-bubble';
    el.style.cssText = `width:${diam}px;height:${diam}px;left:${x - t.r}px;top:${y - t.r}px;`;
    el.innerHTML = `<i class="${t.icon}" style="color:${t.fg};font-size:${Math.round(t.r*0.60)}px;text-shadow:0 0 12px ${t.fg}44"></i><span class="bubble-name" style="font-size:${Math.max(8,Math.round(t.r*0.22))}px">${t.name}</span>`;
    arena.appendChild(el);
    return { el, x, y, r: t.r, vx: Math.cos(angle)*(0.35+Math.random()*0.55), vy: Math.sin(angle)*(0.35+Math.random()*0.55) };
  });

  // Separate on init
  for (let pass = 0; pass < 60; pass++) {
    for (let i = 0; i < bubbles.length; i++) for (let j = i + 1; j < bubbles.length; j++) {
      const a = bubbles[i], b = bubbles[j], dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy), minD = a.r + b.r;
      if (dist < minD && dist > 0.001) { const push = (minD - dist) / 2 + 0.5; const nx = dx/dist, ny = dy/dist; a.x -= nx*push; a.y -= ny*push; b.x += nx*push; b.y += ny*push; }
    }
  }

  let rafId;
  function tick() {
    W = arena.clientWidth; H = arena.clientHeight;
    for (let i = 0; i < bubbles.length; i++) {
      const a = bubbles[i];
      if (mouseInArena) {
        const dx = a.x - mouseX, dy = a.y - mouseY, d = Math.hypot(dx, dy);
        if (d < 110 && d > 0.01) { const f = (110 - d) / 110 * 0.9; a.vx += (dx/d)*f*0.18; a.vy += (dy/d)*f*0.18; }
      }
      a.x += a.vx; a.y += a.vy;
      a.vx *= 0.999; a.vy *= 0.999;
      const spd = Math.hypot(a.vx, a.vy);
      if (spd < 0.18) { const s = 0.18/(spd||0.001); a.vx *= s; a.vy *= s; }
      if (spd > 2.5)  { const s = 2.5/spd;            a.vx *= s; a.vy *= s; }
      if (a.x - a.r < 0)    { a.x = a.r;     a.vx =  Math.abs(a.vx); }
      if (a.x + a.r > W)    { a.x = W - a.r; a.vx = -Math.abs(a.vx); }
      if (a.y - a.r < 0)    { a.y = a.r;     a.vy =  Math.abs(a.vy); }
      if (a.y + a.r > H)    { a.y = H - a.r; a.vy = -Math.abs(a.vy); }
      for (let j = i + 1; j < bubbles.length; j++) {
        const b = bubbles[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), minD = a.r + b.r;
        if (dist < minD && dist > 0.01) {
          const ov = (minD - dist) * 0.5 + 0.5, nx = dx/dist, ny = dy/dist;
          a.x -= nx*ov; a.y -= ny*ov; b.x += nx*ov; b.y += ny*ov;
          const dot = (a.vx-b.vx)*nx + (a.vy-b.vy)*ny;
          if (dot > 0) { const imp = dot*0.9; a.vx -= imp*nx; a.vy -= imp*ny; b.vx += imp*nx; b.vy += imp*ny; }
        }
      }
      a.el.style.left = (a.x - a.r) + 'px';
      a.el.style.top  = (a.y - a.r) + 'px';
    }
    rafId = requestAnimationFrame(tick);
  }
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!rafId) tick(); }
    else { cancelAnimationFrame(rafId); rafId = null; }
  }, { threshold: 0.05 }).observe(arena);
  window.addEventListener('resize', () => { W = arena.clientWidth; H = arena.clientHeight; }, { passive: true });
}

/* ================================================================
   20. HERO NAME GLITCH — data-text attribute for pseudo-elements
   ================================================================ */
function initGlitch() {
  const heroName = $('.hero-name');
  if (!heroName) return;
  heroName.setAttribute('data-text', heroName.textContent.replace(/\s+/g, ' ').trim());
}

/* ================================================================
   21. INIT ALL
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.overflow = 'hidden';

  initLoader();
  initScrollProgress();
  initNeuralCanvas();     // ← New: neural particle mesh background
  initBinaryRails();      // ← New: side binary decoration
  initHudCorners();       // ← New: corner HUD marks
  initCursor();
  initCursorLight();
  initNavbar();
  initSmoothScroll();
  initRoleTyper();
  initCounters();
  initRevealAnimations();
  initContactForm();
  initCertDrag();
  initSheens();
  initPhysicsBubbles();
  initGlitch();

  if (!isTouchDevice() && !prefersReduced) {
    requestAnimationFrame(() => {
      initMagneticElements();
      initCardTilt();
      initHeroParallax();
    });
  }
});
