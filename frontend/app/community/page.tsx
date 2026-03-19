"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layout,
  Menu,
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Badge,
  Button,
  Space,
  Avatar,
  Tabs,
  Input,
  Modal,
  Rate,
  message,
  Tag,
} from "antd";
import {
  AppstoreOutlined,
  CompassOutlined,
  StarOutlined,
  HeartOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
  ShareAltOutlined,
  PlusOutlined,
  UserOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface FeedItem {
  id: number;
  sool_id: number;
  rating: number;
  notes: string;
  created_at: string;
  user_id?: number;
}

export default function CommunityPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ notes: "", rating: 5, sool_id: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchFeed = async () => {
    try {
      const res = await fetch(`${API_URL}/sense/list?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data);
      }
    } catch (err) {
      console.error("Failed to fetch community feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [API_URL]);

  const handlePost = async () => {
    if (!newPost.notes || !newPost.sool_id) {
      message.warning("Please fill in all fields.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/sense/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sool_id: Number(newPost.sool_id),
          notes: newPost.notes,
          rating: newPost.rating,
          aroma: 3, sweetness: 3, acidity: 3, body: 3, aftertaste: 3 // Default values for simple post
        }),
      });
      if (res.ok) {
        message.success("Post shared with the community!");
        setIsModalOpen(false);
        setNewPost({ notes: "", rating: 5, sool_id: "" });
        fetchFeed();
      }
    } catch (err) {
      message.error("Failed to share post.");
    }
  };

  const FeedTab = () => (
    <div className="page-transition">
      <Row gutter={[32, 32]}>
        <Col xs={24} lg={16}>
          <Space orientation="vertical" size={24} style={{ width: "100%" }}>
            {feed.map((item) => (
              <Card 
                key={item.id}
                style={{ 
                  background: "#111", 
                  border: "1px solid #222", 
                  borderRadius: 24,
                  overflow: "hidden" 
                }}
                styles={{ body: { padding: 32 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <Space size="middle">
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#222", border: "1px solid #333" }} />
                    <div>
                      <Text style={{ color: "#fff", fontWeight: 700, display: "block" }}>Anonymous Connoisseur</Text>
                      <Text style={{ color: "#444", fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</Text>
                    </div>
                  </Space>
                  <Link href={`/sool/${item.sool_id}`}>
                    <Tag color="#d4af37" style={{ color: "#000", fontWeight: 600, border: "none" }}>Spirit #{item.sool_id}</Tag>
                  </Link>
                </div>
                
                <Paragraph style={{ color: "#aaa", fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
                  {item.notes || "Recorded a visual and aromatic profile of this exquisite spirit."}
                </Paragraph>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #222", paddingTop: 24 }}>
                  <Space size="large">
                    <Rate disabled value={item.rating / 2} style={{ fontSize: 14, color: "#d4af37" }} />
                    <Text style={{ color: "#d4af37", fontWeight: 700 }}>{item.rating}/10</Text>
                  </Space>
                  <Space size="middle">
                    <Button type="text" icon={<MessageOutlined />} style={{ color: "#444" }}>Comment</Button>
                    <Button type="text" icon={<ShareAltOutlined />} style={{ color: "#444" }}>Share</Button>
                  </Space>
                </div>
              </Card>
            ))}
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={<span style={{ color: "#fff" }}>Trending Now</span>}
            style={{ background: "#111", border: "1px solid #222", borderRadius: 24, marginBottom: 24 }}
            headStyle={{ borderBottom: "1px solid #222" }}
          >
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              {[
                { name: "Andong Soju", tag: "Heavy Hitter", count: 124 },
                { name: "Naru Yakju", tag: "Popular", count: 89 },
                { name: "Makgeolli", tag: "Rising", count: 56 },
              ].map((trend, idx) => (
                <div key={idx} style={{ padding: "12px 0", borderBottom: idx < 2 ? "1px solid #222" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: "#fff", fontWeight: 600 }}>{trend.name}</Text>
                    <Badge count={trend.tag} style={{ backgroundColor: "#222", color: "#666", border: "1px solid #333" }} />
                  </div>
                  <Text style={{ color: "#444", fontSize: 12 }}>{trend.count} discussions today</Text>
                </div>
              ))}
            </Space>
          </Card>
          
          <Card 
            style={{ 
              background: "linear-gradient(135deg, #d4af37 0%, #aa8e2e 100%)", 
              border: "none", 
              borderRadius: 24 
            }}
          >
            <Title level={4} style={{ color: "#000", margin: 0 }}>Join the Guild</Title>
            <Text style={{ color: "rgba(0,0,0,0.6)", display: "block", marginTop: 8, marginBottom: 20 }}>
              Unlock exclusive tasting events and community rewards.
            </Text>
            <Button block style={{ background: "#000", color: "#d4af37", border: "none", fontWeight: 700 }}>Apply Now</Button>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const PlaceholderTab = ({ icon, title, description }: any) => (
    <div style={{ textAlign: "center", padding: "100px 0" }}>
      <div style={{ fontSize: 64, color: "#222", marginBottom: 24 }}>{icon}</div>
      <Title level={3} style={{ color: "#fff" }}>{title}</Title>
      <Paragraph style={{ color: "#666", maxWidth: 400, margin: "0 auto" }}>
        {description}
      </Paragraph>
      <Button style={{ marginTop: 32, background: "transparent", border: "1px solid #333", color: "#888" }}>Notify Me</Button>
    </div>
  );

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
          selectedKeys={["community"]}
          style={{ background: "transparent", border: "none" }}
          items={[
            { key: "explore", icon: <AppstoreOutlined />, label: <Link href="/">Explore</Link> },
            { key: "tasting", icon: <StarOutlined />, label: <Link href="/Tasting">Tasting Notes</Link> },
            { key: "analytics", icon: <BarChartOutlined />, label: <Link href="/dashboard">Analytics</Link> },
            { key: "updates", icon: <CompassOutlined />, label: <Link href="/updates">Discovery</Link> },
            { key: "community", icon: <HeartOutlined />, label: "Community" },
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
            <Title level={4} style={{ color: "#fff", margin: 0 }}>Community Hub</Title>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ background: "#d4af37", color: "#000", border: "none", fontWeight: 700 }}
            onClick={() => setIsModalOpen(true)}
          >
            Create Post
          </Button>
        </Header>

        <Content style={{ padding: "40px 60px" }}>
          <Tabs
            defaultActiveKey="feed"
            className="custom-tabs"
            items={[
              {
                key: "feed",
                label: (<span><FireOutlined />Feed</span>),
                children: loading ? <Spin size="large" /> : <FeedTab />,
              },
              {
                key: "market",
                label: (<span><ShoppingOutlined />Marketplace</span>),
                children: <PlaceholderTab icon={<ShoppingOutlined />} title="Marketplace Coming Soon" description="A dedicated space for trading limited editions and rare finds among collectors." />,
              },
              {
                key: "clubs",
                label: (<span><TeamOutlined />Clubs</span>),
                children: <PlaceholderTab icon={<TeamOutlined />} title="Tasting Clubs" description="Join local or virtual clubs to share experiences and attend exclusive tasting sessions." />,
              },
            ]}
          />
        </Content>

        <Footer style={{ 
          background: "transparent", 
          color: "#444", 
          textAlign: "center", 
          padding: "40px 0",
          borderTop: "1px solid #222",
          marginTop: 60
        }}>
          SOOL COMMUNITY — SHARED PASSION, TIMELESS TRADITION
        </Footer>
      </Layout>

      <Modal
        title={<span style={{ color: "#fff" }}>Share with the Community</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        style={{ borderRadius: 20 }}
        styles={{ content: { background: "#111", border: "1px solid #333" }, header: { background: "#111", borderBottom: "1px solid #222" } }}
      >
        <Space orientation="vertical" size="large" style={{ width: "100%", padding: "20px 0" }}>
          <div>
            <Text style={{ color: "#888", display: "block", marginBottom: 8 }}>Spirit ID</Text>
            <Input 
              placeholder="Which spirit are you enjoying? (ID)" 
              value={newPost.sool_id} 
              onChange={(e) => setNewPost({...newPost, sool_id: e.target.value})}
              style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff" }}
            />
          </div>
          <div>
            <Text style={{ color: "#888", display: "block", marginBottom: 8 }}>Your Rating</Text>
            <Rate value={newPost.rating / 2} onChange={(val) => setNewPost({...newPost, rating: val * 2})} style={{ color: "#d4af37" }} />
          </div>
          <div>
            <Text style={{ color: "#888", display: "block", marginBottom: 8 }}>Impressions</Text>
            <TextArea 
              rows={4} 
              placeholder="What's on your mind?" 
              value={newPost.notes} 
              onChange={(e) => setNewPost({...newPost, notes: e.target.value})}
              style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff" }}
            />
          </div>
          <Button 
            type="primary" 
            block 
            size="large" 
            onClick={handlePost}
            style={{ background: "#d4af37", color: "#000", border: "none", fontWeight: 700, height: 50 }}
          >
            Post to Feed
          </Button>
        </Space>
      </Modal>

      <style jsx global>{`
        .custom-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #222 !important;
        }
        .custom-tabs .ant-tabs-tab {
          color: #444 !important;
        }
        .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #d4af37 !important;
        }
        .custom-tabs .ant-tabs-ink-bar {
          background: #d4af37 !important;
        }
        .ant-modal-close {
          color: #666 !important;
        }
      `}</style>
    </Layout>
  );
}
