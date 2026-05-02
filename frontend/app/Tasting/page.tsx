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
      const res = await fetch("/proxy/sense/", {
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
          {name}
        </Link>
      ),
    },
    {
      title: "RATING",
      dataIndex: "rating",
      key: "rating",
      render: (r: number) => <Rate disabled value={r / 2} style={{ fontSize: 12, color: "#d4af37" }} />,
    },
    {
      title: "NOTES",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (n: string) => <Text style={{ color: "#666" }}>{n || "No comments recorded."}</Text>,
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
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      {!user ? (
        <div className="text-center py-24">
          <Empty description={<Text className="text-white/40">Sign in to start your tasting journal.</Text>} />
          <Link href="/login">
            <Button type="primary" className="mt-6 h-12 px-8 bg-amber-500 text-black border-none font-bold">
              Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <Title className="!text-white !m-0 !text-5xl font-black">
                My Sensory <span className="text-amber-500">Archive</span>
              </Title>
              <Text className="text-white/40 text-lg">You have recorded {notes.length} unique tasting experiences.</Text>
            </div>
            <Link href="/sense/new">
              <Button type="primary" size="large" icon={<PlusOutlined />} className="bg-amber-500 text-black border-none font-bold h-14 px-8 rounded-2xl">
                NEW ENTRY
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="py-24 text-center"><Spin size="large" /></div>
          ) : (
            <Card className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden backdrop-blur-sm">
              <Table dataSource={notes} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} className="custom-table" />
            </Card>
          )}
        </>
      )}

      <div className="mt-20 bg-gradient-to-br from-white/5 to-transparent rounded-[32px] p-10 border border-white/10">
        <Row gutter={[40, 40]} align="middle">
          <Col xs={24} md={4} className="text-center">
            <BulbOutlined className="text-5xl text-amber-500" />
          </Col>
          <Col xs={24} md={20}>
            <Title level={4} className="!text-white !mb-2">Expert Tip</Title>
            <Text className="text-white/60 text-lg">
              Focus on the body of the spirit. Mouthfeel is a key differentiator in traditional drinks.
            </Text>
          </Col>
        </Row>
      </div>

      <style jsx global>{`
        .custom-table .ant-table { background: transparent !important; color: #aaa !important; }
        .custom-table .ant-table-thead > tr > th { background: rgba(255,255,255,0.03) !important; color: rgba(255,255,255,0.4) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; font-weight: 700; }
        .custom-table .ant-table-tbody > tr > td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; background: transparent !important; padding: 24px 16px !important; }
        .custom-table .ant-table-tbody > tr:hover > td { background: rgba(255,255,255,0.02) !important; }
        .custom-table .ant-pagination-item { background: transparent !important; border-color: rgba(255,255,255,0.1) !important; }
        .custom-table .ant-pagination-item a { color: rgba(255,255,255,0.6) !important; }
        .custom-table .ant-pagination-item-active { border-color: #f59e0b !important; }
        .custom-table .ant-pagination-item-active a { color: #f59e0b !important; }
      `}</style>
    </div>
  );
}
