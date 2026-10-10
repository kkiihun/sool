"use client";

// 식당 사장님: 우리 가게 메뉴 → 어울리는 전통주 (R1) + 가게 근처 양조장 (R2). 서울·경기 우선
import { API_BASE } from "@/lib/api";
import { CHANNEL_LABEL, TASTE_LABEL, httpUrl } from "@/lib/soolLabels";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Segmented, Select, Spin, Tooltip, Typography, message } from "antd";
import { AimOutlined, CheckOutlined, EnvironmentOutlined, PlusOutlined, ProfileOutlined, ShopOutlined, TrophyFilled } from "@ant-design/icons";
import type { MapPoint } from "./RestaurantMap";
import { loadBoard, onBoardChange, toggleBoard } from "@/lib/menuBoard";

const RestaurantMap = dynamic(() => import("./RestaurantMap"), { ssr: false });
const { Title, Text } = Typography;

// 가게 메뉴 → 페어링 그룹 (파이프라인 PAIRING_GROUPS 와 같은 이름)
const MENUS: { label: string; group: string }[] = [
  { label: "삼겹살·고기구이", group: "육류" }, { label: "갈비·불고기", group: "육류" }, { label: "보쌈·족발", group: "육류" },
  { label: "치킨", group: "육류" }, { label: "파전·모둠전", group: "전·부침" }, { label: "회·초밥", group: "회·해산물" },
  { label: "조개·해산물", group: "회·해산물" }, { label: "찌개·탕·전골", group: "매운·국물" }, { label: "떡볶이·매운 요리", group: "매운·국물" },
  { label: "한정식·백반", group: "한식 전반" }, { label: "치즈·파스타·피자", group: "치즈·양식" }, { label: "디저트·과일", group: "디저트·과일" },
  { label: "칵테일·하이볼 바", group: "칵테일·하이볼" },
];
const FLAGS = [
  { value: "raw", label: "생(비살균)", tip: "효모가 살아 있는 생술. 냉장 유통이라 가까운 양조장이 유리" },
  { value: "no_sweetener", label: "무감미료" },
  { value: "visit", label: "직접 시음 가능", tip: "찾아가는 양조장 — 방문해서 맛보고 고를 수 있음" },
  { value: "online_buy", label: "온라인 주문 가능" },
];
const CATEGORIES = ["탁주", "약주", "청주", "과실주", "증류주", "리큐르"];
const STORE_KEY = "sool.restaurant.v1";

type Item = {
  sool_id: number; name: string; abv: number | null; category: string | null; main_ingredient: string | null;
  is_raw: boolean; no_sweetener: boolean; tastes: string[]; pairings: string[]; matched: string[]; reason: string | null;
  award: string | null; blog_count: number; online_buy: boolean; purchase_url: string | null; channel: string | null;
  place_id: string; brewery: string | null; sigungu: string | null; lat: number; lng: number; visit_brewery: boolean;
  distance_km: number | null;
};
type Brewery = {
  place_id: string; name: string | null; sido: string | null; sigungu: string | null; address: string | null;
  lat: number; lng: number; distance_km: number | null; product_count: number; matching: number; visit_brewery: boolean;
};
type Store = { lat: number; lng: number; label: string };

function Chip({ on, onClick, children, tone = "amber" }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: "amber" | "purple" }) {
  const onCls = tone === "purple" ? "bg-purple-400 text-black border-purple-400" : "bg-amber-500 text-black border-amber-500";
  return (
    <button type="button" onClick={onClick}
      className={`h-9 px-4 rounded-full text-sm font-bold border transition-colors whitespace-nowrap ${on ? onCls : "bg-white/[0.04] text-white/60 border-white/10 hover:border-white/30 hover:text-white"}`}>
      {children}
    </button>
  );
}

const Box = ({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) => (
  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
    <div className="flex items-center justify-between mb-4"><span className="text-white font-black">{title}</span>{extra}</div>
    {children}
  </section>
);

export default function RestaurantOwners() {
  const [menus, setMenus] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [radius, setRadius] = useState<number>(50);
  const [flags, setFlags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [breweries, setBreweries] = useState<Brewery[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [board, setBoard] = useState<number[]>([]);   // 메뉴판에 담은 술
  useEffect(() => {
    const sync = () => setBoard(loadBoard().map((e) => e.sool_id));
    sync();
    return onBoardChange(sync);
  }, []);

  // 지난번 입력 복원 (이 브라우저에만 저장)
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (s) { setMenus(s.menus ?? []); setAddress(s.address ?? ""); setStore(s.store ?? null); setRadius(s.radius ?? 50); }
    } catch { /* 저장소 사용 불가 */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ menus, address, store, radius })); } catch { /* 무시 */ }
  }, [menus, address, store, radius]);

  const groups = useMemo(() => Array.from(new Set(MENUS.filter((m) => menus.includes(m.label)).map((m) => m.group))), [menus]);

  useEffect(() => {
    const qs = new URLSearchParams({ limit: "40" });
    if (groups.length) qs.set("pairings", groups.join(","));
    if (store) { qs.set("lat", String(store.lat)); qs.set("lng", String(store.lng)); qs.set("radius_km", String(radius)); }
    if (flags.length) qs.set("flags", flags.join(","));
    if (category) qs.set("category", category);
    setLoading(true);
    fetch(`${API_BASE}/explore/restaurant/recommend?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setItems(d?.items ?? []); setTotal(d?.total ?? 0); setBreweries(d?.breweries ?? []); })
      .finally(() => setLoading(false));
  }, [groups, store, radius, flags, category]);

  const locate = async () => {
    if (address.trim().length < 2) return;
    setLocating(true);
    try {
      const r = await fetch(`${API_BASE}/explore/restaurant/geocode?q=${encodeURIComponent(address.trim())}`);
      if (!r.ok) { message.warning(r.status === 404 ? "주소를 찾지 못했습니다. 도로명 주소나 가게 이름으로 다시 입력해 주세요." : "주소 변환을 잠시 쓸 수 없습니다."); return; }
      setStore(await r.json());
    } finally { setLocating(false); }
  };

  const points: MapPoint[] = useMemo(() => {
    const m = new Map<string, MapPoint>();
    for (const it of items) {
      const p = m.get(it.place_id) ?? { place_id: it.place_id, name: it.brewery, lat: it.lat, lng: it.lng, matching: 0, visit_brewery: it.visit_brewery };
      p.matching += 1;
      m.set(it.place_id, p);
    }
    return Array.from(m.values());
  }, [items]);
  const pick = useCallback((id: string) => setFocus(id), []);
  const shown = focus ? items.filter((i) => i.place_id === focus) : items;
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="bg-[#050505] min-h-screen">
      <div className="max-w-[1400px] mx-auto py-12 md:py-16 px-4 md:px-10 flex flex-col gap-6">
        <div>
          <Title className="!text-white !text-4xl md:!text-5xl !font-black !m-0">식당 사장님 <span className="text-amber-500">술 고르기</span></Title>
          <Text className="!text-white/50 !text-base md:!text-lg block mt-3">
            우리 가게 메뉴와 어울리는 전통주를, 가게에서 가까운 양조장부터 찾아 드립니다. (서울·경기 우선)
          </Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          <Box title="① 우리 가게 메뉴" extra={menus.length > 0 && <button className="text-white/40 text-sm" onClick={() => setMenus([])}>지우기</button>}>
            <div className="flex flex-wrap gap-2">
              {MENUS.map((m) => <Chip key={m.label} tone="purple" on={menus.includes(m.label)} onClick={() => setMenus(toggle(menus, m.label))}>{m.label}</Chip>)}
            </div>
            <Text className="!text-white/30 !text-xs block mt-3">여러 개 고르면 더 많은 메뉴와 어울리는 술이 위로 올라옵니다. 안 고르면 전체에서 추천합니다.</Text>
          </Box>

          <Box title="② 가게 위치" extra={store && <button className="text-white/40 text-sm" onClick={() => setStore(null)}>위치 지우기</button>}>
            <div className="flex gap-2">
              <Input size="large" placeholder="도로명 주소, 가게 이름, 역 이름" value={address} onChange={(e) => setAddress(e.target.value)}
                onPressEnter={locate} prefix={<EnvironmentOutlined className="text-amber-500" />} className="!bg-white/5 !border-white/10 !text-white" />
              <Button size="large" type="primary" icon={<AimOutlined />} loading={locating} onClick={locate} className="!bg-amber-500 !text-black !border-none">확인</Button>
            </div>
            {store ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-white/70 text-sm">★ {store.label}</span>
                <Segmented size="small" value={radius} onChange={(v) => setRadius(Number(v))}
                  options={[{ label: "10km", value: 10 }, { label: "30km", value: 30 }, { label: "50km", value: 50 }, { label: "100km", value: 100 }]} />
              </div>
            ) : <Text className="!text-white/30 !text-xs block mt-3">위치를 넣으면 가까운 양조장 순으로 추천하고 거리를 보여 드립니다. 없으면 서울·경기 전체.</Text>}
          </Box>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {FLAGS.map((f) => (
            <Tooltip key={f.value} title={f.tip}><span><Chip on={flags.includes(f.value)} onClick={() => setFlags(toggle(flags, f.value))}>{f.label}</Chip></span></Tooltip>
          ))}
          <Select value={category} onChange={setCategory} style={{ width: 130 }} className="dark-select"
            options={[{ label: "전체 주종", value: "" }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 items-start">
          {/* 추천 목록 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Text className="!text-white/60">
                추천 <span className="text-white font-black text-lg">{total}</span>종
                {groups.length > 0 && <span className="text-white/30 text-sm ml-2">{groups.join(" · ")}와 어울리는 술</span>}
              </Text>
              {focus && <button className="text-amber-400 text-sm" onClick={() => setFocus(null)}>양조장 선택 해제 ✕</button>}
            </div>
            {loading ? <div className="py-20 text-center"><Spin /></div> : shown.length === 0 ? (
              <Empty className="py-16" description={<span className="text-white/40">조건에 맞는 술이 없습니다. 반경을 넓히거나 조건을 줄여 보세요.</span>} />
            ) : shown.map((it, n) => (
              <div key={it.sool_id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-amber-500/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 font-black text-sm">{n + 1}</span>
                      <Link href={`/sool/${it.sool_id}`} className="text-white text-lg font-black hover:text-amber-400 truncate">{it.name}</Link>
                    </div>
                    <div className="text-white/45 text-sm mt-0.5">
                      <ShopOutlined /> {it.brewery} · {it.sigungu ?? ""}
                      {it.distance_km != null && <span className="text-amber-300 font-bold"> · {it.distance_km}km</span>}
                      {it.visit_brewery && <span className="text-cyan-300"> · 직접 시음 가능</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white font-black">{it.abv ?? "-"}%</div>
                    <div className="text-white/40 text-xs">{it.category ?? ""}</div>
                  </div>
                </div>
                {it.reason && <div className="mt-3 text-white/70 text-sm border-l-2 border-purple-400/60 pl-3">“{it.reason}”<span className="text-white/25 text-xs"> — 제품 설명</span></div>}
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {it.matched.map((g) => <span key={g} className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 font-bold">🍽 {g}</span>)}
                  {it.tastes.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300">{TASTE_LABEL[t] ?? t}</span>)}
                  {it.main_ingredient && <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50">원료 {it.main_ingredient}</span>}
                  {it.is_raw && <span className="px-2 py-0.5 rounded-md bg-green-500/15 text-green-300">생</span>}
                  {it.no_sweetener && <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50">무감미료</span>}
                  {it.award && <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300"><TrophyFilled /> {it.award}</span>}
                  {it.blog_count > 0 && <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50">블로그 후기 {it.blog_count}</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button type="button" onClick={() => toggleBoard(it.sool_id)}
                    className={`h-8 px-3 rounded-lg text-sm font-bold border ${board.includes(it.sool_id) ? "bg-amber-500 text-black border-amber-500" : "border-white/20 text-white/70 hover:border-amber-500/60"}`}>
                    {board.includes(it.sool_id) ? <><CheckOutlined /> 메뉴판에 담음</> : <><PlusOutlined /> 메뉴판에 담기</>}
                  </button>
                  {it.purchase_url && (
                    <a href={httpUrl(it.purchase_url)} target="_blank" rel="noreferrer" className="text-amber-400 text-sm font-bold">
                      {CHANNEL_LABEL[it.channel ?? ""] ?? "홈페이지"}에서 보기 →{it.online_buy && <span className="text-green-300 font-normal"> (온라인 주문 가능)</span>}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 지도 + 가까운 양조장 */}
          <div className="flex flex-col gap-4 xl:sticky xl:top-24">
            <RestaurantMap store={store} points={points} onPick={pick} />
            <Box title={store ? "가까운 양조장" : "추천 술이 많은 양조장"}>
              <ul className="flex flex-col divide-y divide-white/5">
                {breweries.slice(0, 12).map((b) => (
                  <li key={b.place_id} className="py-2.5 flex items-center justify-between gap-3">
                    <button className="text-left min-w-0" onClick={() => setFocus(b.matching ? b.place_id : null)}>
                      <div className={`font-bold truncate ${focus === b.place_id ? "text-amber-400" : "text-white"}`}>{b.name}</div>
                      <div className="text-white/40 text-xs">{b.sigungu} · 제품 {b.product_count}{b.visit_brewery && <span className="text-cyan-300"> · 직접 시음</span>}</div>
                    </button>
                    <div className="text-right shrink-0">
                      {b.distance_km != null && <div className="text-amber-300 font-bold text-sm">{b.distance_km}km</div>}
                      <div className="text-white/40 text-xs">추천 {b.matching}종</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Box>
          </div>
        </div>

        {board.length > 0 && (
          <Link href="/owners/menu-board"
            className="fixed z-40 right-4 bottom-20 md:bottom-8 md:right-8 flex items-center gap-2 px-5 h-12 rounded-full bg-amber-500 text-black font-black shadow-2xl shadow-amber-500/20">
            <ProfileOutlined /> 메뉴판 만들기 · {board.length}
          </Link>
        )}

        <Text className="!text-white/25 !text-xs">
          추천은 제품 설명에 나온 어울리는 음식·맛 표현과 정보 충실도·수상·후기·거리로 정합니다. 판매 중단 제품은 제외했습니다.
          주류 거래는 각 양조장·도매처와 직접 확인해 주세요.
        </Text>
      </div>

      <style jsx global>{`
        .dark-select .ant-select-selector { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; border-radius: 12px !important; height: 36px !important; align-items: center !important; }
        .dark-select .ant-select-selection-item { color: white !important; font-weight: 700 !important; }
      `}</style>
    </div>
  );
}
