"use client";

// 술 메뉴판 만들기 (R3): 고른 술 → 인쇄용 메뉴판(A4) 또는 테이블 POP(A4 에 4장). QR → 술 상세 페이지
import { API_BASE } from "@/lib/api";
import { TASTE_LABEL } from "@/lib/soolLabels";
import { BoardEntry, MAX_ITEMS, loadBoard, onBoardChange, saveBoard } from "@/lib/menuBoard";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, QRCode, Segmented, Switch, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined, PrinterOutlined, SearchOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

type Card = {
  sool_id: number; name: string; abv: number | null; category: string | null; producer: string | null; region: string | null;
  main_ingredient: string | null; tastes: string[]; pairings: string[]; intro: string | null; on_sale: boolean | null;
};
type Settings = {
  store: string; title: string; layout: "menu" | "pop"; theme: "light" | "dark";
  taste: boolean; pairing: boolean; brewery: boolean; qr: boolean;
};
const SETTINGS_KEY = "sool.menuBoard.settings.v1";
const DEFAULT: Settings = { store: "", title: "우리 술 메뉴", layout: "menu", theme: "light", taste: true, pairing: true, brewery: true, qr: true };
const CAT_ORDER = ["탁주", "약주", "청주", "과실주", "증류주", "리큐르", "기타주류"];

export default function MenuBoard() {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [cards, setCards] = useState<Record<number, Card>>({});
  const [st, setSt] = useState<Settings>(DEFAULT);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ id: number; name: string; producer: string | null; abv: number | null }[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setEntries(loadBoard());
    try { setSt({ ...DEFAULT, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }); } catch { /* 무시 */ }
    return onBoardChange(() => setEntries(loadBoard()));
  }, []);
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(st)); } catch { /* 무시 */ } }, [st]);

  // 새로 담긴 술만 요약 불러오기
  const ids = entries.map((e) => e.sool_id);
  useEffect(() => {
    const need = ids.filter((i) => !cards[i]);
    if (!need.length) return;
    fetch(`${API_BASE}/explore/cards?ids=${need.join(",")}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setCards((c) => ({ ...c, ...Object.fromEntries((d.items as Card[]).map((x) => [x.sool_id, x])) })));
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // 술 검색해서 추가
  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    const t = setTimeout(() => {
      fetch(`${API_BASE}/explore/sool?q=${encodeURIComponent(q.trim())}&page_size=8&order=recommended`)
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setFound(d.items ?? []));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const update = (next: BoardEntry[]) => { setEntries(next); saveBoard(next); };
  const add = (id: number) => { if (!ids.includes(id) && ids.length < MAX_ITEMS) update([...entries, { sool_id: id }]); };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= entries.length) return;
    const next = [...entries];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };
  const patch = (i: number, p: Partial<BoardEntry>) => update(entries.map((e, k) => (k === i ? { ...e, ...p } : e)));

  const rows = entries.filter((e) => cards[e.sool_id]).map((e) => ({ e, c: cards[e.sool_id] }));
  const groups = useMemo(() => {
    const g: Record<string, typeof rows> = {};
    for (const r of rows) (g[r.c.category ?? "기타주류"] ??= []).push(r);
    return Object.entries(g).sort((a, b) => CAT_ORDER.indexOf(a[0]) - CAT_ORDER.indexOf(b[0]));
  }, [rows]);

  const dark = st.theme === "dark";
  const ink = dark ? "#f5f5f4" : "#1c1917";
  const sub = dark ? "rgba(245,245,244,0.6)" : "#57534e";
  const accent = dark ? "#f59e0b" : "#b45309";
  const desc = (e: BoardEntry, c: Card) => e.note?.trim() || c.intro || [c.main_ingredient && `원료 ${c.main_ingredient}`].filter(Boolean).join("");
  const meta = (c: Card) => [c.category, c.abv != null ? `${c.abv}%` : null, st.brewery ? [c.producer, c.region].filter(Boolean).join(" · ") : null].filter(Boolean).join(" · ");
  const tags = (c: Card) => [
    ...(st.taste ? c.tastes.map((t) => TASTE_LABEL[t] ?? t) : []),
  ];
  const qrUrl = (id: number) => `${origin}/sool/${id}`;

  return (
    <div className="bg-[#050505] min-h-screen">
      <div className="max-w-[1500px] mx-auto py-6 md:py-14 px-4 md:px-10 flex flex-col gap-6">
        <div className="no-print">
          <Title className="!text-white !text-3xl md:!text-5xl !font-black !m-0">술 <span className="text-amber-500">메뉴판</span> 만들기</Title>
          <Text className="!text-white/50 !text-sm md:!text-lg block mt-2">
            고른 전통주로 인쇄용 메뉴판이나 테이블 POP 를 만듭니다. QR 을 찍으면 손님이 술 소개를 볼 수 있어요.
          </Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-6 items-start">
          {/* 편집 */}
          <div className="no-print flex flex-col gap-4">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
              <span className="text-white font-black">설정</span>
              <Input placeholder="가게 이름 (예: 마포 전집)" value={st.store} onChange={(e) => setSt({ ...st, store: e.target.value })} className="!bg-white/5 !border-white/10 !text-white" />
              <Input placeholder="제목" value={st.title} onChange={(e) => setSt({ ...st, title: e.target.value })} className="!bg-white/5 !border-white/10 !text-white" />
              <div className="flex flex-wrap gap-2">
                <Segmented value={st.layout} onChange={(v) => setSt({ ...st, layout: v as Settings["layout"] })}
                  options={[{ label: "메뉴판 (A4)", value: "menu" }, { label: "테이블 POP (4장)", value: "pop" }]} />
                <Segmented value={st.theme} onChange={(v) => setSt({ ...st, theme: v as Settings["theme"] })}
                  options={[{ label: "밝게", value: "light" }, { label: "어둡게", value: "dark" }]} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-white/70 text-sm">
                {([["taste", "맛 표현"], ["pairing", "어울리는 메뉴"], ["brewery", "양조장·지역"], ["qr", "QR 코드"]] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2"><Switch size="small" checked={st[k]} onChange={(v) => setSt({ ...st, [k]: v })} />{label}</label>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-black">담은 술 {entries.length}</span>
                <Link href="/owners/restaurant" className="text-amber-400 text-sm">메뉴에 맞는 술 추천받기 →</Link>
              </div>
              <Input allowClear prefix={<SearchOutlined className="text-amber-500" />} placeholder="술 이름이나 양조장으로 찾아 추가" value={q}
                onChange={(e) => setQ(e.target.value)} className="!bg-white/5 !border-white/10 !text-white" />
              {found.length > 0 && (
                <ul className="rounded-xl border border-white/10 divide-y divide-white/5">
                  {found.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="min-w-0"><span className="text-white text-sm font-bold">{f.name}</span><span className="text-white/40 text-xs"> · {f.producer} · {f.abv}%</span></span>
                      <Button size="small" icon={<PlusOutlined />} disabled={ids.includes(f.id)} onClick={() => add(f.id)}>{ids.includes(f.id) ? "담음" : "추가"}</Button>
                    </li>
                  ))}
                </ul>
              )}
              {entries.length === 0 ? (
                <Empty description={<span className="text-white/40">아직 담은 술이 없습니다. 위에서 찾거나 '식당 사장님' 추천에서 담아 주세요.</span>} />
              ) : (
                <ul className="flex flex-col gap-3">
                  {entries.map((e, i) => {
                    const c = cards[e.sool_id];
                    return (
                      <li key={e.sool_id} className="rounded-2xl border border-white/10 p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white font-bold truncate">{c?.name ?? "불러오는 중…"}{c?.on_sale === false && <span className="text-red-300 text-xs"> · 판매 중단 표시</span>}</span>
                          <span className="flex gap-1 shrink-0">
                            <Button size="small" icon={<ArrowUpOutlined />} onClick={() => move(i, -1)} disabled={i === 0} />
                            <Button size="small" icon={<ArrowDownOutlined />} onClick={() => move(i, 1)} disabled={i === entries.length - 1} />
                            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => update(entries.filter((_, k) => k !== i))} />
                          </span>
                        </div>
                        <div className="grid grid-cols-[110px_1fr] gap-2">
                          <Input size="small" placeholder="가격 (예: 18,000)" value={e.price ?? ""} onChange={(ev) => patch(i, { price: ev.target.value })} className="!bg-white/5 !border-white/10 !text-white" />
                          <Input size="small" placeholder={c?.intro ?? "한 줄 소개 (비우면 자동)"} value={e.note ?? ""} onChange={(ev) => patch(i, { note: ev.target.value })} className="!bg-white/5 !border-white/10 !text-white" />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <Button type="primary" size="large" icon={<PrinterOutlined />} disabled={!rows.length} onClick={() => window.print()} className="!bg-amber-500 !text-black !border-none !font-black">
              인쇄 / PDF 저장
            </Button>
            <Text className="!text-white/30 !text-xs">
              가격은 직접 입력하세요. 담은 목록과 설정은 이 브라우저에만 저장됩니다. QR 은 지금 접속한 주소({origin || "…"})로 연결되므로, 사이트가 공개 주소로 열린 뒤 인쇄하는 것이 좋습니다.
            </Text>
          </div>

          {/* 미리보기 = 인쇄 영역 */}
          <div className="overflow-x-auto">
            <div id="board" className="mx-auto w-full max-w-[794px] rounded-xl print-sheet" style={{ background: dark ? "#111" : "#fffdf8", color: ink }}>
              {rows.length === 0 ? (
                <div className="p-16 text-center" style={{ color: sub }}>메뉴판 미리보기</div>
              ) : st.layout === "menu" ? (
                <div className="p-8 md:p-12">
                  <div className="text-center mb-8">
                    {st.store && <div className="text-sm tracking-widest" style={{ color: sub }}>{st.store}</div>}
                    <div className="text-3xl md:text-4xl font-black mt-1" style={{ color: ink }}>{st.title}</div>
                    <div className="mx-auto mt-3 h-[2px] w-16" style={{ background: accent }} />
                  </div>
                  {groups.map(([cat, list]) => (
                    <div key={cat} className="mb-8 break-inside-avoid">
                      <div className="text-sm font-black tracking-widest mb-3 pb-1 border-b" style={{ color: accent, borderColor: dark ? "#333" : "#e7e5e4" }}>{cat}</div>
                      <div className="flex flex-col gap-4">
                        {list.map(({ e, c }) => (
                          <div key={c.sool_id} className="flex gap-4 break-inside-avoid">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-3">
                                <span className="text-lg font-black" style={{ color: ink }}>{c.name}</span>
                                <span className="flex-1 border-b border-dotted" style={{ borderColor: dark ? "#444" : "#d6d3d1" }} />
                                {e.price && <span className="font-black" style={{ color: ink }}>{e.price}</span>}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: sub }}>{meta(c)}</div>
                              {desc(e, c) && <div className="text-sm mt-1" style={{ color: ink, opacity: 0.85 }}>{desc(e, c)}</div>}
                              {(tags(c).length > 0 || (st.pairing && c.pairings.length > 0)) && (
                                <div className="text-xs mt-1" style={{ color: sub }}>
                                  {tags(c).join(" · ")}{tags(c).length > 0 && st.pairing && c.pairings.length > 0 && "  |  "}
                                  {st.pairing && c.pairings.length > 0 && <>어울리는 메뉴: {c.pairings.slice(0, 3).join(", ")}</>}
                                </div>
                              )}
                            </div>
                            {st.qr && origin && <QRCode value={qrUrl(c.sool_id)} size={64} bordered={false} type="svg" color={ink} bgColor="transparent" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-[10px] mt-6" style={{ color: sub }}>QR 을 찍으면 술 소개·양조장 정보를 볼 수 있습니다</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 print-grid">
                  {rows.map(({ e, c }) => (
                    <div key={c.sool_id} className="p-6 border border-dashed flex flex-col gap-2 break-inside-avoid pop-card" style={{ borderColor: dark ? "#333" : "#d6d3d1" }}>
                      {st.store && <div className="text-[11px] tracking-widest" style={{ color: sub }}>{st.store} · {st.title}</div>}
                      <div className="text-2xl font-black leading-tight" style={{ color: ink }}>{c.name}</div>
                      <div className="text-xs" style={{ color: accent }}>{meta(c)}</div>
                      {desc(e, c) && <div className="text-sm" style={{ color: ink, opacity: 0.85 }}>{desc(e, c)}</div>}
                      {tags(c).length > 0 && <div className="text-xs" style={{ color: sub }}>{tags(c).join(" · ")}</div>}
                      {st.pairing && c.pairings.length > 0 && <div className="text-xs" style={{ color: sub }}>이런 메뉴와: {c.pairings.slice(0, 3).join(", ")}</div>}
                      <div className="mt-auto flex items-end justify-between pt-2">
                        <span className="text-xl font-black" style={{ color: ink }}>{e.price}</span>
                        {st.qr && origin && <QRCode value={qrUrl(c.sool_id)} size={84} bordered={false} type="svg" color={ink} bgColor="transparent" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body, .ant-layout { background: #fff !important; }   /* 앱의 검은 배경이 종이에 찍히지 않게 */
          body * { visibility: hidden !important; }
          #board, #board * { visibility: visible !important; }
          #board { position: absolute; left: 0; top: 0; width: 100% !important; max-width: none !important; border-radius: 0 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-grid { grid-template-columns: 1fr 1fr !important; }
          .pop-card { height: 136mm; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
