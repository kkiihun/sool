"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Statistic,
  Table,
  Rate,
  Select,
  Space,
  Empty,
  Badge,
} from "antd";
import {
  ShopOutlined,
  StarOutlined,
  BarChartOutlined,
  RadarChartOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const { Title, Text } = Typography;

export default function BreweryDashboard() {
  const [loading, setLoading] = useState(false);
  const [producer, setProducer] = useState("이동주조"); // Default placeholder
  const [producers, setProducers] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

  // Load producers list
  useEffect(() => {
    async function loadProducers() {
      try {
        const res = await fetch(`${API_URL}/sool/producers`);
        if (res.ok) {
          const list = await res.json();
          setProducers(list);
          if (list.length > 0 && !producer) setProducer(list[0]);
        }
      } catch (err) {
        console.error("Failed to load producers", err);
      }
    }
    loadProducers();
  }, [API_URL]);

  // Load dashboard data
  useEffect(() => {
    if (!producer) return;
    
    async function fetchDashboard() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/report/stats/producer/${encodeURIComponent(producer)}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [producer, API_URL]);

  const radarDataTransform = (comparison: any) => {
    if (!comparison) return [];
    const subjects = [
      { key: "aroma", label: "향 (Aroma)" },
      { key: "sweetness", label: "단맛 (Sweetness)" },
      { key: "acidity", label: "산미 (Acidity)" },
      { key: "body", label: "바디감 (Body)" },
      { key: "finish", label: "여운 (Finish)" },
    ];

    return subjects.map((s) => ({
      subject: s.label,
      producer: comparison.producer_avg[s.key as keyof typeof comparison.producer_avg],
      market: comparison.market_avg[s.key as keyof typeof comparison.market_avg],
    }));
  };

  const productPerformanceColumns = [
    { title: "제품명", dataIndex: "name", key: "name", render: (text: string) => <Text className="text-white font-bold">{text}</Text> },
    { title: "평점", dataIndex: "avg_rating", key: "avg_rating", render: (val: number) => <Rate disabled value={val} allowHalf className="text-xs text-amber-500" /> },
    { title: "리뷰 수", dataIndex: "review_count", key: "review_count", render: (val: number) => <Text className="text-white/40">{val} Notes</Text> },
  ];

  if (loading && !data) {
    return <div className="h-screen flex items-center justify-center bg-[#0a0a0a]"><Spin size="large" /></div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8 bg-[#050505] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <Title className="!text-white !m-0 !text-6xl font-black tracking-tighter">
            Brewery <span className="text-amber-500">Intelligence</span>
          </Title>
          <Text className="text-white/40 text-lg">Market position and flavor analysis for artisan brewers.</Text>
        </div>
        
        <div className="flex flex-col gap-2">
          <Text className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest ml-1">Select Brewery</Text>
          <Select
            showSearch
            className="w-80 h-14 premium-select"
            value={producer}
            onChange={setProducer}
            options={producers.map(p => ({ label: p, value: p }))}
            placeholder="Search Brewery..."
          />
        </div>
      </div>

      {!data ? (
        <Empty description="No data found for this producer" />
      ) : (
        <>
          {/* Summary Row */}
          <Row gutter={[24, 24]} className="mb-12">
            {[
              { title: "Products in Portfolio", value: data.summary.total_products, icon: <ShopOutlined />, color: "#f59e0b" },
              { title: "Portfolio Avg Rating", value: data.summary.avg_rating.toFixed(1), icon: <StarOutlined />, color: "#f59e0b" },
              { title: "Total Community Notes", value: data.summary.total_reviews, icon: <TeamOutlined />, color: "#10b981" },
              { title: "Market Visibility", value: "High", icon: <GlobalOutlined />, color: "#3b82f6" },
            ].map((kpi, idx) => (
              <Col xs={24} sm={12} lg={6} key={idx}>
                <Card 
                  className="bg-white/5 border-white/10 rounded-[32px] backdrop-blur-sm hover:border-white/20 transition-all"
                  styles={{ body: { padding: 32 } }}
                >
                  <Statistic
                    title={<span className="text-white/30 text-xs font-black uppercase tracking-widest">{kpi.title}</span>}
                    value={kpi.value}
                    prefix={<span style={{ color: kpi.color }} className="mr-3">{kpi.icon}</span>}
                    valueStyle={{ color: "#fff", fontWeight: 900, fontSize: 32 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]}>
            {/* Market Comparison Radars */}
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <RadarChartOutlined className="text-amber-500" />
                    <span className="text-white font-black uppercase tracking-widest text-xs">Flavor DNA vs Market Average</span>
                  </Space>
                }
                className="bg-white/5 border-white/10 rounded-[40px] shadow-2xl h-full"
                styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px 40px' }, body: { padding: '40px' } }}
              >
                {data.market_comparison.length > 0 ? (
                  <Row gutter={[40, 40]}>
                    {data.market_comparison.map((comp: any, idx: number) => (
                      <Col xs={24} md={12} key={idx}>
                        <div className="text-center mb-4">
                          <Badge count={comp.category} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)', fontWeight: 900, borderRadius: 8 }} />
                        </div>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer>
                            <RadarChart data={radarDataTransform(comp)}>
                              <PolarGrid stroke="rgba(255,255,255,0.05)" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                              <Radar
                                name="Our Avg"
                                dataKey="producer"
                                stroke="#f59e0b"
                                fill="#f59e0b"
                                fillOpacity={0.6}
                              />
                              <Radar
                                name="Market Avg"
                                dataKey="market"
                                stroke="rgba(255,255,255,0.2)"
                                fill="rgba(255,255,255,0.1)"
                                fillOpacity={0.3}
                              />
                              <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                              <Legend wrapperStyle={{ fontSize: 10 }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description="Insufficient market comparison data" />
                )}
              </Card>
            </Col>

            {/* Top Products Table */}
            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <ThunderboltOutlined className="text-amber-500" />
                    <span className="text-white font-black uppercase tracking-widest text-xs">Performance Leaders</span>
                  </Space>
                }
                className="bg-white/5 border-white/10 rounded-[40px] shadow-2xl h-full"
                styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px 40px' }, body: { padding: '24px' } }}
              >
                <Table
                  dataSource={data.top_products}
                  columns={productPerformanceColumns}
                  pagination={false}
                  rowKey="id"
                  className="brewery-table"
                />
              </Card>
            </Col>

            {/* Product Rating Distribution */}
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined className="text-amber-500" />
                    <span className="text-white font-black uppercase tracking-widest text-xs">Product Performance Matrix</span>
                  </Space>
                }
                className="bg-white/5 border-white/10 rounded-[40px] shadow-2xl"
                styles={{ header: { borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px 40px' }, body: { padding: '40px' } }}
              >
                <div className="h-[400px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={data.top_products} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="rgba(255,255,255,0.3)" 
                        fontSize={10} 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0}
                        height={80}
                      />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} domain={[0, 5]} />
                      <Tooltip 
                        contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      />
                      <Bar dataKey="avg_rating" name="Rating" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

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
        .brewery-table { background: transparent !important; }
        .brewery-table .ant-table { background: transparent !important; color: white !important; }
        .brewery-table .ant-table-thead > tr > th { background: transparent !important; color: rgba(255,255,255,0.3) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; font-size: 10px; text-transform: uppercase; font-weight: 900; }
        .brewery-table .ant-table-tbody > tr > td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .brewery-table .ant-table-tbody > tr:hover > td { background: rgba(255,255,255,0.02) !important; }
      `}</style>
    </div>
  );
}
