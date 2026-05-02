"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
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
  StarOutlined,
  MessageOutlined,
  ShareAltOutlined,
  PlusOutlined,
  UserOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

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
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ notes: "", rating: 5, sool_id: "" });

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

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
    <div className="animate-in fade-in duration-700">
      <Row gutter={[40, 40]}>
        <Col xs={24} lg={16}>
          <Space orientation="vertical" size={32} className="w-full">
            {feed.map((item) => (
              <Card 
                key={item.id}
                className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden backdrop-blur-sm transition-transform hover:scale-[1.01]"
                styles={{ body: { padding: 40 } }}
              >
                <div className="flex justify-between items-start mb-6">
                  <Space size="middle">
                    <Avatar icon={<UserOutlined />} className="bg-white/10 border-white/20 h-12 w-12" />
                    <div>
                      <Text className="text-white text-lg font-black block leading-tight">Anonymous Connoisseur</Text>
                      <Text className="text-white/20 text-xs font-bold uppercase tracking-widest" suppressHydrationWarning>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Just now"}
                      </Text>
                    </div>
                  </Space>
                  <Link href={`/sool/${item.sool_id}`}>
                    <Tag className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest">Spirit #{item.sool_id}</Tag>
                  </Link>
                </div>
                
                <Paragraph className="text-white/60 text-lg leading-relaxed mb-8">
                  {item.notes || "Recorded a visual and aromatic profile of this exquisite spirit."}
                </Paragraph>
                
                <div className="flex justify-between items-center border-t border-white/5 pt-8">
                  <Space size="large">
                    <Rate disabled value={item.rating / 2} className="text-sm text-amber-500" />
                    <Text className="text-amber-500 font-black tracking-widest">{item.rating}/10</Text>
                  </Space>
                  <Space size="middle">
                    <Button type="text" icon={<MessageOutlined />} className="text-white/20 hover:text-white transition-colors">Comment</Button>
                    <Button type="text" icon={<ShareAltOutlined />} className="text-white/20 hover:text-white transition-colors">Share</Button>
                  </Space>
                </div>
              </Card>
            ))}
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={<span className="text-white font-black uppercase tracking-widest text-xs">Trending Now</span>}
            className="bg-white/5 border-white/10 rounded-[32px] mb-8"
            styles={{ header: { borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "24px 32px" }, body: { padding: "32px" } }}
          >
            <Space orientation="vertical" size="middle" className="w-full">
              {[
                { name: "Andong Soju", tag: "Heavy Hitter", count: 124 },
                { name: "Naru Yakju", tag: "Popular", count: 89 },
                { name: "Makgeolli", tag: "Rising", count: 56 },
              ].map((trend, idx) => (
                <div key={idx} className={`pb-6 ${idx < 2 ? "border-b border-white/5" : ""}`}>
                  <div className="flex justify-between items-center mb-2">
                    <Text className="text-white font-bold">{trend.name}</Text>
                    <Badge count={trend.tag} className="[&>.ant-scroll-number]:bg-white/5 [&>.ant-scroll-number]:text-white/30 [&>.ant-scroll-number]:border-none [&>.ant-scroll-number]:text-[10px] [&>.ant-scroll-number]:font-black [&>.ant-scroll-number]:px-3" />
                  </div>
                  <Text className="text-white/20 text-xs font-medium">{trend.count} discussions today</Text>
                </div>
              ))}
            </Space>
          </Card>
          
          <Card 
            className="bg-gradient-to-br from-amber-500 to-amber-600 border-none rounded-[32px] p-4 shadow-2xl shadow-amber-500/20"
          >
            <Title level={4} className="!text-black !m-0 !font-black !text-2xl uppercase tracking-tight">Join the Guild</Title>
            <Text className="text-black/60 block mt-2 mb-8 font-medium">
              Unlock exclusive tasting events and community rewards.
            </Text>
            <Button block className="bg-black text-amber-500 border-none font-black h-12 rounded-xl uppercase tracking-widest text-xs">Apply Now</Button>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const PlaceholderTab = ({ icon, title, description }: any) => (
    <div className="text-center py-32">
      <div className="text-8xl mb-8 opacity-10">{icon}</div>
      <Title level={3} className="!text-white !font-black !text-3xl mb-4">{title}</Title>
      <Paragraph className="text-white/40 max-w-md mx-auto text-lg">
        {description}
      </Paragraph>
      <Button className="mt-10 bg-transparent border-white/10 text-white/40 h-12 px-8 rounded-xl font-bold hover:!border-amber-500 hover:!text-amber-500 transition-all">Notify Me</Button>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <Title className="!text-white !m-0 !text-5xl font-black">
            Community <span className="text-amber-500">Hub</span>
          </Title>
          <Text className="text-white/40 text-lg">Shared passion, timeless tradition.</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          className="bg-amber-500 text-black border-none font-black h-14 px-8 rounded-2xl text-base shadow-xl shadow-amber-500/10"
          onClick={() => setIsModalOpen(true)}
        >
          Create Post
        </Button>
      </div>

      <Tabs
        defaultActiveKey="feed"
        className="custom-tabs"
        items={[
          {
            key: "feed",
            label: (<span className="flex items-center gap-2 px-4"><FireOutlined />Feed</span>),
            children: loading ? <div className="py-24 text-center"><Spin size="large" /></div> : <FeedTab />,
          },
          {
            key: "market",
            label: (<span className="flex items-center gap-2 px-4"><ShoppingOutlined />Marketplace</span>),
            children: <PlaceholderTab icon={<ShoppingOutlined />} title="Marketplace Coming Soon" description="A dedicated space for trading limited editions and rare finds among collectors." />,
          },
          {
            key: "clubs",
            label: (<span className="flex items-center gap-2 px-4"><TeamOutlined />Clubs</span>),
            children: <PlaceholderTab icon={<TeamOutlined />} title="Tasting Clubs" description="Join local or virtual clubs to share experiences and attend exclusive tasting sessions." />,
          },
        ]}
      />

      <Modal
        title={<span className="text-white font-black uppercase tracking-widest">Share with the Community</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        className="dark-modal"
        width={600}
        styles={{
          mask: { backdropFilter: "blur(10px)" },
          content: { background: "#080808", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "32px", padding: "40px" },
          header: { background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "24px", marginBottom: "32px" },
        }}
      >
        <Space orientation="vertical" size="large" className="w-full">
          <div>
            <Text className="text-white/30 text-xs font-bold uppercase tracking-widest block mb-3">Spirit ID</Text>
            <Input 
              placeholder="Which spirit are you enjoying? (ID)" 
              value={newPost.sool_id} 
              onChange={(e) => setNewPost({...newPost, sool_id: e.target.value})}
              className="bg-white/5 border-white/10 text-white h-14 rounded-xl focus:bg-white/10 transition-all"
            />
          </div>
          <div>
            <Text className="text-white/30 text-xs font-bold uppercase tracking-widest block mb-3">Your Rating</Text>
            <Rate value={newPost.rating / 2} onChange={(val) => setNewPost({...newPost, rating: val * 2})} className="text-2xl text-amber-500" />
          </div>
          <div>
            <Text className="text-white/30 text-xs font-bold uppercase tracking-widest block mb-3">Impressions</Text>
            <TextArea 
              rows={4} 
              placeholder="What's on your mind?" 
              value={newPost.notes} 
              onChange={(e) => setNewPost({...newPost, notes: e.target.value})}
              className="bg-white/5 border-white/10 text-white rounded-xl focus:bg-white/10 transition-all p-4"
            />
          </div>
          <Button 
            type="primary" 
            block 
            className="bg-amber-500 text-black border-none font-black h-16 rounded-2xl text-lg mt-4 uppercase tracking-widest"
            onClick={handlePost}
          >
            Post to Feed
          </Button>
        </Space>
      </Modal>

      <style jsx global>{`
        .custom-tabs .ant-tabs-nav::before { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .custom-tabs .ant-tabs-tab { color: rgba(255,255,255,0.3) !important; font-weight: 700 !important; font-size: 16px !important; padding: 16px 0 !important; margin-right: 40px !important; }
        .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #f59e0b !important; }
        .custom-tabs .ant-tabs-ink-bar { background: #f59e0b !important; height: 3px !important; }
        .dark-modal .ant-modal-close { color: rgba(255,255,255,0.2) !important; top: 32px !important; right: 32px !important; }
        .dark-modal .ant-modal-close:hover { color: #fff !important; }
      `}</style>
    </div>
  );
}
