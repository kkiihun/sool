// 원료 시세 표시 도우미 (양조장 리포트·원료 시세 페이지 공용)
export type IngredientRow = {
  ingredient: string; variety?: string | null; products: number; latest_ym: string | null; latest_kg: number | null;
  yoy_pct: number | null; trend_3m_pct: number | null; volatility: number | null;
  cheapest_months: number[]; on_market_months?: number[]; monthly: { ym: string; kg: number }[];
};

export const won = (v: number | null | undefined) => (v == null ? "-" : `${Math.round(v).toLocaleString()}원`);
export const ymLabel = (ym: string | null) => (ym ? `${ym.slice(0, 4)}.${ym.slice(4)}` : "-");
// 원가 관점: 오르면 빨강, 내리면 파랑
export const pctColor = (v: number | null) => (v == null ? "text-white/40" : v > 3 ? "text-red-400" : v < -3 ? "text-sky-400" : "text-white/60");
export const pctText = (v: number | null) => (v == null ? "-" : `${v > 0 ? "▲" : v < 0 ? "▼" : ""}${Math.abs(v)}%`);
export const volLabel = (v: number | null) => (v == null ? "-" : v < 0.08 ? "안정" : v < 0.18 ? "보통" : "변동 큼");
export const monthsText = (ms: number[]) => (ms.length ? ms.map((m) => `${m}월`).join("·") : "-");
// 달 목록 → 연속 구간 (연도를 넘는 구간 포함): [1,2,3,10,11,12] → "10~3월", [7,8,9] → "7~9월"
export function monthRuns(ms: number[]): string {
  const set = new Set(ms);
  const prev = (m: number) => (m === 1 ? 12 : m - 1);
  const next = (m: number) => (m === 12 ? 1 : m + 1);
  const runs: string[] = [];
  for (const start of [...set].sort((a, b) => a - b).filter((m) => !set.has(prev(m)))) {
    let end = start;
    while (set.has(next(end)) && next(end) !== start) end = next(end);
    runs.push(start === end ? `${start}` : `${start}~${end}`);
  }
  return `${runs.join("·")}월`;
}

// 싼 달이 있으면 '싼 달', 일부 달만 유통되면 '출하 시기 7~10월'
export function timing(r: IngredientRow): { label: string; text: string } {
  if (r.cheapest_months.length) return { label: "싼 달", text: monthsText(r.cheapest_months) };
  const on = r.on_market_months ?? [];
  if (on.length && on.length < 12) return { label: "출하 시기", text: monthRuns(on) };
  return { label: "싼 달", text: "-" };
}
