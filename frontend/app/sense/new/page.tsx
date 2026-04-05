"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ✅ env로 통일 (현재: http://localhost:8000)
// ✅ 프록시로 바꾸면 NEXT_PUBLIC_API_BASE_URL=/proxy 로만 바꾸면 됨
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/proxy").replace(/\/$/, "");

const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
};

export default function SenseForm() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    form.setFieldsValue({
      date: dayjs(),
      clarity: 3,
      color: 3,
      aroma: 3,
      sweetness: 3,
      smoothness: 3,
      rating: 5,
    });
  }, [form]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    const payload = {
      ...values,
      sool_id: Number(values.sool_id),
      date: values.date.format("YYYY-MM-DD HH:mm:ss"),
    };

    try {
      const res = await fetch(`${API_URL}/sense/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success("Tasting note preserved in the vault.");
        router.push("/sense/list");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error(error);
      message.error("An error occurred while saving your note.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #222", marginBottom: 20 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 28 }}>🥃</span>
            {!collapsed && <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: 1.5 }}>SOOL</span>}
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={["tasting"]}
          style={{ background: "transparent", border: "none" }}
          items={[
            { key: "explore", icon: <AppstoreOutlined />, label: <Link href="/">Explore</Link> },
            { key: "tasting", icon: <StarOutlined />, label: <Link href="/Tasting">Tasting Notes</Link> },
            { key: "analytics", icon: <BarChartOutlined />, label: <Link href="/dashboard">Analytics</Link> },
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
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ color: "#888" }} />
            <Title level={4} style={{ color: "#fff", margin: 0 }}>New Tasting Session</Title>
          </Space>
        </Header>

        <Content style={{ padding: "40px 60px" }}>
          <Row justify="center">
            <Col xs={24} lg={16}>
              <div style={{ marginBottom: 40 }}>
                <Title level={2} style={{ color: "#fff", margin: 0 }}>Record <span style={{ color: "#d4af37" }}>New Insights</span></Title>
                <Paragraph style={{ color: "#666", fontSize: 16 }}>
                  Document the visual, aromatic, and flavor profile of your current spirit.
                </Paragraph>
              </div>

              <Card 
                style={{ background: "#111", border: "1px solid #222", borderRadius: 24 }}
                styles={{ body: { padding: 40 } }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark={false}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: "#888" }}>Spirit ID</span>}
                        name="sool_id"
                        rules={[{ required: true, message: "Please enter Spirit ID" }]}
                      >
                        <InputNumber 
                          style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333", color: "#fff" }} 
                          placeholder="e.g. 12"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: "#888" }}>Tasting Date</span>}
                        name="date"
                        rules={[{ required: true }]}
                      >
                        <DatePicker 
                          showTime 
                          style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333" }} 
                          className="custom-datepicker"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider style={{ borderColor: "#222" }}>Sensory Metrics</Divider>

                  <Row gutter={[48, 24]}>
                    {[
                      { name: "clarity", label: "Clarity (Visual)" },
                      { name: "color", label: "Color Intensity" },
                      { name: "aroma", label: "Aroma Complexity" },
                      { name: "sweetness", label: "Sweetness Level" },
                      { name: "smoothness", label: "Smoothness / Mouthfeel" },
                    ].map((metric) => (
                      <Col span={24} key={metric.name}>
                        <Form.Item
                          label={<div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <span style={{ color: "#888" }}>{metric.label}</span>
                            <Form.Item name={metric.name} noStyle><Text style={{ color: "#d4af37", fontWeight: 700 }}>3</Text></Form.Item>
                          </div>}
                          name={metric.name}
                        >
                          <Slider 
                            min={1} max={5} step={0.5} 
                            trackStyle={{ background: "#d4af37" }}
                            handleStyle={{ borderColor: "#d4af37", background: "#0a0a0a" }}
                            railStyle={{ background: "#222" }}
                          />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>

                  <Divider style={{ borderColor: "#222" }}>Final Verdict</Divider>

                  <Form.Item
                    label={<span style={{ color: "#888" }}>Overall Rating (1-10)</span>}
                    name="rating"
                  >
                    <Slider 
                      min={1} max={10} step={1} 
                      trackStyle={{ background: "#d4af37" }}
                      handleStyle={{ borderColor: "#d4af37", background: "#0a0a0a" }}
                      railStyle={{ background: "#222" }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: "#888" }}>Tasting Notes</span>}
                    name="notes"
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="Describe the experience, food pairings, or unique characteristics..." 
                      style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: 12 }}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: 40 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />} 
                      loading={submitting}
                      block
                      style={{ 
                        height: 56, 
                        background: "#d4af37", 
                        color: "#000", 
                        border: "none", 
                        fontWeight: 700, 
                        fontSize: 16,
                        borderRadius: 12
                      }}
                    >
                      Preserve Note
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </Content>

        <Footer style={{ background: "transparent", color: "#444", textAlign: "center", padding: "40px 0", borderTop: "1px solid #222", marginTop: 60 }}>
          SOOL — CRAFTED BY SENSES
        </Footer>
      </Layout>

      <style jsx global>{`
        .ant-form-item-label > label {
          width: 100%;
        }
        .custom-datepicker .ant-picker-input > input {
          color: #fff !important;
        }
        .ant-picker-panel-container {
          background: #1a1a1a !important;
          border: 1px solid #333 !important;
        }
        .ant-picker-header, .ant-picker-content th {
          color: #888 !important;
        }
        .ant-picker-cell {
          color: #444 !important;
        }
        .ant-picker-cell-in-view {
          color: #aaa !important;
        }
        .ant-picker-cell-selected .ant-picker-cell-inner {
          background: #d4af37 !important;
          color: #000 !important;
        }
      `}</style>
    </Layout>
  );
}
