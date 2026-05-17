"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";

interface TastingNote {
  id: number;
  sool_id: number;
  aroma: number;
  sweetness: number;
  acidity: number;
  body: number;
  finish: number;
  comment: string;
  notes?: string;
  created_at?: string;
}

// ✅ env로 통일 (현재: http://localhost:8000)
// ✅ 프록시로 바꾸면 NEXT_PUBLIC_API_BASE_URL=/proxy 로만 바꾸면 됨
const getApiUrl = () => {
  if (typeof window !== "undefined") return "/proxy";
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};
const API_BASE = getApiUrl();

const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

export default function TastingListPage() {
  const [data, setData] = useState<TastingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(apiUrl("/v2/tasting/note/all"), {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${getToken() ?? ""}`,
          },
        });

        if (!res.ok) throw new Error(`목록 조회 실패 (HTTP ${res.status})`);

        const json = (await res.json()) as TastingNote[];
        if (cancelled) return;

        setData(Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "목록 조회 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-6 text-xl">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📋 Tasting Notes List</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-black">
            <th className="border p-2">ID</th>
            <th className="border p-2">SOOL ID</th>
            <th className="border p-2">Aroma</th>
            <th className="border p-2">Sweet</th>
            <th className="border p-2">Acid</th>
            <th className="border p-2">Body</th>
            <th className="border p-2">Finish</th>
            <th className="border p-2">Comment</th>
            <th className="border p-2">View</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="text-center hover:bg-gray-50">
              <td className="border p-2">{item.id}</td>
              <td className="border p-2">{item.sool_id}</td>
              <td className="border p-2">{item.aroma}</td>
              <td className="border p-2">{item.sweetness}</td>
              <td className="border p-2">{item.acidity}</td>
              <td className="border p-2">{item.body}</td>
              <td className="border p-2">{item.finish}</td>
              <td className="border p-2">{item.notes ?? item.comment}</td>

              <td className="border p-2">
                <Link
                  href={`/admin/tasting/view/${item.id}`}
                  className="text-blue-600 underline"
                >
                  상세
                </Link>
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td className="border p-4 text-center text-gray-500" colSpan={9}>
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
