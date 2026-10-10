// 작은 추이 그래프 (SVG). 값 배열만 받아 그린다 — 원료 시세 월별 추이용
export default function Sparkline({ values, width = 160, height = 40, color = "#f59e0b" }: {
  values: number[]; width?: number; height?: number; color?: string;
}) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * (width - 4) + 2;
  const y = (v: number) => height - 3 - ((v - min) / span) * (height - 6);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="가격 추이">
      <path d={`${d} L${x(values.length - 1)},${height} L${x(0)},${height} Z`} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={2.6} fill={color} />
    </svg>
  );
}
