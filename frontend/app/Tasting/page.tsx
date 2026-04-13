"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  Space,
  Table,
  Rate,
  Spin,
  Empty,
} from "antd";

import {
  PlusOutlined,
  BulbOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function TastingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    return "http://127.0.0.1:8000";
  };

  const API_URL = getApiUrl();

  const fetchNotes = async () => {
    const token = localStorage.getItem('sool_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sense/`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.ok) {
        setNotes(await res.json());
      } else if (res.status === 401) {
        localStorage.removeItem('sool_token');
      }
    } catch (err) {
      console.error("Connection Refused:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchNotes();
    }
  }, [authLoading]);

  const columns = [
    {
      title: "SPIRIT",
      dataIndex: "sool_name",
      key: "sool_name",
      render: (name: string, record: any) => (
        <Link href={`/sool/${record.sool_id}`} style={{ color: "#fff", fontWeight: 600 }}>{name}</Link>
      )
    },
    {
      title: "RATING",
      dataIndex: "rating",
      key: "rating",
      render: (r: number) => <Rate disabled value={r / 2} style={{ fontSize: 12, color: "#d4af37" }} />
    },
    {
      title: "NOTES",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (n: string) => <Text style={{ color: "#666" }}>{n || "No comments recorded."}</Text>
    },
    {
      title: "DATE",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => <Text style={{ color: "#444", fontSize: 12 }}>{new Date(d).toLocaleDateString()}</Text>
    }
  ];

  if (authLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: "60px 80px", background: "transparent" }}>
      {!user ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Empty description={<Text style={{ color: '#666' }}>Sign in to start your tasting journal.</Text>} />
          <Link href="/login"><Button type="primary" style={{ marginTop: 20, background: '#d4af37', color: '#000', border: 'none' }}>Sign In</Button></Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <Title style={{ color: "#fff", fontSize: 48, fontWeight: 800, margin: 0 }}>
                My Sensory <span style={{ color: "#d4af37" }}>Archive</span>
              </Title>
              <Text style={{ color: "#666", fontSize: 18 }}>You have recorded {notes.length} unique tasting experiences.</Text>
            </div>
            <Link href="/sense/new">
              <Button type="primary" size="large" icon={<PlusOutlined />} style={{ background: "#d4af37", color: "#000", border: "none", fontWeight: 700, borderRadius: 12, height: 50 }}>
                NEW ENTRY
              </Button>
            </Link>
          </div>

          {loading ? <Spin size="large" /> : (
            <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 24, overflow: 'hidden' }}>
              <Table 
                dataSource={notes} 
                columns={columns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
                className="custom-table"
              />
            </Card>
          )}
        </>
      )}

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
              Focus on the "Body" of the spirit. Is it light like water, or full and coating like syrup? 
              The mouthfeel is a key differentiator in traditional spirits.
            </Text>
          </Col>
        </Row>
      </div>

      <footer style={{ 
        textAlign: "center", 
        padding: "80px 0 40px",
        color: "#444",
        fontSize: 12,
        letterSpacing: 2
      }}>
        SOOL — PRESERVING THE ART OF TASTING
      </footer>

      <style jsx global>{`
        .custom-table .ant-table { background: transparent !important; color: #aaa !important; }
        .custom-table .ant-table-thead > tr > th { background: #1a1a1a !important; color: #666 !important; border-bottom: 1px solid #222 !important; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
        .custom-table .ant-table-tbody > tr > td { border-bottom: 1px solid #222 !important; background: transparent !important; }
        .custom-table .ant-table-tbody > tr:hover > td { background: #161616 !important; }
      `}</style>
    </div>
  );
}
