"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Row,
  Col,
  Button,
  Space,
  Avatar,
  Divider,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  GithubOutlined,
  InstagramOutlined,
  BookOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function AboutPage() {
  const router = useRouter();
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
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #222", marginBottom: 20 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 28 }}>🥃</span>
            {!collapsed && <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: 1.5 }}>SOOL</span>}
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={["about"]}
          style={{ background: "transparent", border: "none" }}
          items={[
            { key: "explore", icon: <AppstoreOutlined />, label: <Link href="/">Explore</Link> },
            { key: "tasting", icon: <StarOutlined />, label: <Link href="/Tasting">Tasting Notes</Link> },
            { key: "analytics", icon: <BarChartOutlined />, label: <Link href="/dashboard">Analytics</Link> },
            { key: "updates", icon: <CompassOutlined />, label: <Link href="/updates">Discovery</Link> },
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
            <Title level={4} style={{ color: "#fff", margin: 0 }}>The Architect</Title>
          </Space>
        </Header>

        <Content style={{ padding: "60px 80px" }}>
          <Row gutter={[64, 64]}>
            {/* Profile Info */}
            <Col xs={24} lg={10}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <Avatar 
                  size={160} 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: "#111", border: "2px solid #d4af37", marginBottom: 24 }} 
                />
                <Title level={2} style={{ color: "#fff", margin: 0 }}>Kim Ki-hun</Title>
                <Text style={{ color: "#d4af37", fontSize: 18, letterSpacing: 2 }}>DATA ARCHITECT & DEVELOPER</Text>
              </div>

              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 24 }}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Title level={5} style={{ color: "#fff", marginBottom: 12 }}>Vision</Title>
                    <Paragraph style={{ color: "#888", fontSize: 15, lineHeight: 1.8 }}>
                      Transforming human sensory experiences into actionable data. 
                      Focused on building systems that bridge the gap between intuition and decision-making through advanced analytics and automation.
                    </Paragraph>
                  </div>
                  
                  <Divider style={{ borderColor: "#222", margin: "12px 0" }} />
                  
                  <div>
                    <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>Connect</Title>
                    <Row gutter={[16, 16]}>
                      {[
                        { icon: <BookOutlined />, label: "Blog", color: "#6aaaff", link: "https://blog.naver.com/sensedatalab" },
                        { icon: <GithubOutlined />, label: "GitHub", color: "#fff", link: "https://github.com/kkiihun" },
                        { icon: <InstagramOutlined />, label: "Instagram", color: "#ff85c0", link: "#" },
                      ].map((social, idx) => (
                        <Col span={8} key={idx}>
                          <a href={social.link} target="_blank" rel="noreferrer">
                            <div style={{ textAlign: "center", cursor: "pointer" }}>
                              <div style={{ fontSize: 24, color: social.color, marginBottom: 4 }}>{social.icon}</div>
                              <Text style={{ color: "#444", fontSize: 12 }}>{social.label}</Text>
                            </div>
                          </a>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Project Portfolio */}
            <Col xs={24} lg={14}>
              <Title level={3} style={{ color: "#fff", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
                <RocketOutlined style={{ color: "#d4af37" }} />
                Strategic Portfolio
              </Title>

              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {[
                  {
                    title: "SOOL",
                    desc: "A premium data-driven recommendation system for traditional spirits, integrating sensory mapping and user behavior analysis.",
                    icon: <ThunderboltOutlined />,
                    status: "Core Project"
                  },
                  {
                    title: "SENSE JOURNEY",
                    desc: "An advanced visualization platform for automated collection of sensory data, including emotion, scent, and environmental factors.",
                    icon: <EyeOutlined />,
                    status: "Expansion"
                  },
                  {
                    title: "LUNARLINE",
                    desc: "A futuristic 1-man automated laboratory integrating robotic arms, drones, and smart Manufacturing Execution Systems (MES).",
                    icon: <CompassOutlined />,
                    status: "Innovation"
                  }
                ].map((project, idx) => (
                  <Card 
                    key={idx}
                    style={{ background: "#111", border: "1px solid #222", borderRadius: 20 }}
                    styles={{ body: { padding: 32 } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 20 }}>
                        <div style={{ fontSize: 28, color: "#d4af37" }}>{project.icon}</div>
                        <div>
                          <Title level={4} style={{ color: "#fff", margin: 0 }}>{project.title}</Title>
                          <Paragraph style={{ color: "#888", marginTop: 8, marginBottom: 0 }}>{project.desc}</Paragraph>
                        </div>
                      </div>
                      <Tag color="#222" style={{ color: "#444", border: "1px solid #333" }}>{project.status}</Tag>
                    </div>
                  </Card>
                ))}
              </Space>

              <div style={{ marginTop: 60, textAlign: "center", padding: 40, border: "1px dashed #222", borderRadius: 32 }}>
                <Text style={{ color: "#444", fontSize: 14 }}>
                  Version v0.1 Alpha • Crafted with Passion and Precision • {new Date().toLocaleDateString()}
                </Text>
              </div>
            </Col>
          </Row>
        </Content>

        <Footer style={{ 
          background: "transparent", 
          color: "#444", 
          textAlign: "center", 
          padding: "40px 0",
          borderTop: "1px solid #222",
          marginTop: 60
        }}>
          SOOL — DESIGNED BY KIM KI-HUN
        </Footer>
      </Layout>
    </Layout>
  );
}
