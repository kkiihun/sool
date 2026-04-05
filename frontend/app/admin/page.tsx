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
  Badge,
  Rate,
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
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { Tabs, Select, Popconfirm, Form, Modal, Input, InputNumber } from "antd";

const { Sider, Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [sool, setSool] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Sool Modal State
  const [isSoolModalOpen, setIsSoolModalOpen] = useState(false);
  const [editingSool, setEditingSool] = useState<any>(null);
  const [soolForm] = Form.useForm();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const resolveImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/static')) return `${API_URL}${encodeURI(url)}`;
    return url;
  };

  const fetchData = async () => {
    const token = localStorage.getItem('sool_token');
    if (!token) return;

    try {
      setLoading(true);
      const [usersRes, statsRes, soolRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/users/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/sool/stats`),
        fetch(`${API_URL}/sool/all`),
        fetch(`${API_URL}/sense/list`)
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (soolRes.ok) setSool(await soolRes.json());
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(Array.isArray(data) ? data : data.items ?? []);
      }
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

  const updateStatus = async (userId: number, status: string) => {
    const token = localStorage.getItem('sool_token');
    try {
      const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        message.success("Account status updated.");
        fetchData();
      }
    } catch (err) {
      message.error("Status update failed.");
    }
  };

  const deleteUser = async (userId: number) => {
    const token = localStorage.getItem('sool_token');
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        message.success("User permanently removed.");
        fetchData();
      } else {
        const data = await res.json();
        message.error(data.detail || "Delete failed.");
      }
    } catch (err) {
      message.error("Connection error.");
    }
  };

  // Spirit Management Logic
  const handleAddSool = () => {
    setEditingSool(null);
    soolForm.resetFields();
    setIsSoolModalOpen(true);
  };

  const handleEditSool = (record: any) => {
    setEditingSool(record);
    soolForm.setFieldsValue(record);
    setIsSoolModalOpen(true);
  };

  const saveSool = async (values: any) => {
    const token = localStorage.getItem('sool_token');
    const method = editingSool ? 'PUT' : 'POST';
    const url = editingSool ? `${API_URL}/sool/${editingSool.id}` : `${API_URL}/sool/`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      if (res.ok) {
        message.success(`Spirit ${editingSool ? 'updated' : 'created'} successfully.`);
        setIsSoolModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        message.error(error.detail || "Operation failed.");
      }
    } catch (err) {
      message.error("Connection failed.");
    }
  };

  const handleDeleteSool = async (soolId: number) => {
    const token = localStorage.getItem('sool_token');
    try {
      const res = await fetch(`${API_URL}/sool/${soolId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        message.success("Spirit removed from archive.");
        fetchData();
      }
    } catch (err) {
      message.error("Failed to delete.");
    }
  };

  if (authLoading || loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}><Spin size="large" /></div>;

  const userColumns = [
    { title: "ID", dataIndex: "id", key: "id", render: (id: number) => <span style={{ color: "#666" }}>#{id}</span> },
    { title: "User", dataIndex: "username", key: "username", render: (name: string, record: any) => (
      <div>
        <Text style={{ color: "#fff", fontWeight: 600, display: 'block' }}>{name}</Text>
        <Text style={{ color: "#444", fontSize: 12 }}>{record.email}</Text>
      </div>
    )},
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status", 
      render: (status: string, record: any) => (
        <Select 
          value={status || 'active'} 
          style={{ width: 120 }} 
          size="small"
          variant="borderless"
          dropdownStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
          onChange={(val) => updateStatus(record.id, val)}
          disabled={record.id === user?.id}
        >
          <Option value="active"><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> Active</Option>
          <Option value="suspended"><StopOutlined style={{ color: '#faad14', marginRight: 8 }} /> Suspended</Option>
          <Option value="locked"><LockOutlined style={{ color: '#ff4d4f', marginRight: 8 }} /> Locked</Option>
        </Select>
      ) 
    },
    { 
      title: "Permissions", 
      key: "permissions", 
      render: (record: any) => (
        <Space>
          <Switch 
            checked={record.is_admin} 
            onChange={() => toggleAdmin(record.id)} 
            disabled={record.id === user?.id}
            size="small"
          />
          <Text style={{ color: "#444", fontSize: 12 }}>Admin</Text>
        </Space>
      ) 
    },
    { 
      title: "Actions", 
      key: "actions", 
      render: (record: any) => (
        <Popconfirm
          title="Delete Account"
          description="Are you sure? This action cannot be undone."
          onConfirm={() => deleteUser(record.id)}
          okText="Yes"
          cancelText="No"
          disabled={record.id === user?.id}
          okButtonProps={{ danger: true }}
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            disabled={record.id === user?.id}
          />
        </Popconfirm>
      ) 
    }
  ];

  const soolColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Name", dataIndex: "name", key: "name", render: (text: string, record: any) => (
      <Space>
        <div style={{ width: 32, height: 32, background: '#1a1a1a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {record.image_url ? <img src={resolveImageUrl(record.image_url) || ""} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : "🥃"}
        </div>
        <Text style={{ color: "#fff", fontWeight: 600 }}>{text}</Text>
      </Space>
    )},
    { title: "Category", dataIndex: "category", key: "category", render: (cat: string) => <Tag color="gold">{cat}</Tag> },
    { title: "ABV", dataIndex: "abv", key: "abv", render: (abv: number) => <Text style={{ color: "#d4af37" }}>{abv}%</Text> },
    { title: "Producer", dataIndex: "producer", key: "producer", render: (p: string) => <Text style={{ color: "#888" }}>{p || "-"}</Text> },
    { 
      title: "Actions", 
      key: "actions", 
      render: (record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditSool(record)} style={{ color: "#888" }} />
          <Popconfirm title="Delete Spirit?" onConfirm={() => handleDeleteSool(record.id)} okText="Yes" cancelText="No">
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const reviewColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Spirit ID", dataIndex: "sool_id", key: "sool_id" },
    { title: "Rating", dataIndex: "rating", key: "rating", render: (r: number) => <Rate disabled value={r / 2} style={{ fontSize: 12 }} /> },
    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (n: string) => <Text style={{ color: "#888" }}>{n}</Text> },
    { 
      title: "Actions", 
      key: "actions", 
      render: () => (
        <Button type="text" icon={<DeleteOutlined />} danger />
      )
    }
  ];

  const tabItems = [
    {
      key: "users",
      label: (
        <span>
          <UserOutlined /> Users
        </span>
      ),
      children: (
        <Table 
          dataSource={users} 
          columns={userColumns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          style={{ background: "transparent" }}
          className="custom-table"
        />
      ),
    },
    {
      key: "sool",
      label: (
        <span>
          <DatabaseOutlined /> Spirits
        </span>
      ),
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSool} style={{ background: '#d4af37', color: '#000', border: 'none' }}>Add Spirit</Button>
          </div>
          <Table 
            dataSource={sool} 
            columns={soolColumns} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            style={{ background: "transparent" }}
            className="custom-table"
          />

          <Modal
            title={<span style={{ color: '#fff' }}>{editingSool ? 'EDIT SPIRIT' : 'ADD NEW SPIRIT'}</span>}
            open={isSoolModalOpen}
            onOk={() => soolForm.submit()}
            onCancel={() => setIsSoolModalOpen(false)}
            okText="Save Spirit"
            okButtonProps={{ style: { background: '#d4af37', border: 'none', color: '#000', fontWeight: 700 } }}
            cancelButtonProps={{ type: 'text', style: { color: '#888' } }}
            styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            modalRender={(modal) => <div className="dark-modal">{modal}</div>}
          >
            <Form 
              form={soolForm} 
              layout="vertical" 
              onFinish={saveSool}
              initialValues={{ abv: 15 }}
              style={{ marginTop: 24 }}
            >
              <Form.Item name="name" label={<Text style={{ color: '#888' }}>Name</Text>} rules={[{ required: true }]}>
                <Input style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="category" label={<Text style={{ color: '#888' }}>Category</Text>}>
                    <Select dropdownStyle={{ background: '#1a1a1a' }}>
                      <Option value="막걸리">막걸리</Option>
                      <Option value="약주">약주</Option>
                      <Option value="청주">청주</Option>
                      <Option value="증류주">증류주</Option>
                      <Option value="과실주">과실주</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="abv" label={<Text style={{ color: '#888' }}>ABV (%)</Text>}>
                    <InputNumber min={0} max={100} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="region" label={<Text style={{ color: '#888' }}>Region</Text>}>
                <Input style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
              </Form.Item>
              <Form.Item name="producer" label={<Text style={{ color: '#888' }}>Producer</Text>}>
                <Input style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
              </Form.Item>
              <Form.Item 
                name="image_url" 
                label={<Text style={{ color: '#888' }}>Image URL</Text>}
                extra={<Text style={{ color: '#444', fontSize: 11 }}>Tip: Use /static/images/{"{id}"}.png for local files.</Text>}
              >
                <Input placeholder="https://... or /static/images/1.png" style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
              </Form.Item>
              <Form.Item name="description" label={<Text style={{ color: '#888' }}>Description</Text>}>
                <TextArea rows={3} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
              </Form.Item>
            </Form>
          </Modal>
        </>
      ),
    },
    {
      key: "reviews",
      label: (
        <span>
          <StarOutlined /> Reviews
        </span>
      ),
      children: (
        <Table 
          dataSource={reviews} 
          columns={reviewColumns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          style={{ background: "transparent" }}
          className="custom-table"
        />
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
          <Space size="middle">
            <Button icon={<ReloadOutlined />} onClick={fetchData} type="text" style={{ color: "#666" }}>Refresh Data</Button>
            <div style={{ width: 1, height: 20, background: "#333" }} />
            <Link href="/profile">
              <Space size="small" style={{ cursor: 'pointer' }}>
                <Text style={{ color: "#fff", fontWeight: 500 }}>{user?.username}</Text>
                <Badge dot color="#52c41a">
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#333", border: "1px solid #444", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserOutlined style={{ color: "#fff" }} />
                  </div>
                </Badge>
              </Space>
            </Link>
          </Space>
        </Header>

        <Content style={{ padding: "40px 60px" }}>
          <div style={{ marginBottom: 40 }}>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>Platform <span style={{ color: "#d4af37" }}>Governance</span></Title>
            <Text style={{ color: "#666" }}>Manage users, spirits, and platform reviews.</Text>
          </div>

          <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
            <Col xs={24} sm={6}>
              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}>
                <Statistic title={<span style={{ color: "#666" }}>TOTAL USERS</span>} value={users.length} styles={{ content: { color: "#fff" } }} prefix={<UserOutlined style={{ color: "#d4af37" }} />} />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}>
                <Statistic title={<span style={{ color: "#666" }}>TOTAL SPIRITS</span>} value={sool.length} styles={{ content: { color: "#fff" } }} prefix={<DatabaseOutlined style={{ color: "#d4af37" }} />} />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}>
                <Statistic title={<span style={{ color: "#666" }}>REVIEWS</span>} value={reviews.length} styles={{ content: { color: "#fff" } }} prefix={<StarOutlined style={{ color: "#d4af37" }} />} />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card style={{ background: "#111", border: "1px solid #222", borderRadius: 16 }}>
                <Statistic title={<span style={{ color: "#666" }}>UPTIME</span>} value={100} suffix="%" styles={{ content: { color: "#52c41a" } }} prefix={<SafetyCertificateOutlined />} />
              </Card>
            </Col>
          </Row>

          <Card 
            style={{ background: "#111", border: "1px solid #222", borderRadius: 24, overflow: "hidden" }}
            styles={{ body: { padding: 24 } }}
          >
            <Tabs 
              defaultActiveKey="users" 
              items={tabItems} 
              className="admin-tabs"
            />
          </Card>
        </Content>

        <Footer style={{ background: "transparent", color: "#444", textAlign: "center", padding: "40px 0", borderTop: "1px solid #222", marginTop: 60 }}>
          SOOL ARCHITECT — INTERNAL GOVERNANCE SYSTEM
        </Footer>
      </Layout>

      <style jsx global>{`
        .custom-table .ant-table { background: transparent !important; color: #aaa !important; }
        .custom-table .ant-table-thead > tr > th { background: #1a1a1a !important; color: #666 !important; border-bottom: 1px solid #222 !important; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
        .custom-table .ant-table-tbody > tr > td { border-bottom: 1px solid #222 !important; background: transparent !important; }
        .custom-table .ant-table-tbody > tr:hover > td { background: #161616 !important; }
        .admin-tabs .ant-tabs-tab { color: #666 !important; }
        .admin-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #d4af37 !important; }
        .admin-tabs .ant-tabs-ink-bar { background: #d4af37 !important; }
        
        .dark-modal .ant-modal-content { background: #111 !important; border: 1px solid #222 !important; border-radius: 24px !important; }
        .dark-modal .ant-modal-header { background: transparent !important; border-bottom: 1px solid #222 !important; padding-bottom: 16px !important; }
        .dark-modal .ant-modal-title { color: #fff !important; }
        .dark-modal .ant-modal-close { color: #666 !important; }
        .dark-modal .ant-form-item-label label { color: #888 !important; }
        .dark-modal .ant-select-selector { background: #1a1a1a !important; border: 1px solid #333 !important; color: #fff !important; }
        .dark-modal .ant-select-arrow { color: #666 !important; }
      `}</style>
    </Layout>
  );
}

