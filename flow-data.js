// Data-flow graph. 4 stages, nodes + edges. Refine freely.
// stage: 1 수집·연동 / 2 표준 저장(SoT) / 3 지표 산출(뷰) / 4 대시보드 화면

const FLOW_NODES = [
  // 1 — Ingest
  { id: "raw_listing", stage: 1, label: "raw_listing", sub: "크롤링 수집 피드",
    desc: "고객이 수집해 제공하는 원천 데이터: 상품명·판매량·가격·이미지·셀러명·상품 URL·플랫폼·국가·수집일자." },
  { id: "raw_enforcement", stage: 1, label: "raw_enforcement", sub: "Red Points 단속 결과",
    desc: "운영/단속 과정에서 생성되는 값: 위조품 상태·확정일·차단일·단속불가 사유·우선순위·링크 플래그. (수집 피드에는 없음 — 별도 확보 필요)" },
  { id: "raw_seller", stage: 1, label: "raw_seller", sub: "셀러 프로필(선택)",
    desc: "제공 시 셀러 식별 보강에 사용." },

  // 2 — Core
  { id: "incident", stage: 2, label: "incident", sub: "핵심 팩트",
    desc: "탐지된 링크 1건 = 1행. 셀러·제품군·플랫폼 참조 + 상태·날짜·가격·재고. 모든 화면의 기준이 되는 단일 진실 원천." },
  { id: "enforcement_event", stage: 2, label: "enforcement_event", sub: "상태 이벤트 로그",
    desc: "추가 전용 이벤트: 모니터링→위조품 확정→차단완료/차단불가→재활성화. 모든 수치를 '시점 기준'으로 재현 가능하게 함." },
  { id: "seller", stage: 2, label: "seller", sub: "셀러",
    desc: "이름·URL·플랫폼·국가·활성여부·공식셀러 플래그." },
  { id: "refdata", stage: 2, label: "asset · platform", sub: "기준정보",
    desc: "제품군(Asset)·플랫폼(Domain). 브랜드별로 달라지는 분류 체계." },
  { id: "lists", stage: 2, label: "allow / deny / watch", sub: "셀러 리스트",
    desc: "화이트리스트(공식 셀러는 신고 제외·표시)·차단·관찰 목록." },
  { id: "document", stage: 2, label: "document", sub: "국가별 IP 문서",
    desc: "브랜드 IP 등록증·수권서. 국가별 권리 → 단속 가능 여부 판단 근거." },

  // 3 — Mart (views)
  { id: "v_incident", stage: 3, label: "v_incident", sub: "인시던트 뷰",
    desc: "조인·정규화된 인시던트. Validation·Database 화면 구동." },
  { id: "v_kpi", stage: 3, label: "v_kpi_summary", sub: "KPI 요약",
    desc: "모니터링·위조품·차단완료·차단불가·성공률 등 카드 지표." },
  { id: "v_economic", stage: 3, label: "v_economic_impact", sub: "경제적 가치",
    desc: "재고×가격(보수적 산정: 미표시→1, 50 초과→50). 고객이 가장 중요시하는 지표." },
  { id: "v_seller_stats", stage: 3, label: "v_seller_stats", sub: "셀러 통계",
    desc: "셀러별 재집계·반복침해(180일) 등." },
  { id: "v_nonenf", stage: 3, label: "v_non_enforceable", sub: "차단불가 집계",
    desc: "사유별·도메인별·링크별 차단불가 현황." },
  { id: "v_top", stage: 3, label: "v_top_*", sub: "Top 집계",
    desc: "플랫폼·셀러·제품군·국가·침해유형별 Top-N 집계 + 드릴다운 진입점." },
  { id: "v_evolution", stage: 3, label: "v_results_evolution", sub: "월별 추이",
    desc: "월별 위조품·차단완료 추이(꺾은선)." },

  // 4 — Dashboard screens
  { id: "home", stage: 4, label: "Home", desc: "요약 KPI + Top 플랫폼/셀러 드릴다운." },
  { id: "validation", stage: 4, label: "Validation", desc: "위조품 확정 운영 화면(확정/삭제/보류). 사용자 처리 → 이벤트 기록." },
  { id: "database", stage: 4, label: "Database", desc: "전체 데이터 필터 탐색." },
  { id: "summary", stage: 4, label: "Summary", desc: "누적·월별 요약 그래프." },
  { id: "analysis", stage: 4, label: "Result analysis", desc: "유형/제품군/플랫폼/셀러별 상세 분석." },
  { id: "sellers", stage: 4, label: "Sellers", desc: "셀러별 분석(셀러 선택 시 전체 재집계)." },
  { id: "economic", stage: 4, label: "Economic impact", desc: "경제적 가치 카드·월별·도메인/셀러/링크별." },
  { id: "nonenf", stage: 4, label: "Non-enforceable", desc: "차단불가 사유 현황." },
  { id: "config", stage: 4, label: "Configuration", desc: "셀러 리스트·IP 문서 관리." },
];

const FLOW_EDGES = [
  // ingest → core
  ["raw_listing", "incident"], ["raw_listing", "seller"], ["raw_listing", "refdata"],
  ["raw_enforcement", "incident"], ["raw_enforcement", "enforcement_event"],
  ["raw_seller", "seller"],
  // core → mart
  ["incident", "v_incident"], ["incident", "v_kpi"], ["incident", "v_economic"],
  ["incident", "v_top"], ["incident", "v_evolution"], ["incident", "v_nonenf"],
  ["enforcement_event", "v_kpi"], ["enforcement_event", "v_economic"], ["enforcement_event", "v_evolution"],
  ["seller", "v_seller_stats"], ["seller", "v_incident"],
  ["refdata", "v_incident"], ["refdata", "v_top"],
  ["lists", "v_incident"], ["document", "v_nonenf"],
  // mart → dashboard
  ["v_kpi", "home"], ["v_kpi", "summary"],
  ["v_top", "home"], ["v_top", "summary"], ["v_top", "analysis"],
  ["v_incident", "validation"], ["v_incident", "database"],
  ["v_economic", "economic"], ["v_seller_stats", "sellers"],
  ["v_nonenf", "nonenf"], ["v_evolution", "summary"],
  ["lists", "config"], ["document", "config"],
  // write-back loop (user action → event)
  ["validation", "enforcement_event", "writeback"],
];

const STAGE_LABELS = {
  1: "① 수집 · 연동", 2: "② 표준 저장 (Source of Truth)",
  3: "③ 지표 산출 (Views)", 4: "④ 대시보드 화면",
};
