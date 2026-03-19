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
  Rate,
  Breadcrumb,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface Sense {
  id: number;
  sool_id: number;
  clarity: number;
  color: number;
  aroma: number;
  sweetness: number;
  smoothness: number;
  rating?: number;
  notes?: string;
  created_at?: string;
}

export default function SenseListPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState<Sense[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/sense/`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch sense list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const columns = [
    {
      title: "ID",
      dataKey: "id",
      render: (id: number) => <span style={{ color: "#666" }}>#{id}</span>,
    },
    {
      title: "Sool",
      dataKey: "sool_id",
      render: (sool_id: number) => (
        <Link href={`/sool/${sool_id}`} style={{ color: "#d4af37", fontWeight: 600 }}>
          Spirit #{sool_id}
        </Link>
      ),
    },
    {
      title: "Ratings",
      render: (record: Sense) => (
        <Space size="small">
          <Tag color="#222" style={{ color: "#888", border: "1px solid #333" }}>Aro: {record.aroma}</Tag>
          <Tag color="#222" style={{ color: "#888", border: "1px solid #333" }}>Swt: {record.sweetness}</Tag>
          <Tag color="#222" style={{ color: "#888", border: "1px solid #333" }}>Smth: {record.smoothness}</Tag>
        </Space>
      ),
    },
    {
      title: "Overall",
      dataIndex: "rating",
      render: (rating: number) => <Rate disabled value={rating / 2} style={{ fontSize: 12, color: "#d4af37" }} />,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      render: (date: string) => <span style={{ color: "#666" }}>{date ? new Date(date).toLocaleDateString() : "-"}</span>,
    },
    {
      title: "Action",
      render: (record: Sense) => (
        <Link href={`/sense/list/${record.id}`}>
          <Button type="text" icon={<EyeOutlined />} style={{ color: "#d4af37" }}>View</Button>
        </Link>
      ),
    },
  ];

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
            <Title level={4} style={{ color: "#fff", margin: 0 }}>Collection History</Title>
          </Space>
          <Breadcrumb 
            items={[
              { title: <Link href="/Tasting" style={{ color: "#666" }}>Tasting</Link> },
              { title: <span style={{ color: "#fff" }}>History</span> },
            ]}
          />
        </Header>

        <Content style={{ padding: "40px 60px" }}>
          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>Your <span style={{ color: "#d4af37" }}>Sensory Vault</span></Title>
            <Text style={{ color: "#666" }}>Review your past explorations and flavor profiles.</Text>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <div style={{ background: "#111", borderRadius: 24, border: "1px solid #222", overflow: "hidden" }}>
              <Table 
                dataSource={data} 
                columns={columns} 
                rowKey="id"
                pagination={{ pageSize: 10, position: ["bottomCenter"] }}
                style={{ background: "transparent" }}
                className="custom-table"
              />
            </div>
          )}
        </Content>

        <Footer style={{ background: "transparent", color: "#444", textAlign: "center", padding: "40px 0", borderTop: "1px solid #222", marginTop: 60 }}>
          SOOL — PRESERVING EVERY DROP
        </Footer>
      </Layout>

      <style jsx global>{`
        .custom-table .ant-table {
          background: transparent !important;
          color: #aaa !important;
        }
        .custom-table .ant-table-thead > tr > th {
          background: #1a1a1a !important;
          color: #666 !important;
          border-bottom: 1px solid #222 !important;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #222 !important;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background: #161616 !important;
        }
        .ant-pagination-item {
          background: transparent !important;
          border-color: #222 !important;
        }
        .ant-pagination-item a {
          color: #666 !important;
        }
        .ant-pagination-item-active {
          border-color: #d4af37 !important;
        }
        .ant-pagination-item-active a {
          color: #d4af37 !important;
        }
      `}</style>
    </Layout>
  );
}
