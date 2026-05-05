"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Statistic,
  Empty,
  Space,
  Button,
} from "antd";
import {
  StarOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  ExperimentOutlined,
  RadarChartOutlined,
  ReloadOutlined,
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

const { Title, Text } = Typography;

const COLORS = ["#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f"];
const RADAR_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

  const fetchStats = async () => {
    try {
      setLoading(true);
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
  };

  useEffect(() => {
    fetchStats();
  }, [API_URL]);

  if (loading && !stats) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Spin size="large" />
      </div>
    );
  }

  // Radar Data Transformation
  const subjects = [
    { key: 'aroma', label: 'Aroma' },
    { key: 'sweetness', label: 'Sweetness' },
    { key: 'acidity', label: 'Acidity' },
    { key: 'body', label: 'Body' },
    { key: 'finish', label: 'Finish' }
  ];

  const radarData = subjects.map(s => {
    const item: any = { subject: s.label };
    stats?.flavor_stats?.forEach((cat: any) => {
      item[cat.category] = cat[s.key];
    });
    return item;
  });

  const categories = stats?.flavor_stats?.map((f: any) => f.category) || [];

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <Title className="!text-white !m-0 !text-5xl font-black">
            Market <span className="text-amber-500">Overview</span>
          </Title>
          <Text className="text-white/40 text-lg italic">Comprehensive data analysis of Korean traditional spirits.</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchStats} 
          className="bg-white/5 border-white/10 text-white/40 hover:text-white font-bold h-12 px-6 rounded-xl transition-all"
        >
          Refresh Analytics
        </Button>
      </div>

      {/* KPI Row */}
      <Row gutter={[24, 24]} className="mb-12">
        {[
          { title: "Total Spirit Varieties", value: stats?.total_sool, icon: <DatabaseOutlined />, suffix: "Items" },
          { title: "Average ABV", value: stats?.avg_abv, icon: <ExperimentOutlined />, suffix: "%" },
          { title: "Consumer Reviews", value: stats?.total_reviews, icon: <StarOutlined />, suffix: "Notes" },
          { title: "Sourcing Regions", value: stats?.region_distribution?.length || 0, icon: <GlobalOutlined />, suffix: "Areas" },
        ].map((kpi, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card 
              className="bg-white/5 border-white/10 rounded-3xl backdrop-blur-sm shadow-xl"
              styles={{ body: { padding: "32px" } }}
            >
              <Statistic
                title={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">{kpi.title}</span>}
                value={kpi.value}
                precision={idx === 1 ? 1 : 0}
                styles={{ content: { color: "#fff", fontSize: "32px", fontWeight: 900 } }}
                prefix={<span className="text-amber-500 mr-4">{kpi.icon}</span>}
                suffix={<span className="text-white/20 text-sm ml-2">{kpi.suffix}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} className="mb-8">
        {/* Category Flavor Profile Comparison */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RadarChartOutlined className="text-amber-500" />
                <span className="text-white font-bold uppercase tracking-wider text-sm">Flavor Profile by Category</span>
              </Space>
            }
            className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm"
            styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "24px 32px" }, body: { padding: "32px" } }}
          >
            <div className="h-[400px] w-full">
              {categories.length > 0 ? (
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} />
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
                      contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(10px)" }}
                      itemStyle={{ fontSize: 12 }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 20 }} 
                      formatter={(value) => <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Empty description={<Text className="text-white/20">No flavor data available yet</Text>} />
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<span className="text-white font-bold uppercase tracking-wider text-sm">Category Breakdown</span>}
            className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm"
            styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "24px 32px" }, body: { padding: "32px" } }}
          >
            <div className="h-[400px] w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats?.category_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats?.category_distribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(10px)" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(value) => <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{value}</span>}
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
            title={<span className="text-white font-bold uppercase tracking-wider text-sm">Regional Sourcing Map (Top 10 Regions)</span>}
            className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-sm"
            styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "24px 32px" }, body: { padding: "32px" } }}
          >
            <div className="h-[350px] w-full">
              <ResponsiveContainer>
                <BarChart data={stats?.region_distribution} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(10px)" }}
                    itemStyle={{ color: "#f59e0b" }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <footer className="text-center py-24 text-white/10 text-[10px] font-black tracking-[0.2em] uppercase border-t border-white/5 mt-24">
        SOOL ANALYTICS — DATA DRIVEN HERITAGE
      </footer>
    </div>
  );
}
