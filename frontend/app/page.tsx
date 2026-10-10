"use client";

// 메인: 전통주 탐색. 목록·필터는 공개 API /explore/sool (파이프라인 술 카드 결과)
import { API_BASE, assetUrl } from "@/lib/api";
import { CAT_COLOR, PAIRINGS, TASTE_LABEL } from "@/lib/soolLabels";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input, Select, Typography, Pagination, Spin, Empty } from "antd";
import { SearchOutlined, ReloadOutlined, TrophyFilled } from "@ant-design/icons";
import { useAppShell } from "./components/AppShellProvider";

const { Title, Text } = Typography;

type Item = {
  id: number; name: string; abv: number | null; region: string | null; producer: string | null; image_url: string | null;
  category: string | null; category_auto: boolean; visit_brewery: boolean; is_raw: boolean; no_sweetener: boolean;
  awarded: boolean; online_buy: boolean; card_score: number | null;
  main_ingredient: string | null; tastes: string[]; pairings: string[]; best_award: string | null;
};

const CATEGORIES = ["탁주", "약주", "청주", "과실주", "증류주", "리큐르", "기타주류"];
const SORT_OPTIONS = [
  { label: "추천순", value: "recommended" },
  { label: "이름순", value: "name" },
  { label: "도수 낮은순", value: "abv_low" },
  { label: "도수 높은순", value: "abv_high" },
];
// 술 카드 필터 — 백엔드 /explore/sool 의 flags 이름과 같다
const FLAGS = [
  { value: "no_sweetener", label: "무감미료" },
  { value: "raw", label: "생(비살균)" },
  { value: "visit", label: "찾아가는 양조장" },
  { value: "online_buy", label: "온라인 구매" },
  { value: "awarded", label: "수상작" },
];
const PAGE_SIZE = 24;

const catColor = (c: string | null) => CAT_COLOR[c ?? ""] ?? "#64748b";
// 도수별 색상 (기존 카드와 같음)
const abvColor = (abv: number) => (abv < 10 ? "#52c41a" : abv < 20 ? "#f59e0b" : "#ff4d4f");

function Chip({ on, onClick, children, tone = "amber" }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: "amber" | "purple" }) {
  const onCls = tone === "purple" ? "bg-purple-400 text-black border-purple-400" : "bg-amber-500 text-black border-amber-500";
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-9 px-4 rounded-full text-sm font-bold border transition-colors whitespace-nowrap",
        on ? onCls : "bg-white/[0.04] text-white/60 border-white/10 hover:border-white/30 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SoolTile({ item }: { item: Item }) {
  const color = catColor(item.category);
  const img = assetUrl(item.image_url);
  return (
    <Link href={`/sool/${item.id}`} className="group block h-full">
      <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-amber-500/50 hover:bg-white/[0.05] transition-colors">
        {/* 위: 이미지 (없으면 주종 이모지) — 기존 디자인 유지 */}
        <div className="p-4 pb-0">
          <div className="relative aspect-square bg-gradient-to-br from-neutral-900 to-black rounded-[2rem] flex flex-col items-center justify-center overflow-hidden border border-white/10 group-hover:border-amber-500/30 transition-all shadow-inner">
            {img ? (
              <img src={img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            ) : (
              <div className="text-8xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] group-hover:scale-125 transition-transform duration-700">
                {item.category === "탁주" ? "🍶" : "🥃"}
              </div>
            )}
            {item.abv != null && (
              <div className="absolute top-5 right-5 backdrop-blur-xl px-4 py-2 rounded-2xl border shadow-2xl"
                style={{ backgroundColor: `${abvColor(item.abv)}22`, borderColor: `${abvColor(item.abv)}44` }}>
                <span style={{ color: abvColor(item.abv) }} className="font-black text-sm">{item.abv}%</span>
              </div>
            )}
            {item.awarded && (
              <span className="absolute top-5 left-5 px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur text-amber-400 text-xs font-bold">
                <TrophyFilled /> {item.best_award ?? "수상"}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        {/* 아래: 술 카드 요약 */}
        <div className="flex-1 flex flex-col gap-2.5 p-5">
          <div>
            <div className="text-white text-lg font-black leading-snug line-clamp-1 group-hover:text-amber-400 transition-colors">{item.name}</div>
            <div className="text-white/40 text-xs mt-0.5 line-clamp-1">
              {[item.producer, item.region].filter(Boolean).join(" · ") || "-"}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {item.category && (
              <span className="px-2 py-0.5 rounded-md font-bold whitespace-nowrap" style={{ background: `${color}22`, color }}>
                {item.category}{item.category_auto && <span className="opacity-60"> · 추정</span>}
              </span>
            )}
            {item.main_ingredient && <span className="text-white/50 line-clamp-1">원료 {item.main_ingredient}</span>}
          </div>

          {(item.tastes.length > 0 || item.pairings.length > 0) && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {item.tastes.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300">{TASTE_LABEL[t] ?? t}</span>
              ))}
              {item.pairings.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300">🍽 {p}</span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-3 flex flex-wrap gap-1.5 text-[11px] font-bold border-t border-white/5">
            {item.visit_brewery && <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300">찾아가는 양조장</span>}
            {item.is_raw && <span className="px-2 py-0.5 rounded-md bg-green-500/15 text-green-300">생</span>}
            {item.no_sweetener && <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50">무감미료</span>}
            {item.online_buy && <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300">온라인 구매</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { search, setSearch } = useAppShell();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState("recommended");
  const [flags, setFlags] = useState<string[]>([]);
  const [pairing, setPairing] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [flagCounts, setFlagCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 상세 페이지의 페어링 태그(/?pairing=...)로 들어온 경우
    const p = new URLSearchParams(window.location.search).get("pairing");
    if (p && PAIRINGS.includes(p)) setPairing(p);
    fetch(`${API_BASE}/sool/regions`).then((r) => (r.ok ? r.json() : [])).then((d) => setRegions(d ?? [])).catch(() => {});
    fetch(`${API_BASE}/explore/meta`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setFlagCounts(d.flags ?? {})).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const qs = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE), order: sort });
      if (search && search.length >= 2) qs.set("q", search);
      if (category) qs.set("category", category);
      if (region) qs.set("region", region);
      if (flags.length) qs.set("flags", flags.join(","));
      if (pairing) qs.set("pairing", pairing);
      try {
        const res = await fetch(`${API_BASE}/explore/sool?${qs}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      } catch (err) {
        console.error("목록 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [page, search, category, region, sort, flags, pairing]);

  // 필터를 바꾸면 항상 1쪽부터
  const reset1 = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const toggleFlag = (f: string) => { setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f])); setPage(1); };
  const togglePairing = (g: string) => { setPairing((cur) => (cur === g ? "" : g)); setPage(1); };
  const filtered = !!(search || category || region || flags.length || pairing);
  const resetAll = () => {
    setSearch(""); setCategory(""); setRegion(""); setSort("recommended"); setFlags([]); setPairing(""); setPage(1);
    window.history.replaceState(null, "", "/");
  };

  return (
    <div className="bg-[#050505] min-h-screen">
      <div className="max-w-[1500px] mx-auto py-12 md:py-16 px-4 md:px-10">
        {/* 머리말 */}
        <div className="mb-8">
          <Title className="!text-white !text-4xl md:!text-5xl !font-black !m-0 !tracking-tight">
            우리 술 <span className="text-amber-500">탐색</span>
          </Title>
          <Text className="!text-white/50 !text-base md:!text-lg block mt-3">
            원료 · 맛 · 어울리는 음식 · 양조장까지, 전통주 정보를 한 장의 술 카드로 정리했습니다.
          </Text>
        </div>

        {/* 검색 + 선택 필터 */}
        <div className="sticky top-20 z-40 mb-4">
          <div className="flex flex-col lg:flex-row gap-2 p-2 bg-[#0b0b0b]/90 border border-white/10 rounded-2xl backdrop-blur-xl">
            <div className="flex-1 flex items-center px-3 gap-3">
              <SearchOutlined className="text-amber-500 text-lg" />
              <Input
                variant="borderless"
                placeholder="술 이름이나 양조장으로 검색 (2글자 이상)"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="text-white h-11 text-base placeholder:text-white/25"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select className="dark-select" style={{ width: 120 }} value={category} onChange={reset1(setCategory)}
                options={[{ label: "전체 주종", value: "" }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]} />
              <Select className="dark-select" style={{ width: 120 }} value={region} onChange={reset1(setRegion)}
                options={[{ label: "전체 지역", value: "" }, ...regions.map((r) => ({ label: r, value: r }))]} />
              <Select className="dark-select" style={{ width: 120 }} value={sort} onChange={reset1(setSort)} options={SORT_OPTIONS} />
            </div>
          </div>
        </div>

        {/* 빠른 필터 칩 */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FLAGS.map((f) => (
              <Chip key={f.value} on={flags.includes(f.value)} onClick={() => toggleFlag(f.value)}>
                {f.label}{flagCounts[f.value] != null && <span className="ml-1 opacity-50">{flagCounts[f.value]}</span>}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 items-center">
            <span className="text-white/30 text-xs font-bold whitespace-nowrap mr-1">어울리는 음식</span>
            {PAIRINGS.map((g) => (
              <Chip key={g} tone="purple" on={pairing === g} onClick={() => togglePairing(g)}>{g}</Chip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <Text className="!text-white/60">
            <span className="text-white font-black text-lg">{total.toLocaleString()}</span>종
            {sort === "recommended" && <span className="text-white/30 text-sm ml-2">정보가 충실한 술부터</span>}
          </Text>
          {filtered && (
            <button type="button" onClick={resetAll} className="text-white/40 hover:text-white text-sm flex items-center gap-1">
              <ReloadOutlined /> 필터 초기화
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-32"><Spin size="large" /></div>
        ) : items.length === 0 ? (
          <Empty className="py-24" description={<span className="text-white/40">조건에 맞는 술이 없습니다</span>} />
        ) : (
          <>
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {items.map((item) => <SoolTile key={item.id} item={item} />)}
            </div>
            <div className="flex justify-center mt-14">
              <Pagination current={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => { setPage(p); window.scrollTo({ top: 0 }); }}
                showSizeChanger={false} className="custom-pagination" />
            </div>
          </>
        )}

        <div className="text-white/20 text-center text-xs py-12 mt-16 border-t border-white/5">
          술 카드 정보는 공개 자료의 원료·설명 문구에서 자동 추출했습니다. 주종의 &apos;추정&apos; 표시는 자동 분류 결과입니다.
        </div>
      </div>

      <style jsx global>{`
        .dark-select .ant-select-selector {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          height: 44px !important;
          align-items: center !important;
        }
        .dark-select .ant-select-selection-item { color: white !important; font-weight: 700 !important; }
        .dark-select .ant-select-arrow { color: #f59e0b !important; }
        .custom-pagination .ant-pagination-item {
          background: rgba(255,255,255,0.03) !important;
          border-color: rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
        }
        .custom-pagination .ant-pagination-item a { color: rgba(255,255,255,0.4) !important; font-weight: 800 !important; }
        .custom-pagination .ant-pagination-item-active { border-color: #f59e0b !important; background: rgba(245,158,11,0.1) !important; }
        .custom-pagination .ant-pagination-item-active a { color: #f59e0b !important; }
        .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
        .custom-pagination .ant-pagination-next .ant-pagination-item-link { color: rgba(255,255,255,0.3) !important; }
        .custom-pagination .ant-pagination-jump-next .ant-pagination-item-ellipsis,
        .custom-pagination .ant-pagination-jump-prev .ant-pagination-item-ellipsis { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  );
}
