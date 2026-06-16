// 구축해야 할 데이터셋 — 렌더러. Vanilla JS. data flow 페이지와 같은 노드+레인+사이드패널 모델.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const canvas = document.getElementById("canvas");
const side = document.getElementById("side");
const toolbar = document.getElementById("toolbar");

const stageLabel = id => (PIPELINE.find(p => p.id === id) || {}).label || id;
const laneLabel  = id => (LANES.find(l => l.id === id) || {}).title || id;

let selectedId = null;
let focusOn = null; // { kind: 'stage'|'question', val }

function buildLanes() {
  LANES.forEach(lane => {
    const el = document.createElement("div");
    el.className = "lane"; el.dataset.src = lane.id;
    el.innerHTML = `<div class="lane-title"><div class="lt">${esc(lane.title)}</div><div class="ls">${esc(lane.sub)}</div></div>`;
    NODES.filter(n => n.srcType === lane.id).forEach(n => {
      const node = document.createElement("div");
      node.className = "node"; node.id = "n-" + n.id; node.dataset.id = n.id;
      node.innerHTML = `<div class="nlabel">${esc(n.mono)}</div>`
        + `<div class="nname">${esc(n.name)}</div>`
        + `<div class="nstatus">${esc(n.status)}</div>`;
      node.onclick = () => selectNode(n.id);
      el.appendChild(node);
    });
    canvas.appendChild(el);
  });
}

function schemaTable(rows) {
  return `<table class="schema"><thead><tr><th>필드</th><th>타입</th><th>예시</th></tr></thead><tbody>` +
    rows.map(([f, t, ex]) => `<tr><td class="f">${esc(f)}</td><td class="t">${esc(t)}</td><td class="ex">${esc(ex)}</td></tr>`).join("") +
    `</tbody></table>`;
}

function selectNode(id) {
  canvas.querySelectorAll(".node.sel").forEach(n => n.classList.remove("sel"));
  document.getElementById("n-" + id)?.classList.add("sel");
  selectedId = id;
  const n = byId[id];
  const stages = n.stages.map(s => `<span class="chip">${esc(stageLabel(s))}</span>`).join("") || "—";
  const qs = n.questions.length ? n.questions.map(q => `<span class="chip">${esc(q)}</span>`).join("") : "—";
  const crawlTitle = n.srcType === "suspect" ? "획득 방법" : "출처 · 왜 크롤로 못 얻나";
  side.innerHTML = `
    <div class="s-head"><span class="s-name">${esc(n.name)}</span><span class="s-src">${esc(laneLabel(n.srcType))}</span></div>
    <div class="s-mono">${esc(n.mono)}</div>
    <div class="s-desc">${esc(n.what)}</div>

    <div class="s-section">푸는 문제</div>
    <div class="s-text">${esc(n.problem)}</div>

    <div class="s-section">${esc(crawlTitle)}</div>
    <div class="s-text${n.srcType === "suspect" ? "" : " crawl"}">${esc(n.source)}</div>

    <div class="s-section">예시 스키마</div>
    ${schemaTable(n.schema)}

    <div class="s-section">쓰이는 단계</div>
    <div>${stages}</div>

    <div class="s-section">판별 질문</div>
    <div>${qs}</div>

    <div class="s-section">주인 · 상태</div>
    <div class="s-meta"><b>주인:</b> ${esc(n.owner)}<br><b>상태:</b> ${esc(n.status)}${n.difficulty ? ` · 난이도 ${esc(n.difficulty)}` : ""}</div>`;
}

function buildToolbar() {
  const stages = PIPELINE.map(p => `<span class="tchip" data-kind="stage" data-val="${p.id}">${esc(p.label)}</span>`).join("");
  const qs = QUESTIONS.map(q => `<span class="tchip" data-kind="question" data-val="${q.id}">${esc(q.label)}</span>`).join("");
  toolbar.innerHTML =
    `<span class="tlabel">단계</span>${stages}` +
    `<span class="tlabel sep">질문</span>${qs}` +
    `<span class="tchip clear" id="t-clear">↺ 해제</span>`;
  toolbar.querySelectorAll(".tchip[data-kind]").forEach(c => {
    c.onclick = () => {
      const kind = c.dataset.kind, val = c.dataset.val;
      focusOn = (focusOn && focusOn.kind === kind && focusOn.val === val) ? null : { kind, val };
      applyFocus();
    };
  });
  document.getElementById("t-clear").onclick = () => { focusOn = null; applyFocus(); };
}

function applyFocus() {
  toolbar.querySelectorAll(".tchip[data-kind]").forEach(c => {
    c.classList.toggle("active", !!(focusOn && focusOn.kind === c.dataset.kind && focusOn.val === c.dataset.val));
  });
  canvas.querySelectorAll(".node.hl").forEach(n => n.classList.remove("hl"));
  if (!focusOn) { canvas.classList.remove("focus"); return; }
  canvas.classList.add("focus");
  NODES.forEach(n => {
    const arr = focusOn.kind === "stage" ? n.stages : n.questions;
    if (arr.includes(focusOn.val)) document.getElementById("n-" + n.id)?.classList.add("hl");
  });
}

buildLanes();
buildToolbar();
selectNode("genuine_price");
