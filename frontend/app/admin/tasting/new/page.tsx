"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SliderInput from "@/components/SliderInput";

// ✅ env로 통일 (현재: http://localhost:8000)
// ✅ 프록시로 바꾸면 NEXT_PUBLIC_API_BASE_URL=/proxy 로만 바꾸면 됨
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

type FormState = {
  sool_id: string;
  aroma: number;
  sweetness: number;
  acidity: number;
  body: number;
  finish: number;
  comment: string;
};

export default function NewTastingNotePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    sool_id: "",
    aroma: 0,
    sweetness: 0,
    acidity: 0,
    body: 0,
    finish: 0,
    comment: "",
  });

  const [saving, setSaving] = useState(false);

  const submitForm = async () => {
    if (saving) return;

    // 최소 검증
    const soolIdNum = Number(form.sool_id);
    if (!Number.isFinite(soolIdNum) || soolIdNum <= 0) {
      alert("sool_id를 숫자로 입력해줘.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(apiUrl("/v2/tasting/note"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sool_id: soolIdNum,
          aroma: Number(form.aroma),
          sweetness: Number(form.sweetness),
          acidity: Number(form.acidity),
          body: Number(form.body),
          finish: Number(form.finish),
          comment: form.comment ?? "",
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`등록 실패 (HTTP ${res.status}) ${msg}`.trim());
      }

      alert("등록 완료!");
      router.push("/admin/tasting/list");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-2">🍶 Tasting Note 등록</h1>

      <div className="space-y-3">
        {/* sool_id는 숫자 입력 */}
        <div className="space-y-1">
          <label className="block font-medium">sool_id</label>
          <input
            value={form.sool_id}
            onChange={(e) => setForm({ ...form, sool_id: e.target.value })}
            className="border px-2 py-1 rounded text-black w-full"
            placeholder="예: 118"
            inputMode="numeric"
          />
        </div>

        {/* 점수는 SliderInput 사용 */}
        <SliderInput
          label="Aroma"
          value={form.aroma}
          onChange={(v) => setForm({ ...form, aroma: v })}
        />
        <SliderInput
          label="Sweetness"
          value={form.sweetness}
          onChange={(v) => setForm({ ...form, sweetness: v })}
        />
        <SliderInput
          label="Acidity"
          value={form.acidity}
          onChange={(v) => setForm({ ...form, acidity: v })}
        />
        <SliderInput
          label="Body"
          value={form.body}
          onChange={(v) => setForm({ ...form, body: v })}
        />
        <SliderInput
          label="Finish"
          value={form.finish}
          onChange={(v) => setForm({ ...form, finish: v })}
        />

        <div className="space-y-1">
          <label className="block font-medium">comment</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="border px-2 py-2 rounded text-black w-full"
            placeholder="코멘트"
            rows={4}
          />
        </div>

        <button
          onClick={submitForm}
          disabled={saving}
          className="bg-blue-500 disabled:bg-blue-900 text-white px-4 py-2 rounded"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}
