"use client";

// 양조장 대표님 입구: 내 양조장 찾기 → 진단 리포트 (B1). 서울·경기 우선
import { API_BASE } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Input, Segmented, Spin, Typography } from "antd";
import { SearchOutlined, WarningFilled } from "@ant-design/icons";

const { Title, Text } = Typography;

type Row = {
  place_id: string; name: string | null; sido: string | null; sigungu: string | null; products: number;
  avg_card_score: number; visit_brewery: boolean; high_issues: number; blog_total: number;
};

export default function BreweryOwners() {
  const [sido, setSido] = useState("서울,경기");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/explore/breweries?sido=${encodeURIComponent(sido)}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setRows(d.items ?? []))
      .finally(() => setLoading(false));
  }, [sido]);

  const shown = useMemo(() => {
    const k = q.trim();
    return k ? rows.filter((r) => (r.name ?? "").includes(k) || (r.sigungu ?? "").includes(k)) : rows;
  }, [rows, q]);

  return (
    <div className="bg-[#050505] min-h-screen">
      <div className="max-w-[1200px] mx-auto py-12 md:py-16 px-4 md:px-10">
        <Title className="!text-white !text-4xl md:!text-5xl !font-black !m-0">양조장 <span className="text-amber-500">진단 리포트</span></Title>
        <Text className="!text-white/50 !text-base md:!text-lg block mt-3 mb-8">
          내 술이 온라인에서 어떻게 보이는지, 무엇을 고치면 식당·소비자가 더 잘 찾는지 한 장으로 확인하세요.
        </Text>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Input size="large" allowClear prefix={<SearchOutlined className="text-amber-500" />} placeholder="양조장 이름이나 시군구"
            value={q} onChange={(e) => setQ(e.target.value)} className="!bg-white/5 !border-white/10 !text-white md:max-w-md" />
          <Segmented value={sido} onChange={(v) => setSido(String(v))}
            options={[{ label: "서울·경기", value: "서울,경기" }, { label: "서울", value: "서울" }, { label: "경기", value: "경기" }, { label: "전국", value: "" }]} />
        </div>

        {loading ? <div className="py-24 text-center"><Spin /></div> : (
          <>
            <Text className="!text-white/40 block mb-3">{shown.length}곳 · 심각한 문제가 있는 곳 {shown.filter((r) => r.high_issues).length}</Text>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {shown.map((r) => (
                <Link key={r.place_id} href={`/owners/brewery/${r.place_id}`}
                  className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-amber-500/50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">{r.name ?? "-"}</div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {[r.sido, r.sigungu].filter(Boolean).join(" ")} · 제품 {r.products} · 후기 {r.blog_total}
                      {r.visit_brewery && <span className="text-cyan-300"> · 찾아가는 양조장</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.high_issues > 0 && <span className="text-red-400 text-xs font-bold"><WarningFilled /> {r.high_issues}</span>}
                    <span className="text-amber-400 font-black">{r.avg_card_score.toFixed(1)}<span className="text-white/30 text-xs">/7</span></span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
