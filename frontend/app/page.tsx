"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  Badge,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  HeartOutlined,
  StarOutlined,
  CompassOutlined,
  ReloadOutlined,
  BarChartOutlined,
  FilterOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "./components/AuthProvider";

const { Sider, Header, Content, Footer } = Layout;
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [sool, setSool] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("전체");
  const [sortOption, setSortOption] = useState("name");
  const [regionOptions, setRegionOptions] = useState<string[]>(["전체"]);
  const [loading, setLoading] = useState(false);
  
  const getApiUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl;
    return "http://127.0.0.1:8000";
  };

  const API_URL = getApiUrl();
  const pageSize = 12;

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
        if (search.length >= 2) url += `&q=${encodeURIComponent(search)}`;
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

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setRegion("전체");
    setSortOption("name");
    setPage(1);
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
        style={{ 
          background: "#0a0a0a", 
          borderRight: "1px solid #222",
          position: "fixed",
          height: "100vh",
          left: 0,
          zIndex: 100,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ 
            height: 80, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            borderBottom: "1px solid #222",
            marginBottom: 20
          }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 28 }}>🥃</span>
              {!collapsed && <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: 1.5 }}>SOOL</span>}
            </Link>
          </div>

          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={["explore"]}
            style={{ background: "transparent", border: "none" }}
            items={[
              { key: "explore", icon: <AppstoreOutlined />, label: "Explore" },
              { key: "tasting", icon: <StarOutlined />, label: <Link href="/Tasting">Tasting Notes</Link> },
              { key: "analytics", icon: <BarChartOutlined />, label: <Link href="/dashboard">Analytics</Link> },
              { key: "updates", icon: <CompassOutlined />, label: <Link href="/updates">Discovery</Link> },
              { key: "community", icon: <HeartOutlined />, label: <Link href="/community">Community</Link> },
              ...(user ? [
                { key: "profile", icon: <UserOutlined />, label: <Link href="/profile">My Page</Link> }
              ] : []),
              ...(user?.is_admin ? [
                { key: "divider", type: "divider" as const, style: { backgroundColor: "#222" } },
                { key: "admin", icon: <AppstoreOutlined />, label: <Link href="/admin">Admin Dashboard</Link> }
              ] : []),
            ]}
          />
        </div>

        <div style={{ 
          padding: "20px", 
          borderTop: "1px solid #222", 
          marginBottom: 40,
          textAlign: collapsed ? "center" : "left" 
        }}>
          {user ? (
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              {!collapsed && (
                <div>
                  <Text style={{ color: "#fff", display: "block", fontWeight: 600 }}>{user.username}</Text>
                  <Text style={{ color: "#444", fontSize: 12 }}>{user.email}</Text>
                </div>
              )}
              <Button 
                type="text" 
                danger 
                icon={<LockOutlined />} 
                onClick={logout}
                block={!collapsed}
                style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", padding: 0 }}
              >
                {!collapsed && "Logout"}
              </Button>
            </Space>
          ) : (
            <Link href="/login">
              <Button 
                type="primary" 
                block={!collapsed}
                icon={<UserOutlined />}
                style={{ 
                  background: "#d4af37", 
                  color: "#000", 
                  border: "none", 
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {!collapsed && "Sign In"}
              </Button>
            </Link>
          )}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, background: "transparent", transition: "all 0.2s" }}>
        <Header style={{ 
          background: "rgba(10, 10, 10, 0.9)", 
          backdropFilter: "blur(20px)",
          padding: "0 40px",
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #333",
          position: "sticky",
          top: 0,
          zIndex: 90
        }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#d4af37" }} />}
            placeholder="Search traditional sool..."
            value={search}
            style={{ 
              width: 400, 
              background: "#1a1a1a", 
              borderRadius: 12, 
              padding: "10px 18px",
              color: "#fff",
              border: "1px solid #444"
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(page); // keep page or reset to 1
            }}
          />

          <Space size="middle">
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={resetFilters} 
              style={{ color: "#888" }}
            />
            <div style={{ width: 1, height: 20, background: "#333" }} />
            <Text style={{ color: "#fff", fontWeight: 500 }}>{user ? user.username : "Guest User"}</Text>
            <Badge dot color={user ? "#52c41a" : "#d4af37"}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#333", border: "1px solid #444", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserOutlined style={{ color: user ? "#fff" : "#666" }} />
              </div>
            </Badge>
          </Space>
        </Header>

        <Content style={{ padding: "60px 80px" }}>
          {/* Hero Section */}
          <div style={{ marginBottom: 80, position: "relative", textAlign: "center" }}>
            <Title style={{ color: "#fff", fontSize: 64, fontWeight: 900, margin: 0, letterSpacing: -1 }}>
              Elevate Your <span style={{ color: "#d4af37" }}>Sense</span>
            </Title>
            <Text style={{ color: "#666", fontSize: 20, maxWidth: 700, display: "block", margin: "16px auto 0" }}>
              Curated collection of Korea's finest traditional spirits. 
              Explore {total} unique flavors and their heritage.
            </Text>
          </div>

          {/* Filter Bar */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 48,
            background: "#111",
            padding: "16px 32px",
            borderRadius: 16,
            border: "1px solid #222",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>
            <Space size="large">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FilterOutlined style={{ color: "#d4af37" }} />
                <Select
                  variant="borderless"
                  style={{ width: 140, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES}
                  styles={{ popup: { root: { background: "#1a1a1a", border: "1px solid #333" } } }}
                />
              </div>
                <Select
                  variant="borderless"
                  style={{ width: 160, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}
                  value={region}
                  onChange={setRegion}
                  options={regionOptions.map((r) => ({ label: r, value: r }))}
                  styles={{ popup: { root: { background: "#1a1a1a", border: "1px solid #333" } } }}
                />
            </Space>

            <Select
              variant="borderless"
              style={{ width: 160, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}
              value={sortOption}
              onChange={setSortOption}
              options={SORT_OPTIONS}
              styles={{ popup: { root: { background: "#1a1a1a", border: "1px solid #333" } } }}
            />
          </div>

          {/* Sool Grid */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div style={{ 
                display: "grid", 
                gap: 32, 
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" 
              }}>
                {sool.map((item) => (
                  <Link href={`/sool/${item.id}`} key={item.id}>
                    <Card
                      hoverable
                      style={{ 
                        background: "#111", 
                        border: "1px solid #222",
                        borderRadius: 20,
                        overflow: "hidden",
                        height: "100%",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                      styles={{ body: { padding: 28 } }}
                    >
                      <div style={{ 
                        width: "100%", 
                        aspectRatio: "1/1", 
                        background: "linear-gradient(135deg, #1a1a1a 0%, #050505 100%)", 
                        borderRadius: 16,
                        marginBottom: 24,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        border: "1px solid #222"
                      }}>
                        <div style={{ fontSize: 64, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.8))" }}>
                          {item.category === "막걸리" ? "🍶" : "🥃"}
                        </div>
                        <div style={{ 
                          position: "absolute", 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          height: "40%", 
                          background: "linear-gradient(to top, rgba(212,175,55,0.05), transparent)" 
                        }} />
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <Title level={4} style={{ color: "#fff", margin: 0, fontSize: 20 }}>{item.name}</Title>
                        <Text style={{ color: "#d4af37", fontWeight: 600 }}>{item.abv}%</Text>
                      </div>
                      
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <Badge count={item.category} style={{ backgroundColor: "#222", color: "#888", border: "none" }} />
                        <Badge count={item.region ?? "미등록"} style={{ backgroundColor: "#222", color: "#888", border: "none" }} />
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <StarOutlined style={{ color: "#666" }} />
                        <Text style={{ color: "#666" }}>Not rated yet</Text>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
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
        </Content>

        <Footer style={{ 
          background: "transparent", 
          color: "#444", 
          textAlign: "center", 
          padding: "40px 0",
          borderTop: "1px solid #222",
          marginTop: 60
        }}>
          SOOL — THE ESSENCE OF TRADITION
        </Footer>
      </Layout>

      <style jsx global>{`
        .ant-layout-sider-trigger {
          background: #111 !important;
        }
        .ant-menu-item-selected {
          background-color: #1a1a1a !important;
          color: #d4af37 !important;
        }
        .ant-menu-item:hover {
          color: #d4af37 !important;
        }
        .ant-pagination-item-active {
          border-color: #d4af37 !important;
          background: transparent !important;
        }
        .ant-pagination-item-active a {
          color: #d4af37 !important;
        }
        .ant-pagination-item:hover {
          border-color: #d4af37 !important;
        }
        .ant-pagination-item:hover a {
          color: #d4af37 !important;
        }
        .ant-select-selector {
          color: #fff !important;
        }
        .ant-select-arrow {
          color: #666 !important;
        }
      `}</style>
    </Layout>
  );
}
