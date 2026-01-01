"use client";
import { useEffect, useState } from "react";

interface TastingNote {
  id: number;
  sool_id: number;
  aroma: number;
  sweetness: number;
  acidity: number;
  body: number;
  finish: number;
  comment: string;
  created_at?: string;
}

export default function TastingListPage() {
  const [data, setData] = useState<TastingNote[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const res = await fetch("http://127.0.0.1:8000/v2/tasting/note/all");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-xl">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📋 Tasting Notes List</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
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
              <td className="border p-2">{item.comment}</td>

              <td className="border p-2">
                <a
                  href={`/admin/tasting/view/${item.id}`}
                  className="text-blue-600 underline"
                >
                  상세
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
