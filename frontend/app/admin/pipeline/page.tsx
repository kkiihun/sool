"use client";

// 데이터 파이프라인 결과 (관리자 전용): 최근 실행 상태 · 술 카드 요약 · 제품별 술 카드
import { API_BASE } from "@/lib/api";
import { CHANNEL_LABEL, LINK_STATE, TASTE_LABEL } from "@/lib/soolLabels";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Col, Descriptions, Empty, Input, Row, Select, Spin, Table, Tabs, Tag, Tooltip, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { useAuth } from "../../components/AuthProvider";
import CategoryReview from "./CategoryReview";
import PlaceMap from "@/components/PlaceMap";
import MarketView from "./MarketView";

const { Title, Text } = Typography;

type StepState = { state: string; out?: number; sec?: number; message?: string };
type Status = {
  ok: boolean; run_id: string; last_run: string; duration_sec: number;
  steps: Record<string, StepState>; quality: Record<string, any>; metrics: Record<string, any>; warnings: string[];
};
type CategoryRow = {
  category: string | null; n: number; visit_pct: number; award_pct: number;
  sweetener_pct: number; raw_pct: number; sparkling_pct: number; avg_confidence: number;
};
type Summary = {
  total: number; by_category: CategoryRow[]; pairings: [string, number][];
  taste: Record<string, { high: number; low: number; mixed: number }>; special_ingredients: [string, number][];
  purchase_channels: { channel: string; n: number; alive: number; dead: number }[];
};
type Profile = Record<string, any>;

const STEP_LABEL: Record<string, string> = { collect: "수집", clean: "정제", analyze: "분석", publish: "발행", feedback: "피드백" };
const FLAG_OPTIONS = [
  { value: "online_buy", label: "온라인 구매 가능" },
  { value: "visit_brewery", label: "찾아가는 양조장" }, { value: "food_master", label: "식품명인" },
  { value: "intangible_heritage", label: "무형문화재" }, { value: "has_sweetener", label: "감미료 사용" },
  { value: "is_raw", label: "생(비살균)" }, { value: "is_sparkling", label: "탄산" },
  { value: "has_spirit_added", label: "주정 첨가" },
];
const CARD_ITEM_LABEL: Record<string, string> = {
  category: "주종", ingredient: "원료", taste: "맛", pairing: "페어링", description: "설명", location: "지도 위치", purchase: "구매 링크",
};
const CATEGORIES = ["탁주", "약주", "청주", "과실주", "증류주", "리큐르", "기타주류"];

const stateColor = (s?: string) => (s === "ok" ? "green" : s === "warn" ? "gold" : s === "error" ? "red" : "default");
const confColor = (c?: number | null) => (c == null ? "default" : c >= 0.85 ? "green" : c >= 0.7 ? "gold" : "orange");

function TasteTags({ taste }: { taste?: Record<string, number | null> }) {
  const items = Object.entries(taste || {}).filter(([, v]) => v !== null && v !== undefined);
  if (!items.length) return <Text className="text-white/20">-</Text>;
  return (
    <span className="flex flex-wrap gap-1">
      {items.map(([k, v]) => (
        <Tag key={k} color={v! > 0 ? "volcano" : v! < 0 ? "blue" : "default"}>
          {TASTE_LABEL[k] ?? k} {v! > 0 ? "↑" : v! < 0 ? "↓" : "±"}
        </Tag>
      ))}
    </span>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<Status | null>(null);
  const [history, setHistory] = useState<{ run_id: string; ok: boolean; duration_sec: number }[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ category?: string; flag?: string; q?: string; unclassified?: boolean; maxConf?: number }>({});
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) router.push("/");
  }, [authLoading, user, router]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, sm] = await Promise.all([
        fetch(`${API_BASE}/admin/pipeline/status`, { cache: "no-store" }),
        fetch(`${API_BASE}/admin/pipeline/summary`, { cache: "no-store" }),
      ]);
      if (!st.ok || !sm.ok) throw new Error(`조회 실패 (HTTP ${st.status}/${sm.status})`);
      const stJson = await st.json();
      setStatus(stJson.latest);
      setHistory(stJson.history || []);
      setSummary(await sm.json());
    } catch (e: any) {
      setError(e?.message ?? "조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    setTableLoading(true);
    const p = new URLSearchParams({ page: String(page), size: "20" });
    if (filters.category) p.set("category", filters.category);
    if (filters.flag) p.set("flag", filters.flag);
    if (filters.q) p.set("q", filters.q);
    if (filters.unclassified) p.set("unclassified", "true");
    if (filters.maxConf !== undefined) p.set("max_confidence", String(filters.maxConf));
    try {
      const res = await fetch(`${API_BASE}/admin/pipeline/profiles?${p}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setProfiles(json.items);
        setTotal(json.total);
      }
    } finally {
      setTableLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { if (user?.is_admin) fetchOverview(); }, [user, fetchOverview]);
  useEffect(() => { if (user?.is_admin) fetchProfiles(); }, [user, fetchProfiles]);

  const setFilter = (patch: Partial<typeof filters>) => { setPage(1); setFilters((f) => ({ ...f, ...patch })); };

  if (authLoading || !user?.is_admin) return <div className="p-20 text-center"><Spin /></div>;

  const q = status?.quality || {};
  const prof = status?.metrics?.profile_summary || {};

  const columns = [
    { title: "ID", dataIndex: "sool_id", width: 70, render: (v: number) => <span className="text-white/30 font-mono">#{v}</span> },
    {
      title: "제품", dataIndex: "name", render: (v: string, r: Profile) => (
        <div>
          <div className="text-white font-bold">{v}</div>
          <div className="text-white/30 text-xs">{r.producer || "-"} · {r.region || "-"} · {r.abv}%</div>
        </div>
      ),
    },
    {
      title: "주종", dataIndex: "category", width: 130, render: (v: string | null, r: Profile) => v ? (
        <Tooltip title={`${r.category_source === "current" ? "기존 값" : `규칙 ${r.category_rule}`} · 신뢰도 ${r.category_confidence}`}>
          <Tag color={confColor(r.category_confidence)}>{v}{r.category_source === "rule" ? " *" : ""}</Tag>
        </Tooltip>
      ) : <Tag>미분류</Tag>,
    },
    {
      title: "특징", width: 260, render: (_: any, r: Profile) => (
        <span className="flex flex-wrap gap-1">
          {r.visit_brewery && <Tag color="cyan">찾아가는 양조장</Tag>}
          {r.food_master && <Tag color="purple">명인</Tag>}
          {r.intangible_heritage && <Tag color="purple">무형문화재</Tag>}
          {r.best_award && <Tag color="gold">{r.best_award}</Tag>}
          {r.is_raw && <Tag>생</Tag>}
          {r.is_sparkling && <Tag>탄산</Tag>}
          {r.has_sweetener && <Tag color="red">감미료</Tag>}
          {r.online_buy && !["dead", "error", "ended"].includes(r.link_state) && <Tag color="green">온라인 구매</Tag>}
        </span>
      ),
    },
    { title: "맛 (텍스트)", dataIndex: "taste", render: (v: any) => <TasteTags taste={v} /> },
    {
      title: "페어링", dataIndex: "pairings", width: 200,
      render: (v: string[]) => v?.length ? <span className="flex flex-wrap gap-1">{v.map((p) => <Tag key={p}>{p}</Tag>)}</span> : <Text className="text-white/20">-</Text>,
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <Title className="!text-white !m-0 !text-4xl font-black">
            Data <span className="text-amber-500">Pipeline</span>
          </Title>
          <Text className="text-white/40">수집 → 정제 → 분석 → 발행 결과. 매일 03:30 자동 실행.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchOverview(); fetchProfiles(); }}
          className="bg-white/5 border-white/10 text-white/60 hover:text-white font-bold h-11 px-5 rounded-xl">
          새로고침
        </Button>
      </div>

      <Tabs className="pipeline-tabs" items={[
        { key: "overview", label: "개요", children: (<>
      {loading ? <div className="p-20 text-center"><Spin /></div> : error ? (
        <Card className="bg-white/5 border-white/10 rounded-3xl"><Text className="text-red-400">{error}</Text></Card>
      ) : !status ? (
        <Card className="bg-white/5 border-white/10 rounded-3xl"><Empty description={<span className="text-white/40">실행 기록이 없습니다</span>} /></Card>
      ) : (
        <>
          {/* 1. 최근 실행 */}
          <Card className="bg-white/5 border-white/10 rounded-3xl mb-6" styles={{ body: { padding: 28 } }}>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {status.ok
                ? <Tag icon={<CheckCircleOutlined />} color="green" className="text-sm px-3 py-1">정상</Tag>
                : <Tag icon={<CloseCircleOutlined />} color="red" className="text-sm px-3 py-1">실패</Tag>}
              <Text className="text-white/70">마지막 실행 {new Date(status.last_run).toLocaleString("ko-KR")}</Text>
              <Text className="text-white/30">{status.duration_sec}초</Text>
              <span className="flex gap-1 ml-auto">
                {history.slice(0, 10).reverse().map((h) => (
                  <Tooltip key={h.run_id} title={`${new Date(h.run_id).toLocaleString("ko-KR")} · ${h.duration_sec}초`}>
                    <span className={`inline-block w-2.5 h-6 rounded ${h.ok ? "bg-green-500/70" : "bg-red-500/70"}`} />
                  </Tooltip>
                ))}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(status.steps).map(([k, s]) => (
                <Tooltip key={k} title={s.message}>
                  <Tag color={stateColor(s.state)} className="px-3 py-1">
                    {STEP_LABEL[k] ?? k} · {s.state}{s.out !== undefined ? ` · ${s.out.toLocaleString()}` : ""}{s.sec !== undefined ? ` · ${s.sec}s` : ""}
                  </Tag>
                </Tooltip>
              ))}
            </div>
            {status.warnings?.length > 0 && (
              <div className="mt-3 text-amber-400 text-sm"><WarningOutlined /> {status.warnings.join(" / ")}</div>
            )}
          </Card>

          {/* 1-1. 술 카드 충실도 (U1): 핵심 7항목 중 채워진 수 */}
          {status.metrics?.card_completeness && (() => {
            const cc = status.metrics.card_completeness as {
              max: number; full: number; full_pct: number; ge6_pct: number; avg: number;
              distribution: Record<string, number>; missing: Record<string, number>;
            };
            const total = Object.values(cc.distribution).reduce((a, b) => a + b, 0) || 1;
            return (
              <Card className="bg-white/5 border-white/10 rounded-3xl mb-6" styles={{ body: { padding: 24 } }}>
                <div className="flex flex-wrap items-end gap-6 mb-4">
                  <div>
                    <div className="text-white/30 text-[11px] font-bold tracking-widest mb-1">술 카드 충실도 (완벽 = {cc.max}/{cc.max})</div>
                    <div className="text-3xl font-black text-white">{cc.full_pct}% <span className="text-base text-white/40">완벽 {cc.full.toLocaleString()}</span></div>
                  </div>
                  <div className="text-white/50 text-sm">6개 이상 {cc.ge6_pct}% · 평균 {cc.avg}</div>
                </div>
                <div className="flex h-6 rounded-lg overflow-hidden mb-2">
                  {Object.entries(cc.distribution).map(([score, n]) => n > 0 && (
                    <Tooltip key={score} title={`${score}개 채움: ${n}`}>
                      <div style={{ width: `${(100 * n) / total}%`, background: `hsl(38 92% ${18 + (Number(score) / cc.max) * 42}%)` }}
                        className="text-[10px] text-black/70 font-bold flex items-center justify-center">{n / total > 0.06 ? score : ""}</div>
                    </Tooltip>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-white/40 text-xs mr-1">빈칸</span>
                  {Object.entries(cc.missing).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                    <Tag key={k}>{CARD_ITEM_LABEL[k] ?? k} {n.toLocaleString()}</Tag>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* 2. 핵심 지표 */}
          <Row gutter={[16, 16]} className="mb-6">
            {[
              { t: "제품", v: q.rows, s: `중복 의심 ${q.dup_suspect ?? "-"}` },
              { t: "원본 CSV 연결", v: q.seed_matched, s: `미연결 ${q.seed_unmatched_sool ?? "-"}` },
              { t: "주종 규칙 제안", v: status.metrics?.category_rule_resolved, s: `미분류 남음 ${status.metrics?.category_unresolved ?? "-"}` },
              { t: "맛 추출", v: prof.with_taste, s: `페어링 ${prof.with_pairing ?? "-"}` },
              { t: "찾아가는 양조장", v: prof.visit_brewery, s: `식품명인 ${prof.food_master ?? "-"}` },
              { t: "수상 제품", v: prof.awarded, s: `감미료 ${prof.sweetener ?? "-"}` },
            ].map((c) => (
              <Col xs={12} md={8} xl={4} key={c.t}>
                <Card className="bg-white/5 border-white/10 rounded-2xl h-full" styles={{ body: { padding: 20 } }}>
                  <div className="text-white/30 text-[11px] font-bold tracking-widest mb-1">{c.t}</div>
                  <div className="text-2xl font-black text-white">{c.v?.toLocaleString?.() ?? "-"}</div>
                  <div className="text-white/30 text-xs mt-1">{c.s}</div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 3. 주종별 요약 + 페어링·맛·원료 */}
          {summary && (
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} xl={14}>
                <Card title={<span className="text-white">주종별 술 카드</span>} className="bg-white/5 border-white/10 rounded-3xl h-full">
                  <Table size="small" pagination={false} rowKey={(r) => r.category ?? "none"} className="custom-table"
                    dataSource={summary.by_category}
                    onRow={(r) => ({ onClick: () => setFilter(r.category ? { category: r.category, unclassified: false } : { category: undefined, unclassified: true }), style: { cursor: "pointer" } })}
                    columns={[
                      { title: "주종", dataIndex: "category", render: (v) => v ?? <Tag>미분류</Tag> },
                      { title: "제품", dataIndex: "n" },
                      { title: "평균 신뢰도", dataIndex: "avg_confidence", render: (v) => <Tag color={confColor(v)}>{v ?? "-"}</Tag> },
                      { title: "찾아가는 양조장 %", dataIndex: "visit_pct" },
                      { title: "수상 %", dataIndex: "award_pct" },
                      { title: "감미료 %", dataIndex: "sweetener_pct" },
                      { title: "생 %", dataIndex: "raw_pct" },
                      { title: "탄산 %", dataIndex: "sparkling_pct" },
                    ]} />
                  <Text className="text-white/30 text-xs">행을 누르면 아래 목록이 그 주종으로 걸러집니다. * = 규칙 제안값(검증 전)</Text>
                </Card>
              </Col>
              <Col xs={24} xl={10}>
                <Card title={<span className="text-white">맛 · 페어링 · 특산 원료</span>} className="bg-white/5 border-white/10 rounded-3xl h-full">
                  <Descriptions column={1} size="small" styles={{ label: { color: "rgba(255,255,255,0.4)", width: 90 }, content: { color: "white" } }}>
                    <Descriptions.Item label="맛 (↑강/↓약)">
                      <span className="flex flex-wrap gap-1">
                        {Object.entries(summary.taste).sort((a, b) => b[1].high - a[1].high).map(([k, t]) => (
                          <Tag key={k}>{TASTE_LABEL[k] ?? k} ↑{t.high} ↓{t.low}</Tag>
                        ))}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="페어링">
                      <span className="flex flex-wrap gap-1">{summary.pairings.map(([k, n]) => <Tag key={k}>{k} {n}</Tag>)}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="특산 원료">
                      <span className="flex flex-wrap gap-1">{summary.special_ingredients.map(([k, n]) => <Tag key={k}>{k} {n}</Tag>)}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="구매 경로">
                      <span className="flex flex-wrap gap-1">
                        {summary.purchase_channels.map((c) => (
                          <Tooltip key={c.channel} title={`접속됨 ${c.alive} · 죽은 링크 ${c.dead}`}>
                            <Tag color={c.channel === "smartstore" || c.channel === "shop_mall" ? "green" : undefined}>
                              {CHANNEL_LABEL[c.channel] ?? c.channel} {c.n}{c.dead ? ` (✕${c.dead})` : ""}
                            </Tag>
                          </Tooltip>
                        ))}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* 4. 제품별 술 카드 */}
      <Card title={<span className="text-white">술 카드 ({total.toLocaleString()})</span>} className="bg-white/5 border-white/10 rounded-3xl"
        extra={
          <div className="flex flex-wrap gap-2">
            <Input.Search allowClear placeholder="이름·양조장" style={{ width: 200 }} onSearch={(v) => setFilter({ q: v || undefined })} />
            <Select allowClear placeholder="주종" style={{ width: 120 }} value={filters.unclassified ? "__none" : filters.category}
              options={[...CATEGORIES.map((c) => ({ value: c, label: c })), { value: "__none", label: "미분류" }]}
              onChange={(v) => setFilter(v === "__none" ? { category: undefined, unclassified: true } : { category: v, unclassified: false })} />
            <Select allowClear placeholder="특징" style={{ width: 150 }} value={filters.flag} options={FLAG_OPTIONS}
              onChange={(v) => setFilter({ flag: v })} />
            <Select allowClear placeholder="신뢰도" style={{ width: 140 }} value={filters.maxConf}
              options={[{ value: 0.65, label: "낮음 (≤0.65)" }, { value: 0.8, label: "중간 이하 (≤0.8)" }]}
              onChange={(v) => setFilter({ maxConf: v })} />
          </div>
        }>
        <Table rowKey="sool_id" size="middle" className="custom-table" loading={tableLoading}
          dataSource={profiles} columns={columns}
          pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, onChange: setPage }}
          expandable={{
            expandedRowRender: (r: Profile) => (
              <Descriptions column={{ xs: 1, md: 2 }} size="small" styles={{ label: { color: "rgba(255,255,255,0.4)" }, content: { color: "rgba(255,255,255,0.85)" } }}>
                <Descriptions.Item label="주원료">{r.main_ingredient || "-"}</Descriptions.Item>
                <Descriptions.Item label="특산 원료">{r.special_ingredients?.join(", ") || "-"}</Descriptions.Item>
                <Descriptions.Item label="용량">{r.volumes_ml?.length ? r.volumes_ml.map((v: number) => `${v}ml`).join(", ") : "-"}</Descriptions.Item>
                <Descriptions.Item label="숙성">{r.aged_years ? `${r.aged_years}년` : "-"}</Descriptions.Item>
                <Descriptions.Item label="수상">{r.award_count ? `${r.award_count}건 · 최고 ${r.best_award ?? "-"} · ${r.award_years?.join(", ")}` : "-"}</Descriptions.Item>
                <Descriptions.Item label="주종 근거">{r.category_source === "current" ? "기존 값" : r.category_rule ? `${r.category_rule} (${r.category_confidence})` : "-"}</Descriptions.Item>
                <Descriptions.Item label="양조장 주소" span={2}>{r.address || "-"}</Descriptions.Item>
                <Descriptions.Item label="구매 경로" span={2}>
                  {r.purchase_channel ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <Tag color={r.online_buy ? "green" : undefined}>{CHANNEL_LABEL[r.purchase_channel] ?? r.purchase_channel}</Tag>
                      <Tag color={LINK_STATE[r.link_state]?.color}>{LINK_STATE[r.link_state]?.label ?? r.link_state}</Tag>
                    </span>
                  ) : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="홈페이지" span={2}>{r.homepage ? <a href={r.homepage.startsWith("http") ? r.homepage : `http://${r.homepage}`} target="_blank" rel="noreferrer">{r.homepage}</a> : "-"}</Descriptions.Item>
                <Descriptions.Item label="맛·페어링 원문" span={2}>{r.features || "-"}</Descriptions.Item>
              </Descriptions>
            ),
          }} />
      </Card>
      </>) },
        { key: "market", label: "시장 구조", children: <MarketView /> },
        { key: "map", label: "양조장 지도", children: <PlaceMap /> },
        { key: "review", label: "주종 검증", children: <CategoryReview /> },
      ]} />

      <style jsx global>{`
        .custom-table .ant-table { background: transparent !important; color: rgba(255,255,255,0.7) !important; }
        .custom-table .ant-table-thead > tr > th { background: rgba(255,255,255,0.03) !important; color: rgba(255,255,255,0.35) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; font-size: 11px; font-weight: 800; }
        .custom-table .ant-table-tbody > tr > td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; background: transparent !important; }
        .custom-table .ant-table-tbody > tr:hover > td { background: rgba(255,255,255,0.03) !important; }
        .custom-table .ant-table-expanded-row > td { background: rgba(255,255,255,0.02) !important; }
        .pipeline-tabs .ant-tabs-tab { color: rgba(255,255,255,0.35) !important; font-weight: 700; }
        .pipeline-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #f59e0b !important; }
        .pipeline-tabs .ant-tabs-ink-bar { background: #f59e0b !important; }
      `}</style>
    </div>
  );
}
