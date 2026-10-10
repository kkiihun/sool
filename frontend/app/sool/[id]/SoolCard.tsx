"use client";

// 상세 페이지의 술 카드 + 어디서 맛보나 (파이프라인 결과 /explore/sool/{id})
import { API_BASE } from "@/lib/api";
import { CHANNEL_LABEL, TASTE_LABEL, httpUrl } from "@/lib/soolLabels";
import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Tag, Tooltip, Typography } from "antd";
import { EnvironmentOutlined, ShoppingOutlined } from "@ant-design/icons";

const { Text } = Typography;

type Profile = {
  category: string | null; category_auto: boolean; main_ingredient: string | null; special_ingredients: string[] | null;
  has_sweetener: boolean | null; has_preservative: boolean | null; has_spirit_added: boolean | null;
  is_raw: boolean | null; is_pasteurized: boolean | null; is_sparkling: boolean | null; aged_years: number | null;
  volume_ml: number | null; volumes_ml: number[] | null;
  visit_brewery: boolean | null; food_master: boolean | null; intangible_heritage: boolean | null;
  award_count: number | null; best_award: string | null; award_years: number[] | null;
  taste: Record<string, number | null> | null; pairings: string[] | null; address: string | null;
};
type Place = {
  name: string | null; address: string | null; homepage: string | null; lat: number; lng: number;
  geo_method: string; product_count: number; visit_brewery: boolean;
  products: { sool_id: number; name: string; category: string | null; abv: number | null }[];
};
type Purchase = { channel: string | null; online_buy: boolean; link_state: string | null; url: string | null };
export type CardResp = { sool_id: number; profile: Profile | null; purchase: Purchase | null; place: Place | null };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3">
    <Text className="!text-white/40 !text-xs !font-bold">{title}</Text>
    {children}
  </div>
);

function MiniMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { center: [lat, lng], zoom: 13, scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors", maxZoom: 18,
      }).addTo(map);
      L.circleMarker([lat, lng], { radius: 9, color: "#000", weight: 1, fillColor: "#f59e0b", fillOpacity: 0.9 })
        .bindTooltip(label, { permanent: true, direction: "top", offset: [0, -8] })
        .addTo(map);
      setTimeout(() => map?.invalidateSize(), 200);   // 레이아웃이 자리 잡은 뒤 크기 재계산 (회색 타일 방지)
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [lat, lng, label]);
  return <div ref={el} style={{ height: 240, borderRadius: 20, overflow: "hidden" }} />;
}

export function useSoolCard(soolId?: string) {
  const [card, setCard] = useState<CardResp | null>(null);
  useEffect(() => {
    if (!soolId) return;
    fetch(`${API_BASE}/explore/sool/${soolId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setCard)
      .catch(() => setCard(null));
  }, [soolId]);
  return card;
}

/** 술 카드: 원료·제조·인증·맛·페어링 */
export function SoolProfileCard({ profile }: { profile: Profile }) {
  const p = profile;
  const make = [
    p.is_raw && { label: "생(비살균)", color: "green", tip: "효모가 살아 있는 생술 — 냉장 보관" },
    p.is_pasteurized && { label: "살균", color: "default", tip: "열처리로 보관성을 높인 술" },
    p.is_sparkling && { label: "탄산", color: "cyan" },
    p.aged_years && { label: `${p.aged_years}년 숙성`, color: "gold" },
  ].filter(Boolean) as { label: string; color: string; tip?: string }[];
  const additives = [
    p.main_ingredient && (p.has_sweetener ? { label: "감미료 사용", color: "orange" } : { label: "무감미료", color: "green" }),
    p.has_spirit_added && { label: "주정 첨가", color: "orange" },
    p.has_preservative && { label: "보존료", color: "orange" },
  ].filter(Boolean) as { label: string; color: string }[];
  const certs = [
    p.food_master && "대한민국 식품명인",
    p.intangible_heritage && "무형문화재",
    p.award_count ? `수상 ${p.award_count}회${p.best_award ? ` · 최고 ${p.best_award}` : ""}${p.award_years?.length ? ` (${p.award_years.join(", ")})` : ""}` : null,
  ].filter(Boolean) as string[];
  const tastes = Object.entries(p.taste || {}).filter(([, v]) => v !== null && v !== undefined) as [string, number][];
  const volumes = p.volumes_ml?.length ? p.volumes_ml : p.volume_ml ? [p.volume_ml] : [];

  return (
    <div className="bg-white/[0.03] p-10 rounded-[3rem] border border-white/10 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Text className="!text-white !text-base !font-black !opacity-60">술 카드</Text>
        {p.category && (
          <Tooltip title={p.category_auto ? "원본에 주종이 없어 원료·도수 규칙으로 자동 분류했습니다 (검증 중)" : undefined}>
            <Tag color="gold" className="!text-sm !px-3">{p.category}{p.category_auto && " · 자동 분류"}</Tag>
          </Tooltip>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Section title="원료">
          <Text className="!text-white/80 !text-lg">{p.main_ingredient || "정보 없음"}</Text>
          {!!p.special_ingredients?.length && (
            <span className="flex flex-wrap gap-1">{p.special_ingredients.map((s) => <Tag key={s}>{s}</Tag>)}</span>
          )}
          {!!additives.length && <span className="flex flex-wrap gap-1">{additives.map((a) => <Tag key={a.label} color={a.color}>{a.label}</Tag>)}</span>}
        </Section>
        <Section title="제조">
          {make.length ? (
            <span className="flex flex-wrap gap-1">
              {make.map((m) => <Tooltip key={m.label} title={m.tip}><Tag color={m.color}>{m.label}</Tag></Tooltip>)}
            </span>
          ) : <Text className="!text-white/30">정보 없음</Text>}
          {!!volumes.length && <Text className="!text-white/50">용량 {volumes.map((v) => `${v}ml`).join(" · ")}</Text>}
        </Section>
        <Section title="맛 (설명에서 추출)">
          {tastes.length ? (
            <span className="flex flex-wrap gap-1">
              {tastes.map(([k, v]) => (
                <Tag key={k} color={v > 0 ? "volcano" : v < 0 ? "blue" : "default"}>
                  {TASTE_LABEL[k] ?? k} {v > 0 ? "강함" : v < 0 ? "약함" : "적당"}
                </Tag>
              ))}
            </span>
          ) : <Text className="!text-white/30">설명에 맛 표현이 없습니다</Text>}
        </Section>
        <Section title="어울리는 음식">
          {p.pairings?.length ? (
            <span className="flex flex-wrap gap-1">
              {p.pairings.map((g) => <Link key={g} href={`/?pairing=${encodeURIComponent(g)}`}><Tag color="purple" className="cursor-pointer">{g}</Tag></Link>)}
            </span>
          ) : <Text className="!text-white/30">정보 없음</Text>}
        </Section>
      </div>

      {(certs.length > 0 || p.visit_brewery) && (
        <Section title="인증 · 수상">
          <span className="flex flex-wrap gap-1">
            {p.visit_brewery && <Tag color="cyan">찾아가는 양조장</Tag>}
            {certs.map((c) => <Tag key={c} color="purple">{c}</Tag>)}
          </span>
        </Section>
      )}
    </div>
  );
}

/** 어디서 맛보나: 양조장 위치 + 구매 경로 */
export function WhereToTaste({ card, soolId }: { card: CardResp; soolId: number }) {
  const { place, purchase, profile } = card;
  if (!place && !purchase && !profile?.address) return null;
  const others = (place?.products ?? []).filter((x) => x.sool_id !== soolId);
  const blocked = purchase?.link_state === "login";

  return (
    <div className="bg-white/[0.03] p-10 rounded-[3rem] border border-white/10 flex flex-col gap-6">
      <Text className="!text-white !text-base !font-black !opacity-60">어디서 맛보나</Text>

      {place ? (
        <>
          <MiniMap lat={place.lat} lng={place.lng} label={place.name ?? "양조장"} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <EnvironmentOutlined className="text-amber-500" />
              <Text className="!text-white !text-lg !font-bold">{place.name}</Text>
              {place.visit_brewery && (
                <Tooltip title="농림축산식품부 지정 — 견학·시음·체험 프로그램을 운영하는 양조장">
                  <Tag color="cyan">찾아가는 양조장 · 방문 가능</Tag>
                </Tooltip>
              )}
            </div>
            <Text className="!text-white/50">{place.address}</Text>
            {place.geo_method !== "address" && <Text className="!text-white/30 !text-xs">지도 위치는 양조장 이름으로 찾은 추정 위치입니다</Text>}
            <span className="flex gap-3 mt-1 text-sm">
              <a className="text-amber-500" target="_blank" rel="noreferrer"
                href={`https://map.kakao.com/link/search/${encodeURIComponent(place.address || place.name || "")}`}>카카오맵에서 보기</a>
              <Link className="text-white/40 hover:text-white" href="/breweries">전체 양조장 지도</Link>
            </span>
          </div>
        </>
      ) : profile?.address ? (
        <Text className="!text-white/60"><EnvironmentOutlined className="text-amber-500 mr-2" />{profile.address}</Text>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-white/10 pt-6">
        <Text className="!text-white/40 !text-xs !font-bold">구매 경로</Text>
        {purchase?.url ? (
          <div className="flex items-center gap-2 flex-wrap">
            <ShoppingOutlined className="text-amber-500" />
            <a className="text-amber-500 font-bold" target="_blank" rel="noreferrer" href={httpUrl(purchase.url)}>
              {CHANNEL_LABEL[purchase.channel ?? ""] ?? "홈페이지"}에서 보기
            </a>
            {purchase.online_buy && <Tag color="green">온라인 구매 가능</Tag>}
            {blocked && <Tag>성인 인증 후 확인</Tag>}
          </div>
        ) : purchase ? (
          <Text className="!text-white/40">등록된 링크가 더 이상 열리지 않습니다{purchase.channel === "modoo" ? " (모두홈페이지 서비스 종료)" : ""}.</Text>
        ) : (
          <Text className="!text-white/40">등록된 구매 링크가 없습니다.</Text>
        )}
      </div>

      {others.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6">
          <Text className="!text-white/40 !text-xs !font-bold">같은 양조장의 술 {others.length}</Text>
          <ul className="space-y-1">
            {others.slice(0, 8).map((o) => (
              <li key={o.sool_id} className="flex justify-between gap-2 text-sm">
                <Link className="text-white/80 hover:text-amber-500" href={`/sool/${o.sool_id}`}>{o.name}</Link>
                <span className="text-white/30 whitespace-nowrap">{o.category ?? "-"} · {o.abv ?? "-"}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
