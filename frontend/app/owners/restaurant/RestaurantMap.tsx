"use client";

// 가게 위치(★) + 추천 술을 만드는 양조장 위치
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

export type MapPoint = { place_id: string; name: string | null; lat: number; lng: number; matching: number; visit_brewery: boolean };

export default function RestaurantMap({ store, points, onPick }: {
  store: { lat: number; lng: number; label: string } | null; points: MapPoint[]; onPick?: (placeId: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      if (!map.current) {
        map.current = L.map(el.current, { center: [37.45, 127.0], zoom: 9, scrollWheelZoom: false });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 18 }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
        setTimeout(() => map.current?.invalidateSize(), 200);
      }
      layer.current!.clearLayers();
      const bounds: [number, number][] = [];
      for (const p of points) {
        L.circleMarker([p.lat, p.lng], {
          radius: 5 + Math.min(p.matching, 6) * 1.5, color: p.visit_brewery ? "#22d3ee" : "#000", weight: p.visit_brewery ? 2.5 : 1,
          fillColor: "#f59e0b", fillOpacity: 0.85,
        }).bindTooltip(`${p.name ?? "-"} · 추천 ${p.matching}종`).on("click", () => onPick?.(p.place_id)).addTo(layer.current!);
        bounds.push([p.lat, p.lng]);
      }
      if (store) {
        L.marker([store.lat, store.lng], {
          icon: L.divIcon({ className: "", html: '<div style="font-size:26px;line-height:26px;color:#facc15;filter:drop-shadow(0 2px 3px #000)">★</div>', iconSize: [26, 26], iconAnchor: [13, 13] }),
        }).bindTooltip(`우리 가게: ${store.label}`).addTo(layer.current!);
        bounds.push([store.lat, store.lng]);
      }
      if (bounds.length) map.current.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 12 });
    })();
    return () => { cancelled = true; };
  }, [store, points, onPick]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);
  return <div ref={el} style={{ height: 380, borderRadius: 20, overflow: "hidden" }} />;
}
