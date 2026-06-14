// Minimal renderer. Reads only from data.js. Refine freely.

function statusBadge(s) {
  return `<span class="badge s-${s}">${STATUS_LABEL[s] || s}</span>`;
}

function renderHome() {
  const k = KPI;
  const cards = [
    [k.monitoring, "모니터링 건수"], [k.infringements_month.toLocaleString(), "확정 위조품(당월)"],
    [k.in_progress, "신고중"], [k.enforced.toLocaleString(), "차단완료"],
    [k.non_enforceable, "차단불가"], [k.reactivated, "재활성화 링크"],
  ].map(([n, l]) => `<div class="card"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join("");

  const maxInf = Math.max(...TOP_PLATFORM.map(p => p.infringements));
  const rows = TOP_PLATFORM.map(p => `
    <tr><td>${p.platform}</td><td>${p.to_validate}</td>
    <td>${p.infringements} <div class="bar"><span style="width:${p.infringements / maxInf * 100}%"></span></div>
    <div class="muted">${p.enforced} 차단완료</div></td></tr>`).join("");

  return `<div class="cards">${cards}</div>
    <h3 style="margin:8px 0 10px">Top incidents per platform</h3>
    <table><thead><tr><th>플랫폼</th><th>확정 필요</th><th>위조품 / 차단완료</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function incidentRows(list, withActions) {
  return list.map(i => `
    <tr data-id="${i.id}">
      <td><div>${i.product_name}</div><div class="muted">ID ${i.id} · ${PROTECTION_TYPES[i.protection_type]}</div></td>
      <td>${i.asset}</td><td>${i.platform}<div class="muted">${i.seller} (${i.seller_country})</div></td>
      <td>$${i.usd_price}<div class="muted">stock ${i.stock}</div></td>
      <td>${i.detection_date}</td>
      <td class="st">${statusBadge(i.status)}</td>
      ${withActions ? `<td class="act">
        <button class="b-enforce" onclick="act('${i.id}','enforced')">확정</button>
        <button class="b-discard" onclick="act('${i.id}','discarded')">삭제</button>
        <button class="b-hold" onclick="act('${i.id}','on_hold')">보류</button></td>` : ""}
    </tr>`).join("");
}

function renderValidation() {
  const pending = INCIDENTS.filter(i => i.status === "pending");
  return `<p class="muted" style="margin-bottom:12px">확정 대기 ${pending.length}건</p>
    <table><thead><tr><th>상품 정보</th><th>제품군</th><th>플랫폼/셀러</th><th>가격</th><th>수집일</th><th>상태</th><th>처리</th></tr></thead>
    <tbody id="val-body">${incidentRows(pending, true)}</tbody></table>`;
}

function act(id, status) {
  const i = INCIDENTS.find(x => x.id === id);
  if (i) i.status = status;
  document.querySelector("#view-validation").innerHTML = renderValidation();
}

function renderDatabase() {
  const opts = ["all", "pending", "enforced", "non_enforceable"]
    .map(s => `<option value="${s}">${s === "all" ? "전체" : STATUS_LABEL[s]}</option>`).join("");
  return `<div class="toolbar">상태 필터:
    <select id="db-filter" onchange="filterDb()">${opts}</select></div>
    <table><thead><tr><th>상품 정보</th><th>제품군</th><th>플랫폼/셀러</th><th>가격</th><th>수집일</th><th>상태</th></tr></thead>
    <tbody id="db-body">${incidentRows(INCIDENTS, false)}</tbody></table>`;
}

function filterDb() {
  const v = document.querySelector("#db-filter").value;
  const list = v === "all" ? INCIDENTS : INCIDENTS.filter(i => i.status === v);
  document.querySelector("#db-body").innerHTML = incidentRows(list, false);
}

const VIEWS = {
  home: renderHome, validation: renderValidation, database: renderDatabase,
};

function show(name) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === name));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const el = document.querySelector("#view-" + name);
  el.innerHTML = VIEWS[name] ? VIEWS[name]() : `<p class="muted">준비 중 — BI 도구로 구성 예정</p>`;
  el.classList.add("active");
}

show("home");
