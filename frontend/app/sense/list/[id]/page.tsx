"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SenseDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/sense/${id}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch (error) {
      alert("데이터 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <p>⏳ 불러오는 중...</p>;
  if (!data) return <p>❌ 데이터 없음</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🍶 시음 상세 정보</h1>
      <hr />

      <ul style={{ fontSize: "18px", lineHeight: "32px" }}>
        <li><strong>ID:</strong> {data.id}</li>
        <li><strong>Sool ID:</strong> {data.sool_id}</li>
        <li><strong>Clarity:</strong> {data.clarity}</li>
        <li><strong>Color:</strong> {data.color}</li>
        <li><strong>Sweetness:</strong> {data.sweetness}</li>
        <li><strong>Smoothness:</strong> {data.smoothness}</li>
        <li><strong>Aroma:</strong> {data.aroma}</li>
        <li><strong>Rating:</strong> {data.rating}</li>
        <li><strong>Notes:</strong> {data.notes || "없음"}</li>
        <li><strong>Date:</strong> {data.date || "-"}</li>
      </ul>

      <br />
      <button
        onClick={() => (window.location.href = "/sense/list")}
        style={{
          padding: "12px 20px",
          border: "1px solid #888",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        목록으로 돌아가기
      </button>
    </div>
  );
}
