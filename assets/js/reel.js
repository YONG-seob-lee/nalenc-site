"use strict";
// NALENC 30초 쇼릴 — 캔버스 한 장. 화면은 시간 t 하나로만 정해진다(render(t) 는 상태 없음) → 아무 데나 끌어서 멈춰 볼 수 있다.
(() => {
  const cv = document.getElementById("reel");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const reelEl = cv.parentElement;
  const DUR = 30;
  const CH = [
    { t: 0, n: "01 — IGNITION" },
    { t: 5, n: "02 — RAW" },
    { t: 10.6, n: "03 — THE CREW" },
    { t: 16.6, n: "04 — PANCAKE TYCOON" },
    { t: 23.6, n: "05 — NEXT" },
    { t: 27.6, n: "06 — NALENC" },
  ];
  const C = { ink: "#0d0816", ink2: "#171024", ink3: "#241a38", text: "#f6f1ff", text3: "#8b80a3", butter: "#ffc83d", berry: "#ff3b5c", lilac: "#b9a8d6", mint: "#5ce1c6", batter: "#ffefd2", pan: "#2a2233", gold: "#e59a3a", gold2: "#ffd98a" };
  const F = { disp: '"Unbounded", sans-serif', kr: '"Black Han Sans", "Noto Sans KR", sans-serif', mono: '"JetBrains Mono", monospace' };
  const CREW = [
    { name: "Kiriko", ini: "Ki", role: "DIRECTOR · PROGRAMMER", c1: "#ffc83d", c2: "#ff7a3d" },
    { name: "Dune", ini: "Du", role: "ART · STORY · UI", c1: "#ff3b5c", c2: "#b9a8d6" },
    { name: "Capy", ini: "Ca", role: "PROGRAMMER", c1: "#5ce1c6", c2: "#3d7bff" },
    { name: "Kora", ini: "Ko", role: "NEW CREW", c1: "#b9a8d6", c2: "#ffc83d" },
  ];
  const duck = new Image();
  duck.src = (document.querySelector('link[rel="icon"]')?.getAttribute("href")) || "assets/img/duck.png";
  duck.onload = () => (dirty = true);

  let W = 0, H = 0, U = 1, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    U = Math.min(W, H) / 100;
    dirty = true;
  }

  // ---- 도우미 ----
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const oC = (k) => 1 - Math.pow(1 - k, 3);
  const iO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const oB = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const oE = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const TAU = Math.PI * 2;

  function font(size, fam, weight = 400) { ctx.font = `${weight} ${Math.max(1, size)}px ${fam}`; }
  function txt(s, x, y, o = {}) {
    font(o.size || 16, o.fam || F.kr, o.w || 400);
    ctx.textAlign = o.align || "center";
    ctx.textBaseline = o.base || "middle";
    ctx.globalAlpha = o.a ?? 1;
    ctx.fillStyle = o.color || C.text;
    if ("letterSpacing" in ctx) ctx.letterSpacing = o.ls ? o.ls + "px" : "0px";
    ctx.fillText(s, x, y);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.globalAlpha = 1;
  }
  // 글자 하나씩 위치 · 크기 · 투명도를 따로 — fn(i) => { dx, dy, s, a, color }
  function letters(str, cx, cy, size, fam, w, fn) {
    font(size, fam, w);
    const ch = [...str];
    const ws = ch.map((c) => ctx.measureText(c).width);
    const total = ws.reduce((a, b) => a + b, 0);
    let x = cx - total / 2;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ch.forEach((c, i) => {
      const p = fn(i, ch.length) || {};
      const mx = x + ws[i] / 2;
      if ((p.a ?? 1) > 0) {
        ctx.save();
        ctx.translate(mx + (p.dx || 0), cy + (p.dy || 0));
        if (p.r) ctx.rotate(p.r);
        const s = p.s ?? 1; ctx.scale(s, p.sy ?? s);
        ctx.globalAlpha = cl(p.a ?? 1);
        ctx.fillStyle = p.color || C.text;
        ctx.fillText(c, 0, 0);
        ctx.restore();
      }
      x += ws[i];
    });
    return total;
  }
  function bg(color = C.ink) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }
  function dust(t, color = C.text, alpha = 0.22, n = 46) {
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const sp = 6 + rnd(i + 9) * 26;
      const x = ((rnd(i) * W + t * sp) % (W + 20)) - 10;
      const y = rnd(i + 3) * H + Math.sin(t * 0.6 + i) * 8;
      ctx.globalAlpha = alpha * (0.4 + rnd(i + 5) * 0.6);
      ctx.beginPath(); ctx.arc(x, y, 0.6 + rnd(i + 7) * 1.4, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function cropMarks(color = C.text3) {
    const m = Math.max(16, U * 4), l = U * 3;
    ctx.strokeStyle = color; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
    ctx.beginPath();
    [[m, m + 50, 1, 1], [W - m, m + 50, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.moveTo(x, y + sy * l); ctx.lineTo(x, y); ctx.lineTo(x + sx * l, y);
    });
    ctx.stroke(); ctx.globalAlpha = 1;
  }

  // ---- 01 IGNITION (0 – 5) : 선 하나 → NALENC 쾅 → 지직 → 빨려 들어감 ----
  function ch1(t) {
    bg(); dust(t, C.text, 0.15);
    const cx = W / 2, cy = H / 2;
    const k = seg(t, 0, 0.9), fade = 1 - seg(t, 1.0, 1.4);
    if (fade > 0) {
      const w = W * 0.8 * oC(k);
      ctx.fillStyle = C.butter; ctx.globalAlpha = fade;
      ctx.fillRect(cx - w / 2, cy - 1, w, 2);
      ctx.globalAlpha = 1;
    }
    const size = Math.min(W * 0.16, H * 0.3);
    const zk = seg(t, 4.4, 5.0);
    const zoom = 1 + Math.pow(zk, 3) * 16, za = 1 - zk * zk;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
    const drawWord = (dx, color, alphaMul = 1, chroma = true) => letters("NALENC", cx + dx, cy, size, F.disp, 900, (i) => {
      const st = 1.0 + i * 0.13, e = seg(t, st, st + 0.45);
      if (e <= 0) return { a: 0 };
      const off = chroma ? (1 - oC(e)) * U * 4 : 0;
      return { s: lerp(2.6, 1, oC(e)), a: cl(e * 2.5) * za * alphaMul, color, dx: off };
    });
    // 색 번짐(빨강 · 민트) 후 본 글자
    const shake = t > 1 && t < 2.2 ? (rnd(Math.floor(t * 30)) - 0.5) * U * 0.6 : 0;
    drawWord(-U * 0.5 + shake, C.berry, 0.7);
    drawWord(U * 0.5 + shake, C.mint, 0.7);
    drawWord(shake, C.text, 1, false);
    // 지직 — 가로 띠를 몇 개 어긋나게
    if (t > 3.0 && t < 3.8) {
      const f = Math.floor(t * 30);
      for (let j = 0; j < 9; j++) {
        if (rnd(f * 13 + j) < 0.55) continue;
        const y0 = cy - size * 0.6 + rnd(f * 3 + j) * size * 1.2, hh = U * (0.6 + rnd(f + j) * 3);
        const dx = (rnd(f * 7 + j) - 0.5) * U * 10;
        ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, hh); ctx.clip();
        ctx.fillStyle = C.ink; ctx.fillRect(0, y0, W, hh);
        drawWord(dx, rnd(f + j * 5) > 0.5 ? C.butter : C.text, 1, false);
        ctx.restore();
      }
    }
    const sk = seg(t, 3.3, 3.9);
    txt("날것 그대로 만드는 게임팀", cx, cy + size * 0.72 + (1 - oC(sk)) * U * 3, { size: Math.max(14, size * 0.17), fam: F.kr, a: sk * za, color: C.text });
    txt("NALENC  ·  SHOWREEL 2026", cx, cy - size * 0.75, { size: Math.max(10, U * 1.4), fam: F.mono, a: seg(t, 1.8, 2.3) * za, color: C.text3, ls: 4 });
    ctx.restore();
    cropMarks();
  }

  // ---- 02 RAW (5 – 10.6) : 단어가 색 판과 함께 넘어간다 + 뒤집히는 팬케이크 ----
  const WORDS = [
    ["날것", C.butter, C.ink],
    ["그대로", C.berry, C.text],
    ["굴리고", C.lilac, C.ink],
    ["뒤집고", C.mint, C.ink],
    ["굽는다.", C.ink3, C.butter],
  ];
  function ch2(t) {
    const L = 1.05, s0 = 5.0;
    const i = cl(Math.floor((t - s0) / L), 0, WORDS.length - 1);
    const si = s0 + i * L;
    bg(i === 0 ? C.ink : WORDS[i - 1][1]);
    // 비스듬한 판이 왼쪽에서 밀고 들어옴
    const wk = oC(seg(t, si, si + 0.38));
    const edge = lerp(-W * 0.3, W * 1.3, wk), slant = W * 0.25;
    ctx.fillStyle = WORDS[i][1];
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(edge, 0); ctx.lineTo(edge - slant, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // 뒤집히는 팬케이크
    const pr = U * 10, pcx = W * 0.8, pcy = H * 0.28;
    const ph = (t - s0) * 2.4 * Math.PI, sy = Math.cos(ph);
    ctx.save(); ctx.translate(pcx, pcy + Math.sin(ph * 0.5) * U * 2); ctx.rotate(-0.25); ctx.scale(1, Math.max(0.04, Math.abs(sy)));
    const g = ctx.createRadialGradient(-pr * 0.2, -pr * 0.2, pr * 0.1, 0, 0, pr);
    if (sy > 0) { g.addColorStop(0, C.gold2); g.addColorStop(1, C.gold); } else { g.addColorStop(0, C.batter); g.addColorStop(1, "#f3d9a8"); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, pr, 0, TAU); ctx.fill();
    ctx.restore();
    // 단어 — 아래에서 올라와 위로 빠짐(띠 안에서만 보임)
    const size = Math.min(W * 0.2, H * 0.34), cy = H * 0.54;
    const inK = oC(seg(t, si + 0.08, si + 0.45)), outK = i < WORDS.length - 1 ? iO(seg(t, si + 0.82, si + L)) : 0;
    const dy = (1 - inK) * size * 1.1 - outK * size * 1.1;
    ctx.save(); ctx.beginPath(); ctx.rect(0, cy - size * 0.62, W, size * 1.2); ctx.clip();
    letters(WORDS[i][0], W / 2, cy + dy, size, F.kr, 400, (j) => ({ dy: (1 - oC(seg(t, si + 0.08 + j * 0.05, si + 0.5 + j * 0.05))) * size * 0.5, color: WORDS[i][2] }));
    ctx.restore();
    const lc = i === 1 || i === 4 ? C.text : C.ink;
    txt(`0${i + 1} / 05`, Math.max(16, U * 4) + 4, Math.max(96, H * 0.16), { size: Math.max(10, U * 1.3), fam: F.mono, align: "left", color: lc, a: 0.7 });
    // 끝: 동그랗게 닫힌다 → 다음 장의 점
    const ik = seg(t, 10.0, 10.6);
    if (ik > 0) {
      const R = Math.hypot(W, H) * 0.6 * (1 - iO(ik));
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, Math.max(R, U * 0.8), 0, TAU, true); ctx.fill("evenodd");
    }
  }

  // ---- 03 THE CREW (10.6 – 16.6) : 점이 넷으로 터져 자리 잡고, 돌다가 다시 하나로 → 팬 ----
  // 가로 화면은 한 줄, 세로 화면은 2×2
  function crewLayout() {
    if (W < H * 0.9) {
      const sp = W * 0.44, r = Math.min(W * 0.13, H * 0.075);
      return { sp, r, pos: (i) => [W / 2 + ((i % 2) - 0.5) * sp, H * 0.5 + (Math.floor(i / 2) - 0.5) * H * 0.26 - H * 0.02] };
    }
    const sp = Math.min(W * 0.22, U * 30), r = Math.min(sp * 0.32, U * 10);
    return { sp, r, pos: (i) => [W / 2 + (i - 1.5) * sp, H * 0.5] };
  }
  function ch3(t) {
    const u = t - 10.6;
    bg(); dust(t, C.lilac, 0.18);
    const cx = W / 2, cy = H * 0.5;
    const { sp, r, pos } = crewLayout();
    const hk = seg(u, 0.1, 0.7), hOut = seg(u, 3.6, 4.0);
    letters("THE CREW", cx, H * 0.2, Math.max(18, U * 4.2), F.disp, 900, (j) => ({ dy: (1 - oB(seg(u, 0.1 + j * 0.04, 0.6 + j * 0.04))) * U * 6, a: seg(u, 0.1 + j * 0.04, 0.4 + j * 0.04) * (1 - hOut) }));
    txt("네 명이 굽고 있어요", cx, H * 0.2 + U * 5.5, { size: Math.max(13, U * 2.2), fam: F.kr, a: hk * (1 - hOut), color: C.text3 });
    if (u < 0.35) { ctx.fillStyle = C.butter; ctx.beginPath(); ctx.arc(cx, cy, U * 0.8 * (1 + u * 3), 0, TAU); ctx.fill(); }
    const om = iO(seg(u, 3.6, 4.4)), shrink = iO(seg(u, 4.4, 5.3));
    const orbR = Math.min(W, H) * 0.26 * (1 - shrink);
    CREW.forEach((m, i) => {
      const k = oB(seg(u, 0.25 + i * 0.12, 1.0 + i * 0.12));
      if (k <= 0) return;
      const [rx, ry] = pos(i);
      let x = lerp(cx, rx, k), y = lerp(cy, ry, k) - Math.sin(cl(k) * Math.PI) * U * 14 * (i % 2 ? 1 : -1);
      const ang = i * (TAU / 4) + (u - 3.6) * 2.6 - Math.PI / 2;
      const ox = cx + Math.cos(ang) * orbR, oy = cy + Math.sin(ang) * orbR * 0.75;
      x = lerp(x, ox, om); y = lerp(y, oy, om);
      const rr = r * lerp(1, 0.25, shrink) * (u > 5.3 ? 1 - seg(u, 5.3, 5.5) : 1);
      if (rr <= 0.5) return;
      const g = ctx.createRadialGradient(x - rr * 0.4, y - rr * 0.4, rr * 0.1, x, y, rr);
      g.addColorStop(0, m.c1); g.addColorStop(1, m.c2);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
      // 도는 점선 고리
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * (i % 2 ? -1.2 : 1.2));
      ctx.strokeStyle = m.c1; ctx.globalAlpha = 0.6 * (1 - om); ctx.lineWidth = 1.2; ctx.setLineDash([U * 0.8, U * 1.2]);
      ctx.beginPath(); ctx.arc(0, 0, rr + U * 1.6, 0, TAU); ctx.stroke(); ctx.restore();
      ctx.globalAlpha = 1;
      txt(m.ini, x, y + rr * 0.05, { size: rr * 0.62, fam: F.kr, color: C.ink, a: 0.85 * (1 - shrink) });
      // 이름 · 역할
      const la = 1 - seg(u, 3.5, 3.8);
      if (la > 0) {
        const nk = seg(u, 1.2 + i * 0.15, 1.7 + i * 0.15);
        const name = [...m.name].slice(0, Math.ceil(nk * 3)).join("");
        txt(name, x, y + rr + U * 4, { size: Math.max(14, U * 2.6), fam: F.kr, a: la });
        const rk = seg(u, 1.6 + i * 0.15, 2.1 + i * 0.15);
        txt(m.role.slice(0, Math.ceil(rk * m.role.length)), x, y + rr + U * 7.6, { size: Math.max(8, Math.min(U * 1.25, sp / 15)), fam: F.mono, a: la * 0.9, color: m.c1, ls: 1 });
      }
    });
    // 하나로 모인 자리에서 팬이 생긴다
    const pk = seg(u, 5.3, 6.0);
    if (pk > 0) { ctx.fillStyle = C.pan; ctx.beginPath(); ctx.arc(cx, cy, panGeo().R * oC(pk), 0, TAU); ctx.fill(); }
    cropMarks();
  }

  // ---- 04 PANCAKE TYCOON (16.6 – 23.6) : 붓고 · 뒤집고 · 쌓고 · 오리가 올라탄다 ----
  function panGeo() { return { R: Math.min(W, H) * 0.24 }; }
  function pancake(x, y, rx, ry, th, golden = true) {
    ctx.fillStyle = golden ? "#b86a22" : "#e8c48a";
    ctx.beginPath(); ctx.ellipse(x, y + th, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillRect(x - rx, y, rx * 2, th);
    const g = ctx.createRadialGradient(x - rx * 0.2, y - ry * 0.3, rx * 0.1, x, y, rx);
    if (golden) { g.addColorStop(0, C.gold2); g.addColorStop(1, C.gold); } else { g.addColorStop(0, C.batter); g.addColorStop(1, "#f3d9a8"); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  }
  function ch4(t) {
    const v = t - 16.6;
    const wide = W >= H * 1.05;
    bg();
    const { R } = panGeo();
    // 무대 이동(4.8~5.4): 가로 화면은 왼쪽, 세로 화면은 위로
    const mk = iO(seg(v, 4.8, 5.5));
    const gx = lerp(W / 2, wide ? W * 0.27 : W / 2, mk), gy = lerp(H * 0.5, wide ? H * 0.6 : H * 0.42, mk), gs = lerp(1, wide ? 0.85 : 0.7, mk);
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, R * 2.6);
    glow.addColorStop(0, "rgba(255,200,61,.18)"); glow.addColorStop(1, "rgba(255,200,61,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    dust(t, C.butter, 0.2, 30);
    ctx.save(); ctx.translate(gx, gy); ctx.scale(gs, gs);
    const tilt = lerp(1, 0.42, iO(seg(v, 0, 0.5)));
    // 팬 + 손잡이
    const hk = oC(seg(v, 0.3, 0.7));
    ctx.fillStyle = "#1c1624"; ctx.save(); ctx.rotate(0.12); ctx.fillRect(R * 0.9, -R * 0.07 * tilt * 2.4, R * 0.9 * hk, R * 0.14 * tilt * 2.4); ctx.restore();
    ctx.fillStyle = "#1c1624"; ctx.beginPath(); ctx.ellipse(0, R * 0.08 * tilt, R, R * tilt, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.pan; ctx.beginPath(); ctx.ellipse(0, 0, R, R * tilt, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#3a3046"; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.86, R * tilt * 0.86, 0, 0, TAU); ctx.fill();
    const pry = 0.42;
    // 반죽 줄기
    const st0 = seg(v, 0.6, 1.0), st1 = seg(v, 1.4, 1.7);
    if (st0 > 0 && st1 < 1) {
      const top = lerp(-H, 0, st1) - gy / gs, bot = lerp(-H, 0, oC(st0));
      const sw = U * 1.6 * (1 - st1 * 0.6);
      ctx.fillStyle = C.batter; ctx.fillRect(-sw / 2, Math.min(top, bot), sw, Math.abs(bot - top));
    }
    // 부은 반죽(물결) → 기포 → 뒤집기
    const bk = oC(seg(v, 0.9, 1.9));
    const fk = seg(v, 2.6, 3.5);
    const th = R * 0.07;
    if (bk > 0 && v < 3.6) {
      const rb = R * 0.68 * bk, wob = 1 - seg(v, 1.7, 2.3);
      if (fk <= 0) {
        ctx.fillStyle = C.batter; ctx.beginPath();
        for (let a = 0; a <= 64; a++) {
          const an = (a / 64) * TAU, rr = rb * (1 + 0.05 * wob * Math.sin(an * 5 + v * 7));
          const px = Math.cos(an) * rr, py = Math.sin(an) * rr * pry;
          a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.fill();
        // 기포
        for (let b = 0; b < 9; b++) {
          const bs = 1.8 + rnd(b) * 0.6, bp = seg(v, bs, bs + 0.35);
          if (bp <= 0 || bp >= 1) continue;
          ctx.strokeStyle = "#d9b77c"; ctx.lineWidth = 1.2; ctx.globalAlpha = 1 - bp;
          ctx.beginPath(); ctx.ellipse((rnd(b + 4) - 0.5) * rb * 1.2, (rnd(b + 8) - 0.5) * rb * pry, U * 0.6 * (1 + bp), U * 0.6 * pry * (1 + bp), 0, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else {
        const lift = Math.sin(Math.PI * fk) * R * 1.3, rot = fk * TAU, sy = Math.cos(rot);
        ctx.save(); ctx.translate(0, -lift); ctx.rotate(Math.sin(fk * Math.PI) * 0.2);
        const g = ctx.createRadialGradient(-rb * 0.2, 0, rb * 0.1, 0, 0, rb);
        const gold = fk > 0.25 && fk < 0.75 ? sy < 0 : fk >= 0.75;
        if (gold) { g.addColorStop(0, C.gold2); g.addColorStop(1, C.gold); } else { g.addColorStop(0, C.batter); g.addColorStop(1, "#f3d9a8"); }
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rb, Math.max(1, rb * pry * Math.abs(sy)), 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
    if (fk > 0.4) { // FLIP!
      const pk = seg(v, 2.95, 3.3), po = seg(v, 3.6, 3.9);
      ctx.save(); ctx.translate(R * 0.75, -R * 0.75); ctx.rotate(-0.18); ctx.scale(oB(pk), oB(pk));
      txt("FLIP!", 0, 0, { size: R * 0.32, fam: F.disp, w: 900, color: C.butter, a: pk * (1 - po) });
      ctx.restore();
    }
    // 쌓기: 첫 장(뒤집힌 것) + 세 장이 떨어짐
    const rbF = R * 0.68;
    if (v >= 3.5) {
      const n = 4;
      for (let j = 0; j < n; j++) {
        const dk = j === 0 ? 1 : oB(seg(v, 3.55 + (j - 1) * 0.28, 3.95 + (j - 1) * 0.28));
        if (dk <= 0) continue;
        const y = lerp(-H / gs, 0, cl(dk)) - j * th * 1.6 + (dk > 1 ? (1 - dk) * th * 4 : 0);
        pancake(0, y - th, rbF * (1 - j * 0.03), rbF * pry * (1 - j * 0.03), th, true);
      }
      const topY = -(n - 1) * th * 1.6 - th;
      // 버터
      const bu = oB(seg(v, 4.5, 4.85));
      if (bu > 0) {
        const by = lerp(-H / gs, topY - th * 0.6, cl(bu));
        const bw = rbF * 0.28;
        ctx.fillStyle = "#e9c64a"; ctx.fillRect(-bw / 2, by - bw * 0.25 + bw * 0.22, bw, bw * 0.22);
        ctx.fillStyle = "#fff1a8"; ctx.beginPath(); ctx.moveTo(-bw / 2, by); ctx.lineTo(0, by - bw * 0.25); ctx.lineTo(bw / 2, by); ctx.lineTo(0, by + bw * 0.25); ctx.closePath(); ctx.fill();
      }
      // 시럽
      const sk = oC(seg(v, 4.7, 5.5));
      if (sk > 0) {
        ctx.fillStyle = "rgba(170,80,20,.85)";
        ctx.beginPath(); ctx.ellipse(0, topY, rbF * 0.8 * sk, rbF * pry * 0.8 * sk, 0, 0, TAU); ctx.fill();
        for (let d = 0; d < 5; d++) {
          const ang = 0.4 + d * 0.55, dx = Math.cos(ang) * rbF * 0.78, dyy = topY + Math.sin(ang) * rbF * pry * 0.78;
          const dl = th * 5 * seg(v, 5.0 + d * 0.08, 5.8 + d * 0.08) * (0.5 + rnd(d) * 0.8);
          ctx.fillRect(dx - U * 0.35, dyy, U * 0.7, dl);
          ctx.beginPath(); ctx.arc(dx, dyy + dl, U * 0.5, 0, TAU); ctx.fill();
        }
      }
      // 오리가 위로 떨어져 앉는다
      const dkk = seg(v, 5.0, 5.7);
      if (dkk > 0 && duck.complete && duck.naturalWidth) {
        const dh = R * 1.15, dw = dh * (duck.naturalWidth / duck.naturalHeight);
        const land = topY - th * 0.4;
        const fall = dkk < 0.55 ? lerp(-H / gs, land, Math.pow(dkk / 0.55, 2)) : land;
        const sq = dkk >= 0.55 ? Math.sin(seg(dkk, 0.55, 1) * Math.PI) * 0.22 * (1 - seg(dkk, 0.55, 1)) : 0;
        const bob = v > 5.7 ? Math.sin((v - 5.7) * 6) * 0.03 : 0;
        ctx.save(); ctx.translate(0, fall); ctx.scale(1 + sq, 1 - sq + bob);
        ctx.drawImage(duck, -dw / 2, -dh, dw, dh);
        ctx.restore();
      }
    }
    ctx.restore();
    // 제목
    const tx = wide ? W * 0.66 : W / 2, ty = wide ? H * 0.42 : H * 0.72;
    const ts = wide ? Math.min(W * 0.072, H * 0.13) : Math.min(W * 0.12, H * 0.08);
    letters("PANCAKE", tx, ty, ts, F.disp, 900, (j) => { const k = seg(v, 5.3 + j * 0.06, 5.8 + j * 0.06); return { dy: (1 - oB(k)) * -ts * 1.2, a: cl(k * 3) }; });
    letters("TYCOON", tx, ty + ts * 1.05, ts, F.disp, 900, (j) => { const k = seg(v, 5.55 + j * 0.06, 6.05 + j * 0.06); return { dy: (1 - oB(k)) * -ts * 1.2, a: cl(k * 3), color: C.butter }; });
    const tg = seg(v, 6.0, 6.5);
    txt("오리가 굽는 B급 팬케이크 타이쿤", tx, ty + ts * 1.95, { size: Math.max(13, ts * 0.27), fam: F.kr, a: tg, color: C.text });
    txt("PROJECT 01  —  IN DEVELOPMENT", tx, ty - ts * 0.95, { size: Math.max(9, ts * 0.13), fam: F.mono, a: seg(v, 5.2, 5.6), color: C.text3, ls: 3 });
    cropMarks();
  }

  // ---- 05 NEXT (23.6 – 27.6) : 두 판이 갈라져 들어온다 — Circle Horror / Duck Please! ----
  function ch5(t) {
    const w = t - 23.6;
    if (w < 0.7) ch4(23.6); else bg();
    const wide = W >= H;
    const ik = oC(seg(w, 0, 0.6));
    const f = Math.floor(t * 24);
    const panels = wide
      ? [{ x: 0, y: -H * (1 - ik), w: W / 2, h: H }, { x: W / 2, y: H * (1 - ik), w: W / 2, h: H }]
      : [{ x: -W * (1 - ik), y: 0, w: W, h: H / 2 }, { x: W * (1 - ik), y: H / 2, w: W, h: H / 2 }];
    // Circle Horror
    {
      const p = panels[0], cx = p.x + p.w / 2, cy = p.y + p.h * 0.44;
      ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(p.w, p.h) * 0.7);
      g.addColorStop(0, "#2a0d16"); g.addColorStop(1, "#060309"); ctx.fillStyle = g; ctx.fillRect(p.x, p.y, p.w, p.h);
      const pr = Math.min(p.w, p.h) * 0.2;
      const blink = 1 - Math.sin(seg(w, 1.9, 2.1) * Math.PI) * 0.95;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, blink);
      ctx.shadowColor = C.berry; ctx.shadowBlur = U * 4;
      ctx.strokeStyle = C.berry; ctx.lineWidth = Math.max(2, U * 0.45); ctx.beginPath(); ctx.arc(0, 0, pr, 0, TAU); ctx.stroke();
      ctx.fillStyle = C.berry; ctx.beginPath(); ctx.arc(Math.sin(w * 1.7) * pr * 0.45, Math.cos(w * 1.1) * pr * 0.15, pr * 0.3, 0, TAU); ctx.fill();
      ctx.restore();
      for (let j = 0; j < 6; j++) { // 깜빡이는 줄
        if (rnd(f * 5 + j) < 0.7) continue;
        ctx.fillStyle = "rgba(255,59,92,.18)"; ctx.fillRect(p.x, p.y + rnd(f + j * 3) * p.h, p.w, 1 + rnd(j + f) * 2);
      }
      const ts = Math.min(p.w * 0.085, p.h * 0.1);
      const jx = (rnd(f) - 0.5) * U * 0.5;
      txt("CIRCLE HORROR", cx + jx, cy + pr + ts * 1.2, { size: ts, fam: F.disp, w: 900, color: C.berry, a: seg(w, 0.5, 0.9) });
      const cs = "COMING SOON"; txt(cs.slice(0, Math.ceil(seg(w, 0.9, 1.4) * cs.length)), cx, cy + pr + ts * 2.3, { size: Math.max(9, ts * 0.32), fam: F.mono, color: C.text3, ls: 3 });
      ctx.restore();
    }
    // Duck Please!
    {
      const p = panels[1], cx = p.x + p.w / 2, cy = p.y + p.h * (wide ? 0.4 : 0.22);
      ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
      ctx.fillStyle = C.butter; ctx.fillRect(p.x, p.y, p.w, p.h);
      const ts = Math.min(p.w * 0.095, p.h * 0.11);
      letters("DUCK PLEASE!", cx, cy, ts, F.disp, 900, (j) => ({ dy: -Math.abs(Math.sin(w * 5 + j * 0.5)) * ts * 0.12 * seg(w, 0.8, 1.2), color: C.ink, a: seg(w, 0.5 + j * 0.03, 0.8 + j * 0.03) }));
      const cs = "COMING SOON"; txt(cs.slice(0, Math.ceil(seg(w, 0.9, 1.4) * cs.length)), cx, cy + ts * 1.0, { size: Math.max(9, ts * 0.3), fam: F.mono, color: C.ink, a: 0.7, ls: 3 });
      if (duck.complete && duck.naturalWidth) {
        const n = 5, dh = Math.min(p.h * 0.2, p.w * 0.12), dw = dh * (duck.naturalWidth / duck.naturalHeight), gap = dw * 1.25;
        for (let d = 0; d < n; d++) {
          const ek = seg(w, 0.9 + d * 0.1, 1.3 + d * 0.1);
          if (ek <= 0) continue;
          const x = cx + (d - (n - 1) / 2) * gap, base = p.y + p.h * (wide ? 0.86 : 0.62);
          const hop = Math.abs(Math.sin(w * 6 + d * 0.9)) * dh * 0.25;
          ctx.globalAlpha = ek;
          ctx.save(); ctx.translate(x, base - hop); if (d % 2) ctx.scale(-1, 1); ctx.drawImage(duck, -dw / 2, -dh, dw, dh); ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    }
    // 닫힘: 양쪽에서 검은 판 → 가운데 노란 선 → 점
    const ck = iO(seg(w, 3.3, 3.75));
    if (ck > 0) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(0, 0, (W / 2) * ck, H); ctx.fillRect(W - (W / 2) * ck, 0, (W / 2) * ck, H);
      const lk = seg(w, 3.6, 4.0);
      if (ck > 0.9) { const lh = H * (1 - oC(lk)); ctx.fillStyle = C.butter; ctx.fillRect(W / 2 - 1, H / 2 - lh / 2, 2, Math.max(lh, 2)); if (lk >= 1) { ctx.beginPath(); ctx.arc(W / 2, H / 2, U * 0.8, 0, TAU); ctx.fill(); } }
    }
  }

  // ---- 06 NALENC (27.6 – 30) : 점이 터지고 로고 ----
  function ch6(t) {
    const z = t - 27.6;
    bg(); dust(t, C.text, 0.18);
    const cx = W / 2, cy = H * 0.47;
    const rk = seg(z, 0, 0.7);
    if (rk < 1) {
      ctx.strokeStyle = C.butter; ctx.lineWidth = Math.max(0.5, U * 0.5 * (1 - rk)); ctx.globalAlpha = 1 - rk;
      ctx.beginPath(); ctx.arc(cx, cy, U * 0.8 + oC(rk) * Math.max(W, H) * 0.6, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      if (z < 0.15) { ctx.fillStyle = C.butter; ctx.beginPath(); ctx.arc(cx, cy, U * 0.8, 0, TAU); ctx.fill(); }
    }
    const size = Math.min(W * 0.15, H * 0.25);
    ctx.save(); ctx.beginPath(); ctx.rect(0, cy - size * 0.62, W, size * 1.24); ctx.clip();
    const ww = letters("NALENC", cx, cy, size, F.disp, 900, (i) => { const k = seg(z, 0.15 + i * 0.06, 0.7 + i * 0.06); return { dy: (1 - oB(k)) * size * 1.1 }; });
    ctx.restore();
    const uk = oC(seg(z, 0.8, 1.3));
    ctx.fillStyle = C.butter; ctx.fillRect(cx - ww / 2, cy + size * 0.58, ww * uk, Math.max(3, size * 0.05));
    const sk = seg(z, 1.0, 1.5);
    txt("날것 그대로 만드는 게임팀", cx, cy + size * 0.95 + (1 - oC(sk)) * U * 2, { size: Math.max(14, size * 0.2), fam: F.kr, a: sk });
    const url = "nalenc.kr"; const nk = seg(z, 1.3, 1.8);
    txt(url.slice(0, Math.ceil(nk * url.length)) + (nk > 0 && nk < 1 ? "▍" : ""), cx, cy + size * 1.3, { size: Math.max(11, size * 0.12), fam: F.mono, color: C.text3, ls: 2 });
    cropMarks();
  }

  function render(t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (t < 5) ch1(t);
    else if (t < 10.6) ch2(t);
    else if (t < 16.6) ch3(t);
    else if (t < 23.6) ch4(t);
    else if (t < 27.6) ch5(t);
    else ch6(Math.min(t, DUR));
  }

  // ---- 재생 ----
  const $ = (id) => document.getElementById(id);
  const bar = $("reel-bar"), fill = $("reel-fill"), timeEl = $("reel-time"), chapEl = $("reel-chapter"), playBtn = $("reel-play");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = reduce ? DUR : 0, playing = false, ready = false, visible = true, dirty = true, last = 0, dragging = false, wasPlaying = false;
  CH.slice(1).forEach((c) => { const i = document.createElement("i"); i.style.left = (c.t / DUR) * 100 + "%"; $("reel-ticks").appendChild(i); });

  const mmss = (s) => "00:" + String(Math.floor(s)).padStart(2, "0");
  function ui() {
    fill.style.width = (t / DUR) * 100 + "%";
    timeEl.textContent = `${mmss(t)} / 00:30`;
    let c = CH[0]; for (const x of CH) if (t >= x.t) c = x;
    chapEl.textContent = c.n;
    bar.setAttribute("aria-valuenow", t.toFixed(1));
    playBtn.textContent = playing ? "❚❚" : "▶";
    playBtn.setAttribute("aria-label", playing ? "일시정지" : "재생");
    reelEl.classList.toggle("done", t >= DUR);
  }
  function play() { if (t >= DUR) t = 0; playing = true; dirty = true; }
  function pause() { playing = false; dirty = true; }
  function seek(nt) { t = cl(nt, 0, DUR); dirty = true; }

  function frame(ts) {
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
    last = ts;
    if (playing && visible && !dragging) {
      t += dt;
      if (t >= DUR) { t = DUR; playing = false; }
      dirty = true;
    }
    if (dirty && visible && W > 0) { render(t); ui(); dirty = false; }
    requestAnimationFrame(frame);
  }

  playBtn.addEventListener("click", () => (playing ? pause() : play()));
  $("reel-restart").addEventListener("click", () => { t = 0; play(); });
  const tAt = (e) => { const r = bar.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * DUR; };
  bar.addEventListener("pointerdown", (e) => { dragging = true; wasPlaying = playing; bar.setPointerCapture(e.pointerId); seek(tAt(e)); });
  bar.addEventListener("pointermove", (e) => { if (dragging) seek(tAt(e)); });
  const endDrag = () => { if (!dragging) return; dragging = false; if (wasPlaying && t < DUR) play(); };
  bar.addEventListener("pointerup", endDrag);
  bar.addEventListener("pointercancel", endDrag);
  bar.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { seek(t - 1); e.preventDefault(); }
    if (e.key === "ArrowRight") { seek(t + 1); e.preventDefault(); }
  });
  document.addEventListener("keydown", (e) => {
    if (!visible || e.target.closest?.("input, textarea, [contenteditable]") || e.target === bar) return;
    if (window.scrollY > window.innerHeight * 0.5) return;
    if (e.code === "Space") { e.preventDefault(); playing ? pause() : play(); }
    else if (e.key === "r" || e.key === "R") { t = 0; play(); }
    else if (e.key === "ArrowLeft") seek(t - 1);
    else if (e.key === "ArrowRight") seek(t + 1);
  });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; dirty = true; }, { threshold: 0.05 }).observe(reelEl);
  new ResizeObserver(resize).observe(cv);
  resize();

  // 글꼴이 다 오면 시작(최대 2초 기다림) — 중간에 글꼴이 바뀌어 튀지 않게
  const start = () => { if (ready) return; ready = true; dirty = true; if (!reduce) play(); };
  const fontLoads = document.fonts ? ['900 40px "Unbounded"', '400 40px "Black Han Sans"', '400 20px "JetBrains Mono"'].map((f) => document.fonts.load(f, "NALENC날것")) : [];
  Promise.all(fontLoads).then(start, start);
  setTimeout(start, 2000);
  requestAnimationFrame(frame);

  window.__reel = { seek: (s) => { pause(); seek(s); render(t); ui(); dirty = false; }, play, pause, get t() { return t; } };
})();
