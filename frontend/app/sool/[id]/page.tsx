"use client";

import { useEffect, useState, use } from "react";
import { 
  Rate, 
  Slider, 
  Button, 
  Input, 
  Card, 
  Tag, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Spin,
  Empty,
  Divider,
  message,
  Badge,
  Breadcrumb
} from "antd";
import { 
  EnvironmentOutlined,
  ExperimentOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  UserOutlined,
  StarFilled,
  InfoCircleFilled
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SoolRadar from "@/components/SoolRadar";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type Sool = {
  id: number;
  name: string;
  abv?: number;
  region?: string;
  category?: string;
  description?: string;
  producer?: string;
  ingredients?: string;
};

type SenseNote = {
  id: number;
  rating: number;
  notes: string;
  aroma?: number;
  sweetness?: number;
  acidity?: number;
  body?: number;
  aftertaste?: number;
  created_at?: string;
};

export default function SoolDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const soolId = resolvedParams?.id;
  
  const [sool, setSool] = useState<Sool | null>(null);
  const [senses, setSenses] = useState<SenseNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [aroma, setAroma] = useState<number>(3);
  const [sweetness, setSweetness] = useState<number>(3);
  const [aftertaste, setAftertaste] = useState<number>(3);

  // 🔥 API URL 결정 로직 강화 (localhost 대신 127.0.0.1 시도)
  const getApiUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl;
    return "http://127.0.0.1:8000"; // localhost 대신 127.0.0.1이 더 안정적임
  };

  const API_URL = getApiUrl();

  useEffect(() => {
    if (!soolId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`[Debug] Fetching Spirit #${soolId} from ${API_URL}`);
        
        // 1. 제품 정보 가져오기
        const soolRes = await fetch(`${API_URL}/sool/by-id/${soolId}`, { 
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });

        if (!soolRes.ok) throw new Error(`Product API error: ${soolRes.status}`);
        const soolData = await soolRes.json();
        setSool(soolData);

        // 2. 테이스팅 노트 가져오기 (실패해도 중단하지 않음)
        try {
          const senseRes = await fetch(`${API_URL}/sense/list?sool_id=${soolId}`, { 
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
          });
          if (senseRes.ok) {
            const senseData = await senseRes.json();
            setSenses(Array.isArray(senseData) ? senseData : senseData.items ?? []);
          }
        } catch (e) {
          console.warn("[Sense API Warning]", e);
        }

      } catch (e: any) {
        console.error("[Fatal Error]", e);
        message.error(`Connection Failed: ${e.message}. URL: ${API_URL}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [soolId, API_URL]);

  const handleSubmit = async () => {
    if (rating === 0) {
      message.warning("Please provide a rating.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/sense/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json" 
        },
        body: JSON.stringify({
          sool_id: Number(soolId),
          rating: rating * 2,
          notes,
          aroma,
          sweetness,
          acidity: 3,
          body: 3,
          aftertaste,
        }),
      });

      if (!res.ok) throw new Error("Post failed");

      message.success("Tasting note archived.");
      setRating(0);
      setNotes("");
      
      // Refresh list
      const refreshRes = await fetch(`${API_URL}/sense/list?sool_id=${soolId}`);
      if (refreshRes.ok) {
        const newData = await refreshRes.json();
        setSenses(Array.isArray(newData) ? newData : newData.items ?? []);
      }
    } catch (e) {
      message.error("Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0a0a0a" }}>
      <Space direction="vertical" align="center">
        <Spin size="large" />
        <Text style={{ color: "#d4af37", marginTop: 20, letterSpacing: 2 }}>ARCHIVE CONSULTATION IN PROGRESS...</Text>
      </Space>
    </div>
  );

  if (!sool) return (
    <div style={{ padding: 100, textAlign: "center", background: "#0a0a0a", minHeight: "100vh" }}>
      <Empty description={<Text style={{ color: "#888" }}>This particular spirit is currently not in our records.</Text>} />
      <Button 
        type="primary" 
        ghost 
        icon={<ArrowLeftOutlined />} 
        onClick={() => router.push('/')} 
        style={{ marginTop: 24, borderColor: "#d4af37", color: "#d4af37" }}
      >
        Return to Gallery
      </Button>
    </div>
  );

  const avgRating = senses.length > 0 
    ? senses.reduce((acc, curr) => acc + (curr.rating || 0), 0) / senses.length 
    : 0;

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", position: "relative" }}>
      {/* Visual Header Background */}
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        right: 0, 
        height: "50vh", 
        background: "linear-gradient(to bottom, #1a1608 0%, #0a0a0a 100%)",
        zIndex: 0
      }} />

      {/* Navigation */}
      <div style={{ 
        padding: "20px 40px", 
        display: "flex", 
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,10,10,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <Space size="large">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ color: "#d4af37" }} />
          <Breadcrumb items={[{ title: "GALLERY" }, { title: sool.name.toUpperCase() }]} />
        </Space>
        <Text style={{ color: "#444", fontSize: 10, letterSpacing: 2 }}>EST. 2026 / SPIRIT ARCHIVE</Text>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "80px 40px", position: "relative", zIndex: 1 }}>
        <Row gutter={[80, 80]}>
          <Col span={24}>
            <Space direction="vertical" size={0}>
              <Badge count={sool.category} style={{ backgroundColor: "#d4af37", color: "#000", fontWeight: 800, border: "none", marginBottom: 16 }} />
              <Title style={{ color: "#fff", fontSize: 80, fontWeight: 900, margin: 0, lineHeight: 0.9 }}>{sool.name}</Title>
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 32 }}>
                <Space>
                  <Rate disabled allowHalf value={avgRating / 2} style={{ color: "#d4af37" }} />
                  <Text style={{ color: "#d4af37", fontSize: 24, fontWeight: 700 }}>{(avgRating/2).toFixed(1)}</Text>
                </Space>
                <div style={{ width: 1, height: 20, background: "#222" }} />
                <Text style={{ color: "#555", fontSize: 16 }}>{senses.length} CONNOISSEUR NOTES</Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} lg={14}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 48, borderRadius: 40, border: "1px solid rgba(255,255,255,0.05)" }}>
              <Title level={4} style={{ color: "#fff", marginBottom: 40, letterSpacing: 2 }}>SENSORY MAP</Title>
              <SoolRadar tastings={senses} />
              
              <Row gutter={[40, 40]} style={{ marginTop: 60, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 40 }}>
                {[
                  { label: "STRENGTH", value: `${sool.abv}% ABV`, icon: <ExperimentOutlined /> },
                  { label: "ORIGIN", value: sool.region || "South Korea", icon: <EnvironmentOutlined /> },
                  { label: "MAISON", value: sool.producer || "Heritage Craft", icon: <ThunderboltOutlined /> },
                ].map((stat, i) => (
                  <Col span={8} key={i}>
                    <div style={{ color: "#d4af37", fontSize: 20, marginBottom: 12 }}>{stat.icon}</div>
                    <Text style={{ color: "#444", fontSize: 10, letterSpacing: 2, display: "block" }}>{stat.label}</Text>
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>{stat.value}</Text>
                  </Col>
                ))}
              </Row>
            </div>

            <div style={{ marginTop: 60, padding: "0 20px" }}>
              <Title level={3} style={{ color: "#fff", marginBottom: 24 }}>THE STORY</Title>
              <Paragraph style={{ color: "#888", fontSize: 20, lineHeight: 1.8, fontWeight: 300 }}>
                {sool.description || "The detailed lineage and tasting profile of this spirit are being meticulously documented by our historians. Experience its depth through our sensory analysis."}
              </Paragraph>
              <Divider style={{ borderColor: "#222", margin: "48px 0" }} />
              <Space direction="vertical">
                <Text style={{ color: "#444", letterSpacing: 2, fontSize: 10 }}>COMPOSITION</Text>
                <Text style={{ color: "#888", fontSize: 16 }}>{sool.ingredients || "Traditional selection of organic grains and artisanal yeast."}</Text>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 32, padding: 20 }} styles={{ body: { padding: 24 } }}>
              <Title level={4} style={{ color: "#fff", marginBottom: 32 }}>LOG A NEW ENTRY</Title>
              <Space direction="vertical" size={32} style={{ width: "100%" }}>
                <div>
                  <Text style={{ color: "#444", fontSize: 10, letterSpacing: 2, display: "block", marginBottom: 12 }}>OVERALL IMPRESSION</Text>
                  <Rate value={rating} onChange={setRating} style={{ fontSize: 32, color: "#d4af37" }} />
                </div>
                
                <div style={{ borderTop: "1px solid #222", paddingTop: 32 }}>
                  {[
                    { label: "Aroma", val: aroma, set: setAroma },
                    { label: "Palate", val: sweetness, set: setSweetness },
                    { label: "Finish", val: aftertaste, set: setAftertaste },
                  ].map((m) => (
                    <div key={m.label} style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text style={{ color: "#888" }}>{m.label}</Text>
                        <Text style={{ color: "#d4af37", fontWeight: 700 }}>{m.val}</Text>
                      </div>
                      <Slider min={1} max={5} step={0.5} value={m.val} onChange={m.set} trackStyle={{ background: "#d4af37" }} handleStyle={{ borderColor: "#d4af37", background: "#000" }} />
                    </div>
                  ))}
                </div>

                <TextArea 
                  rows={4} 
                  placeholder="Describe your encounter with this spirit..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: 16 }}
                />

                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  loading={submitting} 
                  onClick={handleSubmit}
                  style={{ background: "#d4af37", color: "#000", border: "none", height: 60, fontWeight: 800, borderRadius: 16, letterSpacing: 2 }}
                >
                  PRESERVE ENTRY
                </Button>
              </Space>
            </Card>

            <div style={{ marginTop: 60 }}>
              <Title level={4} style={{ color: "#fff", marginBottom: 32 }}>RECENT OBSERVATIONS</Title>
              {senses.length === 0 ? (
                <Empty description={<Text style={{ color: "#444" }}>No records found.</Text>} />
              ) : (
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  {senses.slice().reverse().map((s) => (
                    <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <Rate disabled value={s.rating / 2} style={{ fontSize: 10, color: "#d4af37" }} />
                        <Text style={{ color: "#444", fontSize: 11 }}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "Just now"}</Text>
                      </div>
                      <Paragraph style={{ color: "#aaa", fontSize: 15, margin: 0 }}>"{s.notes || "A singular tasting experience."}"</Paragraph>
                    </div>
                  ))}
                </Space>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
