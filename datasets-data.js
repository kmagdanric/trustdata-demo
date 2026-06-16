// 구축해야 할 데이터셋 — 데모 데이터 (mock, 공개 repo이므로 가공 정보만)
// 근거 문서: ../DATASETS.md
//
// 핵심: 마켓플레이스 크롤/구매로 얻는 것은 "판별 대상(의심 리스팅)" 뿐이다.
// 아래 "판별 기준(정답지)"은 마켓에 없고, 브랜드·등록부·자체 운영에서 온다.

// 레인 = 출처별 (왼쪽에서 오른쪽). suspect 만 크롤/구매로 얻는다.
const LANES = [
  { id: "suspect",    title: "판별 대상", sub: "크롤 / 구매" },
  { id: "brand",      title: "브랜드 제공", sub: "협조 필요" },
  { id: "registry",   title: "공개 등록부", sub: "특허청 등" },
  { id: "platform",   title: "플랫폼 정책", sub: "절차 지식" },
  { id: "firstparty", title: "자체 운영", sub: "일하면 쌓임" },
];

// 대표 개발 방향성 파이프라인 단계
const PIPELINE = [
  { id: "collect", label: "수집" },
  { id: "price",   label: "가격 룰" },
  { id: "image",   label: "이미지" },
  { id: "ocr",     label: "OCR·로고" },
  { id: "score",   label: "위험도" },
  { id: "report",  label: "신고서" },
  { id: "learn",   label: "학습" },
];

// 위조 판별의 4가지 질문
const QUESTIONS = [
  { id: "진위", label: "진위" },
  { id: "권한", label: "권한" },
  { id: "IP",   label: "IP" },
  { id: "표현", label: "표현" },
];

// 마켓에서 크롤/구매로 얻는 유일한 것 — 판별 대상
const SUSPECT = {
  id: "raw_listing", name: "수집 리스팅", mono: "raw_listing", srcType: "suspect",
  what: "상품명·가격·이미지·판매자·URL·판매량. 타오바오·아마존·쇼피 등.",
  problem: "판별의 입력이자 대상. 정답이 아니라, 정답지와 대조해 판별할 '문제지'다.",
  source: "크롤 또는 데이터 구매(Bright Data 등). commodity — 누구나 확보 가능.",
  questions: [], stages: ["collect"],
  owner: "구매/크롤", status: "확보가능",
  schema: [
    ["product_name", "str", "정품st 마스크팩 50매"],
    ["price_raw", "str", "₩12,900"],
    ["image_url", "str", ".../a.jpg"],
    ["seller", "str", "shop_8842"],
    ["platform", "str", "taobao"],
    ["sales", "int", "1,204"],
  ],
};

// A. 기준 데이터 (큐레이션해야 하는 정답지 — 해자)
const REF_DATASETS = [
  {
    id: "genuine_price", name: "정품 가격 DB", mono: "genuine_price", srcType: "brand",
    what: "브랜드·SKU별 정상가. 국가·통화·채널·시점·단위까지 구분.",
    problem: "가격 룰이 \"정상가의 30% 이하면 위험\"으로 작동하려면 비교 기준가가 있어야 한다. 없으면 \"무엇의 30%인가\"가 정의되지 않는다.",
    source: "브랜드 공식가. 마켓 가격을 긁으면 정품·그레이·가짜가 섞인 오염값이라 기준이 못 된다(순환).",
    questions: ["진위"], stages: ["price", "score"],
    owner: "브랜드 협조 + TrustData 큐레이션", status: "미보유", difficulty: "높음",
    schema: [
      ["brand", "str", "AcmeBeauty"],
      ["sku", "str", "AB-MASK-20"],
      ["country", "str", "KR"],
      ["currency", "str", "KRW"],
      ["price", "num", "28,000"],
      ["as_of", "date", "2026-06-01"],
    ],
  },
  {
    id: "genuine_image", name: "정품 이미지 라이브러리", mono: "genuine_image", srcType: "brand",
    what: "제품별 공식 이미지. 벡터(embedding)로 색인.",
    problem: "이미지 유사도는 정품 사진 도용을 잡는 기술이라, 비교 대상인 정품 이미지가 있어야 성립한다.",
    source: "브랜드 공식 카탈로그 이미지. 마켓 이미지엔 도용·조작본이 섞여 있어 기준으로 쓰면 순환.",
    questions: ["진위", "IP"], stages: ["image", "score"],
    owner: "브랜드 협조 + TrustData 큐레이션", status: "미보유", difficulty: "중",
    schema: [
      ["sku", "str", "AB-MASK-20"],
      ["image_url", "str", ".../official/mask.jpg"],
      ["embedding", "vec", "[0.12, -0.04, …]"],
      ["variant", "str", "front"],
    ],
  },
  {
    id: "authorized_sellers", name: "공식 셀러 화이트리스트", mono: "authorized_sellers", srcType: "brand",
    what: "브랜드별로 인정된 정식 판매처 목록.",
    problem: "가장 결정적인 신호. 목록에 없는 셀러 = 무권한 판매로 규칙 확정. 위조품과 그레이마켓(정품·무권한)을 가르는 유일한 장치.",
    source: "브랜드만 안다. 누가 정식 판매처인지는 마켓 어디에도 적혀 있지 않다 — 크롤 자체가 불가능.",
    questions: ["권한"], stages: ["score"],
    owner: "브랜드(갱신 주체 합의 필요)", status: "미보유", difficulty: "중(협조)",
    schema: [
      ["brand", "str", "AcmeBeauty"],
      ["platform", "str", "amazon"],
      ["seller_id", "str", "A1B2C3"],
      ["status", "str", "authorized"],
      ["since", "date", "2024-03"],
    ],
  },
  {
    id: "asset_registry", name: "보호 자산 레지스트리", mono: "asset_registry", srcType: "registry",
    what: "무엇을 보호하는지 — 브랜드·제품명·모델 라인·등록 상표·공식 키워드.",
    problem: "OCR이 \"브랜드 검출 → 브랜드별 처리\"로 이어지려면 무엇이 보호 대상인지 정의돼 있어야 한다. 모든 데이터가 조인되는 기준점(anchor).",
    source: "브랜드 제품 정보 + 공개 상표 등록부(특허청 등). 마켓 크롤 대상이 아니다.",
    questions: ["IP", "표현"], stages: ["ocr", "price", "image", "score", "report"],
    owner: "TrustData + 브랜드", status: "일부", difficulty: "중(기반)",
    schema: [
      ["brand", "str", "AcmeBeauty"],
      ["asset_type", "str", "trademark"],
      ["value", "str", "ACME / 아크메"],
      ["reg_no", "str", "40-2019-…"],
      ["product_line", "str", "Vita Mask"],
    ],
  },
  {
    id: "logo_set", name: "로고·상표 이미지 셋", mono: "logo_set", srcType: "registry",
    what: "기준 로고·상표 이미지와 탐지 학습용 라벨.",
    problem: "로고 인식은 글자 OCR과 다른 객체 탐지 문제라, 비교·학습용 기준 로고가 필요하다.",
    source: "브랜드 자산 + 상표 등록 이미지. 마켓에서 긁는 게 아니다.",
    questions: ["IP"], stages: ["ocr"],
    owner: "브랜드 + TrustData", status: "미보유", difficulty: "중",
    schema: [
      ["brand", "str", "AcmeBeauty"],
      ["logo_id", "str", "acme_wordmark"],
      ["image_url", "str", ".../logo/acme.png"],
      ["label", "str", "wordmark"],
    ],
  },
  {
    id: "keyword_lexicon", name: "브랜드명 변형·키워드 사전", mono: "keyword_lexicon", srcType: "firstparty",
    what: "알려진 오기·회피 표기(A@cme), 정품 비교 표현, 금지 키워드.",
    problem: "텍스트로 숨긴 브랜드를 포착하고, 표현 위반을 잡고, 신고유형 매핑의 근거가 된다.",
    source: "자체 운영으로 관찰·축적 + 브랜드 입력. 통째로 크롤할 수 있는 게 아니다.",
    questions: ["표현"], stages: ["ocr", "report"],
    owner: "TrustData (운영하며 성장)", status: "일부", difficulty: "낮음~중",
    schema: [
      ["brand", "str", "AcmeBeauty"],
      ["term", "str", "A@cme"],
      ["type", "str", "evasion"],
      ["lang", "str", "en"],
    ],
  },
  {
    id: "report_mapping", name: "신고유형 ↔ 플랫폼 양식 매핑", mono: "report_mapping", srcType: "platform",
    what: "위반 6유형을 아마존·타오바오·쇼피 신고 카테고리로 매핑 + 국가별 권리 문서.",
    problem: "신고서를 자동 구성하려면 유형↔양식 대응이 있어야 한다. 잘못 매핑하면 플랫폼이 신고를 반려한다.",
    source: "각 플랫폼의 신고 정책·양식. 데이터가 아니라 절차 지식이라 크롤로 대체 불가.",
    questions: [], stages: ["report"],
    owner: "TrustData", status: "미보유", difficulty: "낮음(상시 유지)",
    schema: [
      ["violation", "str", "trademark"],
      ["platform", "str", "amazon"],
      ["form_category", "str", "Brand Registry / IP"],
      ["doc_required", "str", "상표등록증"],
    ],
  },
];

// B. 운영 데이터 (직접 일하면 쌓이는 복리 자산 — first-party). 정의상 크롤 불가.
const OP_DATASETS = [
  {
    id: "enforcement_history", name: "단속 이력·판정 라벨", mono: "enforcement_history", srcType: "firstparty",
    what: "모든 확정·미확정 판단과 근거 신호, 신고 → 차단/차단불가 결과.",
    problem: "6단계 학습의 연료이자, 탐지율(성과)의 ground truth이며, \"과거 적발 셀러\" 신호의 원천.",
    source: "대시보드 안에서 직원이 판단할 때마다 writeback으로 쌓인다. 외부엔 존재하지 않는다.",
    questions: [], stages: ["score", "learn"],
    owner: "TrustData (자가 축적)", status: "자가축적", difficulty: "설계의 문제 (writeback)",
    schema: [
      ["incident_id", "str", "INC-10293"],
      ["decision", "str", "enforced"],
      ["reason", "str", "정품가 25%·이미지 도용"],
      ["reviewer", "str", "ops_3"],
      ["decided_at", "ts", "2026-06-15 14:02"],
    ],
  },
  {
    id: "seller_profiles", name: "셀러 프로파일·네트워크", mono: "seller_profiles", srcType: "firstparty",
    what: "안정적 셀러 ID, 과거 적발 이력, 동일 주체 계정 연결(엔티티 해소).",
    problem: "점수표의 \"과거 적발 30 / 신규 10\" 신호, 반복침해 추적, 일괄 차단, 재활성화 대응.",
    source: "수집 리스팅 위에 자체 단속 이력을 엮어 만든다. 크롤한 원본만으로는 안 생긴다.",
    questions: ["권한"], stages: ["score", "learn"],
    owner: "TrustData (자가 축적)", status: "자가축적", difficulty: "중~높음 (과병합 리스크)",
    schema: [
      ["seller_key", "str", "SLR-5521"],
      ["aliases", "int", "4"],
      ["past_flags", "int", "12"],
      ["network_id", "str", "NET-77"],
      ["risk", "str", "high"],
    ],
  },
  {
    id: "outcomes", name: "결과·차단불가 사유", mono: "outcomes", srcType: "firstparty",
    what: "신고 성공/실패 이유, 차단불가 사유 분류.",
    problem: "어디를 고쳐야 차단율이 오르는지 파악, 신고 품질 개선.",
    source: "신고를 실제로 넣고 결과를 받아야만 생긴다. 자체 운영의 부산물.",
    questions: [], stages: ["report", "learn"],
    owner: "TrustData (자가 축적)", status: "자가축적", difficulty: "낮음",
    schema: [
      ["incident_id", "str", "INC-10293"],
      ["report_status", "str", "taken_down"],
      ["platform", "str", "taobao"],
      ["days_to_action", "int", "6"],
      ["reason_if_fail", "str", "—"],
    ],
  },
];

// 캔버스에 올라가는 전체 노드
const NODES = [SUSPECT, ...REF_DATASETS, ...OP_DATASETS];
const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
