"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

interface Sense {
  id: number;
  sool_id: number;
  clarity: number;
  color: number;
  aroma: number;
  sweetness: number;
  smoothness: number;
  rating?: number;
  notes?: string;
  date?: string | null;
}

// ✅ env로 통일 (현재: http://localhost:8000)
// ✅ 프록시로 바꾸면 NEXT_PUBLIC_API_BASE_URL=/proxy 로만 바꾸면 됨
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

export default function SenseListPage() {
  const [data, setData] = useState<Sense[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 날짜 포맷 처리 함수 (모든 케이스 처리)
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    if (typeof date !== "string") return "-";
    const trimmed = date.trim();
    if (trimmed === "" || trimmed === "Invalid Date") return "-";
    return trimmed.slice(0, 10);
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(apiUrl("/sense/"));
      setData(res.data);
    } catch (err) {
      console.log(err);
      alert("데이터 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <p className="text-white p-6">⏳ 로딩중...</p>;
  }

  return (
    <div className="p-6 text-white">
      {/* 뒤로가기 + 홈버튼 */}
      <div className="flex items-center gap-4 mb-4">
        <BackButton />
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
          홈으로 이동
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4">📋 테이스팅 노트 목록</h1>

      {data.length === 0 ? (
        <p>저장된 테이스팅 노트가 없습니다.</p>
      ) : (
        <table className="w-full border border-gray-700 text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">ID</th>
              <th className="p-2">Sool ID</th>
              <th className="p-2">Clarity</th>
              <th className="p-2">Color</th>
              <th className="p-2">Sweetness</th>
              <th className="p-2">Smoothness</th>
              <th className="p-2">Aroma</th>
              <th className="p-2">Rating</th>
              <th className="p-2">Date</th>
              <th className="p-2">상세</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-800 hover:bg-gray-800"
              >
                <td className="p-2">{item.id}</td>
                <td className="p-2">{item.sool_id}</td>
                <td className="p-2">{item.clarity}</td>
                <td className="p-2">{item.color}</td>
                <td className="p-2">{item.sweetness}</td>
                <td className="p-2">{item.smoothness}</td>
                <td className="p-2">{item.aroma}</td>
                <td className="p-2">{item.rating ?? "-"}</td>

                {/* ★★★ 날짜 표시는 반드시 formatDate로 처리 ★★★ */}
                <td className="p-2">{formatDate(item.date)}</td>

                <td className="p-2">
                  <Link
                    href={`/sense/list/${item.id}`}
                    className="underline text-blue-400 hover:text-blue-300"
                  >
                    보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
