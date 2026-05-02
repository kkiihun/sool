"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import {
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
  const [data, setData] = useState<Sense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = getToken();
      const res = await fetch("/proxy/sense/", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

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
  }, []);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      render: (id: number) => <span style={{ color: "#666" }}>#{id}</span>,
    },
    {
      title: "Sool",
      dataIndex: "sool_id",
      render: (soolId: number) => (
        <Link href={`/sool/${soolId}`} style={{ color: "#d4af37", fontWeight: 600 }}>
          Spirit #{soolId}
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
      render: (rating: number) => <Rate disabled value={(rating ?? 0) / 2} style={{ fontSize: 12, color: "#d4af37" }} />,
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
          <Button type="text" icon={<EyeOutlined />} style={{ color: "#d4af37" }}>
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: "40px 60px", background: "#050505", minHeight: "100vh" }}>
      <div style={{ marginBottom: 40 }}>
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          Your <span style={{ color: "#d4af37" }}>Sensory Vault</span>
        </Title>
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
    </div>
  );
}
