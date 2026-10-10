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
  aftertaste?: number | null; // Legacy compatibility
};

export default function SoolRadar({
  tastings,
}: {
  tastings: Tasting[];
}) {
  const valid = tastings.filter(
    (t) =>
      t.aroma != null ||
      t.sweetness != null ||
      t.acidity != null ||
      t.body != null ||
      t.finish != null ||
      t.aftertaste != null
  );

  if (valid.length === 0) {
    return (
      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#444", fontStyle: "italic" }}>No sensory data available</p>
      </div>
    );
  }

  const avg = (key: keyof Tasting) => {
    const items = valid.map(t => {
      if (key === 'finish') {
        return Number(t.finish ?? t.aftertaste ?? 0);
      }
      return Number(t[key] ?? 0);
    });
    const sum = items.reduce((acc, val) => acc + val, 0);
    return sum / valid.length;
  };

  const data = [
    { label: "Aroma", value: avg("aroma") },
    { label: "Sweetness", value: avg("sweetness") },
    { label: "Acidity", value: avg("acidity") },
    { label: "Body", value: avg("body") },
    { label: "Finish", value: avg("finish") },
  ];

  return (
    <div style={{ width: "100%", height: 280, marginTop: 20 }}>
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
          <PolarGrid stroke="#333" />
          <PolarAngleAxis 
            dataKey="label" 
            tick={{ fill: "#888", fontSize: 12, fontWeight: 500 }} 
          />
          <PolarRadiusAxis 
            domain={[0, 5]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Sool"
            dataKey="value"
            stroke="#d4af37"
            strokeWidth={2}
            fill="#d4af37"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
