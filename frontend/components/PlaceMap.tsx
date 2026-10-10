"use client";

// 양조장 지도: 파이프라인이 좌표 변환한 양조장(analytics_place)을 OpenStreetMap 위에 표시 (관리자·공개 공용)
import { API_BASE } from "@/lib/api";
import { CAT_COLOR } from "@/lib/soolLabels";
import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { Card, Col, Empty, Row, Select, Spin, Switch, Tag, Typography } from "antd";

const { Text } = Typography;

type Product = { sool_id: number; name: string; category: string | null; abv: number | null };
type Place = {
  place_id: string; name: string | null; address: string | null; homepage: string | null;
  lat: number; lng: number; sido: string | null; sigungu: string | null; geo_method: string;
  product_count: number; categories: Record<string, number>; products: Product[];
  visit_brewery: boolean; food_master: boolean; intangible_heritage: boolean; awarded_products: number;
};
type Resp = {
  total: number; located: number; by_method: Record<string, number>; by_sido: Record<string, number>;
  items: Place[]; unlocated: { name: string; address: string }[];
};

const mainCategory = (c: Record<string, number>) => Object.entries(c || {}).sort((a, b) => b[1] - a[1])[0]?.[0];

// endpoint 를 바꾸면 공개 지도(/explore/places)로도 쓴다. diagnostics=false 면 좌표 변환 정보를 숨김
export default function PlaceMap({ endpoint = "/admin/pipeline/places", diagnostics = true }: { endpoint?: string; diagnostics?: boolean }) {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitOnly, setVisitOnly] = useState(false);
  const [sido, setSido] = useState<string | undefined>();
  const [selected, setSelected] = useState<Place | null>(null);

  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}${endpoint}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [endpoint]);

  const items = useMemo(
    () => (data?.items ?? []).filter((p) => (!visitOnly || p.visit_brewery) && (!sido || p.sido === sido)),
    [data, visitOnly, sido],
  );

  // 지도는 한 번만 만들고, 필터가 바뀌면 마커 레이어만 다시 그림
  useEffect(() => {
    if (!mapEl.current || !data) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      if (!map.current) {
        map.current = L.map(mapEl.current!, { center: [36.3, 127.8], zoom: 7, scrollWheelZoom: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors", maxZoom: 18,
        }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
      }
      layer.current!.clearLayers();
      for (const p of items) {
        const cat = mainCategory(p.categories);
        L.circleMarker([p.lat, p.lng], {
          radius: Math.min(4 + Math.sqrt(p.product_count) * 2.5, 14),
          color: p.visit_brewery ? "#22d3ee" : "#000",
          weight: p.visit_brewery ? 2.5 : 1,
          fillColor: CAT_COLOR[cat ?? ""] ?? "#94a3b8",
          fillOpacity: 0.85,
        })
          .bindTooltip(`${p.name ?? "-"} · ${p.product_count}종`)
          .on("click", () => setSelected(p))
          .addTo(layer.current!);
      }
      if (items.length && sido) {
        map.current.fitBounds(L.latLngBounds(items.map((p) => [p.lat, p.lng] as [number, number])), { padding: [30, 30] });
      }
    })();
    return () => { cancelled = true; };
  }, [data, items, sido]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  if (loading) return <div className="p-16 text-center"><Spin /></div>;
  if (!data || data.total === 0) {
    return <Card className="bg-white/5 border-white/10 rounded-3xl"><Empty description={<span className="text-white/50">장소 데이터가 없습니다. 파이프라인 실행 후 다시 보세요.</span>} /></Card>;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={16}>
        <Card className="bg-white/5 border-white/10 rounded-3xl" styles={{ body: { padding: 16 } }}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Text className="text-white/70">{diagnostics ? `양조장 ${items.length} / 좌표 ${data.located} / 전체 ${data.total}` : `양조장 ${items.length}곳`}</Text>
            <span className="flex items-center gap-2 text-white/60"><Switch size="small" checked={visitOnly} onChange={setVisitOnly} /> 찾아가는 양조장만</span>
            <Select allowClear placeholder="시도" style={{ width: 120 }} value={sido} onChange={setSido}
              options={Object.entries(data.by_sido).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ value: k, label: `${k} (${n})` }))} />
            <span className="flex flex-wrap gap-1 ml-auto">
              {Object.entries(CAT_COLOR).map(([k, c]) => (
                <span key={k} className="flex items-center gap-1 text-xs text-white/50">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />{k}
                </span>
              ))}
              <span className="flex items-center gap-1 text-xs text-white/50 ml-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "#22d3ee" }} />찾아가는 양조장
              </span>
            </span>
          </div>
          <div ref={mapEl} style={{ height: 620, borderRadius: 16, overflow: "hidden" }} />
          <Text className="text-white/30 text-xs">색 = 대표 주종, 크기 = 제품 수.{diagnostics && ` 좌표 변환: ${Object.entries(data.by_method).map(([k, n]) => `${k} ${n}`).join(" · ")}`}</Text>
        </Card>
      </Col>
      <Col xs={24} xl={8}>
        <Card title={<span className="text-white">{selected ? selected.name : "양조장을 누르세요"}</span>} className="bg-white/5 border-white/10 rounded-3xl">
          {selected ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {selected.visit_brewery && <Tag color="cyan">찾아가는 양조장</Tag>}
                {selected.food_master && <Tag color="purple">식품명인</Tag>}
                {selected.intangible_heritage && <Tag color="purple">무형문화재</Tag>}
                {selected.awarded_products > 0 && <Tag color="gold">수상 제품 {selected.awarded_products}</Tag>}
                <Tag>{selected.geo_method === "address" ? "주소 일치" : "위치 추정(이름 검색)"}</Tag>
              </div>
              <div className="text-white/60 text-sm">{selected.address || "-"}</div>
              <a className="text-amber-500 text-sm" href={`/owners/brewery/${selected.place_id}`}>진단 리포트 보기 →</a>
              {selected.homepage && (
                <a className="text-amber-500 text-sm break-all" target="_blank" rel="noreferrer"
                  href={selected.homepage.startsWith("http") ? selected.homepage : `http://${selected.homepage}`}>{selected.homepage}</a>
              )}
              <div>
                <Text className="text-white/40 text-xs">제품 {selected.product_count}종</Text>
                <ul className="mt-1 space-y-1">
                  {selected.products.map((p) => (
                    <li key={p.sool_id} className="flex justify-between gap-2 text-sm">
                      <a className="text-white hover:text-amber-500" href={`/sool/${p.sool_id}`}>{p.name}</a>
                      <span className="text-white/40 whitespace-nowrap">{p.category ?? "미분류"} · {p.abv ?? "-"}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Text className="text-white/40">지도에서 점을 누르면 양조장 정보와 제품 목록이 나옵니다.</Text>
          )}
        </Card>
        {diagnostics && data.unlocated.length > 0 && (
          <Card size="small" title={<span className="text-white/70">좌표를 못 찾은 곳 ({data.total - data.located})</span>} className="bg-white/5 border-white/10 rounded-3xl mt-4">
            <ul className="text-xs text-white/50 space-y-1 max-h-60 overflow-auto">
              {data.unlocated.map((u, i) => <li key={i}>{u.name ?? "-"} · {u.address ?? "주소 없음"}</li>)}
            </ul>
          </Card>
        )}
      </Col>
    </Row>
  );
}
