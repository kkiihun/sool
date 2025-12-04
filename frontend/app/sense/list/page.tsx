"use client";

import { useEffect, useState } from "react";
import axios from "axios";

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
  date?: string;
}

export default function SenseList() {
  const [data, setData] = useState<Sense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/sense/");
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

  if (loading) return <p className="text-white p-6">⏳ 불러오는 중...</p>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">📋 테이스팅 노트 목록</h1>

      {data.length === 0 ? (
        <p>저장된 데이터가 없습니다.</p>
      ) : (
        <table className="w-full border border-gray-700 text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">ID</th>
              <th className="p-2">Sool ID</th>
              <th className="p-2">Sweetness</th>
              <th className="p-2">Aroma</th>
              <th className="p-2">Rating</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer">
                <td className="p-2">{item.id}</td>
                <td className="p-2">{item.sool_id}</td>
                <td className="p-2">{item.sweetness}</td>
                <td className="p-2">{item.aroma}</td>
                <td className="p-2">{item.rating ?? "-"}</td>
                <td className="p-2">{item.date ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
