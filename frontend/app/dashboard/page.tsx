"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Statistic,
  Empty,
  Space,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  ExperimentOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const COLORS = ["#d4af37", "#aa8e2e", "#816d23", "#584c18", "#302b0d"];
const RADAR_COLORS = ["#d4af37", "#52c41a", "#1890ff", "#f5222d", "#722ed1"];

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_URL}/sool/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [API_URL]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0a0a0a" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Radar Data Transformation
  // Expected format: [{ subject: '단맛', '탁주': 4, '약주': 2 }, ...]
  const subjects = [
    { key: 'aroma', label: 'Aroma' },
    { key: 'sweetness', label: 'Sweetness' },
    { key: 'acidity', label: 'Acidity' },
    { key: 'body', label: 'Body' },
    { key: 'finish', label: 'Finish' }
  ];

  const radarData = subjects.map(s => {
    const item: any = { subject: s.label };
    stats.flavor_stats?.forEach((cat: any) => {
      item[cat.category] = cat[s.key];
    });
    return item;
  });

  const categories = stats.flavor_stats?.map((f: any) => f.category) || [];

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
          zIndex: 100
        }}
      >
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
          selectedKeys={["analytics"]}
          style={{ background: "transparent", border: "none" }}
          items={[
            { key: "explore", icon: <AppstoreOutlined />, label: <Link href="/">Explore</Link> },
            { key: "tasting", icon: <StarOutlined />, label: <Link href="/Tasting">Tasting Notes</Link> },
            { key: "analytics", icon: <BarChartOutlined />, label: "Analytics" },
            { key: "updates", icon: <CompassOutlined />, label: <Link href="/updates">Updates</Link> },
            { key: "community", icon: <HeartOutlined />, label: <Link href="/community">Community</Link> },
          ]}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, background: "transparent", transition: "all 0.2s" }}>
        <Header style={{ 
          background: "rgba(10, 10, 10, 0.8)", 
          backdropFilter: "blur(10px)",
          padding: "0 40px",
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #222",
          position: "sticky",
          top: 0,
          zIndex: 90
        }}>
          <Title level={4} style={{ color: "#fff", margin: 0 }}>Analytics Dashboard</Title>
          <Text style={{ color: "#666" }}>Market Insights & Data</Text>
        </Header>

        <Content style={{ padding: "40px 60px" }}>
          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>Market <span style={{ color: "#d4af37" }}>Overview</span></Title>
            <Text style={{ color: "#888" }}>Comprehensive data analysis of Korean traditional spirits.</Text>
          </div>

          {/* KPI Row */}
          <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
            {[
              { title: "Total Varieties", value: stats.total_sool, icon: <DatabaseOutlined />, suffix: "Items" },
              { title: "Average ABV", value: stats.avg_abv, icon: <ExperimentOutlined />, suffix: "%" },
              { title: "Consumer Reviews", value: stats.total_reviews, icon: <StarOutlined />, suffix: "Notes" },
              { title: "Sourcing Regions", value: stats.region_distribution?.length || 0, icon: <GlobalOutlined />, suffix: "Areas" },
            ].map((kpi, idx) => (
              <Col xs={24} sm={12} lg={6} key={idx}>
                <Card 
                  style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}
                  styles={{ body: { padding: "24px" } }}
                >
                  <Statistic
                    title={<span style={{ color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{kpi.title}</span>}
                    value={kpi.value}
                    precision={idx === 1 ? 1 : 0}
                    styles={{ content: { color: "#fff", fontSize: 28, fontWeight: 700 } }}
                    prefix={<span style={{ color: "#d4af37", marginRight: 12 }}>{kpi.icon}</span>}
                    suffix={<span style={{ fontSize: 14, color: "#444", marginLeft: 8 }}>{kpi.suffix}</span>}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            {/* Category Flavor Profile Comparison */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <RadarChartOutlined style={{ color: '#d4af37' }} />
                    <span style={{ color: "#fff" }}>Flavor Profile by Category</span>
                  </Space>
                }
                style={{ background: "#111", border: "1px solid #222", borderRadius: 20 }}
                styles={{ header: { borderBottom: "1px solid #222" } }}
              >
                <div style={{ height: 400, width: "100%" }}>
                  {categories.length > 0 ? (
                    <ResponsiveContainer>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        {categories.map((cat: string, index: number) => (
                          <Radar
                            key={cat}
                            name={cat}
                            dataKey={cat}
                            stroke={RADAR_COLORS[index % RADAR_COLORS.length]}
                            fill={RADAR_COLORS[index % RADAR_COLORS.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Tooltip 
                          contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
                          itemStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 20 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Empty description={<Text style={{ color: '#444' }}>No flavor data available yet</Text>} />
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={<span style={{ color: "#fff" }}>Category Breakdown</span>}
                style={{ background: "#111", border: "1px solid #222", borderRadius: 20 }}
                styles={{ header: { borderBottom: "1px solid #222" } }}
              >
                <div style={{ height: 400, width: "100%" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={stats.category_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.category_distribution?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(value) => <span style={{ color: "#888" }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card
                title={<span style={{ color: "#fff" }}>Regional Sourcing Map (Top 10 Regions)</span>}
                style={{ background: "#111", border: "1px solid #222", borderRadius: 20 }}
                styles={{ header: { borderBottom: "1px solid #222" } }}
              >
                <div style={{ height: 350, width: "100%" }}>
                  <ResponsiveContainer>
                    <BarChart data={stats.region_distribution} layout="vertical" margin={{ left: 20, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                      <XAxis type="number" stroke="#444" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                      <Tooltip 
                        contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
                        itemStyle={{ color: "#d4af37" }}
                      />
                      <Bar dataKey="value" fill="#d4af37" radius={[0, 4, 4, 0]} barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </Content>

        <Footer style={{ 
          background: "transparent", 
          color: "#444", 
          textAlign: "center", 
          padding: "40px 0",
          borderTop: "1px solid #222",
          marginTop: 60
        }}>
          SOOL ANALYTICS — DATA DRIVEN HERITAGE
        </Footer>
      </Layout>
    </Layout>
  );
}
