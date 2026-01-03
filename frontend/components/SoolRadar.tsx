"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

/* ======================
   Types (v1 Standard)
====================== */
type RadarAvg = {
  aroma?: number | null;
  sweetness?: number | null;
  acidity?: number | null;
  body?: number | null;
  finish?: number | null;
};

export default function SoolRadar({
  radar,
}: {
  radar: RadarAvg;
}) {
  // ✅ 값이 하나도 없으면 표시 안 함
  const hasData = Object.values(radar).some((v) => v != null);

  if (!hasData) {
    return <p className="text-gray-500">감각 데이터가 부족합니다.</p>;
  }

  // ✅ Recharts 전용 데이터 (계산 ❌, 매핑만)
  const data = [
    { label: "Aroma", value: radar.aroma ?? 0 },
    { label: "Sweetness", value: radar.sweetness ?? 0 },
    { label: "Acidity", value: radar.acidity ?? 0 },
    { label: "Body", value: radar.body ?? 0 },
    { label: "Finish", value: radar.finish ?? 0 },
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
