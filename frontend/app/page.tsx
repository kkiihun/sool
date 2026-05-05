"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Input,
  Select,
  Card,
  Typography,
  Pagination,
  Space,
  Spin,
  Badge,
  Button,
} from "antd";
import {
  SearchOutlined,
  StarOutlined,
  ReloadOutlined,
  FilterOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "./components/AuthProvider";
import { useAppShell } from "./components/AppShellProvider";

const { Title, Text } = Typography;

const CATEGORIES = [
  { label: "전체 카테고리", value: "" },
  { label: "탁주", value: "탁주" },
  { label: "약주", value: "약주" },
  { label: "청주", value: "청주" },
  { label: "증류주", value: "증류주" },
  { label: "과실주", value: "과실주" },
];

const SORT_OPTIONS = [
  { label: "이름순 정렬", value: "name" },
  { label: "도수 낮은순", value: "abv_low" },
  { label: "도수 높은순", value: "abv_high" },
];

// 도수별 색상 반환 함수
const getAbvColor = (abv: number) => {
  if (abv < 10) return "#52c41a"; // 저도수: 그린
  if (abv < 20) return "#f59e0b"; // 중도수: 앰버
  return "#ff4d4f"; // 고도수: 레드
};

// 카테고리별 색상 맵
const CATEGORY_COLORS: Record<string, string> = {
  "탁주": "rgba(82, 196, 26, 0.15)",   // 그린 계열
  "약주": "rgba(245, 158, 11, 0.15)",  // 앰버 계열
  "청주": "rgba(24, 144, 255, 0.15)",  // 블루 계열
  "증류주": "rgba(255, 77, 79, 0.15)", // 레드 계열
  "과실주": "rgba(114, 46, 209, 0.15)", // 퍼플 계열
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  "탁주": "#b7eb8f",
  "약주": "#ffe58f",
  "청주": "#91d5ff",
  "증류주": "#ffa39e",
  "과실주": "#efdbff",
};

export default function Home() {
  const { user } = useAuth();
  const { search, setSearch } = useAppShell();
  const [sool, setSool] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("전체 지역");
  const [sortOption, setSortOption] = useState("name");
  const [regionOptions, setRegionOptions] = useState<string[]>(["전체 지역"]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };

  const API_URL = getApiUrl();
  const pageSize = 12;

  const resolveImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/static')) return `/proxy${encodeURI(url)}`;
    return url;
  };

  useEffect(() => {
    async function loadRegions() {
      try {
        const res = await fetch(`${API_URL}/sool/regions`);
        if (res.ok) {
          const data = await res.json();
          setRegionOptions(["전체 지역", ...(data ?? [])]);
        }
      } catch (err) {
        console.error("Failed to load regions:", err);
      }
    }
    loadRegions();
  }, [API_URL]);

  useEffect(() => {
    const handler = setTimeout(() => {
      async function fetchData() {
        setLoading(true);
        let url = `${API_URL}/sool/filter?page=${page}&page_size=${pageSize}`;
        if (search && search.length >= 2) url += `&q=${encodeURIComponent(search)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (region !== "전체 지역") url += `&region=${encodeURIComponent(region)}`;
        if (sortOption) url += `&order=${sortOption}`;

        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setSool(data.items ?? []);
            setTotal(data.total ?? 0);
          }
        } catch (err) {
          console.error("Failed to fetch sool data:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, search ? 400 : 0);
    return () => clearTimeout(handler);
  }, [page, search, category, region, sortOption, API_URL]);

  // 필터 변경 핸들러 - 페이지 1로 초기화 보장
  const handleCategoryChange = (val: string) => { setCategory(val); setPage(1); };
  const handleRegionChange = (val: string) => { setRegion(val); setPage(1); };
  const handleSortChange = (val: string) => { setSortOption(val); setPage(1); };

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setRegion("전체 지역");
    setSortOption("name");
    setPage(1);
  };

  return (
    <div className="bg-[#050505] min-h-screen">
      <div className="max-w-[1600px] mx-auto py-24 px-16">
        {/* Hero Section */}
        <div className="mb-24 text-center">
          <Title className="!text-white !text-8xl !font-black !m-0 !tracking-tighter !leading-[1.1]">
            Elevate Your <span className="text-amber-500">Sense</span>
          </Title>
          <Text className="!text-white/60 !text-2xl !max-w-3xl !block !mx-auto !mt-8 !font-medium !leading-relaxed">
            Curated collection of Korea's finest traditional spirits. <br/>
            Discover <span className="text-white font-bold">{total}</span> unique flavors and their heritage.
          </Text>
        </div>

        {/* Command Center (Unified Bar) */}
        <div className="sticky top-20 z-40 mb-16">
          <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-[2rem] backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            <div className="flex-1 flex items-center px-6 gap-4">
              <SearchOutlined className="text-amber-500 text-2xl" />
              <Input
                variant="borderless"
                placeholder="Type to search spirits, brewers, or regions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="text-white h-12 text-lg font-medium placeholder:text-white/10"
              />
            </div>
            
            <div className="h-10 w-[1px] bg-white/10 mx-4" />
            
            <Space size="middle" className="pr-3">
              <Button 
                type={showFilters ? "primary" : "text"}
                icon={<ControlOutlined />} 
                onClick={() => setShowFilters(!showFilters)}
                className={[
                  "h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all",
                  showFilters ? "bg-amber-500 text-black border-none" : "text-white/40 hover:text-white hover:bg-white/5"
                ].join(" ")}
              >
                Filters
              </Button>
              <Button 
                type="text"
                icon={<ReloadOutlined />} 
                onClick={resetFilters}
                className="h-12 w-12 flex items-center justify-center text-white/20 hover:text-white transition-colors"
              />
            </Space>
          </div>

          {/* Hidden Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-8 bg-white/[0.04] border border-white/10 rounded-[2.5rem] backdrop-blur-xl grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-500 shadow-2xl">
              <div className="flex flex-col gap-3">
                <Text className="!text-amber-500 !text-[11px] !font-black !tracking-[0.3em] !uppercase !opacity-70 ml-1">Category</Text>
                <Select
                  className="w-full h-14 premium-select"
                  value={category}
                  onChange={handleCategoryChange}
                  options={CATEGORIES}
                  dropdownStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px' }}
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <Text className="!text-amber-500 !text-[11px] !font-black !tracking-[0.3em] !uppercase !opacity-70 ml-1">Origin Region</Text>
                <Select
                  className="w-full h-14 premium-select"
                  value={region}
                  onChange={handleRegionChange}
                  options={regionOptions.map((r) => ({ label: r, value: r }))}
                  dropdownStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px' }}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Text className="!text-amber-500 !text-[11px] !font-black !tracking-[0.3em] !uppercase !opacity-70 ml-1">Sort By</Text>
                <Select
                  className="w-full h-14 premium-select"
                  value={sortOption}
                  onChange={handleSortChange}
                  options={SORT_OPTIONS}
                  dropdownStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sool Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <Spin size="large" />
            <Text className="text-amber-500/40 font-black tracking-[0.3em] uppercase text-xs animate-pulse">Decrypting Vault Records</Text>
          </div>
        ) : (
          <>
            <div className="grid gap-12 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sool.map((item) => {
                const abvColor = getAbvColor(item.abv);
                const catBg = CATEGORY_COLORS[item.category] || "rgba(255,255,255,0.05)";
                const catText = CATEGORY_TEXT_COLORS[item.category] || "#888";

                return (
                  <Link href={`/sool/${item.id}`} key={item.id}>
                    <Card
                      hoverable
                      className="!bg-white/[0.04] !border-white/10 !rounded-[2.5rem] overflow-hidden h-full hover:!border-amber-500/60 transition-all duration-500 group shadow-2xl"
                      styles={{ body: { padding: 32 } }}
                    >
                      <div className="relative aspect-square bg-gradient-to-br from-neutral-900 to-black rounded-[2rem] mb-8 flex flex-col items-center justify-center overflow-hidden border border-white/10 group-hover:border-amber-500/30 transition-all shadow-inner">
                        {item.image_url ? (
                          <img 
                            src={resolveImageUrl(item.image_url) || ""} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                          />
                        ) : (
                          <div className="text-8xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] group-hover:scale-125 transition-transform duration-700">
                            {item.category === "탁주" ? "🍶" : "🥃"}
                          </div>
                        )}
                        
                        {/* Alcohol Strength Tag */}
                        <div 
                          className="absolute top-6 right-6 backdrop-blur-xl px-4 py-2 rounded-2xl border shadow-2xl"
                          style={{ 
                            backgroundColor: `${abvColor}22`,
                            borderColor: `${abvColor}44`,
                          }}
                        >
                          <Text style={{ color: abvColor }} className="font-black text-sm">{item.abv}%</Text>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Title level={3} className="!text-white !m-0 !text-2xl !font-black !tracking-tight group-hover:text-amber-500 transition-colors line-clamp-1">
                            {item.name}
                          </Title>
                          <Text className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-1 block">{item.producer || "Artisan Brewery"}</Text>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 mb-6">
                          <Badge 
                            count={item.category} 
                            style={{ 
                              backgroundColor: catBg, 
                              color: catText, 
                              borderColor: "transparent",
                              fontSize: 10,
                              fontWeight: 900,
                              letterSpacing: 1.5,
                              borderRadius: 8,
                              padding: '0 12px',
                              height: 24,
                              lineHeight: '24px'
                            }} 
                          />
                          <Badge 
                            count={item.region ?? "Unknown"} 
                            style={{ 
                              backgroundColor: "rgba(255,255,255,0.05)", 
                              color: "rgba(255,255,255,0.4)", 
                              borderColor: "rgba(255,255,255,0.1)",
                              fontSize: 10,
                              fontWeight: 900,
                              letterSpacing: 1.5,
                              borderRadius: 8,
                              padding: '0 12px',
                              height: 24,
                              lineHeight: '24px'
                            }} 
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
                        <StarOutlined className="text-amber-500/40 text-lg" />
                        <Text className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em]">Explore Profile</Text>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="flex justify-center mt-24">
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={setPage}
                showSizeChanger={false}
                className="custom-pagination"
              />
            </div>
          </>
        )}

        <div className="text-white/10 text-center py-24 mt-24 border-t border-white/5 tracking-[0.8em] font-black uppercase text-[10px]">
          SOOL — THE ESSENCE OF TRADITION
        </div>
      </div>

      <style jsx global>{`
        .premium-select .ant-select-selector { 
          background: rgba(255,255,255,0.05) !important; 
          border-color: rgba(255,255,255,0.1) !important; 
          border-radius: 14px !important;
          color: white !important;
          font-weight: 800 !important;
          padding: 0 20px !important;
          height: 56px !important;
          display: flex !important;
          align-items: center !important;
        }
        .premium-select .ant-select-selection-item { color: white !important; font-size: 15px !important; }
        .premium-select .ant-select-arrow { color: #f59e0b !important; }

        .custom-pagination .ant-pagination-item { 
          background: rgba(255,255,255,0.03) !important; 
          border-color: rgba(255,255,255,0.1) !important; 
          height: 52px !important;
          width: 52px !important;
          line-height: 50px !important;
          border-radius: 16px !important; 
        }
        .custom-pagination .ant-pagination-item a { color: rgba(255,255,255,0.3) !important; font-weight: 900 !important; }
        .custom-pagination .ant-pagination-item-active { border-color: #f59e0b !important; background: rgba(245, 158, 11, 0.1) !important; }
        .custom-pagination .ant-pagination-item-active a { color: #f59e0b !important; }
        .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
        .custom-pagination .ant-pagination-next .ant-pagination-item-link { 
          background: transparent !important; 
          color: rgba(255,255,255,0.2) !important; 
          border-color: rgba(255,255,255,0.1) !important; 
          border-radius: 16px !important; 
          height: 52px !important;
          width: 52px !important;
        }
      `}</style>
    </div>
  );
}
