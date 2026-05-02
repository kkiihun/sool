"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  Layout,
  Menu,
  Typography,
  Form,
  Input,
  InputNumber,
  Slider,
  Button,
  DatePicker,
  Space,
  Card,
  Row,
  Col,
  message,
  Divider,
  Select,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import dayjs from "dayjs";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function SenseForm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <SenseFormContent />
    </Suspense>
  );
}

function SenseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedSoolId = searchParams.get("sool_id");
  
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [soolOptions, setSoolOptions] = useState<any[]>([]);
  const [fetchingSool, setFetchingSool] = useState(false);

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };

  const API_URL = getApiUrl();

  useEffect(() => {
    form.setFieldsValue({
      date: dayjs(),
      clarity: 3,
      color: 3,
      aroma: 3,
      sweetness: 3,
      smoothness: 3,
      rating: 5,
      sool_id: preSelectedSoolId ? Number(preSelectedSoolId) : undefined,
    });
    
    if (preSelectedSoolId) {
      handleSearch(""); // Load initial list
    }
  }, [form, preSelectedSoolId]);

  const handleSearch = async (value: string) => {
    setFetchingSool(true);
    try {
      const url = value.length > 0 
        ? `${API_URL}/v2/sool/suggest?q=${encodeURIComponent(value)}`
        : `${API_URL}/sool/all`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setSoolOptions(items);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setFetchingSool(false);
    }
  };

  const onFinish = async (values: any) => {
    const token = localStorage.getItem('sool_token');
    if (!token) {
      message.error("Please login to save tasting notes.");
      return;
    }

    setSubmitting(true);
    const payload = {
      ...values,
      sool_id: Number(values.sool_id),
    };

    try {
      const res = await fetch(`${API_URL}/sense/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success("Tasting note preserved in the vault.");
        router.push("/Tasting");
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save");
      }
    } catch (error: any) {
      console.error(error);
      message.error(`Save failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto py-16 px-8">
      <div className="mb-12">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.back()} 
          className="text-amber-500 hover:text-amber-400 mb-6 !p-0 font-bold tracking-widest"
        >
          DISCARD & RETURN
        </Button>
        <Title className="!text-white !text-6xl !font-black !m-0 !tracking-tight">
          Record <span className="text-amber-500">New Insights</span>
        </Title>
        <Paragraph className="!text-white/40 !text-xl !mt-6 !max-w-2xl">
          Document the visual, aromatic, and flavor profile of your current spirit to preserve the heritage.
        </Paragraph>
      </div>

      <Card 
        className="!bg-white/[0.03] !border-white/10 !rounded-[2.5rem] shadow-2xl backdrop-blur-sm"
        styles={{ body: { padding: 56 } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="custom-form"
        >
          <Row gutter={48}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-white/40 font-bold tracking-widest text-[11px] uppercase">Spirit Selection</span>}
                name="sool_id"
                rules={[{ required: true, message: "Please select a spirit" }]}
              >
                <Select
                  showSearch
                  placeholder="Search spirit name..."
                  filterOption={false}
                  onSearch={handleSearch}
                  loading={fetchingSool}
                  className="custom-select-large"
                  onFocus={() => handleSearch("")}
                >
                  {soolOptions.map((s) => (
                    <Option key={s.id} value={s.id}>
                      <span className="text-white font-medium">{s.name}</span>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-white/40 font-bold tracking-widest text-[11px] uppercase">Tasting Date</span>}
                name="date"
                rules={[{ required: true }]}
              >
                <DatePicker 
                  showTime 
                  className="w-full !bg-white/5 !border-white/10 !text-white !h-14 !rounded-xl"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="!border-white/10 !my-16 !text-white/20 !font-black !tracking-[0.4em] !text-[11px] uppercase">
            Sensory Metrics
          </Divider>

          <Row gutter={[64, 32]}>
            {[
              { name: "clarity", label: "Clarity (Visual)" },
              { name: "color", label: "Color Intensity" },
              { name: "aroma", label: "Aroma Complexity" },
              { name: "sweetness", label: "Sweetness Level" },
              { name: "smoothness", label: "Smoothness / Mouthfeel" },
            ].map((metric) => (
              <Col span={24} key={metric.name}>
                <Form.Item
                  label={
                    <div className="flex justify-between w-full items-center">
                      <span className="text-white/60 font-bold text-sm tracking-wide">{metric.label}</span>
                      <Form.Item name={metric.name} noStyle>
                        <Text className="text-amber-500 font-black text-lg">3</Text>
                      </Form.Item>
                    </div>
                  }
                  name={metric.name}
                >
                  <Slider 
                    min={1} max={5} step={0.5} 
                    trackStyle={{ background: "#f59e0b" }}
                    handleStyle={{ borderColor: "#f59e0b", background: "#000", width: 18, height: 18 }}
                    railStyle={{ background: "rgba(255,255,255,0.05)" }}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>

          <Divider className="!border-white/10 !my-16 !text-white/20 !font-black !tracking-[0.4em] !text-[11px] uppercase">
            Final Verdict
          </Divider>

          <Form.Item
            label={<span className="text-white/60 font-bold text-sm tracking-wide">Overall Rating (1-10)</span>}
            name="rating"
          >
            <Slider 
              min={1} max={10} step={1} 
              trackStyle={{ background: "#f59e0b", height: 8 }}
              handleStyle={{ borderColor: "#f59e0b", background: "#000", width: 24, height: 24 }}
              railStyle={{ background: "rgba(255,255,255,0.05)", height: 8 }}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-white/60 font-bold text-sm tracking-wide">Tasting Notes</span>}
            name="notes"
          >
            <TextArea 
              rows={5} 
              placeholder="Describe the experience, food pairings, or unique characteristics..." 
              className="!bg-white/5 !border-white/10 !text-white !rounded-2xl !p-6 !text-lg focus:!border-amber-500/50 placeholder:!text-white/10"
            />
          </Form.Item>

          <Form.Item className="mt-20">
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={submitting}
              block
              className="!h-20 !bg-amber-500 !text-black !border-none !font-black !text-xl !rounded-2xl !tracking-[0.3em] uppercase hover:!scale-[1.02] transition-transform active:!scale-[0.98]"
            >
              PRESERVE ENTRY
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <style jsx global>{`
        .custom-form .ant-form-item-label > label {
          width: 100%;
          height: auto !important;
        }
        .custom-select-large .ant-select-selector {
          height: 56px !important;
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-picker-input > input {
          color: #fff !important;
          font-weight: 600;
        }
        .ant-picker-suffix {
          color: rgba(255,255,255,0.2) !important;
        }
      `}</style>
    </div>
  );
}
