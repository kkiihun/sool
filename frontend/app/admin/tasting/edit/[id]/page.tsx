"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SliderInput from "@/components/SliderInput";

type TastingForm = {
  aroma?: number;
  sweetness?: number;
  acidity?: number;
  body?: number;
  finish?: number;
  comment?: string;
  // 백엔드에서 다른 필드가 와도 유지
  [key: string]: any;
};

// ✅ env로 통일 (지금은 http://localhost:8000)
// ✅ 추후 프록시 쓰면 NEXT_PUBLIC_API_BASE_URL=/proxy 로만 바꾸면 됨
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

export default function EditTastingPage({ params }: { params: { id: string } }) {
  const router = useRouter();

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

        const res = await fetch(apiUrl(`/v2/tasting/note/${params.id}`), {
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`GET 실패 (HTTP ${res.status})`);

        const data = await res.json();

        if (cancelled) return;
        setForm({
          ...data,
          comment: typeof data?.comment === "string" ? data.comment : "",
        });
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const save = async () => {
    if (!form || saving) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(apiUrl(`/v2/tasting/note/${params.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`PUT 실패 (HTTP ${res.status}) ${msg}`.trim());
      }

      alert("수정 완료");
      router.push("/admin/tasting/list");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "저장 실패");
      alert(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;
  if (!form) return <div className="p-6">No data</div>;

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✏ 테이스팅 수정 #{params.id}</h1>

      <SliderInput
        label="Aroma"
        value={Number(form.aroma ?? 0)}
        onChange={(v) => setForm({ ...form, aroma: v })}
      />
      <SliderInput
        label="Sweetness"
        value={Number(form.sweetness ?? 0)}
        onChange={(v) => setForm({ ...form, sweetness: v })}
      />
      <SliderInput
        label="Acidity"
        value={Number(form.acidity ?? 0)}
        onChange={(v) => setForm({ ...form, acidity: v })}
      />
      <SliderInput
        label="Body"
        value={Number(form.body ?? 0)}
        onChange={(v) => setForm({ ...form, body: v })}
      />
      <SliderInput
        label="Finish"
        value={Number(form.finish ?? 0)}
        onChange={(v) => setForm({ ...form, finish: v })}
      />

      <textarea
        value={form.comment ?? ""}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
        className="border p-2 w-full text-black rounded"
        placeholder="Comment"
      />

      <button
        onClick={save}
        disabled={saving}
        className="bg-green-600 disabled:bg-green-900 text-white px-4 py-2 rounded font-semibold"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
