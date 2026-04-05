"use client";

import { useState, useEffect } from "react";
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
  Form,
  Input,
  message,
  Divider,
  Spin,
  Tag,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  UserOutlined,
  LockOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [updating, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      form.setFieldsValue({ username: user.username });
    }
  }, [user, authLoading, router, form]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    const token = localStorage.getItem("sool_token");
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password || undefined,
        }),
      });

      if (res.ok) {
        message.success("Profile updated successfully. Please re-login if you changed your password.");
        if (values.password) {
          logout();
        } else {
          // Ideally we would refresh the user context here
          window.location.reload();
        }
      } else {
        const err = await res.json();
        message.error(err.detail || "Failed to update profile.");
      }
    } catch (err) {
      message.error("Server error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={240}
        style={{ background: "#0a0a0a", borderRight: "1px solid #222", position: "fixed", height: "100vh", left: 0, zIndex: 100 }}
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
          selectedKeys={[""]}
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

      <Layout style={{ marginLeft: collapsed ? 80 : 240, background: "transparent" }}>
        <Header style={{ background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(10px)", padding: "0 40px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222", position: "sticky", top: 0, zIndex: 90 }}>
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push("/")} style={{ color: "#888" }} />
            <Title level={4} style={{ color: "#fff", margin: 0 }}>Account Settings</Title>
          </Space>
        </Header>

        <Content style={{ padding: "60px 80px" }}>
          <Row gutter={[64, 64]} justify="center">
            <Col xs={24} lg={10}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <Avatar size={120} icon={<UserOutlined />} style={{ backgroundColor: "#111", border: "2px solid #d4af37", marginBottom: 24 }} />
                <Title level={2} style={{ color: "#fff", margin: 0 }}>{user.username}</Title>
                <Text style={{ color: "#666" }}>{user.email}</Text>
                <div style={{ marginTop: 12 }}>
                  <Tag color={user.is_admin ? "gold" : "blue"}>{user.is_admin ? "ADMINISTRATOR" : "CONNOISSEUR"}</Tag>
                </div>
              </div>

              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 24 }}>
                <Title level={4} style={{ color: "#fff", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
                  <EditOutlined style={{ color: "#d4af37" }} />
                  Update Profile
                </Title>

                <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
                  <Form.Item
                    label={<span style={{ color: "#888" }}>Nickname</span>}
                    name="username"
                    rules={[{ required: true, message: "Please enter your nickname" }]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: "#444" }} />} 
                      style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", height: 45 }} 
                    />
                  </Form.Item>

                  <Divider style={{ borderColor: "#222", margin: "32px 0" }} />

                  <Form.Item
                    label={<span style={{ color: "#888" }}>New Password (Leave blank to keep current)</span>}
                    name="password"
                    rules={[{ min: 6, message: "Password must be at least 6 characters" }]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: "#444" }} />} 
                      style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", height: 45 }} 
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: 40 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      loading={updating}
                      style={{ background: "#d4af37", color: "#000", border: "none", fontWeight: 700, height: 50, borderRadius: 12 }}
                    >
                      Save Changes
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Title level={3} style={{ color: "#fff", marginBottom: 32 }}>Security & Privacy</Title>
              <Space orientation="vertical" size="large" style={{ width: "100%" }}>
                <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 20 }}>
                  <Space size="middle">
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(82, 196, 26, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                    </div>
                    <div>
                      <Text style={{ color: "#fff", display: "block", fontWeight: 600 }}>Two-Factor Authentication</Text>
                      <Text style={{ color: "#444", fontSize: 12 }}>Enhance your account security (Coming soon)</Text>
                    </div>
                  </Space>
                </Card>

                <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 20 }}>
                  <Space size="middle">
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255, 77, 79, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <LockOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
                    </div>
                    <div>
                      <Text style={{ color: "#fff", display: "block", fontWeight: 600 }}>Privacy Mode</Text>
                      <Text style={{ color: "#444", fontSize: 12 }}>Hide your tasting notes from the community feed.</Text>
                    </div>
                  </Space>
                </Card>

                <Divider style={{ borderColor: "#222" }} />
                
                <Button 
                  type="text" 
                  danger 
                  block 
                  style={{ height: 50, borderRadius: 12, border: "1px solid rgba(255, 77, 79, 0.2)" }}
                  onClick={() => message.info("Account deletion requires administrator approval.")}
                >
                  Delete Account
                </Button>
              </Space>
            </Col>
          </Row>
        </Content>

        <Footer style={{ background: "transparent", color: "#444", textAlign: "center", padding: "40px 0", borderTop: "1px solid #222", marginTop: 60 }}>
          SOOL — YOUR DATA, YOUR HERITAGE
        </Footer>
      </Layout>

      <style jsx global>{`
        .ant-form-item-label > label { color: #888 !important; }
        .ant-input, .ant-input-password { background: #1a1a1a !important; border-color: #333 !important; color: #fff !important; }
        .ant-input:hover, .ant-input:focus { border-color: #d4af37 !important; }
      `}</style>
    </Layout>
  );
}
