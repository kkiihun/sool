"use client";

// 양조장 진단 리포트 (B1): /explore/breweries/{place_id}/report
import { API_BASE } from "@/lib/api";
import { CHANNEL_LABEL, LINK_STATE, httpUrl } from "@/lib/soolLabels";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button, Empty, Spin, Tag, Tooltip, Typography } from "antd";
import { ArrowLeftOutlined, CheckCircleFilled, EnvironmentOutlined, PrinterOutlined, WarningFilled, InfoCircleFilled } from "@ant-design/icons";

const { Title, Text } = Typography;

type Product = {
  sool_id: number; name: string; abv: number | null; category: string | null; card_score: number | null;
  card_missing: string[]; on_sale: boolean | null; pairings: string[]; award_count: number;
  channel: string | null; link_state: string | null; online_buy: boolean; url: string | null;
  blog_count: number; blog_latest: string | null; peer_count: number; blog_pct: number | null;
};
type Issue = { level: "high" | "mid" | "low" | "ok"; title: string; detail: string; count: number | null };
type Report = {
  place: { name: string | null; address: string | null; homepage: string | null; sido: string | null; sigungu: string | null;
    visit_brewery: boolean; food_master: boolean; intangible_heritage: boolean; product_count: number; geo_method: string };
  summary: { products: number; avg_card_score: number; full_cards: number; online_buy: number; with_blogs: number;
    blog_total: number; dead_links: number; not_on_sale: number };
  ranks: { sido: string | null; peer_breweries: number; blog_pct: number | null; score_pct: number | null };
  issues: Issue[]; strengths: string[]; products: Product[];
  pairing: { group: string; mine: number; region_pct: number }[]; run_date: string;
};

const ITEMS: [string, string][] = [
  ["category", "주종"], ["ingredient", "원료"], ["taste", "맛"], ["pairing", "페어링"],
  ["description", "소개"], ["location", "위치"], ["purchase", "구매"],
];
const LEVEL = {
  high: { color: "#f87171", label: "바로 고치세요", icon: <WarningFilled /> },
  mid: { color: "#fbbf24", label: "개선하면 좋아요", icon: <InfoCircleFilled /> },
  low: { color: "#94a3b8", label: "참고", icon: <InfoCircleFilled /> },
  ok: { color: "#4ade80", label: "좋아요", icon: <CheckCircleFilled /> },
};

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] report-card">
      <div className="text-white/40 text-xs font-bold mb-1">{label}</div>
      <div className="text-white text-2xl font-black">{value}</div>
      {sub && <div className="text-white/40 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function BreweryReport({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = use(params);
  const [r, setR] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/explore/breweries/${placeId}/report`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setR)
      .finally(() => setLoading(false));
  }, [placeId]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Spin size="large" /></div>;
  if (!r) return <div className="min-h-screen bg-[#050505] py-32"><Empty description={<span className="text-white/40">양조장 정보를 찾을 수 없습니다</span>} /></div>;

  const { place, summary: s, ranks } = r;
  const maxPair = Math.max(1, ...r.pairing.map((p) => p.mine));

  return (
    <div className="bg-[#050505] min-h-screen report-root">
      <div className="max-w-[1200px] mx-auto py-10 md:py-14 px-4 md:px-10 flex flex-col gap-8">
        {/* 머리 */}
        <div className="flex items-center justify-between no-print">
          <Link href="/owners/brewery" className="text-white/50 hover:text-white text-sm"><ArrowLeftOutlined /> 양조장 목록</Link>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>인쇄 / PDF</Button>
        </div>
        <div>
          <Text className="!text-amber-500 !text-sm !font-bold">양조장 진단 리포트 · 기준일 {r.run_date}</Text>
          <Title className="!text-white !text-4xl md:!text-5xl !font-black !mt-2 !mb-3">{place.name}</Title>
          <div className="flex flex-wrap items-center gap-2 text-white/60">
            <EnvironmentOutlined className="text-amber-500" />{place.address ?? "주소 없음"}
            {place.visit_brewery && <Tag color="cyan">찾아가는 양조장</Tag>}
            {place.food_master && <Tag color="purple">식품명인</Tag>}
            {place.intangible_heritage && <Tag color="purple">무형문화재</Tag>}
            {place.homepage && <a className="text-amber-500 text-sm" href={httpUrl(place.homepage)} target="_blank" rel="noreferrer">홈페이지</a>}
          </div>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile label="제품" value={`${s.products}종`} sub={s.not_on_sale ? `판매 중단 표시 ${s.not_on_sale}` : "모두 판매 중"} />
          <Tile label="평균 정보 충실도" value={<>{s.avg_card_score.toFixed(1)}<span className="text-base text-white/40"> / 7</span></>}
            sub={ranks.score_pct ? `${ranks.sido} ${ranks.peer_breweries}곳 중 상위 ${ranks.score_pct}%` : undefined} />
          <Tile label="블로그 후기" value={`${s.blog_total}개`}
            sub={s.blog_total ? `${ranks.sido} 상위 ${ranks.blog_pct}% · 후기 있는 제품 ${s.with_blogs}` : "찾은 후기 없음"} />
          <Tile label="온라인 구매" value={`${s.online_buy} / ${s.products}`} sub={s.dead_links ? `열리지 않는 링크 ${s.dead_links}` : "죽은 링크 없음"} />
        </div>

        {r.strengths.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {r.strengths.map((x) => <span key={x} className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-300 text-sm font-bold"><CheckCircleFilled /> {x}</span>)}
          </div>
        )}

        {/* 개선할 점 */}
        <section className="report-card rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <Title level={4} className="!text-white !mb-5">개선할 점</Title>
          <ol className="flex flex-col gap-4">
            {r.issues.map((i, n) => (
              <li key={n} className="flex gap-4">
                <span className="text-lg mt-0.5" style={{ color: LEVEL[i.level].color }}>{LEVEL[i.level].icon}</span>
                <div>
                  <div className="text-white font-bold">
                    {i.title}{i.count != null && <span className="text-white/40 font-normal"> · {i.count}개 제품</span>}
                    <span className="ml-2 text-[11px] font-bold" style={{ color: LEVEL[i.level].color }}>{LEVEL[i.level].label}</span>
                  </div>
                  <div className="text-white/50 text-sm mt-0.5">{i.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 제품별 진단 */}
        <section className="report-card rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <Title level={4} className="!text-white !mb-1">제품별 진단</Title>
          <Text className="!text-white/40 !text-sm block mb-5">정보가 부족한 제품부터. 칸이 비어 있으면 그 정보가 공개 자료에 없다는 뜻입니다.</Text>
          <div className="flex flex-col divide-y divide-white/5">
            {r.products.map((p) => {
              const st = LINK_STATE[p.link_state ?? ""];
              return (
                <div key={p.sool_id} className="py-4 grid grid-cols-1 md:grid-cols-[1.4fr_1.2fr_1fr_0.9fr] gap-3 items-center">
                  <div className="min-w-0">
                    <Link href={`/sool/${p.sool_id}`} className="text-white font-bold hover:text-amber-400">{p.name}</Link>
                    <div className="text-white/40 text-xs mt-0.5">
                      {p.category ?? "주종 미확인"} · {p.abv ?? "-"}%{p.award_count ? ` · 수상 ${p.award_count}` : ""}
                      {p.on_sale === false && <span className="text-red-300"> · 판매 중단 표시</span>}
                    </div>
                  </div>
                  <div>
                    <div className="flex gap-1">
                      {ITEMS.map(([k, label]) => {
                        const ok = !p.card_missing.includes(k);
                        return (
                          <Tooltip key={k} title={`${label} ${ok ? "있음" : "없음"}`}>
                            <span className={`w-7 h-7 rounded-md text-[10px] font-bold flex items-center justify-center ${ok ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-white/25 line-through"}`}>{label.slice(0, 2)}</span>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-sm">
                    {p.url ? (
                      <>
                        <a href={httpUrl(p.url)} target="_blank" rel="noreferrer" className="text-white/70 hover:text-amber-400">{CHANNEL_LABEL[p.channel ?? ""] ?? "홈페이지"}</a>
                        {st && <Tag color={st.color} className="ml-2">{st.label}</Tag>}
                      </>
                    ) : <span className="text-white/30">구매 링크 없음</span>}
                  </div>
                  <div className="text-sm text-white/60">
                    {p.blog_count ? (
                      <>후기 {p.blog_count}{p.blog_latest && <span className="text-white/30"> · 최근 {p.blog_latest}</span>}
                        {p.blog_pct != null && p.peer_count > 1 && <div className="text-white/30 text-xs">{ranks.sido} {p.category} {p.peer_count}종 중 상위 {p.blog_pct}%</div>}</>
                    ) : <span className="text-white/30">후기 없음</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 페어링 포지션 */}
        {r.pairing.length > 0 && (
          <section className="report-card rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <Title level={4} className="!text-white !mb-1">어울리는 음식 포지션</Title>
            <Text className="!text-white/40 !text-sm block mb-5">내 제품 수 (막대) vs {ranks.sido} 전체 제품 중 해당 음식이 언급된 비율. 식당 사장님이 메뉴로 술을 찾을 때 쓰는 기준입니다.</Text>
            <div className="flex flex-col gap-2">
              {r.pairing.map((p) => (
                <div key={p.group} className="grid grid-cols-[100px_1fr_150px] items-center gap-3 text-sm">
                  <span className="text-white/70">{p.group}</span>
                  <div className="h-5 rounded bg-white/5 overflow-hidden">
                    <div className="h-full bg-purple-400/60" style={{ width: `${(100 * p.mine) / maxPair}%` }} />
                  </div>
                  <span className="text-white/40 text-xs text-right">내 제품 {p.mine} · 지역 {p.region_pct}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-white/30 text-xs leading-relaxed">
          자료: aT 전통주정보(더술닷컴) · 카카오 지도·블로그 검색 · 홈페이지 접속 검사(주 1회). 맛·페어링은 제품 설명 문구에서 자동 추출했습니다.
          정보가 실제와 다르면 더술닷컴 정보 수정 요청 또는 운영자에게 알려 주세요.
        </div>
      </div>

      <style jsx global>{`
        @media print {
          header, .ant-layout-sider, .no-print { display: none !important; }
          body, .report-root { background: #fff !important; }
          .report-root * { color: #111 !important; border-color: #ddd !important; }
          .report-card { background: #fff !important; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
