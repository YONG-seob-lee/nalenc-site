"use strict";
// 팀 무대 — 캐릭터 · 이름표를 누르면 통통 튀고(boing), 나머지는 어두워지고, 정보 카드가 뜬다
(() => {
  const scene = document.getElementById("scene");
  const prof = document.getElementById("profile");
  if (!scene || !prof) return;
  const ORDER = ["dune", "kiriko", "kora", "capy"]; // 그림 속 이름표 순서
  const M = {
    dune: { no: "01", name: "Dune", animal: "검은 고양이 · Black Cat", role: "Art", line: "캐릭터와 화면, 손에 닿는 모든 그림을 그립니다.", say: "마감 직전…!!", color: "#ff3b5c" },
    kiriko: { no: "02", name: "Kiriko", animal: "코끼리 · Elephant", role: "Programmer", line: "방향을 잡고, 코드를 짜고, 스토어에 올립니다.", say: "빌드중…", color: "#ffc83d", art: "kiriko-card" },
    kora: { no: "03", name: "Kora", animal: "고라니 · Water Deer", role: "Animator", line: "원화를 그리고, Spine 으로 캐릭터에 숨을 불어넣습니다.", say: "", color: "#b9a8d6" },
    capy: { no: "04", name: "Capy", animal: "회색 고양이 · Gray Cat", role: "Programmer", line: "게임이 돌아가게 코드를 짭니다.", say: "버그 잡는 중!", color: "#5ce1c6" },
  };
  const actors = Object.fromEntries([...scene.querySelectorAll(".actor")].map((a) => [a.dataset.who, a]));
  const plates = [...scene.querySelectorAll(".plate")];
  const bubble = document.getElementById("crew-bubble");
  const empty = prof.querySelector(".pf-empty"), card = prof.querySelector(".pf-card");
  const $ = (sel) => card.querySelector(sel);
  let cur = null, bubbleT = 0, wakeT = 0;

  function boing(a) {
    a.classList.remove("boing");
    void a.offsetWidth; // 다시 재생
    a.classList.add("boing");
    clearTimeout(a._bt);
    a._bt = setTimeout(() => a.classList.remove("boing"), 950);
  }
  // 선택 연출(acting) 길이 — CSS 애니메이션과 맞춘다. 여기 없는 캐릭터는 통통(boing)만
  const ACT = { dune: 2600, kiriko: 3600, kora: 2600 };
  function act(who) {
    const a = actors[who];
    a.classList.remove("acting"); void a.offsetWidth; a.classList.add("acting");
    clearTimeout(a._at);
    a._at = setTimeout(() => a.classList.remove("acting"), ACT[who]);
  }
  function say(who) {
    const a = actors[who], m = M[who];
    if (!m.say) { clearTimeout(bubbleT); bubble.classList.remove("on"); return; } // 고라니는 말풍선 대신 비명 글자
    bubble.textContent = m.say;
    const sr = scene.getBoundingClientRect(), ar = a.getBoundingClientRect();
    // 말풍선이 그림 밖으로 나가지 않게 가운데 위치를 좁혀 둔다
    const bw = Math.min(bubble.offsetWidth || 160, sr.width - 16) / 2 + 8;
    const cx = Math.min(Math.max(ar.left + ar.width / 2 - sr.left, bw), sr.width - bw);
    bubble.style.left = (cx / sr.width) * 100 + "%";
    bubble.style.top = (Math.max(ar.top - sr.top, 40) / sr.height) * 100 + "%";
    bubble.classList.remove("on"); void bubble.offsetWidth; bubble.classList.add("on");
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => bubble.classList.remove("on"), 2200);
  }
  function select(who, { quiet = false } = {}) {
    if (!M[who]) return;
    cur = who;
    const m = M[who];
    scene.classList.add("has-sel");
    scene.classList.toggle("sel-kiriko", who === "kiriko");
    prof.dataset.who = who;
    Object.entries(actors).forEach(([k, a]) => a.classList.toggle("sel", k === who));
    plates.forEach((p) => p.classList.toggle("sel", p.dataset.who === who));
    if (ACT[who]) act(who);
    if (who !== "dune" && who !== "kora") boing(actors[who]);
    say(who);
    if (who === "kora") {
      scene.classList.add("kora-awake");
      clearTimeout(wakeT);
      wakeT = setTimeout(() => scene.classList.remove("kora-awake"), 4000);
    }
    empty.hidden = true; card.hidden = false;
    $(".pf-art img").src = `assets/img/crew-scene/${m.art || who}.png`;
    $(".pf-art img").alt = `${m.name} 캐릭터`;
    $(".pf-name").textContent = m.name;
    $(".pf-role").textContent = m.role;
    $(".pf-line").textContent = m.line;
    prof.style.setProperty("--pc", m.color + "55");
    prof.style.setProperty("--pcs", m.color);
    card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    if (!quiet && window.matchMedia("(max-width: 900px)").matches) {
      const r = prof.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.8) prof.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
  function clear() {
    cur = null;
    scene.classList.remove("has-sel", "sel-kiriko");
    delete prof.dataset.who;
    Object.values(actors).forEach((a) => a.classList.remove("sel"));
    plates.forEach((p) => p.classList.remove("sel"));
    bubble.classList.remove("on");
    card.hidden = true; empty.hidden = false;
  }

  scene.addEventListener("click", (e) => {
    const t = e.target.closest("[data-who]");
    if (t) select(t.dataset.who);
    else if (cur) clear();
  });
  prof.addEventListener("click", (e) => {
    const chip = e.target.closest(".pf-chips [data-who]");
    if (chip) return select(chip.dataset.who);
    const step = e.target.closest("[data-step]");
    if (step && cur) return select(ORDER[(ORDER.indexOf(cur) + Number(step.dataset.step) + ORDER.length) % ORDER.length]);
    if (e.target.closest("[data-close]")) clear();
  });
  document.addEventListener("keydown", (e) => {
    if (!cur) return;
    if (e.key === "Escape") clear();
    else if (e.target.closest?.("#crew") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      select(ORDER[(ORDER.indexOf(cur) + (e.key === "ArrowRight" ? 1 : -1) + ORDER.length) % ORDER.length]);
    }
  });

  // 처음 보일 때 한 명씩 차례로 꿈틀 — 누를 수 있다는 힌트
  let hinted = false;
  new IntersectionObserver((es) => {
    if (hinted || !es[0].isIntersecting || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    hinted = true;
    ORDER.filter((w) => w !== "kora").forEach((w, i) => setTimeout(() => !cur && boing(actors[w]), 400 + i * 260));
  }, { threshold: 0.5 }).observe(scene);

  window.__crew = { select, clear };
})();
