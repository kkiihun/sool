"use client";

import { useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Steps,
  Slider,
  Radio,
  Card,
  Row,
  Col,
  Space,
  Empty,
  Spin,
} from "antd";
import {
  SearchOutlined,
  HeartOutlined,
  RocketOutlined,
  ExperimentOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

interface WizardModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WizardModal({ visible, onClose }: WizardModalProps) {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Wizard State
  const [category, setCategory] = useState<string>("");
  const [abvType, setAbvType] = useState<string>("all");
  const [sweetness, setSweetness] = useState(3.0);
  const [acidity, setAcidity] = useState(3.0);
  const [body, setBody] = useState(3.0);

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

  const handleNext = () => {
    if (current === 2) {
      fetchRecommendations();
    }
    setCurrent(current + 1);
  };

  const handlePrev = () => setCurrent(current - 1);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/v2/sool/recommend/wizard?sweetness=${sweetness}&acidity=${acidity}&body=${body}&abv_type=${abvType}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResults(data.recommendations || []);
      }
    } catch (err) {
      console.error("Failed to fetch wizard recommendations", err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Category", icon: <RocketOutlined /> },
    { title: "Strength", icon: <ExperimentOutlined /> },
    { title: "Taste", icon: <HeartOutlined /> },
    { title: "Matches", icon: <CheckCircleOutlined /> },
  ];

  const renderStep = () => {
    switch (current) {
      case 0:
        return (
          <div className="py-8">
            <Title level={4} className="!text-white !mb-8">What type of spirit are you looking for?</Title>
            <Row gutter={[16, 16]}>
              {["탁주", "약주", "청주", "증류주", "과실주", ""].map((cat) => (
                <Col span={8} key={cat}>
                  <Card
                    hoverable
                    onClick={() => setCategory(cat)}
                    className={[
                      "h-32 flex flex-col items-center justify-center rounded-2xl border-2 transition-all",
                      category === cat ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-white/5"
                    ].join(" ")}
                  >
                    <Text className={[
                      "font-black tracking-widest",
                      category === cat ? "text-amber-500" : "text-white/40"
                    ].join(" ")}>
                      {cat === "" ? "ANY TYPE" : cat.toUpperCase()}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      case 1:
        return (
          <div className="py-8">
            <Title level={4} className="!text-white !mb-8">How strong do you like it?</Title>
            <Radio.Group 
              value={abvType} 
              onChange={(e) => setAbvType(e.target.value)}
              className="w-full flex flex-col gap-4"
            >
              {[
                { label: "Low (Below 10%)", value: "low", desc: "Refreshing and light" },
                { label: "Medium (10% - 20%)", value: "medium", desc: "Balanced and standard" },
                { label: "High (Above 20%)", value: "high", desc: "Bold and intense" },
                { label: "Any Strength", value: "all", desc: "Surprise me" },
              ].map((opt) => (
                <Radio.Button 
                  key={opt.value} 
                  value={opt.value}
                  className="h-24 !rounded-2xl !bg-white/5 !border-white/10 !flex !items-center !px-8 hover:!border-amber-500 group"
                >
                  <div className="flex flex-col text-left">
                    <Text className="text-white font-bold text-lg">{opt.label}</Text>
                    <Text className="text-white/30 text-xs">{opt.desc}</Text>
                  </div>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        );
      case 2:
        return (
          <div className="py-8 space-y-12">
            <Title level={4} className="!text-white !mb-4">Fine-tune the flavor profile</Title>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <Text className="text-white/60 font-black tracking-widest text-xs uppercase">Sweetness</Text>
                <Text className="text-amber-500 font-bold">{sweetness}</Text>
              </div>
              <Slider 
                min={1} max={5} step={0.5} value={sweetness} onChange={setSweetness}
                trackStyle={{ background: "#f59e0b" }}
                railStyle={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Text className="text-white/60 font-black tracking-widest text-xs uppercase">Acidity</Text>
                <Text className="text-amber-500 font-bold">{acidity}</Text>
              </div>
              <Slider 
                min={1} max={5} step={0.5} value={acidity} onChange={setAcidity}
                trackStyle={{ background: "#f59e0b" }}
                railStyle={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Text className="text-white/60 font-black tracking-widest text-xs uppercase">Body</Text>
                <Text className="text-amber-500 font-bold">{body}</Text>
              </div>
              <Slider 
                min={1} max={5} step={0.5} value={body} onChange={setBody}
                trackStyle={{ background: "#f59e0b" }}
                railStyle={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="py-8">
            <Title level={4} className="!text-white !mb-8">Your Curated Matches</Title>
            {loading ? (
              <div className="py-20 text-center"><Spin size="large" /></div>
            ) : results.length > 0 ? (
              <div className="grid gap-6">
                {results.map((item) => (
                  <Link href={`/sool/${item.id}`} key={item.id} onClick={onClose}>
                    <Card className="bg-white/5 border-white/10 rounded-2xl hover:border-amber-500 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-neutral-900 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/5">
                          {item.category === "탁주" ? "🍶" : "🥃"}
                        </div>
                        <div className="flex-1">
                          <Title level={5} className="!text-white !m-0 !text-xl">{item.name}</Title>
                          <Text className="text-white/30 text-xs block mt-1 uppercase tracking-widest font-black">
                            {item.category} • {item.abv}%
                          </Text>
                        </div>
                        <div className="text-right">
                          <Text className="text-amber-500 block font-black text-xl">{item.score}</Text>
                          <Text className="text-white/10 text-[9px] font-black tracking-tighter uppercase">MATCH SCORE</Text>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty description={<Text className="text-white/30">No perfect matches found. Try adjusting your preferences.</Text>} />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      className="premium-modal"
      styles={{
        content: {
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "40px",
          padding: "48px",
          boxShadow: "0 50px 100px rgba(0,0,0,0.9)",
        },
      }}
    >
      <div className="mb-12">
        <Text className="text-amber-500 font-black tracking-[0.4em] uppercase text-[10px] mb-2 block">Curation Assistant</Text>
        <Title className="!text-white !m-0 !text-4xl font-black">Find Your <span className="text-amber-500">Perfect Pour</span></Title>
      </div>

      <Steps
        current={current}
        items={steps}
        className="custom-steps mb-12"
      />

      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      <div className="flex justify-between mt-12 pt-12 border-t border-white/5">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handlePrev} 
          disabled={current === 0}
          className="h-14 px-8 rounded-xl bg-transparent text-white/40 border-white/10 hover:text-white"
        >
          BACK
        </Button>
        {current < 3 ? (
          <Button 
            type="primary" 
            icon={<ArrowRightOutlined />} 
            onClick={handleNext}
            className="h-14 px-10 rounded-xl bg-amber-500 text-black border-none font-black tracking-widest uppercase shadow-lg shadow-amber-500/20"
          >
            {current === 2 ? "REVEAL MATCHES" : "NEXT STEP"}
          </Button>
        ) : (
          <Button 
            type="primary" 
            onClick={() => {
              setCurrent(0);
              setResults([]);
              onClose();
            }}
            className="h-14 px-10 rounded-xl bg-white/5 text-white/40 border-white/10 hover:text-white font-black tracking-widest uppercase"
          >
            CLOSE ASSISTANT
          </Button>
        )}
      </div>

      <style jsx global>{`
        .custom-steps .ant-steps-item-title { color: rgba(255,255,255,0.2) !important; font-size: 11px !important; font-weight: 900 !important; text-transform: uppercase; letter-spacing: 1px; }
        .custom-steps .ant-steps-item-active .ant-steps-item-title { color: #f59e0b !important; }
        .custom-steps .ant-steps-item-icon { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.3) !important; }
        .custom-steps .ant-steps-item-active .ant-steps-item-icon { background: #f59e0b !important; border-color: #f59e0b !important; color: #000 !important; }
        .custom-steps .ant-steps-item-finish .ant-steps-item-icon { border-color: #f59e0b !important; color: #f59e0b !important; }
        .custom-steps .ant-steps-item-finish .ant-steps-item-tail::after { background-color: #f59e0b !important; }
      `}</style>
    </Modal>
  );
}
