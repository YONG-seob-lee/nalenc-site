"use strict";
// 스크롤 연출 · 커서 · 메뉴 — 첫 화면과 프로젝트 페이지가 같이 쓴다
(() => {
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (p, a, b) => cl((p - a) / (b - a));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // 선언 문장을 단어로 쪼갬 — 강조어는 노란색
  const mani = document.getElementById("mani");
  const HL = ["날것", "살아남은", "날것들입니다."];
  let maniWords = [];
  if (mani) {
    const words = mani.textContent.trim().split(/\s+/);
    mani.innerHTML = words.map((w) => `<span class="w${HL.some((h) => w.startsWith(h)) ? " hl" : ""}">${w}</span>`).join(" ");
    maniWords = [...mani.querySelectorAll(".w")];
  }

  const scenes = [...document.querySelectorAll("[data-scene]")];
  const crewTrack = document.getElementById("crew-track");
  const crewBar = document.getElementById("crew-bar");
  const projs = [...document.querySelectorAll(".proj")];
  const projN = document.getElementById("proj-n");
  const maniN = document.getElementById("mani-n");
  const nav = document.querySelector(".nav");
  const marquees = [...document.querySelectorAll(".marquee .track")];
  const steps = [...document.querySelectorAll(".steps [data-step]")];

  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const len = el.offsetHeight - window.innerHeight;
    return len > 0 ? cl(-r.top / len) : r.top < 0 ? 1 : 0;
  };

  const SCENE = {
    manifesto(p) {
      const n = maniWords.length, q = seg(p, 0.05, 0.85);
      maniWords.forEach((w, i) => w.classList.toggle("on", q * n > i + 0.3));
      if (maniN) maniN.textContent = Math.round(q * 100);
    },
    crew(p) {
      if (!crewTrack) return;
      const stage = crewTrack.parentElement;
      const max = Math.max(0, crewTrack.scrollWidth - stage.clientWidth + parseFloat(getComputedStyle(stage).paddingLeft) * 2);
      const q = seg(p, 0.08, 0.92);
      crewTrack.style.transform = `translate3d(${-max * q}px,0,0)`;
      if (crewBar) crewBar.style.transform = `scaleX(${q})`;
    },
    projects(p) {
      let shown = 0;
      projs.forEach((el, i) => {
        const k = reduce ? 1 : 1 - Math.pow(1 - seg(p, 0.05 + i * 0.2, 0.35 + i * 0.2), 3);
        el.style.setProperty("--k", k.toFixed(3));
        if (k > 0.5) shown = i + 1;
      });
      if (projN) projN.textContent = String(Math.max(1, shown)).padStart(2, "0");
    },
    world(p, el) {
      const items = [...el.querySelectorAll("[data-wstep]")];
      const idx = Math.min(items.length - 1, Math.floor(seg(p, 0, 0.999) * items.length));
      items.forEach((a, i) => a.classList.toggle("on", i === idx));
      el.dataset.wstep = idx;
    },
    gallery(p, el) {
      const track = el.querySelector("[data-track]"), bar = el.querySelector("[data-bar]");
      if (!track) return;
      const stage = track.parentElement;
      const max = Math.max(0, track.scrollWidth - stage.clientWidth + parseFloat(getComputedStyle(stage).paddingLeft) * 2);
      const q = seg(p, 0.06, 0.94);
      track.style.transform = `translate3d(${-max * q}px,0,0)`;
      if (bar) bar.style.transform = `scaleX(${q})`;
    },
    story(p, el) {
      const n = steps.length;
      if (!n) return;
      const idx = Math.min(n - 1, Math.floor(seg(p, 0, 0.999) * n));
      steps.forEach((s, i) => s.classList.toggle("on", i === idx));
      el.style.setProperty("--step", idx);
      el.dataset.step = idx;
      const local = seg(p * n - idx, 0, 1);
      el.style.setProperty("--sp-local", local.toFixed(3));
    },
  };

  let lastY = window.scrollY, vel = 0, ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY;
    const docH = root.scrollHeight - window.innerHeight;
    root.style.setProperty("--sp", docH > 0 ? (y / docH).toFixed(4) : 0);
    scenes.forEach((s) => SCENE[s.dataset.scene]?.(progress(s), s));
    if (nav) nav.classList.toggle("hide", y > lastY + 2 && y > window.innerHeight * 0.6);
    vel = cl((y - lastY) * 0.15, -8, 8);
    lastY = y;
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  // 띠는 스크롤 빠르기만큼 기울었다 돌아온다
  let skew = 0;
  (function loop() {
    skew += (vel - skew) * 0.12; vel *= 0.9;
    if (!reduce) marquees.forEach((m) => m.style.setProperty("--skew", skew.toFixed(2)));
    requestAnimationFrame(loop);
  })();

  // 나타나기
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  // 커서
  const dot = document.querySelector(".cursor"), ring = document.querySelector(".cursor-ring");
  if (dot && ring && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      const el = e.target.closest?.("a, button, [role=slider], .proj");
      ring.classList.toggle("hot", !!el && !el.matches("[aria-disabled=true], [disabled]") && !el.closest("[aria-disabled=true]"));
      ring.classList.toggle("no", !!e.target.closest?.("[aria-disabled=true]"));
    });
    (function follow() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    })();
  }
})();
