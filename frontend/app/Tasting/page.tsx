"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";
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

  const fetchNotes = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/proxy/v2/tasting/note/all", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setNotes(await res.json());
      } else if (res.status === 401) {
        clearToken();
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
        <Link href={`/sool/${record.sool_id}`} style={{ color: "#fff", fontWeight: 600 }}>
          {name || `Entry #${record.id}`}
        </Link>
      ),
    },
    {
      title: "RATING",
      dataIndex: "rating",
      key: "rating",
      render: (r: number) => <Rate disabled value={r} style={{ fontSize: 12, color: "#f59e0b" }} />,
    },
    {
      title: "NOTES",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (n: string) => <Text style={{ color: "#888" }}>{n || "No comments recorded."}</Text>,
    },
    {
      title: "DATE",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => <Text style={{ color: "#444", fontSize: 12 }}>{new Date(d).toLocaleDateString()}</Text>,
    },
  ];

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-16 px-10">
      {!user ? (
        <div className="text-center py-32">
          <Empty description={<Text className="text-white/40">Sign in to start your tasting journal.</Text>} />
          <Link href="/login">
            <Button type="primary" className="mt-8 h-12 px-10 bg-amber-500 text-black border-none font-bold rounded-xl">
              Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
            <div>
              <Title className="!text-white !m-0 !text-6xl font-black tracking-tight">
                My Sensory <span className="text-amber-500">Archive</span>
              </Title>
              <Text className="text-white/40 text-xl mt-4 block">You have recorded {notes.length} unique tasting experiences.</Text>
            </div>
            <Link href="/sense/new">
              <Button type="primary" size="large" icon={<PlusOutlined />} className="bg-amber-500 text-black border-none font-bold h-16 px-10 rounded-2xl shadow-lg shadow-amber-500/10">
                NEW ENTRY
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="py-32 text-center"><Spin size="large" /></div>
          ) : (
            <Card className="bg-white/[0.02] border-white/5 rounded-[32px] overflow-hidden backdrop-blur-xl">
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

      {/* Expert Tips Section with Premium Styling */}
      <div className="mt-24 bg-gradient-to-br from-white/[0.03] to-transparent rounded-[40px] p-12 border border-white/5">
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} md={4} className="text-center">
            <BulbOutlined className="text-6xl text-amber-500 opacity-80" />
          </Col>
          <Col xs={24} md={20}>
            <Title level={3} className="!text-white !mb-4 font-bold">Expert Tip</Title>
            <Text className="text-white/50 text-xl leading-relaxed">
              Focus on the "Body" of the spirit. Is it light like water, or full and coating like syrup? 
              The mouthfeel is a key differentiator in traditional spirits.
            </Text>
          </Col>
        </Row>
      </div>

      <footer className="text-center py-20 text-white/10 text-[11px] font-black tracking-[0.4em] uppercase">
        SOOL — PRESERVING THE ART OF TASTING
      </footer>

      <style jsx global>{`
        .custom-table .ant-table { background: transparent !important; color: #aaa !important; }
        .custom-table .ant-table-thead > tr > th { 
          background: rgba(255,255,255,0.02) !important; 
          color: rgba(255,255,255,0.3) !important; 
          border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
          text-transform: uppercase; 
          font-size: 11px; 
          letter-spacing: 3px; 
          font-weight: 800;
          padding: 24px 20px !important;
        }
        .custom-table .ant-table-tbody > tr > td { 
          border-bottom: 1px solid rgba(255,255,255,0.03) !important; 
          background: transparent !important; 
          padding: 28px 20px !important; 
        }
        .custom-table .ant-table-tbody > tr:hover > td { background: rgba(255,255,255,0.01) !important; }
        .custom-table .ant-pagination-item { background: transparent !important; border-color: rgba(255,255,255,0.05) !important; border-radius: 8px; }
        .custom-table .ant-pagination-item a { color: rgba(255,255,255,0.4) !important; }
        .custom-table .ant-pagination-item-active { border-color: #f59e0b !important; background: rgba(245, 158, 11, 0.1) !important; }
        .custom-table .ant-pagination-item-active a { color: #f59e0b !important; }
      `}</style>
    </div>
  );
}
