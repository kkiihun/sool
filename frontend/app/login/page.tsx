"use client";

import { useState } from "react";
import { Form, Input, Button, Typography, Card, Space, message } from "antd";
import { UserOutlined, LockOutlined, ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        const data = await res.json();
        await login(data.access_token);
      } else {
        const error = await res.json();
        message.error(error.detail || "Login failed. Check your credentials.");
      }
    } catch (err) {
      message.error("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1608 100%)",
      padding: 20
    }}>
      <Card 
        style={{ 
          width: 400, 
          background: "rgba(17, 17, 17, 0.8)", 
          backdropFilter: "blur(20px)",
          border: "1px solid #222", 
          borderRadius: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
        }}
        styles={{ body: { padding: 40 } }}
      >
        <Link href="/">
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: "#666", marginBottom: 20 }}>Back to Gallery</Button>
        </Link>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 40 }}>🥃</span>
          <Title level={2} style={{ color: "#fff", margin: "12px 0 0" }}>Welcome Back</Title>
          <Text style={{ color: "#666" }}>Enter your credentials to access the vault.</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Please enter your email" }, { type: "email" }]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: "#d4af37" }} />} 
              placeholder="Email address" 
              style={{ background: "#111", border: "1px solid #333", color: "#fff", borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: "#d4af37" }} />} 
              placeholder="Password" 
              style={{ background: "#111", border: "1px solid #333", color: "#fff", borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 40 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              style={{ 
                height: 50, 
                background: "#d4af37", 
                color: "#000", 
                border: "none", 
                fontWeight: 700, 
                borderRadius: 12 
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Text style={{ color: "#444" }}>Don't have an account? </Text>
          <Link href="/signup" style={{ color: "#d4af37", fontWeight: 600 }}>Create one</Link>
        </div>
      </Card>
    </div>
  );
}
