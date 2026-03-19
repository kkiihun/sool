"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Row,
  Col,
  Button,
  Space,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  PlusOutlined,
  OrderedListOutlined,
  BulbOutlined,
} from "@ant-design/icons";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function TastingPage() {
  const [collapsed, setCollapsed] = useState(false);

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
        <div style={{ 
          height: 80, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          borderBottom: "1px solid #222",
          marginBottom: 20
        }}>
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
            { key: "tasting", icon: <StarOutlined />, label: "Tasting Notes" },
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
          <Title level={4} style={{ color: "#fff", margin: 0 }}>Tasting Journal</Title>
          <Text style={{ color: "#666" }}>Your Sensory Journey</Text>
        </Header>

        <Content style={{ padding: "60px 80px" }}>
          {/* Hero Section */}
          <div style={{ marginBottom: 60, maxWidth: 800 }}>
            <Title style={{ color: "#fff", fontSize: 48, fontWeight: 800, margin: 0 }}>
              Master the Art of <span style={{ color: "#d4af37" }}>Tasting</span>
            </Title>
            <Paragraph style={{ color: "#888", fontSize: 18, lineHeight: 1.8, marginTop: 20 }}>
              Record the intricate nuances of aroma, flavor, and texture. 
              Build your personal library of sensory experiences and discover your unique palate.
              Your data-driven notes help us provide more accurate recommendations.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Link href="/sense/new">
                <Card 
                  hoverable
                  style={{ 
                    background: "#111", 
                    border: "1px solid #222", 
                    borderRadius: 24,
                    height: "100%",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  styles={{ body: { padding: 40 } }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d4af37";
                    e.currentTarget.style.transform = "translateY(-8px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#222";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 16, 
                    background: "rgba(212,175,55,0.1)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    marginBottom: 32
                  }}>
                    <PlusOutlined style={{ fontSize: 24, color: "#d4af37" }} />
                  </div>
                  <Title level={3} style={{ color: "#fff", marginBottom: 16 }}>New Entry</Title>
                  <Text style={{ color: "#666", fontSize: 16 }}>
                    Start a fresh tasting session. Record visual, olfactive, and gustative properties.
                  </Text>
                  <div style={{ marginTop: 32 }}>
                    <Button type="primary" size="large" style={{ background: "#d4af37", color: "#000", border: "none", fontWeight: 700, borderRadius: 8 }}>
                      Record Now
                    </Button>
                  </div>
                </Card>
              </Link>
            </Col>

            <Col xs={24} md={12}>
              <Link href="/sense/list">
                <Card 
                  hoverable
                  style={{ 
                    background: "#111", 
                    border: "1px solid #222", 
                    borderRadius: 24,
                    height: "100%",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                  styles={{ body: { padding: 40 } }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d4af37";
                    e.currentTarget.style.transform = "translateY(-8px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#222";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 16, 
                    background: "rgba(212,175,55,0.1)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    marginBottom: 32
                  }}>
                    <OrderedListOutlined style={{ fontSize: 24, color: "#d4af37" }} />
                  </div>
                  <Title level={3} style={{ color: "#fff", marginBottom: 16 }}>Your Collection</Title>
                  <Text style={{ color: "#666", fontSize: 16 }}>
                    Browse through your previous tasting notes and track how your palate evolves.
                  </Text>
                  <div style={{ marginTop: 32 }}>
                    <Button type="text" size="large" style={{ color: "#d4af37", fontWeight: 700, border: "1px solid #d4af37", borderRadius: 8 }}>
                      View History
                    </Button>
                  </div>
                </Card>
              </Link>
            </Col>
          </Row>

          {/* Quick Tips */}
          <div style={{ 
            marginTop: 80, 
            background: "linear-gradient(135deg, #111 0%, #050505 100%)", 
            borderRadius: 24, 
            padding: 40,
            border: "1px solid #222"
          }}>
            <Row gutter={[40, 40]} align="middle">
              <Col xs={24} md={4} style={{ textAlign: "center" }}>
                <BulbOutlined style={{ fontSize: 48, color: "#d4af37" }} />
              </Col>
              <Col xs={24} md={20}>
                <Title level={4} style={{ color: "#fff" }}>Expert Tip</Title>
                <Text style={{ color: "#888", fontSize: 16 }}>
                  To get the most accurate results, try tasting in a neutral environment and take small sips. 
                  Pay attention to the "Finish" — how long the flavor lingers on your palate after swallowing.
                </Text>
              </Col>
            </Row>
          </div>
        </Content>

        <Footer style={{ 
          background: "transparent", 
          color: "#444", 
          textAlign: "center", 
          padding: "40px 0",
          borderTop: "1px solid #222",
          marginTop: 60
        }}>
          SOOL — THE ART OF THE SENSES
        </Footer>
      </Layout>
    </Layout>
  );
}
