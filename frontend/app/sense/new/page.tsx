"use client";

import axios from "axios";
import { useState } from "react";

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
    date: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 // 🔥 저장 함수
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 🔥 FastAPI가 정수/float을 요구하므로 변환
  const payload = {
    sool_id: Number(form.sool_id),
    clarity: Number(form.clarity),
    color: Number(form.color),
    aroma: Number(form.aroma),
    sweetness: Number(form.sweetness),
    smoothness: Number(form.smoothness),
    rating: Number(form.rating),
    notes: form.notes,
    date: form.date,
  };

  try {
    await axios.post("http://127.0.0.1:8000/sense/", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    alert("저장 완료!");

    // 폼 초기화 (선택)
    setForm({
      sool_id: "",
      clarity: "",
      color: "",
      aroma: "",
      sweetness: "",
      smoothness: "",
      rating: "",
      notes: "",
      date: "",
    });

  } catch (error: any) {
    console.log(error.response?.data || error.message);
    alert("⚠️ 에러 발생! 콘솔 확인해 주세요.");
  }
};


  return (
    <div style={{ padding: "20px" }}>
      <h1>🍶 테이스팅 노트 입력</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
  <input
    name="sool_id"
    placeholder="술 ID (예: 1)"
    type="number"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <input
    name="clarity"
    placeholder="투명도 (1~5)"
    type="number"
    min="1"
    max="5"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <input
    name="color"
    placeholder="색상 강도 (1~5)"
    type="number"
    min="1"
    max="5"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <input
    name="aroma"
    placeholder="향 (1~5)"
    type="number"
    min="1"
    max="5"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <input
    name="sweetness"
    placeholder="단맛 (1~5)"
    type="number"
    min="1"
    max="5"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <input
    name="smoothness"
    placeholder="부드러움 (1~5)"
    type="number"
    min="1"
    max="5"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <input
    name="rating"
    placeholder="총평 점수 (1~10)"
    type="number"
    min="1"
    max="10"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <textarea
    name="notes"
    placeholder="테이스팅 메모 (예: 꽃향기, 과일향, 산뜻함)"
    onChange={handleChange}
    className="border p-2 rounded w-full h-24"
  />

  <input
    name="date"
    type="date"
    onChange={handleChange}
    className="border p-2 rounded w-full"
  />

  <button type="submit" className="bg-blue-500 px-4 py-2 rounded text-white">
    저장하기
  </button>
</form>

    </div>
  );
}
