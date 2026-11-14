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
          const flap = Math.abs(Math.sin(t * 9 + p.p));
          ctx.globalAlpha = 0.95; ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = col.wing || "#7fd6ff"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
          for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sgn * p.r * 0.55 * flap, -p.r * 0.2, p.r * 0.6 * flap + 0.5, p.r * 0.75, sgn * 0.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(sgn * p.r * 0.4 * flap, p.r * 0.45, p.r * 0.4 * flap + 0.4, p.r * 0.45, sgn * -0.4, 0, TAU); ctx.fill(); }
          ctx.restore(); ctx.shadowBlur = 0; break;
        }
        case "snow": {
          p.y += p.v * dt; p.sw += dt; p.x += Math.sin(p.sw) * 10 * dt; if (p.y > h + 5) { p.y = -5; p.x = rand(0, w); }
          ctx.globalAlpha = 0.85; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); break;
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- flashlight demo: the room is still, the light moves ---------------- */
  {
    const st = $("#lStage"), c = $("#lCanvas"), ctx = fit(c);
    const scenes = {
      rain: { kind: "rain", n: 160, bg: ["#2a1a10", "#120c08"], col: { rain: "#c9a77a" }, ring: "transparent", r: 120, deco: "lamp" },
      stars: { kind: "stars", n: 120, bg: ["#0b1030", "#05060f"], col: { star: "#dfe6ff" }, ring: "rgba(160,180,255,.5)", r: 115, deco: "moon" },
      sakura: { kind: "petals", n: 50, bg: ["#3a1530", "#13060f"], col: { petal: "#ffb7d5" }, ring: "rgba(255,150,200,.5)", r: 120, deco: "branch" },
      neon: { kind: "neon", n: 70, bg: ["#0a0420", "#03010a"], col: { a: "#00e5ff", b: "#ff2e97" }, ring: "#00e5ff", r: 105, deco: "grid" },
    };
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
    st.addEventListener("click", e => { const b = e.target.closest("[data-scene]"); if (!b) return; s = scenes[b.dataset.scene]; build(); $$("[data-scene]", st).forEach(x => x.classList.toggle("on", x === b)); });
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
      { name: "Midnight Moon", desc: "A crescent moon on your frame, shooting stars and a moonlit torch.", kind: "stars", deco: "moon", c1: "#6d7cff", c2: "#cfd8ff", bg: ["#0b1030", "#04050d"], col: { star: "#e6ecff" }, tags: ["Moon frame", "Falling stars", "Moonlight"] },
      { name: "Sakura Dreams", desc: "Cherry-blossom petals drift down; a soft pink light in the dark.", kind: "petals", deco: "branch", c1: "#ff7eb6", c2: "#ffd1e6", bg: ["#3a1530", "#10050c"], col: { petal: "#ffb7d5" }, tags: ["Blossom frame", "Petals", "Sakura light"] },
      { name: "Lofi Rain", desc: "Rain runs down the frame. Your flashlight is a warm lamp in a rainy room.", kind: "rain", deco: "lamp", c1: "#d98b3a", c2: "#9fc4ff", bg: ["#1d1a22", "#0a0910"], col: { rain: "#a9c7ee" }, tags: ["Rain frame", "Rain", "Lofi lamp"] },
      { name: "Neon Arcade", desc: "Pixel sparks, a synthwave grid and a glowing neon ring.", kind: "neon", deco: "grid", c1: "#00e5ff", c2: "#ff2e97", bg: ["#0a0420", "#02010a"], col: { a: "#00e5ff", b: "#ff2e97" }, tags: ["Neon frame", "Pixels", "Neon ring"] },
      { name: "Dark Roses", desc: "Deep red roses and falling petals, moody and elegant.", kind: "petals", deco: "roses", c1: "#e0284f", c2: "#ff8aa0", bg: ["#250610", "#080104"], col: { petal: "#c8173d" }, tags: ["Rose frame", "Rose petals", "Crimson light"] },
      { name: "Butterfly Waltz", desc: "Glowing butterflies flutter across your dark screens.", kind: "butterflies", c1: "#4fd1ff", c2: "#b28dff", bg: ["#081a2a", "#03070d"], col: { wing: "#7fd6ff" }, tags: ["Butterfly frame", "Butterflies", "Butterfly light"] },
      { name: "Winter Wonderland", desc: "Frosted frame, gentle snowfall and a snow-globe light.", kind: "snow", deco: "snow", c1: "#9be7ff", c2: "#ffffff", bg: ["#0d2036", "#050b14"], col: {}, tags: ["Frost frame", "Snow", "Snow globe"], limited: true },
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
        // a mini "monitor" with the bundle's glowing frame, a flowing streak travelling around it
        const m = 22, fw = w - m * 2, fh = h - m * 2, per = 2 * (fw + fh), pos = (t * 120) % per;
        ctx.strokeStyle = b.c1; ctx.globalAlpha = .45; ctx.lineWidth = 1.5; ctx.shadowColor = b.c1; ctx.shadowBlur = 12; ctx.strokeRect(m, m, fw, fh);
        ctx.globalAlpha = 1; ctx.lineWidth = 2.5; ctx.strokeStyle = b.c2; ctx.setLineDash([per * 0.18, per]); ctx.lineDashOffset = -pos; ctx.strokeRect(m, m, fw, fh); ctx.setLineDash([]); ctx.shadowBlur = 0;
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
