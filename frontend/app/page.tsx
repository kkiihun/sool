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
  Button,
  Spin,
  Badge,
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
  const [sool, setSool] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("전체 지역");
  const [sortOption, setSortOption] = useState("name");
  const [regionOptions, setRegionOptions] = useState<string[]>(["전체 지역"]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const pageSize = 12;

  const resolveImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/static')) return `${API_URL}${encodeURI(url)}`;
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
        if (search.length >= 2) url += `&q=${encodeURIComponent(search)}`;
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
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        
        {/* Simplified Hero Section */}
        <div className="mb-16">
          <Title className="!text-white !text-5xl font-black mb-2 tracking-tight">
            Vault <span className="text-amber-500">Explorer</span>
          </Title>
          <Text className="text-white/40 text-lg font-medium">
            Accessing {total} registered spirits from across the peninsula.
          </Text>
        </div>

        {/* Command Center (Unified Bar) */}
        <div className="sticky top-20 z-40 mb-12">
          <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl">
            <div className="flex-1 flex items-center px-4 gap-3">
              <SearchOutlined className="text-amber-500 text-lg" />
              <Input
                variant="borderless"
                placeholder="Type to search spirits, brewers, or regions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="text-white h-10 text-base placeholder:text-white/20"
              />
            </div>
            
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            
            <Space size="small" className="pr-2">
              <Button 
                type={showFilters ? "primary" : "text"}
                icon={<ControlOutlined />} 
                onClick={() => setShowFilters(!showFilters)}
                className={[
                  "h-10 px-5 rounded-xl font-bold flex items-center gap-2 transition-all",
                  showFilters ? "bg-amber-500 text-black border-none" : "text-white/60 hover:text-white hover:bg-white/5"
                ].join(" ")}
              >
                Filters
              </Button>
              <Button 
                type="text"
                icon={<ReloadOutlined />} 
                onClick={resetFilters}
                className="h-10 w-10 flex items-center justify-center text-white/40 hover:text-white"
              />
            </Space>
          </div>

          {/* Hidden Filters Panel (Progressive Disclosure) */}
          {showFilters && (
            <div className="mt-3 p-6 bg-white/[0.05] border border-white/10 rounded-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Text className="text-[11px] uppercase tracking-widest font-black text-white/60 ml-1">Spirit Category</Text>
                <Select
                  className="w-full h-11 premium-select"
                  value={category}
                  onChange={handleCategoryChange}
                  options={CATEGORIES}
                  styles={{ popup: { root: { background: '#1a1a1a', border: '1px solid #333' } } }}
                />
              </div>
              
              <div className="space-y-2">
                <Text className="text-[11px] uppercase tracking-widest font-black text-white/60 ml-1">Regional Origin</Text>
                <Select
                  className="w-full h-11 premium-select"
                  value={region}
                  onChange={handleRegionChange}
                  options={regionOptions.map((r) => ({ label: r, value: r }))}
                  styles={{ popup: { root: { background: '#1a1a1a', border: '1px solid #333' } } }}
                />
              </div>

              <div className="space-y-2">
                <Text className="text-[11px] uppercase tracking-widest font-black text-white/60 ml-1">Sort Order</Text>
                <Select
                  className="w-full h-11 premium-select"
                  value={sortOption}
                  onChange={handleSortChange}
                  options={SORT_OPTIONS}
                  styles={{ popup: { root: { background: '#1a1a1a', border: '1px solid #333' } } }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sool Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Spin size="large" />
            <Text className="text-amber-500/40 font-black tracking-widest uppercase text-xs animate-pulse">Decrypting Vault Records</Text>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sool.map((item) => {
                const abvColor = getAbvColor(item.abv);
                const catBg = CATEGORY_COLORS[item.category] || "rgba(255,255,255,0.05)";
                const catText = CATEGORY_TEXT_COLORS[item.category] || "#888";

                return (
                  <Link href={`/sool/${item.id}`} key={item.id} className="group">
                    <div className="relative bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 h-full transition-all duration-500 hover:bg-white/[0.07] hover:border-white/10 hover:-translate-y-1">
                      <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white/5 to-black border border-white/5 mb-6 flex items-center justify-center">
                        {item.image_url ? (
                          <img 
                            src={resolveImageUrl(item.image_url) || ""} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="text-6xl opacity-40 group-hover:scale-110 transition-transform duration-500">
                            {item.category === "탁주" ? "🍶" : "🥃"}
                          </div>
                        )}
                        
                        {/* Alcohol Strength Tag - Dynamic Color */}
                        <div 
                          className="absolute top-4 right-4 backdrop-blur-md px-3 py-1 rounded-full border"
                          style={{ 
                            backgroundColor: `${abvColor}22`, // 20% opacity for bg
                            borderColor: `${abvColor}44`,
                          }}
                        >
                          <Text style={{ color: abvColor, fontWeight: 900, fontSize: 12 }}>{item.abv}%</Text>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Title level={4} className="!text-white !m-0 !text-xl font-bold line-clamp-1 group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </Title>
                          <Text className="text-white/20 text-xs uppercase tracking-tighter font-bold">{item.producer || "Artisan Brewery"}</Text>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            count={item.category} 
                            style={{ 
                              backgroundColor: catBg, 
                              color: catText, 
                              borderColor: "transparent",
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: 1,
                              borderRadius: 6
                            }} 
                          />
                          <Badge 
                            count={item.region ?? "Unknown"} 
                            style={{ 
                              backgroundColor: "rgba(24, 144, 255, 0.05)", 
                              color: "#91d5ff", 
                              borderColor: "transparent",
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: 1,
                              borderRadius: 6
                            }} 
                          />
                        </div>
                      </div>
                    </div>
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

        <footer className="mt-40 py-12 border-t border-white/5 text-center">
          <Text className="text-white/10 uppercase tracking-[0.5em] text-[9px] font-black">
            The Digital Archive of Traditional Spirits
          </Text>
        </footer>
      </div>

      <style jsx global>{`
        .custom-pagination .ant-pagination-item { background: transparent !important; border-color: rgba(255,255,255,0.05) !important; border-radius: 12px !important; }
        .custom-pagination .ant-pagination-item a { color: rgba(255,255,255,0.2) !important; font-weight: bold !important; }
        .custom-pagination .ant-pagination-item-active { border-color: #f59e0b !important; background: rgba(245, 158, 11, 0.1) !important; }
        .custom-pagination .ant-pagination-item-active a { color: #f59e0b !important; }
        .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
        .custom-pagination .ant-pagination-next .ant-pagination-item-link { background: transparent !important; color: rgba(255,255,255,0.2) !important; border-color: rgba(255,255,255,0.05) !important; border-radius: 12px !important; }
        
        .premium-select .ant-select-selector { 
          background: rgba(255,255,255,0.05) !important; 
          border-color: rgba(255,255,255,0.1) !important; 
          border-radius: 12px !important;
          color: rgba(255,255,255,0.9) !important;
          font-weight: 600 !important;
        }
        .premium-select .ant-select-selection-item {
          color: rgba(255,255,255,0.9) !important;
        }
        .ant-select-arrow { color: rgba(255,255,255,0.4) !important; }
      `}</style>
    </div>
  );
}
