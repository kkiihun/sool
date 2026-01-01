"use client";

import { useEffect, useState } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function TastingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [note, setNote] = useState<any>(null);
  const [id, setId] = useState<string | null>(null);

  // params unwrap
  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  // fetch after id ready
  useEffect(() => {
    if (!id) return;

    fetch(`http://127.0.0.1:8000/v2/tasting/note/${id}`)
      .then((res) => res.json())
      .then(setNote);
  }, [id]);

  if (!note) return <div className="p-8 text-white">Loading...</div>;

  const radarData = {
    labels: ["Aroma", "Sweetness", "Acidity", "Body", "Finish"],
    datasets: [
      {
        label: "Tasting Profile",
        data: [note.aroma, note.sweetness, note.acidity, note.body, note.finish],
        backgroundColor: "rgba(0,150,255,0.35)",
        borderColor: "rgb(0,150,255)",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 text-white">

      <h1 className="text-3xl font-bold mb-4">🍶 Tasting Note #{note.id}</h1>

      <div className="bg-white text-black p-5 rounded-xl shadow space-y-2">
        <p><b>SOOL ID:</b> {note.sool_id}</p>
        <p><b>Comment:</b> {note.comment || "-"}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <Radar data={radarData} />
      </div>

      <div className="flex gap-3">
        <a href="/admin/tasting/list" className="px-4 py-2 bg-gray-600 rounded text-white">← 목록</a>
        <a href={`/admin/tasting/edit/${note.id}`} className="px-4 py-2 bg-blue-600 rounded text-white">수정</a>

        <button
          onClick={async () => {
            if (!confirm("정말 삭제할까요?")) return;
            await fetch(`http://127.0.0.1:8000/v2/tasting/note/${note.id}`, { method:"DELETE" });
            alert("삭제되었습니다");
            location.href="/admin/tasting/list";
          }}
          className="px-4 py-2 bg-red-600 rounded text-white"
        >
          삭제
        </button>
      </div>

    </div>
  );
}
