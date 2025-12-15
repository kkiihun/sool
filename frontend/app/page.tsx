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
import TastingPage from "@/app/Tasting/page";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);

  const [sool, setSool] = useState([]);
  const [total, setTotal] = useState(0);

  const [recentReviews, setRecentReviews] = useState([]); // 🔥 최신 리뷰 UI 상태 추가
  const [ratings, setRatings] = useState({});           // 🔥 술별 평점 요약 저장

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("전체");
  const [sortOption, setSortOption] = useState("name");

  const [regionOptions, setRegionOptions] = useState(["전체"]);
  const [loading, setLoading] = useState(false);

  const pageSize = 24;

  // 📌 지역 목록 불러오기
  useEffect(() => {
    async function loadRegions() {
      const res = await fetch("http://127.0.0.1:8000/sool/regions");
      const data = await res.json();
      setRegionOptions(data);
    }
    loadRegions();
  }, []);

  // 📌 최신 리뷰 불러오기
  const fetchRecentReviews = async () => {
  try {
    const res = await fetch("http://127.0.0.1:8000/review/latest?limit=5");
    const data = await res.json();

    // 응답이 배열인지 아닌지 체크해서 저장
    setRecentReviews(
      Array.isArray(data) ? data : data.items ?? []
    );
  } catch (e) {
    console.log("리뷰 API 실패 → Mock 사용");
    setRecentReviews([
      { id: 1, sool_name: "Mock 술", rating: 5, notes: "테스트 리뷰 입니다." },
    ]);
  }
};


  // 📌 첫 로드 시 최신 리뷰 가져옴
  useEffect(() => {
    fetchRecentReviews();
  }, []);

  // 📌 전통주 데이터 불러오기
  const fetchData = async () => {
    setLoading(true);

    let url = `http://127.0.0.1:8000/sool/filter?page=${page}&page_size=${pageSize}`;

    if (search.length >= 2) url += `&q=${search}`;
    if (category) url += `&category=${category}`;
    if (region !== "전체") url += `&region=${region}`;
    if (sortOption) url += `&order=${sortOption}`;

    const res = await fetch(url);
    const data = await res.json();

    setSool(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

   // ⭐ 각 술의 리뷰 요약(평균, 개수) 불러오기
  const fetchSummary = async (soolId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/review/summary/${soolId}`);
      const data = await res.json();
      setRatings((prev) => ({
        ...prev,
        [soolId]: data,
      }));
    } catch (e) {
      console.error("summary 불러오기 실패", e);
    }
  };

  // ⭐ sool 목록이 변경될 때 summary 호출
useEffect(() => {
  if (!sool || sool.length === 0) return;

  console.log("📌 sool 목록 불러옴:", sool);

  sool.forEach((item) => {
    const id = item.sool_id ?? item.id; // 안전한 ID 매핑

    console.log("⏳ summary 요청:", id);

    if (!ratings[id]) {
      fetchSummary(id);
    }
  });
}, [sool]);

  // 📌 필터/검색/페이지 변경 시 술 목록 다시 로딩
  useEffect(() => {
    fetchData();
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
      {/* ---- Sidebar ---- */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(v) => setCollapsed(v)}
        theme="dark"
        style={{
          background: "#111",
          borderRight: "1px solid #333",
        }}
      >

               {/* 🔥 로고 클릭 시 홈("/")으로 이동 */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <div
              style={{
                color: "#fff",
                padding: 20,
                fontSize: collapsed ? 18 : 22,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
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
              { key: "3", icon: <StarOutlined />, label: <Link href="/Tasting">Tasting</Link> },
              { key: "4", icon: <BarChartOutlined />, label: <Link href="/dashboard">Analytics</Link>,},
              { key: "5", icon: <HeartOutlined />, label: <Link href="/community">Community</Link> },
            ]}

        />
      </Sider>

      {/* ---- Main Layout ---- */}
      <Layout>
        {/* Header */}
        <Header
          style={{
            background: "#111",
            borderBottom: "1px solid #333",
            padding: "15px 30px",
          }}
        >
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="전통주 검색…"
              value={search}
              style={{ width: 350, background: "#1a1a1a", color: "#fff" }}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <Space>
              <Select
                style={{ width: 140 }}
                value={category}
                onChange={(v) => setCategory(v)}
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
                onChange={(v) => setRegion(v)}
                options={regionOptions.map((r) => ({ label: r, value: r }))}
              />

              <Select
                style={{ width: 160 }}
                value={sortOption}
                onChange={(v) => setSortOption(v)}
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

        {/* ---- Content ---- */}
        <Content style={{ padding: 30, background: "#000" }}>
          {/* 상단 텍스트 */}
          <div style={{ marginBottom: 16 }}>
            <Title level={3} style={{ color: "#fff", marginBottom: 4 }}>
              전통주 탐색
            </Title>
            <Text style={{ color: "#aaa" }}>
              총 <span style={{ color: "#fff", fontWeight: 600 }}>{total}</span>종
            </Text>
          </div>

          {/* 🔥 최신 리뷰 표시 */}
          <div
            style={{
              marginBottom: 25,
              padding: "20px",
              background: "#111",
              borderRadius: 10,
              border: "1px solid #333",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>
                📌 최근 리뷰
              </Text>

              <Link href="/reviews" style={{ color: "#6aaaff", fontSize: 13 }}>
                전체 보기 →
              </Link>
            </div>

            {recentReviews.length === 0 ? (
              <Text style={{ color: "#777" }}>리뷰 없음</Text>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                }}
              >
                {recentReviews.map((r: any) => (
                  <Card
                    key={r.id}
                    hoverable
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: 10,
                    }}
                  >
                    <Link href={`/sool/${r.sool_id ?? ""}`}>
                      <div style={{ fontWeight: 600, marginBottom: 6, color: "#fff" }}>
                        {r.sool_name}
                      </div>
                    </Link>

                    <div style={{ color: "#ffc107", marginBottom: 6 }}>
                      ⭐ {r.rating}/5
                    </div>

                    <Text style={{ color: "#bbb" }}>
                      {r.notes?.slice(0, 50)}...
                    </Text>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 🔥 전통주 카드 목록 */}
          {loading ? (
            <div style={{ textAlign: "center", marginTop: 60 }}>
              <Spin size="large" />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 20,
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              }}
            >
              {sool.map((item: any) => (
                <Card
                  key={item.id}
                  hoverable
                  style={{
                    background: "#1a1a1a",
                    borderColor: "#333",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                >
                  <Link href={`/sool/${item.id}`} style={{ textDecoration: "none" }}>
                    <Title level={5} style={{ color: "#fff", marginBottom: 4 }}>
                      {item.name}
                    </Title>

                      {/* ⭐ 평균 별점 표시 */}
                    {ratings[item.id] && ratings[item.id].count > 0 ? (
                      <Text
                        style={{
                          color: "#ffc107",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        ⭐ {ratings[item.id].avg} / 5 ({ratings[item.id].count})
                      </Text>
                    ) : (
                      <Text
                        style={{
                          color: "#555",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        ⭐ 평가 없음
                      </Text>
                    )}

                    <Text style={{ color: "#bbb" }}>🍶 도수: {item.abv}%</Text>
                    <br />
                    <Text style={{ color: "#bbb" }}>
                      📍 지역: {item.region ?? "미등록"}
                    </Text>
                  </Link>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <Pagination
              current={page}
              total={total}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </Content>

        {/* Footer */}
        <Footer
          style={{
            textAlign: "center",
            background: "#111",
            color: "#555",
            padding: "14px 0",
            borderTop: "1px solid #222",
          }}
        >
          <div>Sool — Powered by Sense Journey</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#777" }}>
            v0.2.0 Alpha • Last Updated: 2025-12-10
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
}
