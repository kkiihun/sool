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

export default function TastingDetailPage({ params }: { params: { id: string } }) {
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/v2/tasting/note/${params.id}`)
      .then((res) => res.json())
      .then(setNote);
  }, [params.id]);

  if (!note) return <div className="p-6 text-lg">Loading...</div>;

  const radarData = {
    labels: ["Aroma", "Sweetness", "Acidity", "Body", "Finish"],
    datasets: [
      {
        label: "Tasting Profile",
        data: [note.aroma, note.sweetness, note.acidity, note.body, note.finish],
        backgroundColor: "rgba(0,150,255,0.3)",
        borderColor: "rgb(0,150,255)",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">

      <h1 className="text-3xl font-bold">🍶 Tasting Note #{note.id}</h1>

      <div className="text-black bg-white p-5 rounded space-y-2 shadow">
        <p><b>SOOL ID:</b> {note.sool_id}</p>
        <p><b>Comment:</b> {note.comment || "-"}</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <Radar data={radarData} />
      </div>

      <div className="flex gap-3">
        <a href="/admin/tasting/list" className="bg-gray-600 text-white px-4 py-2 rounded">← 목록으로</a>
        <a href={`/admin/tasting/edit/${note.id}`} className="bg-blue-600 text-white px-4 py-2 rounded">수정</a>

        <button
          onClick={async () => {
            if (!confirm("정말 삭제할까요?")) return;
            await fetch(`http://127.0.0.1:8000/v2/tasting/note/${note.id}`, { method: "DELETE" });
            alert("삭제 완료");
            location.href = "/admin/tasting/list";
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
