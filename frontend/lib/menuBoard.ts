// 술 메뉴판(R3) 담기 목록: 로그인 없이 이 브라우저에만 저장. 화면끼리는 이벤트로 개수 동기화
export type BoardEntry = { sool_id: number; price?: string; note?: string };

const KEY = "sool.menuBoard.v1";
const EVENT = "sool:menuBoard";
export const MAX_ITEMS = 40;

export function loadBoard(): BoardEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveBoard(entries: BoardEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
  } catch { /* 저장소 사용 불가 (사파리 개인 정보 보호 모드 등) */ }
  window.dispatchEvent(new Event(EVENT));
}

export function toggleBoard(soolId: number): boolean {
  const cur = loadBoard();
  const on = cur.some((e) => e.sool_id === soolId);
  saveBoard(on ? cur.filter((e) => e.sool_id !== soolId) : [...cur, { sool_id: soolId }]);
  return !on;
}

export function onBoardChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);    // 다른 탭에서 바꾼 경우
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}
