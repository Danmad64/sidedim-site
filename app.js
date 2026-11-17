/* SideDim website: all effects are hand-made canvas/CSS, nothing loaded from elsewhere. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  /* Runs a draw loop only while the element is on screen (saves battery). */
  function loop(el, draw) {
    let on = false, raf = 0, last = performance.now();
    const tick = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; draw(now / 1000, dt); if (on) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(tick); }
      else if (!e.isIntersecting) { on = false; cancelAnimationFrame(raf); }
    }, { rootMargin: "100px" }).observe(el);
    if (reduce) requestAnimationFrame(t => draw(t / 1000, 0));
  }

  /* Canvas that matches its CSS size and the screen's pixel density. */
  function fit(canvas) {
    const ctx = canvas.getContext("2d");
    const resize = () => {
      const r = canvas.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * d)); canvas.height = Math.max(1, Math.round(r.height * d));
      ctx.setTransform(d, 0, 0, d, 0, 0); canvas._w = r.width; canvas._h = r.height;
    };
    resize(); new ResizeObserver(resize).observe(canvas);
    return ctx;
  }

  /* ---------------- headline letters ---------------- */
  let delay = 0.15;
  $$("[data-split]").forEach(line => {
    const text = line.textContent; line.textContent = "";
    for (const word of text.split(" ")) {
      const w = document.createElement("span"); w.style.whiteSpace = "nowrap"; w.style.display = "inline-block";
      for (const ch of word) { const s = document.createElement("span"); s.className = "ch"; s.textContent = ch; s.style.animationDelay = (delay += 0.028).toFixed(3) + "s"; w.append(s); }
      line.append(w, " ");
    }
    // once the letters have landed, put the plain text back (so the gradient line shows its gradient)
    setTimeout(() => { line.textContent = text; }, (delay + 0.85) * 1000);
  });

  /* ---------------- page background: slow stars + cursor light ---------------- */
  {
    const c = $("#starsBg"), ctx = fit(c);
    const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0.3, 1.3), p: rand(0, TAU), s: rand(0.3, 1.2) }));
    let scrollY = 0;
    const progress = $(".progress");
    const onScroll = () => {
      scrollY = window.scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    const draw = t => {
      ctx.clearRect(0, 0, c._w, c._h);
      for (const s of stars) {
        const y = ((s.y * c._h - scrollY * 0.08 * s.s) % c._h + c._h) % c._h;
        ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.s * 1.5 + s.p));
        ctx.fillStyle = "#cfd3ff"; ctx.beginPath(); ctx.arc(s.x * c._w, y, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    (function frame(now) { draw(now / 1000); if (!reduce) requestAnimationFrame(frame); })(performance.now());
    addEventListener("pointermove", e => {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
  }

  /* ---------------- scroll reveal + counters ---------------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io.unobserve(e.target);
    $$("[data-count]", e.target).forEach(n => {
      const end = +n.dataset.count, t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 1400); n.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }), { threshold: 0.15 });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------------- tilt cards + magnetic buttons ---------------- */
  $$(".tilt").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--x", x * 100 + "%"); card.style.setProperty("--y", y * 100 + "%");
      if (!reduce) card.style.transform = `perspective(700px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => card.style.transform = "");
  });
  $$(".magnetic").forEach(b => {
    b.addEventListener("pointermove", e => { if (reduce) return; const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
    b.addEventListener("pointerleave", () => b.style.transform = "");
  });

  /* ---------------- a tiny "game": a drifting synthwave sunset ---------------- */
  function gameScene(ctx, w, h, t) {
    const hue = (t * 18) % 360;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, `hsl(${(hue + 250) % 360} 70% 12%)`); sky.addColorStop(0.55, `hsl(${(hue + 320) % 360} 80% 40%)`); sky.addColorStop(0.62, `hsl(${(hue + 20) % 360} 95% 60%)`);
    sky.addColorStop(0.63, "#0b0618"); sky.addColorStop(1, `hsl(${(hue + 270) % 360} 60% 10%)`);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // sun with stripes
    const sx = w * 0.5, sy = h * 0.5, sr = h * 0.2;
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.clip();
    const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr); sun.addColorStop(0, `hsl(${(hue + 50) % 360} 100% 65%)`); sun.addColorStop(1, `hsl(${(hue + 330) % 360} 100% 55%)`);
    ctx.fillStyle = sun; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    ctx.fillStyle = "rgba(11,6,24,.9)"; for (let i = 0; i < 5; i++) ctx.fillRect(sx - sr, sy + sr * (0.1 + i * 0.18), sr * 2, sr * 0.04 + i * 1.2);
    ctx.restore();
    // grid floor
    const hy = h * 0.625; ctx.strokeStyle = `hsl(${(hue + 300) % 360} 100% 65% / .7)`; ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * w * 0.02, hy); ctx.lineTo(w / 2 + i * w * 0.16, h); ctx.stroke(); }
    for (let i = 0; i < 8; i++) { const k = ((i + (t * 0.8) % 1) / 8); const y = hy + (h - hy) * k * k; ctx.globalAlpha = k; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    return `hsl(${(hue + 320) % 360} 90% 55%)`; // the colour at the game's edge (for Ambient glow)
  }

  /* ---------------- HERO demo timeline ---------------- */
  {
    const desk = $("#heroDesk"), side = $("#heroSide"), left = desk.querySelector(".monitor.left .screen");
    const gameCanvas = $("#heroGame"), gctx = fit(gameCanvas);
    const dim = side.querySelector(".dimmer"), amb = side.querySelector(".ambient"), pills = $$("#heroSteps span");
    let edge = "#ff2e97";
    loop(desk, t => { edge = gameScene(gctx, gameCanvas._w, gameCanvas._h, t); amb.style.setProperty("--amb", edge); });
    const set = n => pills.forEach((p, i) => p.classList.toggle("on", i === n));
    const timeline = [
      [0, () => { left.classList.remove("playing"); dim.style.opacity = 0; amb.style.opacity = 0; side.classList.remove("spot"); set(0); }],
      [1800, () => { left.classList.add("playing"); set(1); }],
      [2800, () => { dim.style.opacity = 0.86; amb.style.opacity = 0.55; set(2); }],
      [5600, () => { side.classList.add("spot"); set(3); }],
      [8800, () => { side.classList.remove("spot"); set(2); }],
      [11000, null],
    ];
    let timers = [];
    const run = () => { timers.forEach(clearTimeout); timers = timeline.map(([ms, f]) => setTimeout(f || run, ms)); };
    if (reduce) { left.classList.add("playing"); dim.style.opacity = 0.86; side.classList.add("spot"); set(3); } else run();
    pills.forEach((p, i) => p.addEventListener("click", () => { timers.forEach(clearTimeout); timeline[0][1](); if (i >= 1) left.classList.add("playing"); if (i >= 2) { dim.style.opacity = .86; amb.style.opacity = .55; } if (i === 3) side.classList.add("spot"); set(i); }));
  }

  /* ---------------- before/after slider ---------------- */
  {
    const c = $("#compare");
    const setPos = x => { const r = c.getBoundingClientRect(); const p = Math.max(3, Math.min(97, (x - r.left) / r.width * 100)); c.style.setProperty("--pos", p + "%"); c.setAttribute("aria-valuenow", Math.round(p)); };
    let drag = false;
    c.addEventListener("pointerdown", e => { drag = true; c.setPointerCapture(e.pointerId); setPos(e.clientX); });
    c.addEventListener("pointermove", e => drag && setPos(e.clientX));
    c.addEventListener("pointerup", () => drag = false);
    c.addEventListener("keydown", e => { const v = +c.getAttribute("aria-valuenow"); if (e.key === "ArrowLeft" || e.key === "ArrowRight") { const r = c.getBoundingClientRect(); setPos(r.left + r.width * (v + (e.key === "ArrowLeft" ? -5 : 5)) / 100); e.preventDefault(); } });
    // a little nudge when it first appears
    new IntersectionObserver(([e], o) => { if (!e.isIntersecting || reduce) return; o.disconnect(); const t0 = performance.now(); const s = now => { const k = (now - t0) / 1600; if (k > 1) return; c.style.setProperty("--pos", 50 + Math.sin(k * TAU) * 22 + "%"); requestAnimationFrame(s); }; requestAnimationFrame(s); }, { threshold: .6 }).observe(c);
  }

  /* ---------------- notification demo ---------------- */
  {
    const st = $("#nStage"), toast = $("#nToast");
    let effect = "spot", app = "#5865f2", name = "Discord", timer = 0;
    const fire = () => {
      clearTimeout(timer); st.classList.remove("spot", "glow", "bright"); void st.offsetWidth;
      st.style.setProperty("--app", app); toast.textContent = `💬 ${name}: new message`;
      st.classList.add(effect);
      st.querySelector(".desk2").classList.toggle("spot", effect === "spot");
      toast.style.opacity = 1; toast.style.transform = "none";
      timer = setTimeout(() => { st.classList.remove(effect); st.querySelector(".desk2").classList.remove("spot"); toast.style.opacity = ""; toast.style.transform = ""; }, 3200);
    };
    st.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.effect) { effect = b.dataset.effect; $$("[data-effect]", st).forEach(x => x.classList.toggle("on", x === b)); }
      if (b.dataset.app) { app = b.dataset.app; name = b.dataset.name; $$("[data-app]", st).forEach(x => x.classList.toggle("on", x === b)); }
      fire();
    });
    let auto = 0;
    new IntersectionObserver(([e]) => { clearInterval(auto); if (e.isIntersecting) { fire(); auto = setInterval(fire, 5200); } }, { threshold: .4 }).observe(st);
  }

  /* ---------------- particles (shared by the flashlight scenes and the shop) ---------------- */
  const P = {
    stars(w, h) { return { x: rand(0, w), y: rand(0, h), r: rand(0.5, 1.8), p: rand(0, TAU), s: rand(1, 3) }; },
    rain(w, h) { return { x: rand(0, w), y: rand(-h, h), l: rand(8, 18), v: rand(320, 520) }; },
    petals(w, h) { return { x: rand(0, w), y: rand(-h, h), r: rand(3, 6), a: rand(0, TAU), va: rand(-2, 2), v: rand(25, 55), sw: rand(0, TAU) }; },
    neon(w, h) { return { x: rand(0, w), y: rand(0, h), r: rand(2, 4), v: rand(-30, -12), p: rand(0, TAU) }; },
    butterflies(w, h) { return { x: rand(0, w), y: rand(0, h), r: rand(5, 8), p: rand(0, TAU), vx: rand(12, 26) * (Math.random() < .5 ? -1 : 1) }; },
    snow(w, h) { return { x: rand(0, w), y: rand(-h, h), r: rand(1, 3), v: rand(18, 40), sw: rand(0, TAU) }; },
  };
  function stepDraw(ctx, kind, ps, w, h, t, dt, col) {
    for (const p of ps) {
      switch (kind) {
        case "stars": {
          ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.s + p.p)); ctx.fillStyle = col.star || "#fff";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); break;
        }
        case "rain": {
          p.y += p.v * dt; p.x -= p.v * 0.12 * dt; if (p.y > h) { p.y = -20; p.x = rand(0, w + 40); }
          ctx.globalAlpha = 0.5; ctx.strokeStyle = col.rain || "#9fc4ff"; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * 0.12, p.y - p.l); ctx.stroke(); break;
        }
        case "petals": {
          p.y += p.v * dt; p.sw += dt; p.x += Math.sin(p.sw) * 18 * dt; p.a += p.va * dt; if (p.y > h + 10) { p.y = -10; p.x = rand(0, w); }
          ctx.globalAlpha = 0.9; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, 0.55 + 0.45 * Math.sin(p.sw * 2));
          ctx.fillStyle = col.petal || "#ffb7d5"; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
        }
        case "neon": {
          p.y += p.v * dt; if (p.y < -10) { p.y = h + 10; p.x = rand(0, w); }
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + p.p); ctx.fillStyle = p.p > 3 ? (col.a || "#00e5ff") : (col.b || "#ff2e97");
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.fillRect(p.x, p.y, p.r, p.r); ctx.shadowBlur = 0; break;
        }
        case "butterflies": {
          p.x += p.vx * dt; p.y += Math.sin(t * 1.3 + p.p) * 10 * dt; if (p.x > w + 20) p.x = -20; if (p.x < -20) p.x = w + 20;
          const flap = 0.25 + 0.75 * Math.abs(Math.sin(t * 7 + p.p)), s = p.r * 1.5, wc = ["#b794ff", "#7ccbff", "#ff9fd6"][(p.p * 10 | 0) % 3];
          ctx.globalAlpha = 0.95; ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = wc; ctx.shadowColor = wc; ctx.shadowBlur = 8;
          for (const sgn of [-1, 1]) {
            ctx.beginPath(); ctx.ellipse(sgn * s * 0.5 * flap, -s * 0.2, s * 0.55 * flap + 0.5, s * 0.7, sgn * 0.5, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.ellipse(sgn * s * 0.38 * flap, s * 0.42, s * 0.36 * flap + 0.4, s * 0.42, sgn * -0.4, 0, TAU); ctx.fill();
          }
          ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,.75)";
          for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(sgn * s * 0.55 * flap, -s * 0.45, s * 0.08, 0, TAU); ctx.fill(); }
          ctx.fillStyle = "#1a1230"; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.08, s * 0.5, 0, 0, TAU); ctx.fill();
          ctx.restore(); break;
        }
        case "snow": {
          p.y += p.v * dt; p.sw += dt; p.x += Math.sin(p.sw) * 10 * dt; if (p.y > h + 5) { p.y = -5; p.x = rand(0, w); }
          // soft round flakes, like the app's music screen
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.2); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.45, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.globalAlpha = 0.85; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.2, 0, TAU); ctx.fill(); break;
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- bundle looks: each bundle's frame, corner pieces and what drifts across the screen,
     drawn the way the app draws them. Used by the decoration demo and the bundle cards. ---------------- */
  const LOOKS = {
    sakura:   { name: "Sakura Dreams", pc: "#ff7eb6", frame: ["#ffb7d0", "#ffe3ee", "#ff9ec4"], glow: "#ff8fb8", fx: "petals", fxCol: ["#ffc4da", "#ffd9e6", "#ffb0cc"], corner: "blossom", bg: ["#0b0c14", "#1a1728"] },
    midnight: { name: "Midnight Moon", pc: "#8c7bff", frame: ["#3b2f8f", "#8c7bff", "#c9c2ff"], glow: "#7a6bff", fx: "stars", corner: "moon", bg: ["#0a0b1c", "#16142c"] },
    lofi:     { name: "Lofi Rain", pc: "#ff8a8a", frame: ["#ff9a8b", "#ff6a88", "#b388eb", "#7fa7e8"], glow: "#ff7f9e", fx: "rain", corner: "lamp", bg: ["#100f18", "#1b1726"] },
    winter:   { name: "Winter Wonderland", pc: "#9be7ff", frame: ["#bfe6ff", "#ffffff", "#7cc8f8"], glow: "#8fd3ff", fx: "snow", bg: ["#0a1020", "#161c2c"] },
    autumn:   { name: "Autumn Breeze", pc: "#e8890c", frame: ["#8d2b0b", "#e8590c", "#ffc53d"], glow: "#f08c00", fx: "leaves", fxCol: ["#d9480f", "#e0a100", "#c92a2a", "#b8500f"], corner: "leaves", bg: ["#100b0a", "#1d1512"] },
    butterfly:{ name: "Butterfly Waltz", pc: "#8fd8ff", frame: ["#c9a7ff", "#8fd8ff", "#ffb3e1"], glow: "#b79bff", fx: "butterflies", fxCol: ["#b794ff", "#7ccbff", "#ff9fd6"], corner: "daisy", bg: ["#0b0d18", "#161a2a"] },
    roses:    { name: "Dark Roses", pc: "#e0284f", frame: ["#3a0410", "#b3122e", "#5a0616"], glow: "#b3122e", fx: "petals", fxCol: ["#8b0a1e", "#b3122e", "#a3162e"], corner: "rose", bg: ["#0e080b", "#1a0f14"] },
    neon:     { name: "Neon Arcade", pc: "#ff2e97", neon: true, fx: "none", bg: ["#0a0614", "#140a20"] },
    cyber:    { name: "Cyberpunk", pc: "#05d9e8", frame: ["#ff2a6d", "#b967ff", "#05d9e8"], glow: "#ff2a6d", fx: "neonrain", corner: "hud", bg: ["#0b0614", "#130a22"] },
    aurora:   { name: "Aurora", pc: "#6fe6ff", aurora: true, fx: "sparkles", bg: ["#080c1c", "#121830"] },
  };

  const PETAL = new Path2D("M50,94 C33,82 21,60 22,38 C23,22 33,12 44,15 L50,24 L56,15 C67,12 77,22 78,38 C79,60 67,82 50,94 Z");
  const LEAF = new Path2D("M50,95 C22,74 20,32 50,5 C80,32 78,74 50,95 Z");
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

  function drawPetal(ctx, x, y, size, rot, squash, color, alpha, dark) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(size / 100, size / 100 * squash); ctx.translate(-50, -55);
    const g = ctx.createLinearGradient(50, 94, 50, 12); g.addColorStop(0, dark ? "#3a0410" : "#ff8fb8"); g.addColorStop(0.55, color); g.addColorStop(1, dark ? color : "#fff4f8");
    ctx.fillStyle = g; ctx.fill(PETAL); ctx.restore();
  }
  function drawLeaf(ctx, x, y, size, rot, squash, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(size / 100, size / 100 * squash); ctx.translate(-50, -50);
    const g = ctx.createRadialGradient(50, 55, 4, 50, 55, 50); g.addColorStop(0, "#ffd43b"); g.addColorStop(0.45, color); g.addColorStop(1, "#4a1a06");
    ctx.fillStyle = g; ctx.fill(LEAF);
    ctx.strokeStyle = "rgba(255,220,150,.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(50, 92); ctx.lineTo(50, 12);
    for (let i = 0; i < 4; i++) { const yy = 74 - i * 15; ctx.moveTo(50, yy); ctx.lineTo(34, yy - 11); ctx.moveTo(50, yy); ctx.lineTo(66, yy - 11); }
    ctx.stroke(); ctx.restore();
  }
  function blossom(ctx, x, y, size, rot, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = "rgba(255,143,184,.55)"; ctx.shadowBlur = size * 0.35;
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate(i * TAU / 5); ctx.translate(0, -size * 0.27); ctx.scale(size / 210, size / 210); ctx.translate(-50, -52);
      const g = ctx.createLinearGradient(50, 94, 50, 12); g.addColorStop(0, "#ff8fb8"); g.addColorStop(0.5, color); g.addColorStop(1, "#fff6fa");
      ctx.fillStyle = g; ctx.fill(PETAL); ctx.restore();
    }
    ctx.shadowBlur = 0;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.09); cg.addColorStop(0, "#fff6c8"); cg.addColorStop(1, "#ffd54f");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, size * 0.08, 0, TAU); ctx.fill();
    ctx.fillStyle = "#c2537e"; for (let i = 0; i < 7; i++) { const a = i * TAU / 7; ctx.beginPath(); ctx.arc(Math.cos(a) * size * 0.13, Math.sin(a) * size * 0.13, size * 0.018, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function daisy(ctx, x, y, size, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = "rgba(16,8,32,.35)"; ctx.beginPath(); ctx.arc(size * 0.03, size * 0.05, size * 0.46, 0, TAU); ctx.fill();
    for (let row = 0; row < 2; row++) for (let i = 0; i < 14; i++) {
      ctx.save(); ctx.rotate(i * TAU / 14 + row * TAU / 28);
      const g = ctx.createLinearGradient(0, 0, 0, -size * 0.45); g.addColorStop(0, "#c8bde8"); g.addColorStop(1, row ? "#ffffff" : "#efe8ff");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -size * 0.25 * (row ? 0.9 : 1), size * 0.055, size * 0.2 * (row ? 0.88 : 1), 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    const cg = ctx.createRadialGradient(-size * 0.03, -size * 0.03, 0, 0, 0, size * 0.13); cg.addColorStop(0, "#fff6c2"); cg.addColorStop(0.5, "#ffc83d"); cg.addColorStop(1, "#c46a00");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, size * 0.12, 0, TAU); ctx.fill(); ctx.restore();
  }
  function rose(ctx, x, y, size, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = "#2e5e35"; for (const a of [0.6, 2.4]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -size * 0.42, size * 0.13, size * 0.26, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * TAU / 6); const g = ctx.createLinearGradient(0, 0, 0, -size * 0.4); g.addColorStop(0, "#5a0616"); g.addColorStop(1, "#c8173d"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -size * 0.2, size * 0.13, size * 0.2, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = "#3a0410"; ctx.beginPath(); ctx.arc(0, 0, size * 0.13, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#e85a78"; ctx.lineWidth = size * 0.03; ctx.beginPath(); ctx.arc(0, 0, size * 0.09, 0.3, TAU - 0.8); ctx.stroke(); ctx.restore();
  }

  /* The frame itself, around (x, y, w, h). k = scale (1 = a full screen demo). */
  function drawFrame(ctx, x, y, w, h, L, t, k) {
    const r = 12 * k;
    ctx.save();
    if (L.neon) {
      const tube = (inset, col, core, glowC, dash) => {
        ctx.setLineDash(dash ? [Math.max(20, (w + h) * 0.45), 7 * k] : []);
        ctx.shadowColor = glowC; ctx.shadowBlur = 18 * k; ctx.strokeStyle = col; ctx.lineWidth = 3.4 * k; rr(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, r); ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = core; ctx.lineWidth = 1.2 * k; rr(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, r); ctx.stroke();
      };
      const flick = 0.92 + 0.08 * Math.sin(t * 9) * Math.sin(t * 2.3);
      ctx.globalAlpha = flick; tube(0, "#ff4fae", "#ffe3f2", "#ff2e97", false);
      ctx.globalAlpha = 1; tube(9 * k, "#37ecff", "#e2fcff", "#00d4f0", true);
      ctx.setLineDash([]);
    } else if (L.aurora) {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${(t * 50 + i * 60) % 360}, 95%, 72%)`);
      const breathe = 0.75 + 0.25 * Math.sin(t * 1.6);
      ctx.strokeStyle = g; ctx.globalAlpha = 0.35 * breathe; ctx.lineWidth = 10 * k; ctx.shadowColor = `hsl(${(t * 50) % 360}, 95%, 70%)`; ctx.shadowBlur = 30 * k; rr(ctx, x, y, w, h, r); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 2.2 * k; ctx.shadowBlur = 10 * k; rr(ctx, x, y, w, h, r); ctx.stroke();
    } else {
      const g = ctx.createLinearGradient(x, y, x + w, y + h), n = L.frame.length, off = (t * 0.06) % 1;
      for (let i = 0; i <= n; i++) g.addColorStop(((i / n) + off) % 1, L.frame[i % n]);
      ctx.strokeStyle = g; ctx.lineWidth = 2 * k; ctx.shadowColor = L.glow; ctx.shadowBlur = 16 * k * (0.75 + 0.25 * Math.sin(t * 1.2)); rr(ctx, x, y, w, h, r); ctx.stroke();
    }
    ctx.restore();
    // corner pieces
    const B = 46 * k, sw = Math.sin(t * 1.5) * 0.08;
    const pair = (fn) => { fn(x, y, 1, sw); fn(x + w, y + h, -1, -sw); };
    switch (L.corner) {
      case "blossom": pair((cx, cy, s, a) => { blossom(ctx, cx + s * B * 0.55, cy + s * B * 0.5, B * 1.15, a, "#ffc4da"); blossom(ctx, cx + s * B * 1.55, cy + s * B * 0.42, B * 0.95, a + 0.4, "#ffd9e6"); blossom(ctx, cx + s * B * 0.42, cy + s * B * 1.45, B * 0.85, a + 0.9, "#ffb0cc"); }); break;
      case "daisy": pair((cx, cy, s, a) => { daisy(ctx, cx + s * B * 0.55, cy + s * B * 0.5, B * 1.2, a); daisy(ctx, cx + s * B * 1.6, cy + s * B * 0.4, B, a + 0.5); daisy(ctx, cx + s * B * 0.4, cy + s * B * 1.5, B * 0.9, a + 1); }); break;
      case "rose": pair((cx, cy, s, a) => { rose(ctx, cx + s * B * 0.6, cy + s * B * 0.55, B * 1.3, a); rose(ctx, cx + s * B * 1.7, cy + s * B * 0.45, B * 0.95, a + 0.7); rose(ctx, cx + s * B * 0.45, cy + s * B * 1.6, B * 0.9, a + 1.4); }); break;
      case "leaves": pair((cx, cy, s, a) => { const cs = ["#d9480f", "#e0a100", "#c92a2a", "#b8500f", "#8e2040"]; [[0.5, 0.5, 1.4, 0.3], [1.5, 0.35, 1.1, 1.2], [0.35, 1.5, 1.1, -0.6], [1.2, 1.1, 0.9, 2.2], [2.3, 0.3, 0.8, 0.9]].forEach(([dx, dy, sz, ro], j) => drawLeaf(ctx, cx + s * B * dx, cy + s * B * dy, B * sz, ro + a, 1, cs[j], 0.95)); }); break;
      case "moon": {
        const mx = x + w - B * 1.1, my = y + B * 1.05, R = B * 0.62 * (1 + Math.sin(t * 0.9) * 0.02);
        const halo = ctx.createRadialGradient(mx - R * 0.35, my + R * 0.2, R * 0.3, mx - R * 0.35, my + R * 0.2, R * 2.1); halo.addColorStop(0, "rgba(255,236,170,.35)"); halo.addColorStop(1, "rgba(255,236,170,0)");
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx - R * 0.35, my + R * 0.2, R * 2.1, 0, TAU); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.rect(mx - R * 3, my - R * 3, R * 6, R * 6); ctx.arc(mx + R * 0.45, my - R * 0.3, R * 0.88, 0, TAU); ctx.clip("evenodd");
        const mg = ctx.createLinearGradient(mx - R, my - R, mx + R, my + R); mg.addColorStop(0, "#fffdf2"); mg.addColorStop(0.5, "#fff4c8"); mg.addColorStop(1, "#e8cf7a");
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.fill(); ctx.restore();
        break;
      }
      case "lamp": { const lg = ctx.createRadialGradient(x, y + h, 0, x, y + h, Math.max(w, h) * 0.6); lg.addColorStop(0, "rgba(255,169,77,.32)"); lg.addColorStop(1, "rgba(255,169,77,0)"); ctx.fillStyle = lg; ctx.fillRect(x, y, w, h); break; }
      case "hud": {
        ctx.save(); ctx.strokeStyle = "#05d9e8"; ctx.shadowColor = "#05d9e8"; ctx.shadowBlur = 10 * k; ctx.lineWidth = 2.4 * k; const a = 34 * k, i = 8 * k;
        for (const [cx, cy, sx, sy] of [[x + i, y + i, 1, 1], [x + w - i, y + i, -1, 1], [x + i, y + h - i, 1, -1], [x + w - i, y + h - i, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx + sx * a, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * a); ctx.stroke(); }
        ctx.restore(); break;
      }
    }
  }

  /* What drifts across the screen. */
  function spawnFx(L, w, h, k, any) {
    const c = L.fxCol || ["#ffffff"], col = c[(Math.random() * c.length) | 0];
    const y0 = any ? rand(-h, h) : rand(-0.2 * h, -0.04 * h);
    switch (L.fx) {
      case "petals": case "leaves": return { x: rand(-0.1 * w, w), y: y0, s: rand(15, 28) * k, v: rand(16, 34) * k, sw: rand(0, TAU), sws: rand(0.6, 1.3), rot: rand(0, TAU), vr: rand(-1.2, 1.2), fl: rand(1.5, 3), c: col, a: rand(0.55, 0.95) };
      case "snow": return { x: rand(0, w), y: y0, r: rand(1.2, 4.2) * k, v: rand(14, 34) * k, sw: rand(0, TAU), a: rand(0.3, 0.9) };
      case "rain": case "neonrain": return { x: rand(0, w + h * 0.25), y: any ? rand(-h, h) : rand(-h * 0.3, 0), l: rand(30, 75) * k, v: rand(520, 820) * k, a: L.fx === "rain" ? rand(0.1, 0.3) : rand(0.35, 0.8), c: L.fx === "rain" ? "#ddeeff" : (Math.random() < 0.5 ? "#ff2a6d" : "#05d9e8") };
      case "stars": return { x: rand(0, w), y: Math.pow(Math.random(), 1.3) * h * 0.85, r: rand(0.6, 1.9) * k, p: rand(0, TAU), s: rand(0.8, 2.4), warm: Math.random() < 0.2 };
      case "sparkles": return { x: rand(0, w), y: any ? rand(0, h) : h + 10, r: rand(1.5, 3.5) * k, v: rand(6, 16) * k, p: rand(0, TAU), hue: rand(0, 360) };
      case "butterflies": return { x: rand(0.1, 0.9) * w, y: rand(0.15, 0.85) * h, s: rand(10, 16) * k, p: rand(0, TAU), rx: rand(30, 70) * k, ry: rand(12, 26) * k, sp: rand(0.25, 0.45), c: col };
    }
    return null;
  }
  function fxCount(L) { return { petals: 34, leaves: 22, snow: 70, rain: 80, neonrain: 60, stars: 70, sparkles: 34, butterflies: 5 }[L.fx] || 0; }
  function stepFx(ctx, L, ps, w, h, t, dt, k) {
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      switch (L.fx) {
        case "petals": case "leaves":
          p.y += p.v * dt; p.sw += p.sws * dt; p.x += (Math.sin(p.sw) * 22 + 10) * k * dt; p.rot += p.vr * dt;
          if (p.y > h + 20 || p.x > w + 30) ps[i] = spawnFx(L, w, h, k, false);
          if (L.fx === "leaves") drawLeaf(ctx, p.x, p.y, p.s, p.rot, 0.35 + 0.65 * Math.abs(Math.sin(t * p.fl + p.sw)), p.c, p.a);
          else drawPetal(ctx, p.x, p.y, p.s, p.rot, 0.35 + 0.65 * Math.abs(Math.sin(t * p.fl + p.sw)), p.c, p.a, L.corner === "rose");
          break;
        case "snow": {
          p.y += p.v * dt; p.sw += dt * 0.8; const x = p.x + Math.sin(p.sw) * 14 * k; if (p.y > h + 6) ps[i] = spawnFx(L, w, h, k, false);
          const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 2.2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.45, "rgba(255,255,255,.6)"); g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.globalAlpha = p.a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, p.y, p.r * 2.2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; break;
        }
        case "rain": case "neonrain": {
          p.y += p.v * dt; p.x -= p.v * 0.21 * dt; if (p.y - p.l > h) ps[i] = spawnFx(L, w, h, k, false);
          const g = ctx.createLinearGradient(p.x + p.l * 0.21, p.y - p.l, p.x, p.y); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, p.c);
          ctx.globalAlpha = p.a; ctx.strokeStyle = g; ctx.lineWidth = (L.fx === "rain" ? 1.2 : 1.6) * Math.max(0.8, k);
          if (L.fx === "neonrain") { ctx.shadowColor = p.c; ctx.shadowBlur = 8 * k; }
          ctx.beginPath(); ctx.moveTo(p.x + p.l * 0.21, p.y - p.l); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1; break;
        }
        case "stars": {
          ctx.globalAlpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * p.s + p.p)); ctx.fillStyle = p.warm ? "#ffe9a8" : "#ffffff";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; break;
        }
        case "sparkles": {
          p.y -= p.v * dt; if (p.y < -10) ps[i] = spawnFx(L, w, h, k, false);
          const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2 + p.p)), s = p.r * 2.4;
          ctx.globalAlpha = a; ctx.fillStyle = `hsl(${(p.hue + t * 30) % 360}, 90%, 78%)`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s); ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); ctx.fill(); ctx.globalAlpha = 1; break;
        }
        case "butterflies": {
          const u = t * p.sp + p.p, x = p.x + Math.sin(u) * p.rx, y = p.y + Math.sin(2 * u) * p.ry, flap = 0.25 + 0.75 * Math.abs(Math.sin(t * 7 + p.p));
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(u) * 0.25); ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 8 * k;
          for (const sgn of [-1, 1]) {
            ctx.beginPath(); ctx.ellipse(sgn * p.s * 0.5 * flap, -p.s * 0.2, p.s * 0.55 * flap + 0.5, p.s * 0.7, sgn * 0.5, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.ellipse(sgn * p.s * 0.38 * flap, p.s * 0.42, p.s * 0.36 * flap + 0.4, p.s * 0.42, sgn * -0.4, 0, TAU); ctx.fill();
          }
          ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,.75)";
          for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(sgn * p.s * 0.55 * flap, -p.s * 0.45, p.s * 0.08, 0, TAU); ctx.fill(); }
          ctx.fillStyle = "#1a1230"; ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.08, p.s * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
        }
      }
    }
  }

  /* ---------------- decoration demo: a side screen dressed in the picked bundle ---------------- */
  {
    const st = $("#dScreen"), c = $("#dCanvas"), pills = $("#dPills");
    if (st && c && pills) {
      const ctx = fit(c);
      let L = LOOKS.sakura, ps = [];
      pills.innerHTML = Object.entries(LOOKS).map(([id, l]) => `<button class="pill${id === "sakura" ? " on" : ""}" data-look="${id}" style="--pc:${l.pc}">${l.name}</button>`).join("");
      pills.addEventListener("click", e => {
        const b = e.target.closest("[data-look]"); if (!b) return;
        L = LOOKS[b.dataset.look]; ps = []; $$("[data-look]", pills).forEach(x => x.classList.toggle("on", x === b));
      });
      loop(st, (t, dt) => {
        const w = c._w, h = c._h; if (!w) return;
        const k = Math.max(0.8, w / 600);
        if (ps.length === 0 && fxCount(L)) ps = Array.from({ length: fxCount(L) }, () => spawnFx(L, w, h, k, true));
        const bg = ctx.createLinearGradient(0, 0, w, h); bg.addColorStop(0, L.bg[0]); bg.addColorStop(1, L.bg[1]); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
        stepFx(ctx, L, ps, w, h, t, dt, k);
        drawFrame(ctx, 3, 3, w - 6, h - 6, L, t, k);
      });
    }
  }

  /* ---------------- music screen demo: the same looks as the app's music screen ---------------- */
  {
    const scr = $("#mScreen"), c = $("#mCanvas"), pills = $("#mPills");
    if (scr && c && pills) {
      const ctx = fit(c);
      const SERIF = "Georgia, 'Times New Roman', serif", SANS = "'Segoe UI', system-ui, sans-serif", COND = "Bahnschrift, 'Arial Narrow', 'Segoe UI', sans-serif";
      const T = {
        sakura:   { name: "Sakura", pc: "#ff7eb6", a: "#1a0812", b: "#5e2443", c: "#c0638e", ink: "#fff4f8", glow: "#ff9ec4", font: SERIF, w: 400, fx: "petals", fxCol: ["#ffc4da", "#ffd9e6", "#ffb0cc"] },
        midnight: { name: "Midnight", pc: "#8c7bff", a: "#04030f", b: "#14104a", c: "#2e2a7a", ink: "#f2f0ff", glow: "#b9b0ff", font: SERIF, w: 400, st: "italic", fx: "stars" },
        lofi:     { name: "Lofi", pc: "#ff8a8a", a: "#0e0a18", b: "#3a2450", c: "#9e5a62", ink: "#ffe9d6", glow: "#ffa94d", font: "'Cascadia Mono', Consolas, monospace", w: 300, cs: "lowercase", fx: "rain" },
        aurora:   { name: "Aurora", pc: "#6fe6ff", a: "#0b0618", b: "#3a1e6e", c: "#1b6e8e", ink: "#ffffff", glow: "#c8a8ff", font: SANS, w: 600, fx: "aurora", rainbow: true },
        arcade:   { name: "Arcade", pc: "#ff2e97", a: "#07020f", b: "#2a0838", c: "#06384a", ink: "#ffffff", glow: "#ff2e97", font: COND, w: 600, cs: "uppercase", fx: "scan", chroma: true },
        cyber:    { name: "Cyberpunk", pc: "#05d9e8", a: "#05010c", b: "#2e0838", c: "#03404e", ink: "#e8fdff", glow: "#05d9e8", font: COND, w: 700, cs: "uppercase", fx: "cyber", chroma: true },
        roses:    { name: "Dark Roses", pc: "#e0284f", a: "#060103", b: "#2a030b", c: "#6a0a1c", ink: "#ffecee", glow: "#d12a45", font: SERIF, w: 400, st: "italic", fx: "embers", fxCol: ["#ff4d5e", "#d12a45", "#ff8a6a"] },
        waltz:    { name: "Butterfly Waltz", pc: "#8fd8ff", a: "#0a0c1e", b: "#33285e", c: "#4e8aa8", ink: "#f6f2ff", glow: "#c9a7ff", font: SERIF, w: 500, st: "italic", fx: "petals", fxCol: ["#d9c4ff", "#bfe6ff", "#ffd1ec"] },
        autumn:   { name: "Autumn", pc: "#e8890c", a: "#120804", b: "#4a1e08", c: "#9a4a10", ink: "#fff1de", glow: "#ff9a3d", font: "Constantia, " + SERIF, w: 700, fx: "embers", fxCol: ["#ffb347", "#ff8a3d", "#ffd27a"] },
        frost:    { name: "Frost", pc: "#9be7ff", a: "#040a16", b: "#16365c", c: "#5a8ab8", ink: "#f4fbff", glow: "#9cd8ff", font: SANS, w: 300, fx: "snow" },
        hearts:   { name: "Sweethearts", pc: "#ff4d8d", a: "#1a0510", b: "#5a1236", c: "#b83a6e", ink: "#fff2f6", glow: "#ff4d8d", font: "'Segoe Print', 'Comic Sans MS', cursive", w: 700, fx: "hearts", fxCol: ["#ff4d8d", "#ff8fb5", "#ffc2d6"] },
        studio:   { name: "Studio", pc: "#9aa3b8", a: "#050507", b: "#1a1a24", c: "#3a3a4c", ink: "#ffffff", glow: "#ffffff", font: SANS, w: 700, fx: "grain" },
      };
      let th = T.sakura, ps = [];
      pills.innerHTML = Object.entries(T).map(([id, l]) => `<button class="pill${id === "sakura" ? " on" : ""}" data-mt="${id}" style="--pc:${l.pc}">${l.name}</button>`).join("");
      const apply = () => {
        const v = { a: th.a, b: th.b, c: th.c, ink: th.ink, glow: th.glow, font: th.font, w: th.w, st: th.st || "normal", case: th.cs || "none" };
        for (const k in v) scr.style.setProperty("--m-" + k, v[k]);
        scr.classList.toggle("chroma", !!th.chroma); scr.classList.toggle("rainbow", !!th.rainbow); ps = [];
      };
      pills.addEventListener("click", e => {
        const b = e.target.closest("[data-mt]"); if (!b) return;
        th = T[b.dataset.mt]; apply(); $$("[data-mt]", pills).forEach(x => x.classList.toggle("on", x === b));
      });
      apply();
      const asLook = () => ({ fx: th.fx === "cyber" ? "neonrain" : th.fx, fxCol: th.fxCol });
      const count = () => ({ petals: 26, rain: 70, snow: 60, stars: 70, cyber: 26, embers: 34, hearts: 14 })[th.fx] || 0;
      const spawn = (w, h, k, any) => {
        if (th.fx === "embers" || th.fx === "hearts") {
          const col = th.fxCol[(Math.random() * th.fxCol.length) | 0];
          return { x: rand(0, w), y: any ? rand(0, h) : h + 10, r: (th.fx === "hearts" ? rand(5, 10) : rand(1, 2.6)) * k, v: rand(10, 28) * k, p: rand(0, TAU), c: col };
        }
        return spawnFx(asLook(), w, h, k, any);
      };
      const heart = (x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); ctx.fill(); };
      loop(scr, (t, dt) => {
        const w = c._w, h = c._h; if (!w) return;
        const k = Math.max(0.7, w / 600);
        ctx.clearRect(0, 0, w, h);
        if (ps.length === 0 && count()) ps = Array.from({ length: count() }, () => spawn(w, h, k, true));
        if (th.fx === "aurora") { // slow ribbons of coloured light drifting across, like the app's aurora
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(18px)";
          for (let i = 0; i < 3; i++) {
            const g = ctx.createLinearGradient(0, 0, w, 0), hue = (t * 18 + i * 110) % 360;
            g.addColorStop(0, `hsla(${hue},90%,65%,0)`); g.addColorStop(0.5, `hsla(${(hue + 40) % 360},90%,65%,.24)`); g.addColorStop(1, `hsla(${(hue + 80) % 360},90%,65%,0)`);
            ctx.strokeStyle = g; ctx.lineWidth = h * 0.22; ctx.beginPath();
            for (let x = -20; x <= w + 20; x += 20) { const y = h * (0.25 + i * 0.22) + Math.sin(x / w * 5 + t * (0.4 + i * 0.15) + i) * h * 0.08; if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            ctx.stroke();
          }
          ctx.restore();
        } else if (th.fx === "scan" || th.fx === "cyber") { // CRT lines and a slow bright band rolling down
          ctx.fillStyle = "rgba(255,255,255,.035)"; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
          const by = ((t * 0.12) % 1.2 - 0.1) * h, bg = ctx.createLinearGradient(0, by - 30, 0, by + 30);
          bg.addColorStop(0, "rgba(255,255,255,0)"); bg.addColorStop(0.5, "rgba(255,255,255,.06)"); bg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = bg; ctx.fillRect(0, by - 30, w, 60);
        } else if (th.fx === "grain") { // a little film grain
          ctx.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 260; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
        if (th.fx === "embers" || th.fx === "hearts") {
          for (let i = 0; i < ps.length; i++) {
            const p = ps[i]; p.y -= p.v * dt; p.p += dt; const x = p.x + Math.sin(p.p * 1.3) * 8 * k;
            if (p.y < -12) { ps[i] = spawn(w, h, k, false); continue; }
            ctx.globalAlpha = Math.max(0, Math.min(1, p.y / (h * 0.5))) * (0.5 + 0.5 * Math.sin(p.p * 3)); ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 10 * k;
            if (th.fx === "hearts") heart(x, p.y, p.r * 0.6); else { ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, TAU); ctx.fill(); }
          }
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        } else if (count()) stepFx(ctx, asLook(), ps, w, h, t, dt, k);
      });
    }
  }

  /* ---------------- flashlight demo: the room is still, the light moves ---------------- */
  {
    const st = $("#lStage"), c = $("#lCanvas"), ctx = fit(c);
    // One light per bundle, as in the app's Shop.
    const scenes = {
      rain: { name: "Lofi Lamp", pc: "#d98b3a", kind: "rain", n: 160, bg: ["#2a1a10", "#120c08"], col: { rain: "#c9a77a" }, ring: "transparent", r: 120, deco: "lamp" },
      stars: { name: "Moonlight", pc: "#6d7cff", kind: "stars", n: 120, bg: ["#0b1030", "#05060f"], col: { star: "#dfe6ff" }, ring: "rgba(160,180,255,.5)", r: 115, deco: "moon" },
      sakura: { name: "Sakura Light", pc: "#ff7eb6", kind: "petals", n: 50, bg: ["#3a1530", "#13060f"], col: { petal: "#ffb7d5" }, ring: "rgba(255,150,200,.5)", r: 120, deco: "branch" },
      aurora: { name: "Aurora Light", pc: "#6fe6ff", kind: "stars", n: 70, bg: ["#0b1430", "#04060f"], col: { star: "#cfeaff" }, ring: "rgba(185,139,255,.55)", r: 120, deco: "aurora" },
      butterfly: { name: "Butterfly Light", pc: "#8fd8ff", kind: "butterflies", n: 14, bg: ["#081a2a", "#03070d"], col: { wing: "#c9a7ff" }, ring: "rgba(201,181,255,.5)", r: 120, deco: "daisies" },
      winter: { name: "Snow Globe", pc: "#9be7ff", kind: "snow", n: 120, bg: ["#0d2036", "#050b14"], col: {}, ring: "rgba(200,235,255,.7)", r: 118, deco: "snow" },
      roses: { name: "Crimson Light", pc: "#e0284f", kind: "petals", n: 40, bg: ["#250610", "#080104"], col: { petal: "#c8173d" }, ring: "rgba(224,40,79,.5)", r: 115, deco: "roses" },
      autumn: { name: "Autumn Lantern", pc: "#e8890c", kind: "petals", n: 40, bg: ["#2a1205", "#0c0502"], col: { petal: "#e2741a" }, ring: "rgba(255,170,80,.45)", r: 118, deco: "lamp" },
      neon: { name: "Neon Ring", pc: "#00e5ff", kind: "neon", n: 70, bg: ["#0a0420", "#03010a"], col: { a: "#00e5ff", b: "#ff2e97" }, ring: "#00e5ff", r: 105, deco: "grid" },
      cyber: { name: "Cyber Visor", pc: "#ff2a6d", kind: "neon", n: 80, bg: ["#140620", "#04020a"], col: { a: "#05d9e8", b: "#ff2a6d" }, ring: "#ff2a6d", r: 100, deco: "grid" },
    };
    const lp = $("#lPills");
    if (lp) lp.innerHTML = Object.entries(scenes).map(([id, l], i) => `<button class="pill${i ? "" : " on"}" data-scene="${id}" style="--pc:${l.pc}">${l.name}</button>`).join("");
    let s = scenes.rain, ps = [];
    const build = () => { ps = Array.from({ length: s.n }, () => P[s.kind](c._w || 500, c._h || 380)); st.style.setProperty("--r", s.r + "px"); st.style.setProperty("--rc", s.ring); };
    build();
    const deco = (w, h, t) => drawDeco(ctx, s.deco, w, h, t, s.bg[0]);
    loop(st, (t, dt) => {
      const w = c._w, h = c._h, g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, s.bg[0]); g.addColorStop(1, s.bg[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); deco(w, h, t); stepDraw(ctx, s.kind, ps, w, h, t, dt, s.col);
    });
    // light follows the pointer; drifts by itself until someone touches it
    let user = false, tx = .5, ty = .45, lx = .5, ly = .45;
    st.addEventListener("pointermove", e => { const r = st.getBoundingClientRect(); user = true; tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; });
    st.addEventListener("pointerleave", () => user = false);
    loop(st, t => {
      if (!user) { tx = .5 + Math.cos(t * .7) * .28; ty = .45 + Math.sin(t * 1.1) * .2; }
      lx += (tx - lx) * .25; ly += (ty - ly) * .25;
      st.style.setProperty("--lx", lx * 100 + "%"); st.style.setProperty("--ly", ly * 100 + "%");
    });
    (lp || st).addEventListener("click", e => { const b = e.target.closest("[data-scene]"); if (!b) return; s = scenes[b.dataset.scene]; build(); $$("[data-scene]", lp || st).forEach(x => x.classList.toggle("on", x === b)); });
  }

  /* Each theme's still "room": what the flashlight reveals (and what the shop previews show). */
  function drawDeco(ctx, deco, w, h, t, bgTop) {
      if (deco === "lamp") { // window frame + desk lamp glow
        ctx.strokeStyle = "rgba(255,210,150,.35)"; ctx.lineWidth = 6; ctx.strokeRect(w * .12, h * .1, w * .5, h * .55); ctx.beginPath(); ctx.moveTo(w * .37, h * .1); ctx.lineTo(w * .37, h * .65); ctx.moveTo(w * .12, h * .375); ctx.lineTo(w * .62, h * .375); ctx.stroke();
        const g = ctx.createRadialGradient(w * .8, h * .7, 5, w * .8, h * .7, h * .45); g.addColorStop(0, "rgba(255,190,110,.55)"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#3a2616"; ctx.fillRect(0, h * .8, w, h * .2); ctx.fillStyle = "#ffcf8a"; ctx.beginPath(); ctx.moveTo(w * .76, h * .6); ctx.lineTo(w * .84, h * .6); ctx.lineTo(w * .87, h * .7); ctx.lineTo(w * .73, h * .7); ctx.fill();
      } else if (deco === "moon") {
        const m = Math.min(34, h * .14);
        const g = ctx.createRadialGradient(w * .72, h * .28, 4, w * .72, h * .28, m * 2.6); g.addColorStop(0, "rgba(220,230,255,.5)"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#e8edff"; ctx.beginPath(); ctx.arc(w * .72, h * .28, m, 0, TAU); ctx.fill(); ctx.fillStyle = bgTop; ctx.beginPath(); ctx.arc(w * .72 + m * .42, h * .28 - m * .24, m * .88, 0, TAU); ctx.fill();
        // a shooting star now and then
        const k = (t * .35) % 1; if (k < .25) { const x = w * (.15 + k * 1.6), y = h * (.12 + k * .6); const sg = ctx.createLinearGradient(x, y, x - 50, y - 18); sg.addColorStop(0, "rgba(255,255,255,.9)"); sg.addColorStop(1, "transparent"); ctx.strokeStyle = sg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 50, y - 18); ctx.stroke(); }
      } else if (deco === "branch") {
        ctx.strokeStyle = "#5a2a3a"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(w, h * .15); ctx.quadraticCurveTo(w * .6, h * .2, w * .35, h * .08); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .7, h * .17); ctx.lineTo(w * .62, h * .32); ctx.stroke();
        ctx.fillStyle = "#ff9cc7"; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(w * (.38 + i * .045), h * (.1 + Math.sin(i * 1.7) * .05 + .04), 6, 0, TAU); ctx.fill(); }
      } else if (deco === "grid") {
        ctx.strokeStyle = "rgba(255,46,151,.35)"; ctx.lineWidth = 1; const hy = h * .55;
        for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 10, hy); ctx.lineTo(w / 2 + i * 70, h); ctx.stroke(); }
        for (let i = 0; i < 7; i++) { const k = (i + (t * .6) % 1) / 7; const y = hy + (h - hy) * k * k; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      } else if (deco === "roses") { // three roses climbing the bottom corner
        ctx.strokeStyle = "#2e4a2a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .02, h); ctx.bezierCurveTo(w * .1, h * .7, w * .2, h * .85, w * .3, h * .62); ctx.stroke();
        for (const [x, y, r] of [[.1, .78, 13], [.22, .7, 10], [.31, .6, 8]]) {
          for (let k = 3; k >= 1; k--) { ctx.fillStyle = k === 3 ? "#7a0c22" : k === 2 ? "#b3123a" : "#e0284f"; ctx.beginPath(); ctx.arc(w * x, h * y, r * k / 3 + 1, 0, TAU); ctx.fill(); }
        }
      } else if (deco === "aurora") { // soft drifting lights in aurora colours, like the app's Aurora Light
        for (const [i, col] of ["255,111,176", "140,124,255", "111,230,255"].entries()) {
          const x = w * (.3 + .4 * (.5 + .5 * Math.sin(t * .25 + i * 2.1))), y = h * (.3 + .35 * (.5 + .5 * Math.cos(t * .2 + i * 1.7))), R = h * (.35 + .08 * Math.sin(t * .6 + i));
          const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(${col},.32)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        }
      } else if (deco === "daisies") { // daisies in two corners, as on the Butterfly Waltz frame
        const B = Math.min(w, h) * .11;
        daisy(ctx, B * .7, B * .7, B * 1.3, Math.sin(t) * .06); daisy(ctx, B * 1.9, B * .5, B, .5); daisy(ctx, B * .5, B * 1.8, B * .9, 1);
        daisy(ctx, w - B * .7, h - B * .7, B * 1.3, -Math.sin(t) * .06); daisy(ctx, w - B * 1.9, h - B * .5, B, .5); daisy(ctx, w - B * .5, h - B * 1.8, B * .9, 1);
      } else if (deco === "snow") { // snowy hills + a little tree
        ctx.fillStyle = "#dfefff"; ctx.beginPath(); ctx.moveTo(0, h); ctx.quadraticCurveTo(w * .3, h * .72, w * .6, h * .88); ctx.quadraticCurveTo(w * .85, h * .78, w, h * .84); ctx.lineTo(w, h); ctx.fill();
        ctx.fillStyle = "#1f4a3a"; ctx.beginPath(); ctx.moveTo(w * .78, h * .55); ctx.lineTo(w * .7, h * .8); ctx.lineTo(w * .86, h * .8); ctx.fill();
      }
  }

  /* ---------------- ambient glow demo ---------------- */
  {
    const st = $("#aStage"), c = $("#aCanvas"), ctx = fit(c), glow = $("#aGlow");
    let strength = 0.75, n = 0;
    loop(st, t => {
      const edge = gameScene(ctx, c._w, c._h, t * 1.6);
      if (++n % 4 === 0) glow.style.background = `linear-gradient(${innerWidth <= 640 ? 180 : 90}deg, ${edge}, transparent 70%)`; // from the edge that faces the game // a few updates a second, like the app
      glow.style.opacity = strength;
    });
    st.addEventListener("click", e => { const b = e.target.closest("[data-amb]"); if (!b) return; strength = +b.dataset.amb; $$("[data-amb]", st).forEach(x => x.classList.toggle("on", x === b)); });
  }

  /* ---------------- hotkey demo ---------------- */
  {
    const st = $("#kStage"), dim = st.querySelector(".mini .dimmer"), status = $("#kStatus"), keys = $$(".key", st);
    let dimmed = true, peeking = false;
    const show = () => { dim.style.opacity = peeking ? 0 : dimmed ? .85 : 0; status.innerHTML = peeking ? "👀 Peeking: bright while you hold it" : dimmed ? "🌙 Dimmed. Press <b>Ctrl+Alt+D</b> to undim" : "☀️ Undimmed. Press <b>Ctrl+Alt+D</b> to dim again"; };
    const press = (on, last) => { keys.forEach(k => k.classList.toggle("down", on)); if (last) keys[2].textContent = last; };
    const toggle = () => { dimmed = !dimmed; show(); };
    addEventListener("keydown", e => {
      if (!e.ctrlKey || !e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "d" && !e.repeat) { e.preventDefault(); press(true, "D"); toggle(); }
      if (k === "p") { e.preventDefault(); press(true, "P"); if (!peeking) { peeking = true; show(); } }
    });
    addEventListener("keyup", e => { press(false); if (peeking && (e.key.toLowerCase() === "p" || e.key === "Control" || e.key === "Alt")) { peeking = false; show(); } });
    keys.forEach(k => k.addEventListener("click", () => { press(true, "D"); setTimeout(() => press(false), 140); toggle(); }));
    show();
  }

  /* ---------------- shop bundles ---------------- */
  {
    const bundles = [
      { name: "Midnight Moon", look: "midnight", desc: "A crescent moon, drifting clouds, a quiet starry sky and a moonlit torch.", kind: "stars", deco: "moon", c1: "#6d7cff", c2: "#cfd8ff", bg: ["#0b1030", "#04050d"], col: { star: "#e6ecff" }, tags: ["Moon frame", "Falling stars", "Moonlight"] },
      { name: "Sakura Dreams", look: "sakura", desc: "Cherry-blossom petals drift down; a soft pink light in the dark.", kind: "petals", deco: "branch", c1: "#ff7eb6", c2: "#ffd1e6", bg: ["#3a1530", "#10050c"], col: { petal: "#ffb7d5" }, tags: ["Blossom frame", "Petals", "Sakura light"] },
      { name: "Lofi Rain", look: "lofi", desc: "Soft rain falls across your screen. Your flashlight is a warm lamp in a rainy room.", kind: "rain", deco: "lamp", c1: "#d98b3a", c2: "#9fc4ff", bg: ["#1d1a22", "#0a0910"], col: { rain: "#a9c7ee" }, tags: ["Rain frame", "Rain", "Lofi lamp"] },
      { name: "Neon Arcade", look: "neon", desc: "Two real neon tubes, hot pink and electric cyan, and a glowing neon ring.", kind: "neon", deco: "grid", c1: "#00e5ff", c2: "#ff2e97", bg: ["#0a0420", "#02010a"], col: { a: "#00e5ff", b: "#ff2e97" }, tags: ["Neon tubes", "Pixels", "Neon ring"] },
      { name: "Dark Roses", look: "roses", desc: "Deep red roses and falling petals, moody and elegant.", kind: "petals", deco: "roses", c1: "#e0284f", c2: "#ff8aa0", bg: ["#250610", "#080104"], col: { petal: "#c8173d" }, tags: ["Rose frame", "Rose petals", "Crimson light"] },
      { name: "Butterfly Waltz", look: "butterfly", desc: "Daisies in the corners and butterflies resting on them, more fluttering through your light.", kind: "butterflies", c1: "#4fd1ff", c2: "#b28dff", bg: ["#081a2a", "#03070d"], col: { wing: "#7fd6ff" }, tags: ["Butterfly frame", "Butterflies", "Butterfly light"] },
      { name: "Winter Wonderland", look: "winter", desc: "An icy frame, soft snow falling across your screen and a snow-globe light.", kind: "snow", deco: "snow", c1: "#9be7ff", c2: "#ffffff", bg: ["#0d2036", "#050b14"], col: {}, tags: ["Frost frame", "Snow", "Snow globe"], limited: true },
      { name: "Cyberpunk", look: "cyber", desc: "Neon rain over a city that never sleeps: HUD corners and flickering circuits.", kind: "neon", deco: "grid", c1: "#ff2a6d", c2: "#05d9e8", bg: ["#140620", "#04020a"], col: { a: "#05d9e8", b: "#ff2a6d" }, tags: ["Cyberpunk frame", "Neon rain", "Cyber visor"] },
      { name: "Autumn Breeze", look: "autumn", desc: "Maple and oak leaves in the corners, more tumbling across your screen.", kind: "petals", c1: "#e8890c", c2: "#ffc53d", bg: ["#2a1205", "#0c0502"], col: { petal: "#e2741a" }, tags: ["Autumn frame", "Falling leaves", "Autumn lantern"] },
      { name: "Aurora", look: "aurora", desc: "A soft rainbow glow that flows around your screen and breathes.", kind: "stars", c1: "#6fe6ff", c2: "#ff6fb0", bg: ["#0b1430", "#04060f"], col: { star: "#cfeaff" }, tags: ["Aurora frame", "Sparkles", "Aurora light"] },
    ];
    const host = $("#bundles");
    bundles.forEach((b, i) => {
      const el = document.createElement("article");
      el.className = "bundle flow reveal"; el.style.setProperty("--c", b.c1); el.style.setProperty("--c2", b.c2); el.style.setProperty("--d", (i % 3) * 0.08 + "s");
      el.innerHTML = `<div class="art"><canvas></canvas>${b.limited ? '<span class="badge limited">❄ LIMITED</span>' : ""}<span class="badge pro">PRO · SET OF 3</span></div>
        <div class="meta"><h3>${b.name}</h3><p>${b.desc}</p><div class="tags">${b.tags.map(t => `<span>${t}</span>`).join("")}</div></div>`;
      host.append(el); io.observe(el);
      const c = el.querySelector("canvas"), ctx = fit(c);
      let ps = null;
      loop(el, (t, dt) => {
        const w = c._w, h = c._h; if (!ps) ps = Array.from({ length: b.kind === "rain" ? 90 : b.kind === "stars" ? 70 : 28 }, () => P[b.kind](w, h));
        const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, b.bg[0]); g.addColorStop(1, b.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        if (b.deco) drawDeco(ctx, b.deco, w, h, t, b.bg[0]);
        stepDraw(ctx, b.kind, ps, w, h, t, dt, b.col);
        // the dim layer with the bundle's flashlight wandering over it: the scene stays put, the light moves
        const lx = w * (.5 + Math.cos(t * .5 + i) * .3), ly = h * (.5 + Math.sin(t * .8 + i) * .22), lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, h * .42);
        lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(.6, "rgba(0,0,0,.05)"); lg.addColorStop(1, "rgba(0,0,0,.5)"); ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
        // a mini window wearing the bundle's real frame, as in the app's Shop
        const L = LOOKS[b.look], ww = w * 0.56, wh = h * 0.5, wx = (w - ww) / 2, wy = (h - wh) / 2, kk = Math.max(0.45, w / 900);
        ctx.fillStyle = "rgba(40,44,56,.92)"; rr(ctx, wx, wy, ww, wh, 8 * kk); ctx.fill();
        ctx.fillStyle = "rgba(170,178,196,.55)"; [0.62, 0.42, 0.52].forEach((f, j) => { rr(ctx, wx + 12 * kk, wy + (12 + j * 9) * kk, ww * f * 0.6, 3.5 * kk, 2); ctx.fill(); });
        drawFrame(ctx, wx, wy, ww, wh, L, t, kk);
      });
    });

    // Winter Wonderland season: 1 Nov – 6 Jan (same calendar as the app)
    const count = $("#winterCount");
    const tick = () => {
      const now = new Date(), y = now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
      const end = new Date(y, 0, 7), inSeason = now.getMonth() >= 10 || (now.getMonth() === 0 && now.getDate() <= 6);
      if (!inSeason) { count.textContent = "Back on 1 November"; return; }
      const s = Math.max(0, (end - now) / 1000), d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), mm = Math.floor(s % 3600 / 60), ss = Math.floor(s % 60);
      count.textContent = `${d}d ${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}m ${String(ss).padStart(2, "0")}s`;
    };
    tick(); setInterval(tick, 1000);
  }
})();
