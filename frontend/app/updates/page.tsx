"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Badge,
  Button,
  Space,
  Timeline,
} from "antd";
import {
  StarOutlined,
  FireOutlined,
  SoundOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

const { Title, Text, Paragraph } = Typography;

interface Sool {
  id: number;
  name: string;
  category: string;
  abv: number;
  region: string;
}

interface Review {
  id: number;
  sool_name: string;
  rating: number;
  notes: string;
  timestamp: string;
}

export default function DiscoveryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [newSool, setNewSool] = useState<Sool[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

  useEffect(() => {
    async function fetchData() {
      try {
        const [soolRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/sool/new-arrivals`),
          fetch(`${API_URL}/sense/list`),
        ]);

        if (soolRes.ok) setNewSool(await soolRes.json());
        if (activityRes.ok) {
          const data = await activityRes.json();
          setRecentActivity(Array.isArray(data) ? data.slice(0, 5) : (data.items ?? []).slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch discovery data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [API_URL]);

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      {/* Section 1: New Arrivals */}
      <div className="mb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <Title className="!text-white !m-0 !text-5xl font-black">
              What's <span className="text-amber-500">New</span>
            </Title>
            <Text className="text-white/40 text-lg">The latest additions to our curated heritage collection.</Text>
          </div>
          <Link href="/">
            <Button type="link" className="text-amber-500 hover:text-amber-400 font-bold p-0 text-lg">
              Explore All Collections →
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-24 text-center"><Spin size="large" /></div>
        ) : (
          <Row gutter={[32, 32]}>
            {newSool.map((item) => (
              <Col xs={24} sm={12} lg={6} key={item.id}>
                <Link href={`/sool/${item.id}`}>
                  <Card 
                    hoverable
                    className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden backdrop-blur-sm group"
                    styles={{ body: { padding: 32 } }}
                  >
                    <div className="aspect-square bg-gradient-to-br from-white/10 to-transparent rounded-2xl mb-6 flex items-center justify-center text-5xl transition-transform group-hover:scale-110">
                      {item.category === "막걸리" ? "🍶" : "🥃"}
                    </div>
                    <Badge status="processing" color="#f59e0b" text={<span className="text-white/40 text-xs font-bold tracking-widest">JUST ADDED</span>} />
                    <Title level={4} className="!text-white !mt-4 !mb-1">{item.name}</Title>
                    <Text className="text-white/20 text-sm font-medium uppercase tracking-wider">{item.region} • {item.abv}%</Text>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <Row gutter={64}>
        {/* Section 2: Live Feed */}
        <Col xs={24} lg={14}>
          <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] backdrop-blur-sm">
            <Title level={3} className="!text-white !mb-10 flex items-center gap-4">
              <SoundOutlined className="text-amber-500" />
              Community Pulse
            </Title>
            <Timeline 
              mode="start"
              reverse={false}
              items={[
                ...recentActivity.map((act) => ({
                  color: "#f59e0b",
                  title: <Text className="text-white/20 font-bold">{act.created_at ? new Date(act.created_at).toLocaleTimeString() : "Just now"}</Text>,
                  content: (
                    <div className="mb-10 pl-4">
                      <Text className="text-white text-lg font-bold block mb-2">
                        New Tasting Note on <span className="text-amber-500">Spirit #{act.sool_id}</span>
                      </Text>
                      <Paragraph className="text-white/40 italic text-base leading-relaxed mb-4">
                        "{act.notes || "Recorded a visual and aromatic profile."}"
                      </Paragraph>
                      <Space className="bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                        <StarOutlined className="text-amber-500" />
                        <Text className="text-amber-500 font-bold">{act.rating}/10</Text>
                      </Space>
                    </div>
                  )
                })),
                {
                  icon: <LoadingOutlined className="text-lg text-amber-500" />,
                  content: <Text className="text-white/20 font-bold ml-4">Awaiting more sensory data...</Text>,
                }
              ]}
              className="custom-timeline"
            />
          </div>
        </Col>

        {/* Section 3: Trending Stats */}
        <Col xs={24} lg={10}>
          <Card 
            className="bg-white/5 border-white/10 rounded-[40px] mb-8"
            styles={{ body: { padding: 40 } }}
          >
            <Title level={4} className="!text-white !mb-8 flex items-center gap-4">
              <FireOutlined className="text-amber-500" />
              Hot Picks
            </Title>
            <Space orientation="vertical" size="large" className="w-full">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 transition-colors hover:bg-white/10 cursor-pointer">
                <Text className="text-white/30 block mb-2 text-xs font-bold tracking-widest uppercase">MOST REVIEWED THIS WEEK</Text>
                <Title level={5} className="!text-white !m-0">나루 약주</Title>
                <Text className="text-amber-500 font-bold">42 New Reviews</Text>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 transition-colors hover:bg-white/10 cursor-pointer">
                <Text className="text-white/30 block mb-2 text-xs font-bold tracking-widest uppercase">HIGHEST RATING TREND</Text>
                <Title level={5} className="!text-white !m-0">일품 안동소주</Title>
                <Text className="text-amber-500 font-bold">Average 9.8/10</Text>
              </div>
            </Space>
          </Card>

          <div className="text-center p-12 border border-dashed border-white/10 rounded-[40px]">
            <ClockCircleOutlined className="text-4xl text-white/10 mb-6" />
            <Text className="text-white/20 block font-medium">Stay tuned for more updates on the heritage map.</Text>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .custom-timeline .ant-timeline-item-tail { border-inline-start: 2px solid rgba(255,255,255,0.05) !important; }
        .custom-timeline .ant-timeline-item-content { padding-inline-start: 24px !important; }
      `}</style>
    </div>
  );
}
