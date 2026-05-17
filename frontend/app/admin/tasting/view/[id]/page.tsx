"use client";

import { use, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
};

type TastingNote = {
  id: number;
  sool_id: number;
  aroma?: number | null;
  sweetness?: number | null;
  acidity?: number | null;
  body?: number | null;
  finish?: number | null;
  comment?: string | null;
  notes?: string | null;
};

export default function TastingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [note, setNote] = useState<TastingNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setError(null);

        const res = await fetch(apiUrl(`/v2/tasting/note/${id}`), {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${getToken() ?? ""}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Load failed (HTTP ${res.status})`);
        }

        const data = (await res.json()) as TastingNote;
        if (!cancelled) {
          setNote(data);
        }
      } catch (fetchError: any) {
        if (!cancelled) {
          setError(fetchError?.message ?? "Failed to load tasting note.");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!note) return <div className="p-8 text-white">Loading...</div>;

  const radarData = {
    labels: ["Aroma", "Sweetness", "Acidity", "Body", "Finish"],
    datasets: [
      {
        label: "Tasting Profile",
        data: [
          Number(note.aroma ?? 0),
          Number(note.sweetness ?? 0),
          Number(note.acidity ?? 0),
          Number(note.body ?? 0),
          Number(note.finish ?? 0),
        ],
        backgroundColor: "rgba(0,150,255,0.35)",
        borderColor: "rgb(0,150,255)",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8 text-white">
      <h1 className="mb-4 text-3xl font-bold">Tasting Note #{note.id}</h1>

      <div className="space-y-2 rounded-xl bg-white p-5 text-black shadow">
        <p>
          <b>SOOL ID:</b> {note.sool_id}
        </p>
        <p>
          <b>Comment:</b> {note.notes || note.comment || "-"}
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <Radar data={radarData} />
      </div>

      <div className="flex gap-3">
        <a href="/admin/tasting/list" className="rounded bg-gray-600 px-4 py-2 text-white">
          Back to list
        </a>
        <a href={`/admin/tasting/edit/${note.id}`} className="rounded bg-blue-600 px-4 py-2 text-white">
          Edit
        </a>
        <button
          onClick={async () => {
            if (!confirm("Delete this tasting note?")) return;

            const res = await fetch(apiUrl(`/v2/tasting/note/${note.id}`), {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${getToken() ?? ""}`,
              },
            });
            if (!res.ok) {
              alert(`Delete failed (HTTP ${res.status})`);
              return;
            }

            alert("Deleted.");
            window.location.href = "/admin/tasting/list";
          }}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
