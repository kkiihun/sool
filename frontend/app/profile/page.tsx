"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  Space,
  Avatar,
  Form,
  Input,
  message,
  Divider,
  Spin,
  Tag,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [updating, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      form.setFieldsValue({ username: user.username });
    }
  }, [user, authLoading, router, form]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    const token = localStorage.getItem("sool_token");
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password || undefined,
        }),
      });

      if (res.ok) {
        message.success("Profile updated successfully. Please re-login if you changed your password.");
        if (values.password) {
          logout();
        } else {
          // Ideally we would refresh the user context here
          window.location.reload();
        }
      } else {
        const err = await res.json();
        message.error(err.detail || "Failed to update profile.");
      }
    } catch (err) {
      message.error("Server error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-8">
      <div className="mb-12">
        <Title className="!text-white !m-0 !text-5xl font-black text-center">
          Account <span className="text-amber-500">Settings</span>
        </Title>
      </div>

      <Row gutter={[64, 64]} justify="center">
        <Col xs={24} lg={10}>
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Avatar size={160} icon={<UserOutlined />} className="bg-white/5 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 mb-8" />
            <Title level={2} className="!text-white !m-0 !text-4xl font-black">{user.username}</Title>
            <Text className="text-white/30 text-lg font-medium tracking-wide">{user.email}</Text>
            <div className="mt-6 flex justify-center gap-3">
              <Tag className={`${user.is_admin ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"} px-4 py-1 rounded-full font-black tracking-widest text-[10px]`}>
                {user.is_admin ? "ADMINISTRATOR" : "CONNOISSEUR"}
              </Tag>
              <Tag className="bg-white/5 text-white/40 border-white/10 px-4 py-1 rounded-full font-black tracking-widest text-[10px]">
                MEMBER SINCE 2024
              </Tag>
            </div>
          </div>

          <Card className="bg-white/5 border-white/10 rounded-[40px] shadow-2xl backdrop-blur-sm" styles={{ body: { padding: 48 } }}>
            <Title level={4} className="!text-white !mb-10 flex items-center gap-4">
              <EditOutlined className="text-amber-500" />
              Update Profile
            </Title>

            <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} className="custom-form">
              <Form.Item
                label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">Nickname</span>}
                name="username"
                rules={[{ required: true, message: "Please enter your nickname" }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-white/20 mr-2" />} 
                  className="bg-white/5 border-white/10 text-white h-14 rounded-xl hover:border-amber-500 focus:border-amber-500 transition-all" 
                />
              </Form.Item>

              <Divider className="border-white/5 my-10" />

              <Form.Item
                label={<span className="text-white/30 text-xs font-bold uppercase tracking-widest">New Password (Leave blank to keep current)</span>}
                name="password"
                rules={[{ min: 6, message: "Password must be at least 6 characters" }]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-white/20 mr-2" />} 
                  className="bg-white/5 border-white/10 text-white h-14 rounded-xl hover:border-amber-500 focus:border-amber-500 transition-all" 
                />
              </Form.Item>

              <Form.Item className="mt-12 mb-0">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  loading={updating}
                  className="bg-amber-500 text-black border-none font-black h-16 rounded-2xl text-lg uppercase tracking-widest shadow-xl shadow-amber-500/10 hover:scale-[1.02] transition-transform"
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Title level={3} className="!text-white !mb-10 !text-2xl font-black uppercase tracking-widest">Security & Privacy</Title>
          <Space orientation="vertical" size="large" className="w-full">
            <Card className="bg-white/5 border-white/10 rounded-[24px] hover:bg-white/10 transition-colors cursor-pointer" styles={{ body: { padding: 24 } }}>
              <Space size="large" className="w-full">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <SafetyCertificateOutlined className="text-green-500 text-2xl" />
                </div>
                <div>
                  <Text className="text-white block text-lg font-bold">Two-Factor Authentication</Text>
                  <Text className="text-white/20 text-sm font-medium">Enhance your account security (Coming soon)</Text>
                </div>
              </Space>
            </Card>

            <Card className="bg-white/5 border-white/10 rounded-[24px] hover:bg-white/10 transition-colors cursor-pointer" styles={{ body: { padding: 24 } }}>
              <Space size="large" className="w-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <LockOutlined className="text-amber-500 text-2xl" />
                </div>
                <div>
                  <Text className="text-white block text-lg font-bold">Privacy Mode</Text>
                  <Text className="text-white/20 text-sm font-medium">Hide your tasting notes from the community feed.</Text>
                </div>
              </Space>
            </Card>

            <Divider className="border-white/5 my-8" />
            
            <Button 
              type="text" 
              danger 
              block 
              className="h-14 rounded-2xl border border-red-500/20 text-red-500/50 hover:!bg-red-500/10 hover:!text-red-500 font-bold tracking-widest uppercase transition-all"
              onClick={() => message.info("Account deletion requires administrator approval.")}
            >
              Delete Account
            </Button>
          </Space>
        </Col>
      </Row>

      <style jsx global>{`
        .custom-form .ant-form-item-label > label { font-family: inherit !important; }
        .ant-input-affix-wrapper { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; color: white !important; }
        .ant-input-password-icon { color: rgba(255,255,255,0.2) !important; }
      `}</style>
    </div>
  );
}
