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
  FireOutlined,
  SoundOutlined,
  ClockCircleOutlined,
  StarOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

const { Title, Text, Paragraph } = Typography;

interface Sool {
  id: number;
  name: string;
  category: string;
  abv: number;
  region: string;
}

export default function DiscoveryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [newSool, setNewSool] = useState<Sool[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
    <div style={{ padding: "60px 80px", background: "transparent" }}>
      {/* Section 1: New Arrivals */}
      <div style={{ marginBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <Title style={{ color: "#fff", fontSize: 48, fontWeight: 900, margin: 0 }}>
              What's <span style={{ color: "#d4af37" }}>New</span>
            </Title>
            <Text style={{ color: "#666", fontSize: 18 }}>The latest additions to our curated heritage collection.</Text>
          </div>
          <Link href="/">
            <Button type="link" style={{ color: "#d4af37", fontSize: 16 }}>Explore All Collections →</Button>
          </Link>
        </div>

        {loading ? (
          <Spin size="large" />
        ) : (
          <Row gutter={[32, 32]}>
            {newSool.map((item) => (
              <Col xs={24} sm={12} lg={6} key={item.id}>
                <Link href={`/sool/${item.id}`}>
                  <Card 
                    hoverable
                    style={{ background: "#111", border: "1px solid #222", borderRadius: 20, overflow: "hidden" }}
                    styles={{ body: { padding: 24 } }}
                  >
                    <div style={{ aspectRatio: "1/1", background: "linear-gradient(45deg, #1a1a1a, #050505)", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                      {item.category === "탁주" ? "🍶" : "🥃"}
                    </div>
                    <Badge status="processing" color="#d4af37" text={<span style={{ color: "#888", fontSize: 12 }}>JUST ADDED</span>} />
                    <Title level={4} style={{ color: "#fff", margin: "12px 0 4px" }}>{item.name}</Title>
                    <Text style={{ color: "#555" }}>{item.region} • {item.abv}%</Text>
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
          <div style={{ background: "#111", padding: 40, borderRadius: 32, border: "1px solid #222" }}>
            <Title level={3} style={{ color: "#fff", marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
              <SoundOutlined style={{ color: "#d4af37" }} />
              Community Pulse
            </Title>
            <Timeline 
              mode="start"
              reverse={false}
              items={[
                ...recentActivity.map((act) => ({
                  color: "#d4af37",
                  title: <Text style={{ color: "#444" }}>{act.created_at ? new Date(act.created_at).toLocaleTimeString() : "Just now"}</Text>,
                  content: (
                    <div style={{ marginBottom: 24 }}>
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: 600, display: "block" }}>
                        New Tasting Note on <span style={{ color: "#d4af37" }}>Spirit #{act.sool_id}</span>
                      </Text>
                      <Paragraph style={{ color: "#888", marginTop: 8, fontStyle: "italic" }}>
                        "{act.notes || "Recorded a visual and aromatic profile."}"
                      </Paragraph>
                      <Space orientation="horizontal">
                        <StarOutlined style={{ color: "#d4af37" }} />
                        <Text style={{ color: "#d4af37" }}>{(act.rating/2).toFixed(1)}/5.0</Text>
                      </Space>
                    </div>
                  )
                })),
                {
                  icon: <LoadingOutlined style={{ fontSize: '16px', color: '#d4af37' }} />,
                  content: <Text style={{ color: "#444" }}>Awaiting more sensory data...</Text>,
                }
              ]}
            />
          </div>
        </Col>

        {/* Section 3: Trending Stats */}
        <Col xs={24} lg={10}>
          <Card 
            style={{ background: "#111", border: "1px solid #222", borderRadius: 32, marginBottom: 32 }}
            styles={{ body: { padding: 32 } }}
          >
            <Title level={4} style={{ color: "#fff", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <FireOutlined style={{ color: "#d4af37" }} />
              Hot Picks
            </Title>
            <Space orientation="vertical" size="large" style={{ width: "100%" }}>
              <div style={{ background: "#1a1a1a", padding: 20, borderRadius: 16, border: "1px solid #333" }}>
                <Text style={{ color: "#888", display: "block", marginBottom: 8 }}>MOST REVIEWED THIS WEEK</Text>
                <Title level={5} style={{ color: "#fff", margin: 0 }}>나루 약주</Title>
                <Text style={{ color: "#d4af37" }}>42 New Reviews</Text>
              </div>
              <div style={{ background: "#1a1a1a", padding: 20, borderRadius: 16, border: "1px solid #333" }}>
                <Text style={{ color: "#888", display: "block", marginBottom: 8 }}>HIGHEST RATING TREND</Text>
                <Title level={5} style={{ color: "#fff", margin: 0 }}>일품 안동소주</Title>
                <Text style={{ color: "#d4af37" }}>Average 4.9/5.0</Text>
              </div>
            </Space>
          </Card>

          <div style={{ textAlign: "center", padding: 40, border: "1px dashed #222", borderRadius: 32 }}>
            <ClockCircleOutlined style={{ fontSize: 32, color: "#222", marginBottom: 16 }} />
            <Text style={{ color: "#444", display: "block" }}>Stay tuned for more updates on the heritage map.</Text>
          </div>
        </Col>
      </Row>

      <footer style={{ 
        textAlign: "center", 
        padding: "80px 0 40px",
        color: "#444",
        fontSize: 12,
        letterSpacing: 2
      }}>
        SOOL DISCOVERY — UNVEILING THE HIDDEN HERITAGE
      </footer>
    </div>
  );
}
