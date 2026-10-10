"use client";

// 주종 제안 검증: 표본 100건을 한 건씩 보고 맞음/정답 주종/모르겠음 → 규칙별 정확도
import { API_BASE } from "@/lib/api";

import { useCallback, useEffect, useState } from "react";
import { App, Button, Card, Col, Empty, Progress, Row, Spin, Table, Tag, Typography } from "antd";

const { Text } = Typography;

type Item = {
  sool_id: number; name: string; producer?: string; region?: string; abv?: number;
  ingredients?: string; description?: string; features?: string;
  suggested?: string | null; rule?: string; confidence?: number;
};
type Next = { total: number; done: number; item: Item | null; categories: string[] };
type Stats = {
  labeled: number; estimated_accuracy: number | null;
  by_rule: { rule: string; size: number; labeled: number; correct: number; unsure: number; accuracy: number | null }[];
  confusion: [string, number][];
};

const pct = (v: number | null | undefined) => (v == null ? "-" : `${Math.round(v * 100)}%`);

export default function CategoryReview() {
  const { message } = App.useApp();
  const [next, setNext] = useState<Next | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [n, s] = await Promise.all([
      fetch(`${API_BASE}/admin/pipeline/review/next`, { cache: "no-store" }),
      fetch(`${API_BASE}/admin/pipeline/review/stats`, { cache: "no-store" }),
    ]);
    if (n.ok) setNext(await n.json());
    if (s.ok) setStats(await s.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(async (verdict: "correct" | "wrong" | "unsure", correct_category?: string) => {
    const item = next?.item;
    if (!item || saving) return;
    // 제안값과 같은 주종을 고르면 '맞음'으로 처리
    if (verdict === "wrong" && correct_category === item.suggested) verdict = "correct";
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pipeline/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sool_id: item.sool_id, verdict, correct_category }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? `HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      message.error(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  }, [next, saving, load, message]);

  // 단축키: Enter/Space = 맞음, 1~7 = 정답 주종, 0 = 모르겠음
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!next?.item || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if ((e.key === "Enter" || e.key === " ") && next.item.suggested) { e.preventDefault(); submit("correct"); }
      else if (e.key === "0") submit("unsure");
      else {
        const i = Number(e.key) - 1;
        if (i >= 0 && i < next.categories.length) submit("wrong", next.categories[i]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, submit]);

  if (loading) return <div className="p-16 text-center"><Spin /></div>;
  const item = next?.item;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={14}>
        <Card className="bg-white/5 border-white/10 rounded-3xl" styles={{ body: { padding: 28 } }}>
          <div className="flex items-center gap-4 mb-5">
            <Progress percent={next ? Math.round((next.done / Math.max(next.total, 1)) * 100) : 0} className="flex-1 !m-0" />
            <Text className="text-white/60 whitespace-nowrap">{next?.done} / {next?.total}</Text>
          </div>

          {!item ? (
            <Empty description={<span className="text-white/50">표본 검증 완료. 오른쪽에서 정확도를 확인하세요.</span>} />
          ) : (
            <>
              <div className="text-2xl font-black text-white">{item.name}</div>
              <div className="text-white/40 mb-4">#{item.sool_id} · {item.producer || "-"} · {item.region || "-"} · <b className="text-amber-500">{item.abv}%</b></div>
              <div className="space-y-2 text-sm mb-6">
                <div><Text className="text-white/40">원료 </Text><Text className="text-white/85">{item.ingredients || "-"}</Text></div>
                <div><Text className="text-white/40">설명 </Text><Text className="text-white/70">{item.description || "-"}</Text></div>
                {item.features && <div><Text className="text-white/40">특징 </Text><Text className="text-white/70">{item.features}</Text></div>}
              </div>

              <div className="mb-3 text-white/60">
                규칙 제안: {item.suggested
                  ? <Tag color="gold" className="text-base px-3">{item.suggested}</Tag>
                  : <Tag>미분류</Tag>}
                <Text className="text-white/30 text-xs">{item.rule} · 신뢰도 {item.confidence ?? "-"}</Text>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Button type="primary" size="large" disabled={!item.suggested || saving} onClick={() => submit("correct")}>
                  맞음 (Enter)
                </Button>
                <Button size="large" disabled={saving} onClick={() => submit("unsure")}>모르겠음 (0)</Button>
              </div>
              <div className="text-white/40 text-xs mb-2">틀렸으면 정답 주종을 누르세요</div>
              <div className="flex flex-wrap gap-2">
                {next!.categories.map((c, i) => (
                  <Button key={c} disabled={saving} onClick={() => submit("wrong", c)}
                    className={c === item.suggested ? "!border-amber-500" : ""}>
                    {i + 1}. {c}
                  </Button>
                ))}
              </div>
            </>
          )}
        </Card>
      </Col>

      <Col xs={24} xl={10}>
        <Card title={<span className="text-white">규칙 정확도</span>} className="bg-white/5 border-white/10 rounded-3xl">
          <div className="mb-4">
            <Text className="text-white/40">전체 추정 정확도 (규칙 크기 가중, 제안이 있는 제품 기준) </Text>
            <div className="text-4xl font-black text-amber-500">{pct(stats?.estimated_accuracy)}</div>
            <Text className="text-white/30 text-xs">라벨 {stats?.labeled ?? 0}건 · 표본이 적은 규칙은 오차가 큼</Text>
          </div>
          <Table size="small" pagination={false} rowKey="rule" className="custom-table" dataSource={stats?.by_rule ?? []}
            columns={[
              { title: "규칙", dataIndex: "rule" },
              { title: "전체", dataIndex: "size" },
              { title: "라벨", dataIndex: "labeled" },
              { title: "정확도", dataIndex: "accuracy", render: (v: number | null) => v == null ? "-" : <Tag color={v >= 0.9 ? "green" : v >= 0.7 ? "gold" : "red"}>{pct(v)}</Tag> },
            ]} />
          {!!stats?.confusion?.length && (
            <div className="mt-4">
              <Text className="text-white/40 text-xs">자주 틀린 경우 (제안 → 정답)</Text>
              <div className="flex flex-wrap gap-1 mt-1">
                {stats.confusion.map(([k, n]) => <Tag key={k} color="red">{k} · {n}</Tag>)}
              </div>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}
