"use client";

import { useState, useEffect } from "react";

export default function SoolDetail({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // 🚀 params 처리 (Next.js 요구사항)
  useEffect(() => {
    params.then((p) => setResolvedId(p.id));
  }, [params]);

  // 🚀 데이터 fetch
  useEffect(() => {
    if (!resolvedId) return;

    const fetchDetail = async () => {
      const res = await fetch(`http://127.0.0.1:8000/sool/${resolvedId}`);
      setData(await res.json());
    };

    const fetchReviews = async () => {
      const res = await fetch(`http://127.0.0.1:8000/review/${resolvedId}`);
      setReviews(await res.json());
    };

    fetchDetail();
    fetchReviews();
  }, [resolvedId]);

  // 🚀 리뷰 저장
  const submitReview = async () => {
  if (!rating) return alert("별점을 입력해주세요.");

  try {
    const res = await fetch("http://127.0.0.1:8000/review/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        notes,
        sool_id: Number(resolvedId),
      }),
    });

    // ❗ FastAPI validation 에러 대응
    if (!res.ok) {
      const err = await res.json();
      alert("저장 실패: " + (err.detail ?? "알 수 없는 오류"));
      return;
    }

    alert("저장 완료!");

    setRating(null);
    setNotes("");

    const updated = await fetch(`http://127.0.0.1:8000/review/${resolvedId}`);
    setReviews(await updated.json());
  } catch (error) {
    alert("⚠️ 네트워크 오류 발생!");
  }
};


  if (!resolvedId || !data) return <p className="p-6 text-gray-300">⏳ 로딩 중...</p>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">{data.name}</h1>

      <p>🍶 도수: {data.abv}%</p>
      <p>📍 지역: {data.region ?? "미등록"}</p>
      <p>📦 카테고리: {data.category ?? "미분류"}</p>

      <hr className="my-6 border-gray-700" />

      <h2 className="text-xl font-semibold mb-3">리뷰 남기기</h2>

      <input
          type="number"
          placeholder="별점 (1~5)"
          min={1}
          max={5}
          step={1}
          value={rating ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value);
            setRating(value); // 입력 중에는 제한 없음
          }}
          onBlur={() => {
            if (rating! < 1) setRating(1);
            if (rating! > 5) setRating(5);
          }}
          className="border p-2 w-full bg-gray-900 text-white mb-3"
        />


      <textarea
        placeholder="메모 작성..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="border p-2 w-full bg-gray-900 text-white mb-3"
      />
      <button
        onClick={submitReview}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition"
      >
        저장하기
      </button>

      <hr className="my-6 border-gray-700" />

      <h2 className="text-xl font-semibold mb-3">📌 사용자 리뷰</h2>
      {reviews.length === 0 ? (
        <p className="text-gray-400">리뷰 없음</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="border border-gray-700 p-3 rounded mb-3">
            ⭐ {r.rating}
            <p>{r.notes}</p>
          </div>
        ))
      )}

      <a href="/" className="block mt-6 underline text-blue-400">
        ← 목록으로 돌아가기
      </a>
    </div>
  );
}
