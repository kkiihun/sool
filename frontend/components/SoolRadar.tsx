"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type Tasting = {
  aroma?: number | null;
  sweetness?: number | null;
  acidity?: number | null;
  body?: number | null;
  finish?: number | null;
};

export default function SoolRadar({
  tastings,
}: {
  tastings: Tasting[];
}) {
  // ✅ 유효한 감각값만 추출
  const valid = tastings.filter(
    (t) =>
      t.aroma != null &&
      t.sweetness != null &&
      t.acidity != null &&
      t.body != null &&
      t.finish != null
  );

  if (valid.length === 0) {
    return <p className="text-gray-500">감각 데이터가 부족합니다.</p>;
  }

  const avg = (key: keyof Tasting) =>
    valid.reduce((sum, t) => sum + Number(t[key]), 0) / valid.length;

  // ✅ Recharts용 데이터로 변환
  const data = [
    { label: "Aroma", value: avg("aroma") },
    { label: "Sweetness", value: avg("sweetness") },
    { label: "Acidity", value: avg("acidity") },
    { label: "Body", value: avg("body") },
    { label: "Finish", value: avg("finish") },
  ];

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="#444" />
          <PolarAngleAxis dataKey="label" stroke="#aaa" />
          <PolarRadiusAxis domain={[0, 5]} stroke="#666" />
          <Radar
            dataKey="value"
            stroke="#facc15"
            fill="#facc15"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
