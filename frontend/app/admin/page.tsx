"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layout,
  Menu,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Spin,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Switch,
  Breadcrumb,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const fetchData = async () => {
    const token = localStorage.getItem('sool_token');
    if (!token) return;

    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/users/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/sool/stats`)
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      message.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.is_admin) {
        message.error("Access denied. Admin only.");
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  const toggleAdmin = async (userId: number) => {
    const token = localStorage.getItem('sool_token');
    try {
      const res = await fetch(`${API_URL}/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        message.success("Role updated.");
        fetchData();
      }
    } catch (err) {
      message.error("Update failed.");
    }
  };

  if (authLoading || loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}><Spin size="large" /></div>;

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", render: (id: number) => <span style={{ color: "#666" }}>#{id}</span> },
    { title: "Username", dataIndex: "username", key: "username", render: (name: string) => <Text style={{ color: "#fff", fontWeight: 600 }}>{name}</Text> },
    { title: "Email", dataIndex: "email", key: "email", render: (email: string) => <span style={{ color: "#888" }}>{email}</span> },
    { 
      title: "Role", 
      dataIndex: "is_admin", 
      key: "role", 
      render: (isAdmin: boolean) => (
        <Tag color={isAdmin ? "gold" : "blue"} style={{ borderRadius: 4, fontWeight: 600 }}>
          {isAdmin ? "ADMINISTRATOR" : "CONNOISSEUR"}
        </Tag>
      ) 
    },
    { 
      title: "Actions", 
      key: "actions", 
      render: (record: any) => (
        <Space>
          <Switch 
            checked={record.is_admin} 
            onChange={() => toggleAdmin(record.id)} 
            disabled={record.id === user?.id}
            size="small"
          />
          <Text style={{ color: "#444", fontSize: 12 }}>Admin Rights</Text>
        </Space>
      ) 
    }
  ];

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
          selectedKeys={["admin"]}
          style={{ background: "transparent", border: "none" }}
          items={[
            { key: "explore", icon: <AppstoreOutlined />, label: <Link href="/">Explore</Link> },
            { key: "admin", icon: <SafetyCertificateOutlined />, label: "Admin Console" },
            { key: "analytics", icon: <BarChartOutlined />, label: <Link href="/dashboard">System Stats</Link> },
          ]}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, background: "transparent" }}>
        <Header style={{ background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(10px)", padding: "0 40px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222", position: "sticky", top: 0, zIndex: 90 }}>
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/')} style={{ color: "#888" }} />
            <Title level={4} style={{ color: "#fff", margin: 0 }}>Command Center</Title>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} type="text" style={{ color: "#666" }}>Refresh Data</Button>
        </Header>

        <Content style={{ padding: "40px 60px" }}>
          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>Platform <span style={{ color: "#d4af37" }}>Governance</span></Title>
            <Text style={{ color: "#666" }}>Manage users, roles, and global platform configuration.</Text>
          </div>

          <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
            <Col xs={24} sm={8}>
              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}>
                <Statistic title={<span style={{ color: "#666" }}>TOTAL USERS</span>} value={users.length} valueStyle={{ color: "#fff" }} prefix={<UserOutlined style={{ color: "#d4af37" }} />} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}>
                <Statistic title={<span style={{ color: "#666" }}>TOTAL SPIRITS</span>} value={stats?.total_sool || 0} valueStyle={{ color: "#fff" }} prefix={<DatabaseOutlined style={{ color: "#d4af37" }} />} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}>
                <Statistic title={<span style={{ color: "#666" }}>PLATFORM UPTIME</span>} value={100} suffix="%" valueStyle={{ color: "#52c41a" }} prefix={<SafetyCertificateOutlined />} />
              </Card>
            </Col>
          </Row>

          <Card 
            title={<span style={{ color: "#fff", letterSpacing: 1 }}>USER MANAGEMENT</span>} 
            style={{ background: "#111", border: "1px solid #222", borderRadius: 24, overflow: "hidden" }}
            headStyle={{ borderBottom: "1px solid #222" }}
          >
            <Table 
              dataSource={users} 
              columns={columns} 
              rowKey="id" 
              pagination={{ pageSize: 10 }}
              style={{ background: "transparent" }}
              className="custom-table"
            />
          </Card>
        </Content>

        <Footer style={{ background: "transparent", color: "#444", textAlign: "center", padding: "40px 0", borderTop: "1px solid #222", marginTop: 60 }}>
          SOOL ARCHITECT — INTERNAL GOVERNANCE SYSTEM
        </Footer>
      </Layout>

      <style jsx global>{`
        .custom-table .ant-table { background: transparent !important; color: #aaa !important; }
        .custom-table .ant-table-thead > tr > th { background: #1a1a1a !important; color: #666 !important; border-bottom: 1px solid #222 !important; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
        .custom-table .ant-table-tbody > tr > td { border-bottom: 1px solid #222 !important; }
        .custom-table .ant-table-tbody > tr:hover > td { background: #161616 !important; }
      `}</style>
    </Layout>
  );
}
