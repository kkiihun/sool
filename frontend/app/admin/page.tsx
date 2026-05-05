"use client";

import { useEffect, useState } from "react";
import {
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
  Rate,
  Tabs,
  Select,
  Popconfirm,
  Form,
  Modal,
  Input,
  InputNumber,
  Badge,
} from "antd";
import {
  StarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
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

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [sool, setSool] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Sool Modal State
  const [isSoolModalOpen, setIsSoolModalOpen] = useState(false);
  const [editingSool, setEditingSool] = useState<any>(null);
  const [soolForm] = Form.useForm();

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

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

  if (authLoading || loading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0a]"><Spin size="large" /></div>;

  const userColumns = [
    { title: "ID", dataIndex: "id", key: "id", render: (id: number) => <span className="text-white/20 font-mono">#{id}</span> },
    { title: "User", dataIndex: "username", key: "username", render: (name: string, record: any) => (
      <div>
        <Text className="text-white font-bold block">{name}</Text>
        <Text className="text-white/30 text-xs">{record.email}</Text>
      </div>
    )},
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status", 
      render: (status: string, record: any) => (
        <Select 
          value={status || 'active'} 
          className="w-32 admin-select" 
          size="small"
          variant="borderless"
          dropdownStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
          onChange={(val) => updateStatus(record.id, val)}
          disabled={record.id === user?.id}
        >
          <Option value="active"><CheckCircleOutlined className="text-green-500 mr-2" /> Active</Option>
          <Option value="suspended"><StopOutlined className="text-amber-500 mr-2" /> Suspended</Option>
          <Option value="locked"><LockOutlined className="text-red-500 mr-2" /> Locked</Option>
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
            className="admin-switch"
          />
          <Text className="text-white/30 text-xs font-bold uppercase tracking-widest">Admin</Text>
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
            className="hover:bg-red-500/10"
          />
        </Popconfirm>
      ) 
    }
  ];

  const soolColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, render: (id: number) => <span className="text-white/20 font-mono">#{id}</span> },
    { title: "Name", dataIndex: "name", key: "name", render: (text: string, record: any) => (
      <Space size="middle">
        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
          {record.image_url ? <img src={resolveImageUrl(record.image_url) || ""} className="w-full h-full object-cover" /> : "🥃"}
        </div>
        <Text className="text-white font-bold">{text}</Text>
      </Space>
    )},
    { title: "Category", dataIndex: "category", key: "category", render: (cat: string) => <Tag className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black text-[10px] tracking-widest uppercase px-3">{cat}</Tag> },
    { title: "ABV", dataIndex: "abv", key: "abv", render: (abv: number) => <Text className="text-amber-500 font-black">{abv}%</Text> },
    { title: "Producer", dataIndex: "producer", key: "producer", render: (p: string) => <Text className="text-white/20 text-xs font-medium">{p || "-"}</Text> },
    { 
      title: "Actions", 
      key: "actions", 
      render: (record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditSool(record)} className="text-white/20 hover:text-white transition-colors" />
          <Popconfirm title="Delete Spirit?" onConfirm={() => handleDeleteSool(record.id)} okText="Yes" cancelText="No">
            <Button type="text" icon={<DeleteOutlined />} danger className="hover:bg-red-500/10" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const reviewColumns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80, render: (id: number) => <span className="text-white/20 font-mono">#{id}</span> },
    { title: "Spirit ID", dataIndex: "sool_id", key: "sool_id", render: (id: number) => <Tag className="bg-white/5 text-white/40 border-white/10 font-bold px-3">SPIRIT #{id}</Tag> },
    { title: "Rating", dataIndex: "rating", key: "rating", render: (r: number) => <Rate disabled value={r / 2} className="text-[10px] text-amber-500" /> },
    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (n: string) => <Text className="text-white/40 italic">{n}</Text> },
    { 
      title: "Actions", 
      key: "actions", 
      render: () => (
        <Button type="text" icon={<DeleteOutlined />} danger className="hover:bg-red-500/10" />
      )
    }
  ];

  const tabItems = [
    {
      key: "users",
      label: (<span className="flex items-center gap-2 px-4"><UserOutlined /> Users</span>),
      children: (
        <Table 
          dataSource={users} 
          columns={userColumns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          className="custom-table admin-table"
        />
      ),
    },
    {
      key: "sool",
      label: (<span className="flex items-center gap-2 px-4"><DatabaseOutlined /> Spirits</span>),
      children: (
        <>
          <div className="mb-8 flex justify-end">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSool} className="bg-amber-500 text-black border-none font-black h-12 px-8 rounded-xl shadow-xl shadow-amber-500/10">Add Spirit</Button>
          </div>
          <Table 
            dataSource={sool} 
            columns={soolColumns} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            className="custom-table admin-table"
          />

          <Modal
            title={<span className="text-white font-black tracking-widest uppercase">Spirit Management</span>}
            open={isSoolModalOpen}
            onOk={() => soolForm.submit()}
            onCancel={() => setIsSoolModalOpen(false)}
            okText="Save Spirit"
            className="dark-modal"
            width={700}
            styles={{
              mask: { backdropFilter: 'blur(10px)' },
              content: { background: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '40px' },
              header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px', marginBottom: '32px' },
            }}
            okButtonProps={{ className: 'bg-amber-500 text-black border-none font-black h-12 px-8 rounded-xl' }}
            cancelButtonProps={{ className: 'text-white/20 font-bold hover:text-white' }}
          >
            <Form 
              form={soolForm} 
              layout="vertical" 
              onFinish={saveSool}
              initialValues={{ abv: 15 }}
              className="admin-form"
            >
              <Form.Item name="name" label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">Spirit Name</span>} rules={[{ required: true }]}>
                <Input className="bg-white/5 border-white/10 text-white h-12 rounded-xl" />
              </Form.Item>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="category" label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">Category</span>}>
                    <Select className="admin-select h-12" dropdownStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Option value="막걸리">막걸리</Option>
                      <Option value="약주">약주</Option>
                      <Option value="청주">청주</Option>
                      <Option value="증류주">증류주</Option>
                      <Option value="과실주">과실주</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="abv" label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">ABV (%)</span>}>
                    <InputNumber min={0} max={100} className="w-full bg-white/5 border-white/10 text-white h-12 rounded-xl flex items-center" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="region" label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">Origin Region</span>}>
                <Input className="bg-white/5 border-white/10 text-white h-12 rounded-xl" />
              </Form.Item>
              <Form.Item name="producer" label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">Producer / Brewery</span>}>
                <Input className="bg-white/5 border-white/10 text-white h-12 rounded-xl" />
              </Form.Item>
              <Form.Item 
                name="image_url" 
                label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">Cover Image Asset Path</span>}
                extra={<span className="text-white/10 text-[10px] font-bold uppercase tracking-tighter mt-2 block">Standard: /static/images/{"{id}"}.png</span>}
              >
                <Input placeholder="https://... or /static/images/1.png" className="bg-white/5 border-white/10 text-white h-12 rounded-xl" />
              </Form.Item>
              <Form.Item name="description" label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">Product Narrative</span>}>
                <TextArea rows={4} className="bg-white/5 border-white/10 text-white rounded-xl p-4" />
              </Form.Item>
            </Form>
          </Modal>
        </>
      ),
    },
    {
      key: "reviews",
      label: (<span className="flex items-center gap-2 px-4"><StarOutlined /> Reviews</span>),
      children: (
        <Table 
          dataSource={reviews} 
          columns={reviewColumns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          className="custom-table admin-table"
        />
      ),
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <Title className="!text-white !m-0 !text-5xl font-black">
            Platform <span className="text-amber-500">Governance</span>
          </Title>
          <Text className="text-white/40 text-lg">Centralized system administration and content curation.</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchData} 
          className="bg-white/5 border-white/10 text-white/40 hover:text-white font-bold h-12 px-6 rounded-xl transition-all"
        >
          Refresh Data
        </Button>
      </div>

      <Row gutter={[24, 24]} className="mb-12">
        {[
          { title: "TOTAL USERS", value: users.length, icon: <UserOutlined /> },
          { title: "TOTAL SPIRITS", value: sool.length, icon: <DatabaseOutlined /> },
          { title: "REVIEWS", value: reviews.length, icon: <StarOutlined /> },
          { title: "SYSTEM STATUS", value: "OPERATIONAL", icon: <SafetyCertificateOutlined />, color: "text-green-500" },
        ].map((stat, idx) => (
          <Col xs={24} sm={6} key={idx}>
            <Card className="bg-white/5 border-white/10 rounded-3xl backdrop-blur-sm shadow-xl" styles={{ body: { padding: 32 } }}>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-amber-500 text-lg">{stat.icon}</span>
                <span className="text-white/20 text-[10px] font-black tracking-widest">{stat.title}</span>
              </div>
              <div className={`text-2xl font-black ${stat.color || "text-white"}`}>{stat.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card 
        className="bg-white/5 border-white/10 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-sm"
        styles={{ body: { padding: 40 } }}
      >
        <Tabs 
          defaultActiveKey="users" 
          items={tabItems} 
          className="custom-tabs admin-tabs"
        />
      </Card>

      <style jsx global>{`
        .custom-table .ant-table { background: transparent !important; color: rgba(255,255,255,0.6) !important; }
        .custom-table .ant-table-thead > tr > th { background: rgba(255,255,255,0.03) !important; color: rgba(255,255,255,0.3) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; text-transform: uppercase; font-size: 10px; letter-spacing: 2px; font-weight: 900; padding: 20px !important; }
        .custom-table .ant-table-tbody > tr > td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; background: transparent !important; padding: 24px 20px !important; }
        .custom-table .ant-table-tbody > tr:hover > td { background: rgba(255,255,255,0.02) !important; }
        
        .admin-tabs .ant-tabs-nav::before { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .admin-tabs .ant-tabs-tab { color: rgba(255,255,255,0.2) !important; font-weight: 800 !important; font-size: 14px !important; padding: 16px 0 !important; margin-right: 48px !important; text-transform: uppercase; letter-spacing: 2px; }
        .admin-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #f59e0b !important; }
        .admin-tabs .ant-tabs-ink-bar { background: #f59e0b !important; height: 3px !important; }

        .admin-select .ant-select-selector { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; color: white !important; border-radius: 8px !important; }
        .admin-switch.ant-switch-checked { background: #f59e0b !important; }
      `}</style>
    </div>
  );
}
