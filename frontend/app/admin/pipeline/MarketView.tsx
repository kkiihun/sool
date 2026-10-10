"use client";

// 시장 구조 (P6): 파이프라인이 계산한 analytics_market 지표를 표·막대로 표시
import { API_BASE } from "@/lib/api";

import { useEffect, useState } from "react";
import { Card, Col, Empty, Row, Spin, Tag, Tooltip, Typography } from "antd";

const { Text } = Typography;

type Rate = { key: string; n: number; rate: number | null };
type Market = Record<string, any> & { run_date?: string };

const pct = (v?: number | null, d = 0) => (v == null ? "-" : `${(v * 100).toFixed(d)}%`);
const TASTE_LABEL: Record<string, string> = {
  sweetness: "단맛", acidity: "산미", body: "바디", carbonation: "탄산", smoothness: "부드러움",
  aroma: "향", nutty: "고소함", bitterness: "쌉쌀함", clean: "깔끔함",
};

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card className="bg-white/5 border-white/10 rounded-3xl h-full" title={<span className="text-white">{title}</span>}>
      {desc && <div className="text-white/40 text-xs mb-3">{desc}</div>}
      {children}
    </Card>
  );
}

function RateBars({ rows, max = 1, color = "#f59e0b" }: { rows: Rate[]; max?: number; color?: string }) {
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2 text-sm">
          <span className="w-28 shrink-0 text-white/70 truncate">{r.key}</span>
          <div className="flex-1 h-4 bg-white/5 rounded">
            <div className="h-4 rounded" style={{ width: `${Math.min(((r.rate ?? 0) / max) * 100, 100)}%`, background: color }} />
          </div>
          <span className="w-14 text-right text-white/80">{pct(r.rate)}</span>
          <span className="w-12 text-right text-white/30 text-xs">{r.n}</span>
        </div>
      ))}
    </div>
  );
}

// 입지계수 색: 1 이하는 투명, 1.5↑ 진하게
const lqBg = (lq?: number | null) => (lq == null || lq <= 1 ? "transparent" : `rgba(245,158,11,${Math.min((lq - 1) / 2, 0.85)})`);

export default function MarketView() {
  const [m, setM] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/pipeline/market`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null)).then(setM).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-16 text-center"><Spin /></div>;
  if (!m?.region_specialization) {
    return <Card className="bg-white/5 border-white/10 rounded-3xl"><Empty description={<span className="text-white/50">시장 지표가 없습니다. 파이프라인 실행 후 다시 보세요.</span>} /></Card>;
  }

  const rs = m.region_specialization, bs = m.brewery_structure, pa = m.purchase_access, sw = m.sweetener_segments, abv = m.abv_profile;
  const cell = (s: string, c: string) => rs.cells.find((x: any) => x.sido === s && x.category === c);

  return (
    <div className="space-y-4">
      <Text className="text-white/30 text-xs">기준일 {m.run_date} · 주종은 규칙 제안값 포함(검증 전)</Text>

      <Row gutter={[16, 16]}>
        {[
          { t: "양조장", v: bs.breweries, s: `제품 ${bs.products}` },
          { t: "상위 10곳 점유율", v: pct(bs.top10_share), s: `HHI ${bs.hhi} · 매우 분산` },
          { t: "지니계수 (제품 수)", v: bs.gini, s: `1종만 만드는 곳 ${bs.distribution["1종"]}` },
          { t: "온라인 구매 가능", v: pct(pa.overall), s: "링크 살아 있는 스마트스토어·판매몰" },
          { t: "숨은 명주", v: m.hidden_gems.length, s: "수상·명인인데 온라인 경로 없음" },
          { t: "도수 이상치", v: abv.outlier_count, s: "분류·데이터 확인 후보" },
        ].map((c) => (
          <Col xs={12} md={8} xl={4} key={c.t}>
            <Card className="bg-white/5 border-white/10 rounded-2xl h-full" styles={{ body: { padding: 18 } }}>
              <div className="text-white/30 text-[11px] font-bold tracking-widest mb-1">{c.t}</div>
              <div className="text-2xl font-black text-white">{c.v}</div>
              <div className="text-white/30 text-xs mt-1">{c.s}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Section title="① 지역별 주종 특화 (입지계수)" desc="LQ = 지역 내 주종 비중 ÷ 전국 비중. 1.5 이상이면 그 지역의 특화 주종. 제품 20개 이상 지역만.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-white/40">
                  <th className="text-left p-1.5">지역</th>
                  {rs.categories.map((c: string) => <th key={c} className="p-1.5">{c}<div className="text-[10px] text-white/25">전국 {pct(rs.national_share[c])}</div></th>)}
                </tr></thead>
                <tbody>
                  {rs.regions.map((s: string) => (
                    <tr key={s} className="border-t border-white/5">
                      <td className="p-1.5 text-white/80">{s}</td>
                      {rs.categories.map((c: string) => {
                        const x = cell(s, c);
                        return (
                          <Tooltip key={c} title={x ? `${s} ${c}: ${x.n}개 · 지역 내 ${pct(x.share)} · LQ ${x.lq}` : ""}>
                            <td className="p-1.5 text-center text-white/80" style={{ background: lqBg(x?.lq) }}>{x?.n ? x.n : ""}</td>
                          </Tooltip>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </Col>
        <Col xs={24} xl={9}>
          <Section title="특화 상위" desc="제품 5개 이상 칸 중 LQ 순">
            <div className="space-y-1.5">
              {rs.top_specialized.map((x: any) => (
                <div key={`${x.sido}${x.category}`} className="flex justify-between text-sm">
                  <span className="text-white/80">{x.sido} · {x.category}</span>
                  <span><Tag color="gold">LQ {x.lq}</Tag><span className="text-white/40">{x.n}개 · {pct(x.share)}</span></span>
                </div>
              ))}
            </div>
          </Section>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Section title="② 특산 원료와 지역" desc="원료를 쓰는 제품 중 가장 많은 지역의 비중 (집중도)">
            <div className="space-y-1.5">
              {m.ingredient_regions.map((x: any) => (
                <Tooltip key={x.ingredient} title={Object.entries(x.regions).map(([k, v]) => `${k} ${v}`).join(" · ")}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-16 text-white/80">{x.ingredient}</span>
                    <span className="w-10 text-right text-white/40 text-xs">{x.n}</span>
                    <div className="flex-1 h-4 bg-white/5 rounded"><div className="h-4 rounded bg-emerald-500/70" style={{ width: `${x.concentration * 100}%` }} /></div>
                    <span className="w-28 text-right text-white/70">{x.top_sido} {pct(x.concentration)}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </Section>
        </Col>
        <Col xs={24} xl={12}>
          <Section title="③ 감미료 사용률" desc="원료 표기에 아스파탐·수크랄로스 등. 주종 / 양조장 규모(장소당 제품 수) / 인증 / 수상">
            <RateBars rows={sw.by_category} max={0.4} color="#ef4444" />
            <div className="h-3" />
            <RateBars rows={sw.by_brewery_size} max={0.4} color="#f87171" />
            <div className="h-3" />
            <RateBars rows={[...sw.by_visit_brewery, ...sw.by_awarded]} max={0.4} color="#fca5a5" />
          </Section>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Section title="④ 온라인 구매 접근성" desc="링크가 살아 있는 스마트스토어·판매몰이 있는 제품 비율">
            <div className="text-white/50 text-xs mb-1">양조장 규모별</div>
            <RateBars rows={pa.by_brewery_size} max={0.5} color="#22c55e" />
            <div className="text-white/50 text-xs mt-3 mb-1">주종별</div>
            <RateBars rows={pa.by_category} max={0.5} color="#4ade80" />
            <div className="text-white/50 text-xs mt-3 mb-1">시도별 (제품 10개 이상)</div>
            <RateBars rows={pa.by_sido} max={0.5} color="#86efac" />
          </Section>
        </Col>
        <Col xs={24} xl={12}>
          <Section title="⑤ 양조장 구조" desc="장소(양조장) 단위. 제품 수 분포와 상위 양조장">
            <RateBars rows={Object.entries(bs.distribution).map(([k, v]) => ({ key: k, n: v as number, rate: (v as number) / bs.breweries }))} max={0.5} color="#60a5fa" />
            <div className="text-white/40 text-xs mt-2">두 주종 이상 만드는 양조장 {pct(bs.multi_category_rate)}</div>
            <div className="mt-3 space-y-1">
              {bs.top.map((t: any, i: number) => (
                <div key={i} className="flex justify-between text-sm"><span className="text-white/80">{i + 1}. {t.name}</span><span className="text-white/40">{t.products}종 · 주종 {t.categories}</span></div>
              ))}
            </div>
          </Section>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Section title="⑥ 주종별 맛 표현" desc="맛 설명이 있는 제품 중 그 맛을 강조한 비율 (텍스트 추출)">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-white/40"><th className="text-left p-1.5">주종</th>
                  {Object.keys(TASTE_LABEL).map((a) => <th key={a} className="p-1.5">{TASTE_LABEL[a]}</th>)}</tr></thead>
                <tbody>
                  {m.taste_by_category.filter((r: any) => r.with_text >= 10).map((r: any) => (
                    <tr key={r.category} className="border-t border-white/5">
                      <td className="p-1.5 text-white/80">{r.category}<span className="text-white/30 text-xs"> {r.with_text}</span></td>
                      {Object.keys(TASTE_LABEL).map((a) => (
                        <td key={a} className="p-1.5 text-center text-white/80" style={{ background: r[a] == null ? "transparent" : `rgba(244,114,182,${Math.min(r[a] * 1.6, 0.85)})` }}>{pct(r[a])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </Col>
        <Col xs={24} xl={12}>
          <Section title="⑦ 주종별 도수" desc="사분위(Q1·중앙·Q3). 이상치 = 주종 기준 IQR 밖 → 분류 오류 또는 데이터 확인 후보">
            <table className="w-full text-sm mb-3">
              <thead><tr className="text-white/40"><th className="text-left p-1">주종</th><th>n</th><th>최소</th><th>Q1</th><th>중앙</th><th>Q3</th><th>최대</th></tr></thead>
              <tbody>{abv.by_category.map((r: any) => (
                <tr key={r.category} className="border-t border-white/5 text-center text-white/80">
                  <td className="text-left p-1">{r.category}</td><td>{r.n}</td><td>{r.min}</td><td>{r.q1}</td><td className="text-amber-500 font-bold">{r.median}</td><td>{r.q3}</td><td>{r.max}</td>
                </tr>))}</tbody>
            </table>
            <div className="text-white/40 text-xs mb-1">이상치 예시 ({abv.outlier_count}건 중 {abv.outliers.length})</div>
            <div className="flex flex-wrap gap-1">
              {abv.outliers.map((o: any) => <Tag key={o.sool_id}>{o.name} · {o.category} {o.abv}%</Tag>)}
            </div>
          </Section>
        </Col>
      </Row>

      <Section title="⑧ 숨은 명주" desc="수상·식품명인·무형문화재 신호가 있는데 온라인 구매 경로가 없는 제품 — 큐레이션·콘텐츠 후보">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-2">
          {m.hidden_gems.map((g: any) => (
            <a key={g.sool_id} href={`/sool/${g.sool_id}`} className="block p-3 rounded-xl bg-white/5 hover:bg-white/10">
              <div className="text-white font-bold">{g.name}</div>
              <div className="text-white/40 text-xs">{g.producer} · {g.sido ?? "-"} · {g.category ?? "미분류"}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {g.award_count > 0 && <Tag color="gold">수상 {g.award_count}</Tag>}
                {g.food_master && <Tag color="purple">명인</Tag>}
                {g.visit_brewery && <Tag color="cyan">찾아가는 양조장</Tag>}
              </div>
            </a>
          ))}
        </div>
      </Section>
    </div>
  );
}
