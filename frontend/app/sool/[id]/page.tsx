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
import { useAuth } from "@/app/components/AuthProvider";

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
  const { user } = useAuth();
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
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
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
          const senseRes = await fetch(`${API_URL}/sense/list?sool_id=${Number(soolId)}`, { 
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

    const token = localStorage.getItem('sool_token');
    if (!token) {
      message.error("Please sign in to record a tasting note.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/sense/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
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
      <Space orientation="vertical" align="center">
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
    <div className="min-h-full text-white relative">
      <div className="max-w-[1400px] mx-auto py-12 px-10 relative z-1">
        <div className="mb-12">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()} 
            className="text-amber-500 hover:text-amber-400 mb-6 !p-0 font-bold tracking-widest"
          >
            BACK TO GALLERY
          </Button>
          
          <Row gutter={[80, 80]}>
            <Col span={24}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Badge 
                    count={sool.category} 
                    className="custom-category-badge"
                  />
                  <Badge 
                    count={sool.region || "South Korea"} 
                    className="custom-region-badge"
                  />
                </div>
                <Title className="!text-white !text-8xl !font-black !m-0 !tracking-tight !leading-none uppercase">
                  {sool.name}
                </Title>
                <div className="mt-8 flex items-center gap-10">
                  <div className="flex items-center gap-4">
                    <Rate disabled allowHalf value={avgRating / 2} className="!text-amber-500 !text-2xl" />
                    <Text className="!text-amber-500 !text-3xl !font-black">{(avgRating/2).toFixed(1)}</Text>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <Text className="!text-white/30 !text-lg !font-bold !tracking-widest uppercase">
                    {senses.length} Connoisseur Notes
                  </Text>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={14}>
              <div className="bg-white/[0.03] p-12 rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-sm">
                <Title level={4} className="!text-white !mb-12 !tracking-[0.3em] !text-sm !font-black !uppercase !opacity-40">
                  Sensory Analysis
                </Title>
                <SoolRadar tastings={senses} />
                
                <Row gutter={[40, 40]} className="mt-16 border-t border-white/10 pt-12">
                  {[
                    { label: "STRENGTH", value: `${sool.abv}% ABV`, icon: <ExperimentOutlined /> },
                    { label: "ORIGIN", value: sool.region || "South Korea", icon: <EnvironmentOutlined /> },
                    { label: "PRODUCER", value: sool.producer || "Heritage Craft", icon: <ThunderboltOutlined /> },
                  ].map((stat, i) => (
                    <Col span={8} key={i}>
                      <div className="text-amber-500 text-2xl mb-4">{stat.icon}</div>
                      <Text className="!text-white/20 !text-[10px] !font-black !tracking-[0.2em] !display-block !mb-2 !uppercase">
                        {stat.label}
                      </Text>
                      <Text className="!text-white !text-xl !font-bold">
                        {stat.value}
                      </Text>
                    </Col>
                  ))}
                </Row>
              </div>

              <div className="mt-20 px-4">
                <Title level={3} className="!text-white !mb-8 !text-3xl !font-black !tracking-tight uppercase">
                  The Heritage
                </Title>
                <Paragraph className="!text-white/60 !text-xl !leading-relaxed !font-medium !mb-12">
                  {sool.description || "The detailed lineage and tasting profile of this spirit are being meticulously documented by our historians. Experience its depth through our sensory analysis."}
                </Paragraph>
                <Divider className="!border-white/10 !my-16" />
                <div className="flex flex-col gap-3">
                  <Text className="!text-white/20 !tracking-[0.3em] !text-[10px] !font-black !uppercase">Composition</Text>
                  <Text className="!text-white/60 !text-lg !font-medium">
                    {sool.ingredients || "Traditional selection of organic grains and artisanal yeast."}
                  </Text>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={10}>
              <Card 
                className="!bg-neutral-900/50 !border-white/10 !rounded-[2.5rem] !p-6 shadow-2xl backdrop-blur-md sticky top-32"
                styles={{ body: { padding: 32 } }}
              >
                <Title level={4} className="!text-amber-500 !mb-10 !text-lg !font-black !tracking-widest uppercase">
                  Record Discovery
                </Title>
                <Space orientation="vertical" size={40} className="w-full">
                  <div>
                    <Text className="!text-white/30 !text-[10px] !font-black !tracking-widest !block !mb-4 !uppercase">
                      Overall Impression
                    </Text>
                    <Rate value={rating} onChange={setRating} className="!text-4xl !text-amber-500" />
                  </div>
                  
                  <div className="border-t border-white/5 pt-10 flex flex-col gap-8">
                    {[
                      { label: "AROMA", val: aroma, set: setAroma },
                      { label: "PALATE", val: sweetness, set: setSweetness },
                      { label: "FINISH", val: aftertaste, set: setAftertaste },
                    ].map((m) => (
                      <div key={m.label} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center mb-2">
                          <Text className="!text-white/40 !font-bold !text-xs !tracking-widest">{m.label}</Text>
                          <Text className="!text-amber-500 !font-black !text-lg">{m.val}</Text>
                        </div>
                        <Slider 
                          min={1} max={5} step={0.5} value={m.val} onChange={m.set} 
                          trackStyle={{ background: "#f59e0b" }} 
                          handleStyle={{ borderColor: "#f59e0b", background: "#000", width: 20, height: 20 }}
                          railStyle={{ background: "rgba(255,255,255,0.05)" }}
                        />
                      </div>
                    ))}
                  </div>

                  <TextArea 
                    rows={4} 
                    placeholder="Describe your sensory journey..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="!bg-white/5 !border-white/10 !text-white !rounded-2xl !p-4 !text-[15px] focus:!border-amber-500/50 placeholder:!text-white/20"
                  />

                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    loading={submitting} 
                    onClick={handleSubmit}
                    className="!bg-amber-500 !text-black !border-none !h-16 !font-black !rounded-2xl !tracking-[0.2em] !text-sm active:!scale-[0.98] transition-transform"
                  >
                    PRESERVE NOTE
                  </Button>
                </Space>
              </Card>

              <div className="mt-20">
                <Title level={4} className="!text-white/40 !mb-10 !text-sm !font-black !tracking-widest uppercase">
                  Connoisseur Observations
                </Title>
                {senses.length === 0 ? (
                  <Empty description={<Text className="!text-white/10">No records found.</Text>} />
                ) : (
                  <div className="flex flex-col gap-8">
                    {senses.slice().reverse().map((s) => (
                      <div key={s.id} className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                          <Rate disabled value={s.rating / 2} className="!text-xs !text-amber-500/50" />
                          <Text className="!text-white/20 !text-xs !font-bold">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "Just now"}
                          </Text>
                        </div>
                        <Paragraph className="!text-white/70 !text-[17px] !italic !m-0 !leading-relaxed">
                          "{s.notes || "A singular tasting experience."}"
                        </Paragraph>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-category-badge .ant-scroll-number {
          background: #f59e0b !important;
          color: #000 !important;
          font-weight: 900 !important;
          border: none !important;
          font-size: 12px !important;
          padding: 4px 12px !important;
          border-radius: 6px !important;
        }
        .custom-region-badge .ant-scroll-number {
          background: rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.4) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          font-size: 12px !important;
          padding: 4px 12px !important;
          border-radius: 6px !important;
        }
      `}</style>
    </div>
  );
}
