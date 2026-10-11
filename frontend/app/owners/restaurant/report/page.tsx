"use client";

// 식당 리포트: 우리 가게 메뉴판 → 메뉴 분석 · 메뉴별 추천 · 가게 라인업 · 공급처·우리 동네 술 (POST /explore/restaurant/report)
import { API_BASE } from "@/lib/api";
import { TASTE_LABEL } from "@/lib/soolLabels";
import { loadBoard, saveBoard } from "@/lib/menuBoard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Input, Segmented, Typography, message } from "antd";
import { AimOutlined, EnvironmentOutlined, FileTextOutlined, PrinterOutlined, ProfileOutlined, ShopOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;
const KEY = "sool.restaurantReport.v1";
const SAMPLE = "생삼겹살 200g 16,000원\n항정살 18,000\n양념갈비 19,000\n된장찌개 7,000\n김치찌개 8,000\n물냉면 8,000\n계란찜 5,000\n해물파전 18,000";

type Drink = {
  sool_id: number; name: string; abv: number | null; category: string | null; is_raw: boolean; award: boolean;
  online_buy: boolean; blog_count: number; place_id: string; brewery: string | null; sigungu: string | null;
  visit_brewery: boolean; distance_km: number | null; tastes: string[]; abv_band: string;
};
type Report = {
  store_name: string | null;
  profile: { dishes: number; groups: { name: string; count: number; pct: number }[]; traits: { name: string; count: number; pct: number }[] };
  parsed: number; unrecognized: string[];
  per_dish: { name: string; groups: string[]; traits: string[]; picks: (Drink & { why: string[] })[] }[];
  lineup: (Drink & { covers: string[] })[]; local: Drink[];
  suppliers: { place_id: string; brewery: string | null; sigungu: string | null; distance_km: number | null; visit_brewery: boolean }[];
  raw_count: number; candidates: number;
};
type Store = { lat: number; lng: number; label: string };

const Section = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
  <section className="report-card rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-8">
    <Title level={4} className="!text-white !mb-1">{title}</Title>
    {sub && <Text className="!text-white/40 !text-sm block mb-4">{sub}</Text>}
    <div className={sub ? "" : "mt-4"}>{children}</div>
  </section>
);

function DrinkLine({ d }: { d: Drink }) {
  return (
    <div className="text-xs text-white/45 mt-0.5">
      {d.category} · {d.abv ?? "-"}% · {d.brewery}{d.sigungu ? ` (${d.sigungu})` : ""}
      {d.distance_km != null && <span className="text-amber-300"> · {d.distance_km}km</span>}
    </div>
  );
}

export default function RestaurantReport() {
  const [storeName, setStoreName] = useState("");
  const [menuText, setMenuText] = useState("");
  const [address, setAddress] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [size, setSize] = useState(4);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s) { setStoreName(s.storeName ?? ""); setMenuText(s.menuText ?? ""); setAddress(s.address ?? ""); setStore(s.store ?? null); setSize(s.size ?? 4); }
    } catch { /* 저장소 사용 불가 */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ storeName, menuText, address, store, size })); } catch { /* 무시 */ }
  }, [storeName, menuText, address, store, size]);

  const locate = async () => {
    if (address.trim().length < 2) return;
    setLocating(true);
    try {
      const r = await fetch(`${API_BASE}/explore/restaurant/geocode?q=${encodeURIComponent(address.trim())}`);
      if (!r.ok) { message.warning(r.status === 429 ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." : "주소를 찾지 못했습니다. 도로명 주소나 가게 이름으로 다시 입력해 주세요."); return; }
      setStore(await r.json());
    } finally { setLocating(false); }
  };

  const make = async () => {
    if (menuText.trim().length < 2) { message.warning("메뉴판을 붙여 넣어 주세요"); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/explore/restaurant/report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_text: menuText, store_name: storeName || null, lat: store?.lat, lng: store?.lng, radius_km: 50, lineup_size: size }),
      });
      const d = await r.json();
      if (!r.ok) { message.warning(d.detail ?? "리포트를 만들지 못했습니다"); return; }
      setReport(d);
      setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 50);
    } finally { setLoading(false); }
  };

  const toBoard = () => {
    if (!report) return;
    const cur = loadBoard();
    const add = report.lineup.filter((l) => !cur.some((e) => e.sool_id === l.sool_id)).map((l) => ({ sool_id: l.sool_id }));
    saveBoard([...cur, ...add]);
    message.success(`메뉴판에 ${add.length}개 담았습니다`);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-[#050505] min-h-screen report-root">
      <div className="max-w-[1100px] mx-auto py-6 md:py-14 px-4 md:px-10 flex flex-col gap-6">
        <div className="no-print">
          <Title className="!text-white !text-3xl md:!text-5xl !font-black !m-0">식당 <span className="text-amber-500">리포트</span></Title>
          <Text className="!text-white/50 !text-sm md:!text-lg block mt-2">
            우리 가게 메뉴판을 붙여 넣으면 메뉴를 하나씩 분석해 어울리는 전통주와 가게에 맞는 라인업을 제안합니다.
          </Text>
        </div>

        {/* 입력 */}
        <section className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input size="large" placeholder="가게 이름 (선택)" prefix={<ShopOutlined className="text-amber-500" />} value={storeName}
              onChange={(e) => setStoreName(e.target.value)} className="!bg-white/5 !border-white/10 !text-white" />
            <div className="flex gap-2">
              <Input size="large" placeholder="가게 주소·이름·역 (선택)" prefix={<EnvironmentOutlined className="text-amber-500" />} value={address}
                onChange={(e) => setAddress(e.target.value)} onPressEnter={locate} className="!bg-white/5 !border-white/10 !text-white" />
              <Button size="large" icon={<AimOutlined />} loading={locating} onClick={locate}>확인</Button>
            </div>
          </div>
          {store && <Text className="!text-white/50 !text-sm">★ {store.label} — 50km 안 양조장에서 고릅니다 <button className="text-white/30 ml-2" onClick={() => setStore(null)}>지우기</button></Text>}
          <TextArea rows={8} value={menuText} onChange={(e) => setMenuText(e.target.value)}
            placeholder={"메뉴판을 그대로 붙여 넣으세요. 한 줄에 메뉴 하나 (가격은 있어도 됩니다)\n\n예)\n" + SAMPLE}
            className="!bg-white/5 !border-white/10 !text-white" />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-white/50 text-sm">라인업</span>
            <Segmented value={size} onChange={(v) => setSize(Number(v))} options={[3, 4, 5].map((n) => ({ label: `${n}병`, value: n }))} />
            <button className="text-white/40 text-sm" onClick={() => setMenuText(SAMPLE)}>예시 넣기</button>
            <Button type="primary" size="large" icon={<FileTextOutlined />} loading={loading} onClick={make}
              className="!bg-amber-500 !text-black !border-none !font-black ml-auto">리포트 만들기</Button>
          </div>
          <Text className="!text-white/30 !text-xs">메뉴판과 주소는 이 브라우저에만 저장됩니다. 리포트를 만들 때만 서버로 보내고 저장하지 않습니다.</Text>
        </section>

        {report && (
          <div id="report" className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Text className="!text-amber-500 !text-sm !font-bold">전통주 도입 리포트 · {today}</Text>
                <Title className="!text-white !text-3xl md:!text-4xl !font-black !mt-1 !mb-0">{report.store_name || "우리 가게"}</Title>
              </div>
              <div className="no-print flex gap-2">
                <Button icon={<ProfileOutlined />} onClick={toBoard}>라인업 메뉴판에 담기</Button>
                <Button icon={<PrinterOutlined />} onClick={() => window.print()}>인쇄 / PDF</Button>
              </div>
            </div>

            <Section title="메뉴 분석" sub={`메뉴 ${report.parsed}개 중 ${report.profile.dishes}개를 분석했습니다.`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-white/40 text-xs font-bold">음식 종류</span>
                  {report.profile.groups.map((g) => (
                    <div key={g.name} className="grid grid-cols-[90px_1fr_40px] items-center gap-2 text-sm">
                      <span className="text-white/70">{g.name}</span>
                      <div className="h-4 rounded bg-white/5 overflow-hidden"><div className="h-full bg-purple-400/60" style={{ width: `${g.pct}%` }} /></div>
                      <span className="text-white/40 text-xs text-right">{g.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-white/40 text-xs font-bold">맛 특성</span>
                  <div className="flex flex-wrap gap-2">
                    {report.profile.traits.map((t) => <span key={t.name} className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 text-sm font-bold">{t.name} {t.pct}%</span>)}
                  </div>
                  {report.unrecognized.length > 0 && <Text className="!text-white/30 !text-xs mt-2">분류하지 못한 메뉴: {report.unrecognized.join(", ")}</Text>}
                </div>
              </div>
            </Section>

            <Section title={`추천 라인업 ${report.lineup.length}병`} sub="메뉴를 가장 넓게 덮으면서 주종·도수가 겹치지 않게 골랐습니다.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.lineup.map((l, i) => (
                  <div key={l.sool_id} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/sool/${l.sool_id}`} className="text-white text-lg font-black hover:text-amber-400"><span className="text-white/30 mr-1">{i + 1}</span>{l.name}</Link>
                      <span className="text-amber-300 text-xs font-bold whitespace-nowrap">{l.abv_band}</span>
                    </div>
                    <DrinkLine d={l} />
                    {l.covers.length > 0 && <div className="text-sm text-white/70 mt-2">🍽 {l.covers.join(", ")}</div>}
                    <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                      {l.tastes.map((t) => <span key={t} className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300">{TASTE_LABEL[t] ?? t}</span>)}
                      {l.is_raw && <span className="px-2 py-0.5 rounded-md bg-green-500/15 text-green-300">생</span>}
                      {l.online_buy && <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300">온라인 주문</span>}
                      {l.visit_brewery && <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300">직접 시음</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="메뉴별 어울리는 술" sub="추천 이유는 제품 설명의 음식 언급과 메뉴 맛 특성(기름짐·매움 등)에 맞는 술의 맛 표현입니다.">
              <div className="flex flex-col divide-y divide-white/5">
                {report.per_dish.map((d) => (
                  <div key={d.name} className="py-3 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-2">
                    <div>
                      <div className="text-white font-bold">{d.name}</div>
                      <div className="text-white/35 text-xs">{[...d.groups, ...d.traits].join(" · ")}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {d.picks.length === 0 ? <span className="text-white/30 text-sm">맞는 술을 찾지 못함</span> : d.picks.map((p) => (
                        <div key={p.sool_id}>
                          <Link href={`/sool/${p.sool_id}`} className="text-white/90 font-bold hover:text-amber-400">{p.name}</Link>
                          <DrinkLine d={p} />
                          {p.why.length > 0 && <div className="text-white/50 text-xs mt-0.5">{p.why.join(" / ")}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {store && (
              <Section title="가까운 공급처 · 우리 동네 술" sub={`30km 안 생(비살균) 제품 ${report.raw_count}개 — 생막걸리는 냉장 유통이라 가까운 양조장이 유리합니다.`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ul className="flex flex-col divide-y divide-white/5">
                    {report.suppliers.map((s) => (
                      <li key={s.place_id} className="py-2 flex justify-between gap-2 text-sm">
                        <span className="text-white/80">{s.brewery}<span className="text-white/35"> · {s.sigungu}</span>{s.visit_brewery && <span className="text-cyan-300"> · 직접 시음</span>}</span>
                        <span className="text-amber-300 font-bold whitespace-nowrap">{s.distance_km}km</span>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <span className="text-white/40 text-xs font-bold">우리 동네 술 — 메뉴판 이야깃거리</span>
                    {report.local.length === 0 ? <div className="text-white/30 text-sm mt-2">같은 동네 양조장 제품이 없습니다</div> : (
                      <ul className="mt-2 flex flex-col gap-2">
                        {report.local.map((l) => (
                          <li key={l.sool_id}><Link href={`/sool/${l.sool_id}`} className="text-white/90 font-bold hover:text-amber-400">{l.name}</Link><DrinkLine d={l} /></li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Section>
            )}

            <Text className="!text-white/30 !text-xs leading-relaxed">
              자료: aT 전통주정보(더술닷컴) 제품 설명·원료, 카카오 지도. 가격·마진 정보는 없습니다. 판매 중단 제품은 제외했습니다.
              주류 구매는 각 양조장·도매처와 직접 확인해 주세요.
            </Text>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          header, .ant-layout-sider, .app-tabbar, .no-print { display: none !important; }
          html, body, .ant-layout, .report-root { background: #fff !important; }
          .report-root * { color: #111 !important; border-color: #ddd !important; }
          .report-card { background: #fff !important; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
