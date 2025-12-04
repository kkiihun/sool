"use client";

import { useState, useEffect } from "react";

export default function SoolDetail({ params }: any) {
  const [id, setId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [reviews, setReviews] = useState<any[]>([]); // ← 배열로 초기화

  // unwrap params.id (Next.js 요구사항)
  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setId(resolved.id);
    }
    resolveParams();
  }, [params]);

  // 상세 데이터 + 리뷰 로딩
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      const res = await fetch(`http://127.0.0.1:8000/sool/${id}`);
      setData(await res.json());
    };

    const fetchReviews = async () => {
      const res = await fetch(`http://127.0.0.1:8000/review/${id}`);
      const json = await res.json();
      setReviews(Array.isArray(json) ? json : []); // ← map 에러 방지
    };

    fetchDetail();
    fetchReviews();
  }, [id]);

  // 리뷰 저장
  const submitReview = async () => {
    if (!rating) return alert("별점을 입력해주세요.");

    await fetch("http://127.0.0.1:8000/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        notes,
        sool_id: Number(id),
      }),
    });

    alert("저장 완료!");
    setRating(null);
    setNotes("");

    // 새로 저장하면 목록 갱신
    const res = await fetch(`http://127.0.0.1:8000/review/${id}`);
    const updated = await res.json();
    setReviews(Array.isArray(updated) ? updated : []);
  };

  if (!id || !data) return <p className="p-6">로딩 중...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{data.name}</h1>

      <p>🍶 도수: {data.abv ?? "?"}%</p>
      <p>📍 지역: {data.region ?? "미등록"}</p>
      <p>📦 카테고리: {data.category ?? "미분류"}</p>

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-3">리뷰 남기기</h2>

      <input
        type="number"
        placeholder="별점 (1~5)"
        value={rating ?? ""}
        onChange={(e) => setRating(Number(e.target.value))}
        className="border p-2 rounded w-full mb-3 bg-gray-800 text-white placeholder-gray-400"
      />

      <textarea
        placeholder="메모..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="border p-2 rounded w-full mb-3 bg-gray-800 text-white placeholder-gray-400"
      />

      <button
        onClick={submitReview}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        저장하기
      </button>

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-3">📌 기록된 리뷰</h2>

      {reviews.length === 0 ? (
        <p>리뷰 없음</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="border p-3 rounded mb-3">
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
