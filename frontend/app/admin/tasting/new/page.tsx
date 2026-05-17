"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import SliderInput from "@/components/SliderInput";
import { getToken } from "@/lib/auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
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

    const soolId = Number(form.sool_id);
    if (!Number.isFinite(soolId) || soolId <= 0) {
      alert("Enter a valid numeric sool_id.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(apiUrl("/v2/tasting/note"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
        body: JSON.stringify({
          sool_id: soolId,
          aroma: form.aroma,
          sweetness: form.sweetness,
          acidity: form.acidity,
          body: form.body,
          finish: form.finish,
          notes: form.comment,
        }),
      });

      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(`Create failed (HTTP ${res.status}) ${message}`.trim());
      }

      alert("Created.");
      router.push("/admin/tasting/list");
      router.refresh();
    } catch (error: any) {
      alert(error?.message ?? "Request failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="mb-2 text-2xl font-bold">Create Tasting Note</h1>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block font-medium">sool_id</label>
          <input
            value={form.sool_id}
            onChange={(e) => setForm({ ...form, sool_id: e.target.value })}
            className="w-full rounded border px-2 py-1 text-black"
            placeholder="e.g. 118"
            inputMode="numeric"
          />
        </div>

        <SliderInput label="Aroma" value={form.aroma} onChange={(v) => setForm({ ...form, aroma: v })} />
        <SliderInput label="Sweetness" value={form.sweetness} onChange={(v) => setForm({ ...form, sweetness: v })} />
        <SliderInput label="Acidity" value={form.acidity} onChange={(v) => setForm({ ...form, acidity: v })} />
        <SliderInput label="Body" value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
        <SliderInput label="Finish" value={form.finish} onChange={(v) => setForm({ ...form, finish: v })} />

        <div className="space-y-1">
          <label className="block font-medium">comment</label>
          <textarea
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="w-full rounded border px-2 py-2 text-black"
            placeholder="Comment"
            rows={4}
          />
        </div>

        <button
          onClick={submitForm}
          disabled={saving}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-blue-900"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
