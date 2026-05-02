"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Statistic,
} from "antd";
import {
  StarOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  ExperimentOutlined,
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
} from "recharts";

const { Title, Text } = Typography;

const COLORS = ["#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

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
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      <div className="mb-12">
        <Title className="!text-white !m-0 !text-5xl font-black">
          Market <span className="text-amber-500">Overview</span>
        </Title>
        <Text className="text-white/40 text-lg italic">Comprehensive data analysis of Korean traditional spirits.</Text>
      </div>

      {/* KPI Row */}
      <Row gutter={[24, 24]} className="mb-12">
        {[
          { title: "Total Spirit Varieties", value: stats.total_sool, icon: <DatabaseOutlined />, suffix: "Items" },
          { title: "Average ABV", value: stats.avg_abv, icon: <ExperimentOutlined />, suffix: "%" },
          { title: "Consumer Reviews", value: stats.total_reviews, icon: <StarOutlined />, suffix: "Notes" },
          { title: "Sourcing Regions", value: stats.region_distribution.length, icon: <GlobalOutlined />, suffix: "Areas" },
        ].map((kpi, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card 
              className="bg-white/5 border-white/10 rounded-3xl backdrop-blur-sm"
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

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title={<span className="text-white font-bold uppercase tracking-wider text-sm">Region Distribution</span>}
            className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden"
            styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "24px 32px" }, body: { padding: "32px" } }}
          >
            <div className="h-[450px] w-full">
              <ResponsiveContainer>
                <BarChart data={stats.region_distribution} layout="vertical" margin={{ left: 20 }}>
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

        <Col xs={24} lg={10}>
          <Card
            title={<span className="text-white font-bold uppercase tracking-wider text-sm">Category Breakdown</span>}
            className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden"
            styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "24px 32px" }, body: { padding: "32px" } }}
          >
            <div className="h-[450px] w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.category_distribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={100}
                    outerRadius={140}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.category_distribution.map((entry: any, index: number) => (
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
                    formatter={(value) => <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
