"use client";

import axios from "axios";
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

// ✅ env로 통일 (현재: http://localhost:8000)
// ✅ 프록시로 바꾸면 NEXT_PUBLIC_API_BASE_URL=/proxy 로만 바꾸면 됨
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

export default function SenseForm() {
  const [form, setForm] = useState({
    sool_id: "",
    clarity: "",
    color: "",
    aroma: "",
    sweetness: "",
    smoothness: "",
    rating: "",
    notes: "",
    date: "", // ✅ date 유지
  });

  const [saving, setSaving] = useState(false);

  // 페이지 입장 시 현재 시간 세팅 (datetime-local 형식)
  useEffect(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const iso = local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    setForm((prev) => ({ ...prev, date: iso }));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // 화면 값(YYYY-MM-DDTHH:MM)을 DB 저장용 문자열로 변환
    const formattedDate = form.date ? form.date.replace("T", " ") + ":00" : "";

    const payload = {
      sool_id: Number(form.sool_id),
      clarity: Number(form.clarity),
      color: Number(form.color),
      aroma: Number(form.aroma),
      sweetness: Number(form.sweetness),
      smoothness: Number(form.smoothness),
      rating: Number(form.rating),
      notes: form.notes,
      date: formattedDate,
    };

    try {
      setSaving(true);

      await axios.post(apiUrl("/sense/"), payload, {
        headers: { "Content-Type": "application/json" },
      });

      alert("저장 완료!");

      // 다시 현재 시간으로 초기화
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      const iso = local.toISOString().slice(0, 16);

      setForm({
        sool_id: "",
        clarity: "",
        color: "",
        aroma: "",
        sweetness: "",
        smoothness: "",
        rating: "",
        notes: "",
        date: iso,
      });
    } catch (error: any) {
      console.log(error?.response?.data || error?.message);
      alert("⚠️ 에러 발생! 콘솔 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 text-gray-200 max-w-xl">
      {/* 🔙 뒤로가기 + 🏠 홈 */}
      <div className="flex items-center gap-6 mb-6">
        <BackButton />
        <Link href="/" className="text-blue-400 underline hover:text-blue-300">
          홈으로 이동
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-white mb-4">🍶 테이스팅 노트 입력</h1>
      <p className="text-gray-400 mb-6">
        전통주의 향, 맛, 질감 등 감각 데이터를 기록해보세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 술 ID */}
        <input
          name="sool_id"
          placeholder="술 ID (예: 12)"
          type="number"
          value={form.sool_id}
          onChange={handleChange}
          className="border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded w-full"
        />

        {/* 1~5 점수들 */}
        {[
          { name: "clarity", placeholder: "투명도 (1~5)" },
          { name: "color", placeholder: "색상 강도 (1~5)" },
          { name: "aroma", placeholder: "향 (1~5)" },
          { name: "sweetness", placeholder: "단맛 (1~5)" },
          { name: "smoothness", placeholder: "부드러움 (1~5)" },
        ].map((f) => (
          <input
            key={f.name}
            name={f.name}
            placeholder={f.placeholder}
            type="number"
            min={1}
            max={5}
            value={(form as any)[f.name]}
            onChange={handleChange}
            className="border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded w-full"
          />
        ))}

        {/* Rating */}
        <input
          name="rating"
          placeholder="총평 점수 (1~10)"
          type="number"
          min={1}
          max={10}
          value={form.rating}
          onChange={handleChange}
          className="border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded w-full"
        />

        {/* 메모 */}
        <textarea
          name="notes"
          placeholder="테이스팅 메모 작성..."
          value={form.notes}
          onChange={handleChange}
          className="border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded w-full h-24"
        />

        {/* 날짜 + 시간 입력 */}
        <input
          name="date"
          type="datetime-local"
          value={form.date}
          onChange={handleChange}
          className="border border-gray-700 bg-gray-900 text-gray-100 p-2 rounded w-full"
        />

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 px-4 py-2 rounded text-white w-full"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </form>
    </div>
  );
}
