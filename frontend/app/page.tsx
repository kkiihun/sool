"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Select,
  Card,
  Typography,
  Pagination,
  Space,
  Spin,
  Badge,
} from "antd";
import {
  StarOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "./components/AuthProvider";
import { useAppShell } from "./components/AppShellProvider";

const { Title, Text } = Typography;

const CATEGORIES = [
  { label: "전체", value: "" },
  { label: "막걸리", value: "막걸리" },
  { label: "약주", value: "약주" },
  { label: "청주", value: "청주" },
  { label: "증류주", value: "증류주" },
  { label: "과실주", value: "과실주" },
];

const SORT_OPTIONS = [
  { label: "이름순", value: "name" },
  { label: "도수 낮은순", value: "abv_low" },
  { label: "도수 높은순", value: "abv_high" },
];

export default function Home() {
  const { user } = useAuth();
  const { search, setSearch } = useAppShell();
  const [sool, setSool] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("전체");
  const [sortOption, setSortOption] = useState("name");
  const [regionOptions, setRegionOptions] = useState<string[]>(["전체"]);
  const [loading, setLoading] = useState(false);
  
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
        const res = await fetch(`${API_URL}/sool/regions`, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setRegionOptions(["전체", ...(data ?? [])]);
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
        if (region !== "전체") url += `&region=${encodeURIComponent(region)}`;
        if (sortOption) url += `&order=${sortOption}`;

        try {
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
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

  return (
    <div className="bg-[#050505] min-h-full">
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

        {/* Advanced Filter Control Center */}
        <div className="mb-16 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <Space size={48} className="flex-wrap">
              {/* Category Filter */}
              <div className="flex flex-col gap-3">
                <Text className="!text-amber-500 !text-[11px] !font-black !tracking-[0.3em] !uppercase !opacity-70">Category</Text>
                <Select
                  variant="borderless"
                  className="custom-filter-select w-48"
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES}
                  classNames={{ popup: { root: "custom-select-dropdown" } }}
                />
              </div>

              {/* Region Filter */}
              <div className="flex flex-col gap-3">
                <Text className="!text-amber-500 !text-[11px] !font-black !tracking-[0.3em] !uppercase !opacity-70">Region Origin</Text>
                <Select
                  variant="borderless"
                  className="custom-filter-select w-56"
                  value={region}
                  onChange={setRegion}
                  options={regionOptions.map((r) => ({ label: r, value: r }))}
                  classNames={{ popup: { root: "custom-select-dropdown" } }}
                />
              </div>

              {/* Sort Control */}
              <div className="flex flex-col gap-3">
                <Text className="!text-amber-500 !text-[11px] !font-black !tracking-[0.3em] !uppercase !opacity-70">Sort By</Text>
                <Select
                  variant="borderless"
                  className="custom-filter-select w-48"
                  value={sortOption}
                  onChange={setSortOption}
                  options={SORT_OPTIONS}
                  classNames={{ popup: { root: "custom-select-dropdown" } }}
                />
              </div>
            </Space>

            <div className="flex flex-col items-end gap-2 bg-white/5 p-4 px-6 rounded-2xl border border-white/5">
              <Text className="!text-white/30 !text-[10px] !font-black !tracking-widest !uppercase">Matched Archive</Text>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white leading-none">{total}</span>
                <span className="text-amber-500 font-bold text-sm">SPIRITS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sool Grid */}
        {loading ? (
          <div className="flex justify-center py-32">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="grid gap-12 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sool.map((item) => (
                <Link href={`/sool/${item.id}`} key={item.id}>
                  <Card
                    hoverable
                    className="!bg-white/[0.04] !border-white/10 !rounded-[2.5rem] overflow-hidden h-full hover:!border-amber-500/60 transition-all duration-500 group shadow-2xl"
                    styles={{ body: { padding: 32 } }}
                  >
                    <div className="w-full aspect-square bg-gradient-to-br from-neutral-900 to-black rounded-[2rem] mb-8 flex flex-col items-center justify-center relative overflow-hidden border border-white/10 group-hover:border-amber-500/30 transition-all shadow-inner">
                      {item.image_url ? (
                        <img 
                          src={resolveImageUrl(item.image_url) || ""} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                        />
                      ) : (
                        <div className="text-8xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)] group-hover:scale-125 transition-transform duration-700">
                          {item.category === "막걸리" ? "🍶" : "🥃"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-3">
                      <Title level={3} className="!text-white !m-0 !text-2xl !font-black !tracking-tight group-hover:text-amber-500 transition-colors">{item.name}</Title>
                      <Text className="!text-amber-500 !font-black !text-xl">{item.abv}%</Text>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5 mb-6">
                      <Badge count={item.category} className="custom-large-badge" />
                      <Badge count={item.region ?? "미등록"} className="custom-large-badge" />
                    </div>
                    
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                      <StarOutlined className="text-amber-500/40 text-lg" />
                      <Text className="text-white/40 text-[13px] font-bold uppercase tracking-widest">Explore Profile</Text>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-24">
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          </>
        )}

        <div className="!bg-transparent text-white/20 text-center py-24 mt-24 border-t border-white/5 tracking-[0.8em] font-black uppercase text-sm">
          SOOL — THE ESSENCE OF TRADITION
        </div>
      </div>

      <style jsx global>{`
        /* --- Filter Visibility Fix --- */
        .custom-filter-select.ant-select .ant-select-selector {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 14px !important;
          height: 56px !important;
          padding: 0 24px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: flex !important;
          align-items: center !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
        }
        
        .custom-filter-select.ant-select:hover .ant-select-selector {
          border-color: #f59e0b !important;
          background: rgba(255,255,255,0.1) !important;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15) !important;
        }

        /* Essential: Force White Text */
        .custom-filter-select.ant-select .ant-select-selection-item,
        .custom-filter-select.ant-select .ant-select-selection-placeholder,
        .custom-filter-select.ant-select .ant-select-selection-search-input {
          color: #ffffff !important;
          font-size: 17px !important;
          font-weight: 800 !important;
          letter-spacing: -0.02em !important;
        }

        .custom-filter-select.ant-select .ant-select-arrow {
          color: #f59e0b !important;
          font-size: 14px !important;
        }

        /* Dropdown Menu Styling */
        .custom-select-dropdown {
          background: #121212 !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 18px !important;
          padding: 10px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
          backdrop-filter: blur(20px) !important;
          z-index: 1000 !important;
        }

        .custom-select-dropdown .ant-select-item {
          color: rgba(255,255,255,0.7) !important;
          border-radius: 10px !important;
          margin-bottom: 6px !important;
          padding: 12px 18px !important;
          font-weight: 600 !important;
          transition: all 0.2s !important;
        }

        .custom-select-dropdown .ant-select-item-option-selected {
          background: rgba(245, 158, 11, 0.2) !important;
          color: #f59e0b !important;
          font-weight: 800 !important;
        }

        .custom-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-selected) {
          background: rgba(255,255,255,0.06) !important;
          color: #ffffff !important;
        }

        /* --- Global Enhancements --- */
        .custom-large-badge .ant-scroll-number {
          background: rgba(255,255,255,0.1) !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          padding: 4px 14px !important;
          height: auto !important;
          line-height: 1.4 !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        
        .ant-pagination-item {
          background: rgba(255,255,255,0.03) !important;
          border-color: rgba(255,255,255,0.1) !important;
          height: 52px !important;
          width: 52px !important;
          line-height: 50px !important;
          border-radius: 14px !important;
          transition: all 0.3s !important;
        }
        
        .ant-pagination-item a {
          color: rgba(255,255,255,0.5) !important;
          font-size: 17px !important;
          font-weight: 700 !important;
        }
        
        .ant-pagination-item-active {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
        }
        
        .ant-pagination-item-active a {
          color: #f59e0b !important;
        }
      `}</style>
    </div>
  );
}
