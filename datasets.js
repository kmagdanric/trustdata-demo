// 구축해야 할 데이터셋 — 렌더러. Vanilla JS.
// 필터: 파이프라인 단계 / 판별 질문 / 출처 유형. 하나 누르면 해당 데이터셋만 강조.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ALL = [...REF_DATASETS, ...OP_DATASETS];
const stageLabel = id => (PIPELINE.find(p => p.id === id) || {}).label || id;

let filter = null; // { kind: 'stage'|'question'|'src', val: string }

function worldsHTML() {
  const s = SUSPECT_DATA;
  return `
  <div class="worlds">
    <div class="world suspect">
      <h3>판별 대상 — 의심 리스팅</h3>
      <div class="tag">${esc(s.mono)}</div>
      <p>${esc(s.what)}</p>
      <div class="how">획득: ${esc(s.how)}</div>
      <div class="verdict">크롤 / 구매로 얻는 건 오직 이것 — "문제지"</div>
    </div>
    <div class="vs">대조 ▶</div>
    <div class="world answer">
      <h3>판별 기준 — 정답지 (아래 데이터셋)</h3>
      <div class="tag">reference + first-party</div>
      <p>가격·이미지·셀러·상표 기준. 의심 리스팅을 이 기준과 대조해야 판별이 된다.</p>
      <div class="how">획득: 브랜드 · 공개 등록부 · 자체 운영. 마켓에 없다.</div>
      <div class="verdict">크롤로 못 얻는다 — 그래서 해자(moat)</div>
    </div>
  </div>`;
}

function pipelineHTML() {
  const stages = PIPELINE.map(p =>
    `<div class="pstage" data-kind="stage" data-val="${p.id}">
       <div class="pl">${esc(p.label)}</div><div class="pd">${esc(p.desc)}</div>
     </div>`).join('<span class="parrow">→</span>');
  return `<div class="section-label">대표 개발 방향성 파이프라인 — 단계를 누르면 필요한 데이터셋이 강조됩니다</div>
    <div class="pipeline">${stages}</div>`;
}

function filtersHTML() {
  const q = QUESTIONS.map(x => `<span class="chip" data-kind="question" data-val="${x.id}" title="${esc(x.desc)}">${esc(x.label)}</span>`).join("");
  const src = Object.entries(SRC_TYPES).map(([k, v]) => `<span class="chip" data-kind="src" data-val="${k}" title="${esc(v.desc)}">${esc(v.label)}</span>`).join("");
  return `<div class="filters">
    <div class="filter-grp"><span class="glabel">판별 질문</span>${q}</div>
    <div class="filter-grp"><span class="glabel">출처</span>${src}</div>
    <span class="chip reset" id="reset">↺ 전체</span>
  </div>`;
}

function cardHTML(d) {
  const qs = d.questions.map(q => `<span class="badge b-q">${esc(q)}</span>`).join("");
  const sts = d.stages.map(s => `<span class="badge b-stage">${esc(stageLabel(s))}</span>`).join("");
  const srcMeta = SRC_TYPES[d.srcType] || { label: d.srcType };
  return `<div class="card" data-id="${d.id}"
      data-stages="${d.stages.join(",")}" data-questions="${d.questions.join(",")}" data-src="${d.srcType}">
    <div class="chead">
      <div><div class="cname">${esc(d.name)}</div><div class="cmono">${esc(d.mono)}</div></div>
      <span class="badge b-status ${d.status}">${esc(d.status)}</span>
    </div>
    <div class="what">${esc(d.what)}</div>
    <div class="src">
      <div class="srclabel">출처 · 왜 크롤로 못 얻나</div>
      <div class="srctext">${esc(d.source)}</div>
    </div>
    <div class="problem"><b>푸는 문제:</b> ${esc(d.problem)}</div>
    <div class="meta">
      <span class="badge b-src ${d.srcType}">${esc(srcMeta.label)}</span>
      ${qs}${sts}
    </div>
    <div class="owner"><b>주인:</b> ${esc(d.owner)} · 난이도 ${esc(d.difficulty)}</div>
  </div>`;
}

function gridHTML(title, note, items) {
  return `<div class="section-label">${esc(title)}</div>
    <div class="note">${note}</div>
    <div class="grid">${items.map(cardHTML).join("")}</div>`;
}

function render() {
  const root = document.getElementById("root");
  root.innerHTML =
    worldsHTML() +
    pipelineHTML() +
    filtersHTML() +
    gridHTML("A. 기준 데이터 — 큐레이션해야 하는 정답지 (여기가 경쟁력)",
      "모델은 공개되어 거의 공짜다. 진짜 만들어야 하는 것은 이 비교 기준 데이터이고, 절반은 <b>브랜드 협조 없이는 시작도 안 된다.</b>",
      REF_DATASETS) +
    gridHTML("B. 운영 데이터 — 직접 일하면 쌓이는 복리 자산",
      "대시보드 안에서 사람이 일하며 생기는 1차 데이터. 정의상 외부가 가질 수 없다 — 대표가 말한 \"데이터 자산\"의 핵심.",
      OP_DATASETS);

  document.querySelectorAll("[data-kind]").forEach(el => {
    el.onclick = () => {
      const kind = el.dataset.kind, val = el.dataset.val;
      filter = (filter && filter.kind === kind && filter.val === val) ? null : { kind, val };
      applyFilter();
    };
  });
  document.getElementById("reset").onclick = () => { filter = null; applyFilter(); };
  applyFilter();
}

function applyFilter() {
  // 활성 표시
  document.querySelectorAll("[data-kind]").forEach(el => {
    const on = filter && filter.kind === el.dataset.kind && filter.val === el.dataset.val;
    el.classList.toggle("active", !!on);
  });
  // 카드 강조/흐림
  document.querySelectorAll(".card").forEach(card => {
    let hit = true;
    if (filter) {
      if (filter.kind === "stage") hit = card.dataset.stages.split(",").includes(filter.val);
      else if (filter.kind === "question") hit = card.dataset.questions.split(",").includes(filter.val);
      else if (filter.kind === "src") hit = card.dataset.src === filter.val;
    }
    card.classList.toggle("dim", filter && !hit);
    card.classList.toggle("hit", !!(filter && hit));
  });
}

render();
