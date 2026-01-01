"use client";

import { useState, useEffect } from "react";

export default function SoolDetail({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [reportImg, setReportImg] = useState<string | null>(null);  // 🔥 base64 이미지

  /* ------------------------------
      1) Next.js Dynamic Route 처리
  ------------------------------ */
  useEffect(() => {
    params.then((p) => setResolvedId(p.id));
  }, [params]);


  /* ------------------------------
      2) 상세 데이터 / 리뷰 / 리포트 fetch
  ------------------------------ */
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


  /* ------------------------------
      3) 분석 report(base64) 요청
  ------------------------------ */
  useEffect(() => {
    if (!data) return;

    fetch(`http://127.0.0.1:8000/report/${data.name}`)
      .then(res => res.json())
      .then(d => setReportImg(`data:image/png;base64,${d.image}`));
  }, [data]);


  /* ------------------------------
      4) 리뷰 작성
  ------------------------------ */
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

    } catch {
      alert("⚠️ 서버 요청 오류 발생");
    }
  };


  /* ------------------------------
      Loading UI
  ------------------------------ */
  if (!resolvedId || !data) return <p className="p-6 text-gray-400">⏳ 로딩중...</p>;


  /* ------------------------------
      렌더 UI
  ------------------------------ */
  return (
    <div className="p-6 text-white max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-4">{data.name}</h1>
      <p>🍶 도수: {data.abv}%</p>
      <p>📍 지역: {data.region ?? "미등록"}</p>
      <p>📦 카테고리: {data.category ?? "미분류"}</p>

      <hr className="my-6 border-gray-700" />

      {/* 🔥 분석 리포트 */}
      <h2 className="text-xl font-bold mb-3">📊 분석 리포트</h2>
      {reportImg ? (
        <img src={reportImg} className="rounded-lg shadow-xl border border-gray-700 mb-6" />
      ) : (
        <p className="text-gray-400">🔄 분석 생성중...</p>
      )}

      <hr className="my-6 border-gray-700" />

      {/* 리뷰 입력 */}
      <h2 className="text-xl font-semibold mb-3">✍ 리뷰 남기기</h2>

      <input
        type="number"
        placeholder="별점 (1~5)"
        min={1} max={5}
        value={rating ?? ""}
        onChange={(e) => setRating(Number(e.target.value))}
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
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition mb-6"
      >
        저장하기
      </button>

      <hr className="my-6 border-gray-700" />

      {/* 리뷰 목록 */}
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
