// Mock data — mirrors the canonical schema in DATA-MAP.md.
// Refine these shapes; the dashboard reads only from here for now.

const KPI = {
  monitoring: 702,            // 모니터링 건수
  infringements_month: 19700, // 위조품 확정(당월)
  in_progress: 348,           // 신고중
  enforced: 2249,             // 차단완료
  non_enforceable: 476,       // 차단불가
  reactivated: 0,             // 재활성화된 링크
};

const TOP_PLATFORM = [
  { platform: "AliExpress",    to_validate: 345, infringements: 3150, enforced: 2061 },
  { platform: "Rogue Websites",to_validate: 399, infringements: 155,  enforced: 55 },
  { platform: "Taobao",        to_validate: 250, infringements: 646,  enforced: 111 },
  { platform: "Shopify",       to_validate: 146, infringements: 71,   enforced: 2 },
  { platform: "TMall",         to_validate: 49,  infringements: 49,   enforced: 6 },
];

// v_incident rows (Validation / Database)
const INCIDENTS = [
  { id: "1437965350", asset: "Covernat - Sweatshirts", protection_type: "product_counterfeit",
    platform: "Tokopedia", seller: "Automoro Id", seller_country: "ID",
    product_name: "Covernat Hoodie Sweater Wanita Korean Style",
    url: "https://www.tokopedia.com/automoro-id", site_price: "180400 IDR", usd_price: 10.72,
    stock: 922, detection_date: "2025-10-22", status: "pending", priority: "high" },
  { id: "1437917536", asset: "Covernat - Sweatshirts", protection_type: "product_counterfeit",
    platform: "Tokopedia", seller: "Lvthrift", seller_country: "ID",
    product_name: "Covernat,adidas,puma,dkies, Hoodie Sweater Pria Wanita",
    url: "https://www.tokopedia.com/lvthrift", site_price: "50000 IDR", usd_price: 2.97,
    stock: 10, detection_date: "2025-10-20", status: "pending", priority: "high" },
  { id: "1438255667", asset: "Covernat - Sweatshirts", protection_type: "image_theft",
    platform: "Shopee", seller: "mei.almaida", seller_country: "ID",
    product_name: "crewnek covernat",
    url: "https://shopee.co.id/mei.almaida", site_price: "120000 IDR", usd_price: 7.13,
    stock: 5, detection_date: "2025-10-27", status: "enforced", priority: "medium" },
  { id: "1438606752", asset: "Coyselo - T-Shirts", protection_type: "product_counterfeit",
    platform: "Taobao", seller: "inststudio设计师", seller_country: "CN",
    product_name: "博主推荐 25韩国COYSELO时尚星空花朵...",
    url: "https://item.taobao.com", site_price: "325 CNY", usd_price: 45.73,
    stock: 9, detection_date: "2025-08-02", status: "non_enforceable", priority: "low" },
  { id: "1439125666", asset: "Coyselo - Hoodies", protection_type: "keyword_abuse",
    platform: "Shopee", seller: "srstudio.vn", seller_country: "VN",
    product_name: "[SR-STUDIO] coyselo 2025 Cardigan",
    url: "https://shopee.vn/srstudio.vn", site_price: "870534 VND", usd_price: 33.06,
    stock: 6, detection_date: "2025-08-16", status: "pending", priority: "medium" },
];

const PROTECTION_TYPES = {
  product_counterfeit: "상표침해/위조품",
  image_theft: "이미지 도용",
  keyword_abuse: "키워드 남용",
  price_compare: "정가품 비교",
  copyright: "저작권침해",
  not_produced: "미생산",
};

const STATUS_LABEL = {
  pending: "확정 대기", enforced: "차단완료",
  non_enforceable: "차단불가", discarded: "삭제", on_hold: "보류",
};
