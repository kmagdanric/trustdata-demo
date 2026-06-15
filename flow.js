// Renders the data-flow graph from flow-data.js. Vanilla JS.

const byId = Object.fromEntries(FLOW_NODES.map(n => [n.id, n]));
const canvas = document.getElementById("canvas");
const side = document.getElementById("side");
let svg;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// tag → [표시 텍스트, 설명]  (출처/갭)
const TAG_META = {
  "6":            ["제공",      "제공(6필드)"],
  "export":       ["RP export", "Red Points 내보내기 · 채널 미정"],
  "derive":       ["파생",      "계산/파생"],
  "classify":     ["분류",      "분류 필요(brain)"],
  "not-collected":["미수집",    "현재 미수집"],
  "customer":     ["고객",      "고객 관리"],
  "ai":           ["RP내부",    "RP 내부지표 · 재현 난망"],
  "future":       ["목표",      "목표(범위 외)"],
};

function buildLanes() {
  for (let s = 1; s <= 4; s++) {
    const lane = document.createElement("div");
    lane.className = "lane"; lane.dataset.stage = s;
    lane.innerHTML = `<div class="lane-title">${STAGE_LABELS[s]}</div>`;
    FLOW_NODES.filter(n => n.stage === s).forEach(n => {
      const el = document.createElement("div");
      el.className = "node" + (n.tentative ? " tentative" : ""); el.id = "n-" + n.id; el.dataset.id = n.id;
      el.innerHTML = `<div class="nlabel">${n.label}</div>`
        + (n.sub ? `<div class="nsub">${n.sub}</div>` : "");
      el.onmouseenter = () => focusNode(n.id);
      el.onmouseleave = clearFocus;
      el.onclick = () => selectNode(n.id);
      lane.appendChild(el);
    });
    canvas.appendChild(lane);
  }
  svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "edges");
  canvas.appendChild(svg);
}

function edgeId(e) { return `e-${e[0]}-${e[1]}`; }

function drawEdges() {
  const cv = canvas.getBoundingClientRect();
  svg.setAttribute("width", canvas.scrollWidth);
  svg.setAttribute("height", canvas.scrollHeight);
  svg.innerHTML = "";
  FLOW_EDGES.forEach(e => {
    const a = document.getElementById("n-" + e[0]), b = document.getElementById("n-" + e[1]);
    if (!a || !b) return;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const x1 = ra.right - cv.left + canvas.scrollLeft, y1 = ra.top - cv.top + ra.height / 2 + canvas.scrollTop;
    const x2 = rb.left - cv.left + canvas.scrollLeft, y2 = rb.top - cv.top + rb.height / 2 + canvas.scrollTop;
    const dx = Math.max(40, (x2 - x1) / 2);
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
    p.setAttribute("id", edgeId(e));
    if (e[2] === "writeback") p.classList.add("writeback");
    svg.appendChild(p);
    if (e[3]) {                                                // labeled edge
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", (x1 + x2) / 2); t.setAttribute("y", (y1 + y2) / 2 - 4);
      t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "elabel");
      t.textContent = e[3];
      svg.appendChild(t);
    }
  });
}

function neighbors(id) {
  const nodes = new Set([id]), edges = [];
  FLOW_EDGES.forEach(e => { if (e[0] === id || e[1] === id) { nodes.add(e[0]); nodes.add(e[1]); edges.push(e); } });
  return { nodes, edges };
}

let selectedId = null;

function setHL(id) {
  const { nodes, edges } = neighbors(id);
  canvas.classList.add("focus");
  nodes.forEach(nid => document.getElementById("n-" + nid)?.classList.add("hl"));
  edges.forEach(e => document.getElementById(edgeId(e))?.classList.add("hl"));
}

function clearHL() {
  canvas.querySelectorAll(".node.hl").forEach(n => n.classList.remove("hl"));
  svg.querySelectorAll("path.hl").forEach(p => p.classList.remove("hl"));
}

function focusNode(id) { clearHL(); setHL(id); }              // hover: temporary

function clearFocus() {                                       // hover out: fall back to selection
  clearHL();
  if (selectedId) setHL(selectedId);
  else canvas.classList.remove("focus");
}

function schemaTable(rows) {
  return `<table class="schema"><thead><tr><th>필드</th><th>타입</th><th>예시</th><th>출처</th></tr></thead><tbody>` +
    rows.map(([f, t, ex, tag]) => {
      const meta = TAG_META[tag];
      const txt = meta ? `<span title="${esc(meta[1])}">${esc(meta[0])}</span>` : "";
      return `<tr><td class="f">${esc(f)}</td><td class="t">${esc(t)}</td><td class="ex">${esc(ex)}</td><td class="tag">${txt}</td></tr>`;
    }).join("") +
    `</tbody></table>`;
}

function selectNode(id) {
  canvas.querySelectorAll(".node.sel").forEach(n => n.classList.remove("sel"));
  document.getElementById("n-" + id)?.classList.add("sel");
  selectedId = id;
  clearHL(); setHL(id);                                      // persistent highlight on select
  const n = byId[id];
  const ins = FLOW_EDGES.filter(e => e[1] === id).map(e => e[0]);
  const outs = FLOW_EDGES.filter(e => e[0] === id).map(e => e[1]);
  const chips = ids => ids.length ? ids.map(i => `<span class="chip" onclick="selectNode('${i}')">${byId[i]?.label || i}</span>`).join("") : "—";
  side.innerHTML = `
    <div class="s-head"><span class="s-label">${n.label}</span><span class="s-stage">${STAGE_LABELS[n.stage]}</span></div>
    ${n.sub ? `<div class="s-sub">${n.sub}</div>` : ""}
    <div class="s-desc">${n.desc}</div>
    ${n.schema ? `<div class="s-section">예시 스키마</div>${schemaTable(n.schema)}` : ""}
    <div class="s-section">흐름</div>
    <div class="s-flow"><b>◀ 받는 데이터</b><br>${chips(ins)}</div>
    <div class="s-flow"><b>▶ 보내는 곳</b><br>${chips(outs)}</div>`;
}

buildLanes();
requestAnimationFrame(() => { drawEdges(); selectNode("raw_listing"); });
window.addEventListener("resize", drawEdges);
canvas.addEventListener("scroll", drawEdges);
