// Renders the data-flow graph from flow-data.js. Vanilla JS.

const byId = Object.fromEntries(FLOW_NODES.map(n => [n.id, n]));
const canvas = document.getElementById("canvas");
const detail = document.getElementById("detail");
let svg;

function buildLanes() {
  for (let s = 1; s <= 4; s++) {
    const lane = document.createElement("div");
    lane.className = "lane"; lane.dataset.stage = s;
    lane.innerHTML = `<div class="lane-title">${STAGE_LABELS[s]}</div>`;
    FLOW_NODES.filter(n => n.stage === s).forEach(n => {
      const el = document.createElement("div");
      el.className = "node"; el.id = "n-" + n.id; el.dataset.id = n.id;
      el.innerHTML = `<div class="nlabel">${n.label}</div>` + (n.sub ? `<div class="nsub">${n.sub}</div>` : "");
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
  });
}

function neighbors(id) {
  const nodes = new Set([id]), edges = [];
  FLOW_EDGES.forEach(e => {
    if (e[0] === id || e[1] === id) { nodes.add(e[0]); nodes.add(e[1]); edges.push(e); }
  });
  return { nodes, edges };
}

function focusNode(id) {
  const { nodes, edges } = neighbors(id);
  canvas.classList.add("focus");
  nodes.forEach(nid => document.getElementById("n-" + nid)?.classList.add("hl"));
  edges.forEach(e => document.getElementById(edgeId(e))?.classList.add("hl"));
}

function clearFocus() {
  canvas.classList.remove("focus");
  canvas.querySelectorAll(".node.hl").forEach(n => n.classList.remove("hl"));
  svg.querySelectorAll("path.hl").forEach(p => p.classList.remove("hl"));
}

function selectNode(id) {
  canvas.querySelectorAll(".node.sel").forEach(n => n.classList.remove("sel"));
  document.getElementById("n-" + id)?.classList.add("sel");
  const n = byId[id];
  const ins = FLOW_EDGES.filter(e => e[1] === id).map(e => e[0]);
  const outs = FLOW_EDGES.filter(e => e[0] === id).map(e => e[1]);
  const chips = ids => ids.length ? ids.map(i => `<span class="chip">${byId[i]?.label || i}</span>`).join("") : "<span class='dflow'>—</span>";
  detail.innerHTML = `
    <div class="dhead">${n.label}<span class="dstage">${STAGE_LABELS[n.stage]}${n.sub ? " · " + n.sub : ""}</span></div>
    <div class="ddesc">${n.desc}</div>
    <div class="dflow"><b>받는 데이터 ◀</b> ${chips(ins)} &nbsp;&nbsp; <b>▶ 보내는 곳</b> ${chips(outs)}</div>`;
}

buildLanes();
requestAnimationFrame(() => { drawEdges(); selectNode("incident"); });
window.addEventListener("resize", drawEdges);
canvas.addEventListener("scroll", drawEdges);
</content>
