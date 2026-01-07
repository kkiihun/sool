"use client";

import { use, useEffect, useState } from "react";
import { Rate } from "antd";
import SoolRadar from "@/components/SoolRadar";

/* ======================
   Types (v1 Standard)
====================== */
type Sool = {
  id: number;
  name: string;
  abv?: number;
  region?: string;
  category?: string;
};

type Tasting = {
  id: number;
  rating: number;
  notes: string;
};

type RadarAvg = {
  aroma?: number | null;
  sweetness?: number | null;
  acidity?: number | null;
  body?: number | null;
  finish?: number | null;
};

type Summary = {
  avg_rating: number | null;
  count: number;
  radar_avg: RadarAvg;
};

/* ======================
   Component
====================== */
export default function SoolDetail({
  params,
}: {
  params: Promise<{ id: string }>; // ✅ 문법 수정
}) {
  // ✅ Next.js 15: params Promise 언랩
  const { id: soolId } = use(params);

  /* ---------- state ---------- */
  const [sool, setSool] = useState<Sool | null>(null);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* ======================
     Data Fetch (v1 + Safe)
  ====================== */
  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [soolRes, tastingsRes, summaryRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/sool/by-id/${soolId}`),
        fetch(`http://127.0.0.1:8000/tasting/?sool_id=${soolId}`),
        fetch(`http://127.0.0.1:8000/sool/${soolId}/summary`),
      ]);

      if (!soolRes.ok) {
        throw new Error("제품 정보를 불러오지 못했습니다.");
      }

      setSool(await soolRes.json());

      const tastingData = await tastingsRes.json();
      setTastings(tastingData.items ?? tastingData ?? []);

      // ✅ summary는 평가 0건이면 404일 수 있음
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      } else {
        setSummary({
          avg_rating: null,
          count: 0,
          radar_avg: {},
        });
      }
    } catch (e) {
      console.error(e);
      setError("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // soolId는 항상 있어야 하지만, 안전장치
    if (!soolId) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soolId]);

  /* ======================
     Submit Tasting
  ====================== */
  const submitTasting = async () => {
    if (!rating) {
      alert("별점을 입력하세요");
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/tasting/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sool_id: Number(soolId),
        rating,
        notes,
        aroma: rating,
        sweetness: rating,
        acidity: rating,
        body: rating,
        finish: rating,
      }),
    });

    if (!res.ok) {
      alert("저장 실패");
      return;
    }

    setRating(0);
    setNotes("");

    await fetchAll();
  };

  /* ======================
     Render (Safe Order)
  ====================== */
  if (loading) {
    return <p className="p-6 text-gray-400">⏳ 로딩중...</p>;
  }

  if (error) {
    return <div className="p-6 text-red-400">⚠️ {error}</div>;
  }

  if (!sool) {
    return <p className="p-6 text-gray-400">존재하지 않는 제품입니다.</p>;
  }

  return (
    <div className="p-6 text-white max-w-3xl mx-auto space-y-6">
      {/* ---------- Header ---------- */}
      <header>
        <h1 className="text-3xl font-bold">{sool.name}</h1>

        {summary && summary.count > 0 ? (
          <p className="text-yellow-400 mt-1">
            ⭐ {summary.avg_rating?.toFixed(1)} / 5 ({summary.count}명 평가)
          </p>
        ) : (
          <p className="text-gray-500 mt-1">⭐ 아직 평가 없음</p>
        )}
      </header>

      <hr className="border-gray-700" />

      {/* ---------- Radar ---------- */}
      <section>
        <h2 className="text-xl font-semibold mb-2">🧠 감각 프로파일</h2>

        {summary && summary.count > 0 ? (
          <SoolRadar radar={summary.radar_avg} />
        ) : (
          <p className="text-gray-500">아직 감각 데이터가 없습니다.</p>
        )}
      </section>

      <hr className="border-gray-700" />

      {/* ---------- Input ---------- */}
      <section>
        <h2 className="text-xl font-semibold mb-2">✍ 테이스팅 노트</h2>

        <Rate
          value={rating}
          onChange={setRating}
          style={{ color: "#facc15", fontSize: 28 }}
        />

        <textarea
          className="border p-2 w-full bg-gray-900 text-white mt-3"
          placeholder="향, 맛, 질감 등을 기록하세요"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={submitTasting}
          className="mt-3 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
        >
          저장
        </button>
      </section>

      <hr className="border-gray-700" />

      {/* ---------- List ---------- */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          📌 테이스팅 노트 ({tastings.length})
        </h2>

        {tastings.length === 0 ? (
          <p className="text-gray-400">아직 노트가 없습니다.</p>
        ) : (
          tastings.map((t) => (
            <div
              key={t.id}
              className="border border-gray-700 p-3 rounded mb-3"
            >
              <Rate disabled value={t.rating} />
              <p className="mt-2 text-gray-300">{t.notes}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
