"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Input,
  Select,
  Card,
  Typography,
  Pagination,
  Space,
  Button,
  Spin,
  Alert,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  HeartOutlined,
  StarOutlined,
  CompassOutlined,
  ReloadOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);

  const [sool, setSool] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("전체");
  const [sortOption, setSortOption] = useState("name");

  const [regionOptions, setRegionOptions] = useState<string[]>(["전체"]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pageSize = 24;

  // env 기반 백엔드 주소 (fallback용)
  const API_BASE = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    return base ? base.replace(/\/+$/, "") : "";
  }, []);

  /**
   * 우선: 같은 도메인 상대경로(Next rewrites로 프록시되면 CORS 없이 안전)
   * 실패 시: env(API_BASE)로 직접 호출 fallback
   */
  async function fetchJsonWithFallback(path: string) {
    // 1) same-origin (requires rewrites to backend)
    try {
      const r1 = await fetch(path, { cache: "no-store" });
      if (r1.ok) return await r1.json();
      // rewrites가 없으면 여기서 404/500 등이 날 수 있음 → fallback
    } catch {
      // 네트워크/CORS 등 → fallback
    }

    // 2) fallback to direct backend
    if (!API_BASE) {
      throw new Error(
        `API_BASE is missing. Set NEXT_PUBLIC_API_BASE_URL or configure Next rewrites for "${path}".`
      );
    }
    const r2 = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!r2.ok) {
      throw new Error(`Backend request failed: ${r2.status} ${r2.statusText}`);
    }
    return await r2.json();
  }

  /* =========================
     지역 목록
  ========================= */
  useEffect(() => {
    let alive = true;

    async function loadRegions() {
      try {
        setErrorMsg(null);
        const data = await fetchJsonWithFallback("/sool/regions");
        if (!alive) return;
        setRegionOptions(["전체", ...(data ?? [])]);
      } catch (e: any) {
        if (!alive) return;
        setRegionOptions(["전체"]);
        setErrorMsg(e?.message ?? "지역 목록을 불러오지 못했습니다.");
      }
    }

    loadRegions();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     최신 리뷰 (Mock 고정)
  ========================= */
  useEffect(() => {
    setRecentReviews([
      {
        id: 1,
        sool_id: 1,
        sool_name: "Mock 술",
        rating: 5,
        notes: "테스트 리뷰입니다.",
      },
    ]);
  }, []);

  /* =========================
     전통주 목록
  ========================= */
  useEffect(() => {
    let alive = true;

    async function fetchData() {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));

      if (search.trim().length >= 2) params.set("q", search.trim());
      if (category) params.set("category", category);
      if (region !== "전체") params.set("region", region);
      if (sortOption) params.set("order", sortOption);

      const path = `/sool/filter?${params.toString()}`;

      try {
        const data = await fetchJsonWithFallback(path);
        if (!alive) return;
        setSool(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (e: any) {
        if (!alive) return;
        setSool([]);
        setTotal(0);
        setErrorMsg(e?.message ?? "전통주 목록을 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    fetchData();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category, region, sortOption]);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setRegion("전체");
    setSortOption("name");
    setPage(1);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{ background: "#111" }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ color: "#fff", padding: 20, fontSize: 22 }}>
            🥃 {collapsed ? "" : "Sool"}
          </div>
        </Link>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={[
            { key: "1", icon: <AppstoreOutlined />, label: <Link href="/about">About</Link> },
            { key: "2", icon: <CompassOutlined />, label: <Link href="/updates">Updates</Link> },
            { key: "3", icon: <StarOutlined />, label: <Link href="/tasting">Tasting</Link> },
            { key: "4", icon: <BarChartOutlined />, label: <Link href="/dashboard">Analytics</Link> },
            { key: "5", icon: <HeartOutlined />, label: <Link href="/community">Community</Link> },
            { key: "6", icon: <AppstoreOutlined />, label: <Link href="/admin/tasting/list">Tasting Admin</Link> },
          ]}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header style={{ background: "#111", padding: "15px 30px" }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="전통주 검색…"
              value={search}
              style={{ width: 350 }}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <Space>
              <Select
                style={{ width: 140 }}
                value={category}
                onChange={setCategory}
                options={[
                  { label: "전체", value: "" },
                  { label: "막걸리", value: "막걸리" },
                  { label: "약주", value: "약주" },
                  { label: "증류주", value: "증류주" },
                ]}
              />

              <Select
                style={{ width: 160 }}
                value={region}
                onChange={setRegion}
                options={regionOptions.map((r) => ({ label: r, value: r }))}
              />

              <Select
                style={{ width: 160 }}
                value={sortOption}
                onChange={setSortOption}
                options={[
                  { label: "이름순", value: "name" },
                  { label: "도수 낮은순", value: "abv_low" },
                  { label: "도수 높은순", value: "abv_high" },
                ]}
              />

              <Button icon={<ReloadOutlined />} onClick={resetFilters} />
            </Space>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ padding: 30, background: "#000" }}>
          <Title level={3} style={{ color: "#fff" }}>
            전통주 탐색
          </Title>

          <Text style={{ color: "#aaa", display: "block", marginBottom: 20 }}>
            총 <span style={{ color: "#fff", fontWeight: 600 }}>{total}</span>종
          </Text>

          {/* 에러 표시 */}
          {errorMsg && (
            <div style={{ marginBottom: 16 }}>
              <Alert
                type="error"
                showIcon
                message="API 호출 실패"
                description={
                  <div style={{ wordBreak: "break-word" }}>
                    {errorMsg}
                    <div style={{ marginTop: 8, color: "#666" }}>
                      (팁) 3000은 되는데 3001만 실패하면 백엔드 CORS 또는 Next rewrites 미설정일 가능성이 큽니다.
                    </div>
                  </div>
                }
              />
            </div>
          )}

          {/* 최근 리뷰 */}
          <div style={{ marginBottom: 30, padding: 20, background: "#111" }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>📌 최근 리뷰</Text>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {recentReviews.map((r) => (
                <Card key={r.id} style={{ background: "#1a1a1a" }}>
                  <Text style={{ color: "#fff" }}>{r.sool_name}</Text>
                  <div style={{ color: "#ffc107" }}>⭐ {r.rating}/5</div>
                  <Text style={{ color: "#aaa" }}>{r.notes}</Text>
                </Card>
              ))}
            </div>
          </div>

          {/* 전통주 목록 */}
          {loading ? (
            <Spin size="large" />
          ) : (
            <div
              style={{
                display: "grid",
                gap: 20,
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              }}
            >
              {sool.map((item) => (
                <Card key={item.id} style={{ background: "#1a1a1a" }}>
                  <Link href={`/sool/${item.id}`}>
                    <Title level={5} style={{ color: "#fff" }}>
                      {item.name}
                    </Title>
                  </Link>
                  <Text style={{ color: "#555" }}>⭐ 평가 없음</Text>
                  <br />
                  <Text style={{ color: "#bbb" }}>🍶 도수: {item.abv}%</Text>
                  <br />
                  <Text style={{ color: "#bbb" }}>📍 지역: {item.region ?? "미등록"}</Text>
                </Card>
              ))}
            </div>
          )}

          <Pagination
            style={{ marginTop: 40, textAlign: "center" }}
            current={page}
            total={total}
            pageSize={pageSize}
            onChange={setPage}
            showSizeChanger={false}
          />
        </Content>

        <Footer style={{ background: "#111", color: "#777", textAlign: "center" }}>
          Sool — Powered by Sense Journey
        </Footer>
      </Layout>
    </Layout>
  );
}
