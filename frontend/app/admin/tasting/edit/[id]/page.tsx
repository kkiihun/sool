"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SliderInput from "@/components/SliderInput";
import { getToken } from "@/lib/auth";

type TastingForm = {
  aroma?: number;
  sweetness?: number;
  acidity?: number;
  body?: number;
  finish?: number;
  comment?: string;
  notes?: string;
  [key: string]: any;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

export default function EditTastingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [form, setForm] = useState<TastingForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(apiUrl(`/v2/tasting/note/${id}`), {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${getToken() ?? ""}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load tasting note (HTTP ${res.status})`);
        }

        const data = await res.json();

        if (cancelled) return;
        setForm({
          ...data,
          comment: typeof data?.notes === "string" ? data.notes : "",
        });
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load tasting note.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async () => {
    if (!form || saving) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(apiUrl(`/v2/tasting/note/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
        body: JSON.stringify({ ...form, notes: form.comment }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Failed to update tasting note (HTTP ${res.status}) ${msg}`.trim());
      }

      alert("Tasting note updated.");
      router.push("/admin/tasting/list");
      router.refresh();
    } catch (e: any) {
      const message = e?.message ?? "Failed to update tasting note.";
      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;
  if (!form) return <div className="p-6">No data</div>;

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="mb-4 text-2xl font-bold">Edit tasting note #{id}</h1>

      <SliderInput label="Aroma" value={Number(form.aroma ?? 0)} onChange={(v) => setForm({ ...form, aroma: v })} />
      <SliderInput label="Sweetness" value={Number(form.sweetness ?? 0)} onChange={(v) => setForm({ ...form, sweetness: v })} />
      <SliderInput label="Acidity" value={Number(form.acidity ?? 0)} onChange={(v) => setForm({ ...form, acidity: v })} />
      <SliderInput label="Body" value={Number(form.body ?? 0)} onChange={(v) => setForm({ ...form, body: v })} />
      <SliderInput label="Finish" value={Number(form.finish ?? 0)} onChange={(v) => setForm({ ...form, finish: v })} />

      <textarea
        value={form.comment ?? ""}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
        className="w-full rounded border p-2 text-black"
        placeholder="Comment"
      />

      <button
        onClick={save}
        disabled={saving}
        className="rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:bg-green-900"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
