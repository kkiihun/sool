"use client";

// 양조 원료 시세: aT 일별 도·소매 가격(중도매·상품 등급) 월평균 → 원료별 최근 가격·전년 대비·출하기
import { API_BASE } from "@/lib/api";
import { IngredientRow, pctColor, pctText, timing, volLabel, won, ymLabel } from "@/lib/ingredients";
import Sparkline from "@/components/Sparkline";
import { useEffect, useState } from "react";
import { Empty, Spin, Tooltip, Typography } from "antd";

const { Title, Text } = Typography;

export default function Ingredients() {
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/explore/ingredients`).then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setRows((d.items ?? []).filter((x: IngredientRow) => x.latest_kg)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#050505] min-h-screen">
      <div className="max-w-[1200px] mx-auto py-6 md:py-14 px-4 md:px-10 flex flex-col gap-6">
        <div>
          <Title className="!text-white !text-3xl md:!text-5xl !font-black !m-0">양조 원료 <span className="text-amber-500">시세</span></Title>
          <Text className="!text-white/50 !text-sm md:!text-lg block mt-2">
            쌀·찹쌀·과일 등 술 원료의 도매 가격 흐름입니다. 원가 계획과 원료 구매 시기를 정할 때 참고하세요.
          </Text>
        </div>

        {loading ? <div className="py-24 text-center"><Spin /></div> : rows.length === 0 ? (
          <Empty description={<span className="text-white/40">시세 데이터를 모으는 중입니다</span>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map((r) => (
              <div key={r.ingredient} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white text-xl font-black">{r.ingredient}{r.variety && <span className="text-white/40 text-sm font-normal"> · {r.variety} 기준</span>}</div>
                    <div className="text-white/40 text-xs mt-0.5">원재료에 쓰는 술 {r.products}종</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-lg font-black">{won(r.latest_kg)}<span className="text-white/40 text-xs font-normal"> /kg</span></div>
                    <div className="text-white/35 text-xs">{ymLabel(r.latest_ym)} 월평균</div>
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <Sparkline values={r.monthly.map((m) => m.kg)} width={180} height={44} />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-white/40">전년 같은 달</span><span className={`font-bold ${pctColor(r.yoy_pct)}`}>{pctText(r.yoy_pct)}</span>
                    <span className="text-white/40">최근 3개월</span><span className={`font-bold ${pctColor(r.trend_3m_pct)}`}>{pctText(r.trend_3m_pct)}</span>
                    <Tooltip title="싼 달: 연도별 평균 대비 가장 싼 달(출하가 몰려 사기 좋은 시기) / 출하 시기: 도매시장에 나오는 달"><span className="text-white/40 underline decoration-dotted">{timing(r).label}</span></Tooltip>
                    <span className="text-green-300 font-bold">{timing(r).text}</span>
                    <span className="text-white/40">가격 변동</span><span className="text-white/60">{volLabel(r.volatility)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Text className="!text-white/30 !text-xs leading-relaxed">
          자료: 한국농수산식품유통공사 일별 도·소매 가격정보 (공공데이터포털) — 중도매·상품 등급, 날마다 시장 간 중앙값의 월평균(원/kg).
          매실·유자·오미자·복분자 등은 이 자료에 없어 표시하지 않습니다. 제품 수는 원재료 문구에서 찾은 값입니다.
        </Text>
      </div>
    </div>
  );
}
