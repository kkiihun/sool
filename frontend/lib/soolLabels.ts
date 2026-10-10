// 파이프라인 결과(analytics_*)를 화면에 보여줄 때 쓰는 이름표 (관리자·공개 화면 공용)

export const TASTE_LABEL: Record<string, string> = {
  sweetness: "단맛", acidity: "산미", body: "바디", carbonation: "탄산", smoothness: "부드러움",
  aroma: "향", nutty: "고소함", bitterness: "쌉쌀함", clean: "깔끔함",
};

export const CHANNEL_LABEL: Record<string, string> = {
  smartstore: "스마트스토어", shop_mall: "판매몰", own_site: "자체 사이트", modoo: "모두홈페이지",
  instagram: "인스타그램", facebook: "페이스북", blog: "블로그", kakao: "카카오",
};

export const LINK_STATE: Record<string, { label: string; color: string }> = {
  alive: { label: "접속됨", color: "green" }, login: { label: "스토어 있음 · 성인 인증 필요", color: "green" },
  blocked: { label: "요청 제한(확인 불가)", color: "gold" }, ended: { label: "서비스 종료", color: "red" },
  dead: { label: "없는 페이지", color: "red" }, error: { label: "접속 실패", color: "red" }, unchecked: { label: "미검사", color: "default" },
};

export const CAT_COLOR: Record<string, string> = {
  탁주: "#f5f5f4", 약주: "#fbbf24", 청주: "#a3e635", 과실주: "#f472b6", 증류주: "#60a5fa", 리큐르: "#c084fc", 기타주류: "#94a3b8",
};

export const PAIRINGS = ["전·부침", "회·해산물", "육류", "치즈·양식", "디저트·과일", "매운·국물", "한식 전반", "칵테일·하이볼"];

export const httpUrl = (u: string) => (u.startsWith("http") ? u : `http://${u}`);
