// 브라우저는 항상 같은 origin 의 /api/proxy 만 호출한다.
// → Next 서버(app/api/proxy)가 BACKEND_URL 로 전달하므로 CORS·쿠키 도메인 문제가 없다.
// 인증은 HttpOnly 쿠키(access_token)로만 하며, JS 에서 토큰을 다루지 않는다.
export const API_BASE = "/api/proxy";

// 백엔드가 서빙하는 이미지(/static/...)도 프록시 경유로 변환
export function assetUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/static")) return `${API_BASE}${encodeURI(url)}`;
  return url;
}
