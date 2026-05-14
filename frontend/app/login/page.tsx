"use client";

import { useState } from "react";
import { Form, Input, Button, Typography, Card, Space, Divider, App } from "antd";
import { 
  LockOutlined, 
  ArrowLeftOutlined, 
  MailOutlined,
  GoogleOutlined,
  CommentOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { message } = App.useApp();
  
  const getApiUrl = () => {
    if (typeof window !== "undefined") return "/proxy";
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  };
  const API_URL = getApiUrl();

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
        router.push("/");
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

  const handleSocialLogin = (provider: 'google' | 'kakao') => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Using direct backend URL to bypass proxy issues during OAuth flow
    // In production, this would be your API domain
    const authUrl = `http://localhost:8000/auth/social/login/${provider}`;
    
    const popup = window.open(
      authUrl,
      `Login with ${provider}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.token) {
        await login(event.data.token);
        popup?.close();
        router.push("/");
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
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
          width: 500, 
          background: "rgba(17, 17, 17, 0.8)", 
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.05)", 
          borderRadius: 32,
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)"
        }}
        styles={{ body: { padding: "60px" } }}
      >
        <Link href="/">
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>Back to Gallery</Button>
        </Link>
        
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontSize: 64, filter: "drop-shadow(0 10px 20px rgba(212,175,55,0.3))" }}>🥃</span>
          <Title className="!text-white !m-0 !mt-6 !font-black !tracking-tight">Access the <span style={{ color: '#d4af37' }}>Vault</span></Title>
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>Sign in to continue your collection journey.</Text>
        </div>

        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Button 
            block 
            size="large"
            icon={<GoogleOutlined />}
            onClick={() => handleSocialLogin('google')}
            className="h-14 rounded-2xl flex items-center justify-center font-bold text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            Continue with Google
          </Button>
          <Button 
            block 
            size="large"
            icon={<CommentOutlined />}
            onClick={() => handleSocialLogin('kakao')}
            style={{ backgroundColor: '#FEE500', color: '#000', border: 'none' }}
            className="h-14 rounded-2xl flex items-center justify-center font-bold hover:opacity-90 transition-all"
          >
            Continue with Kakao
          </Button>
        </Space>

        <Divider className="border-white/5 !my-8">
          <Text style={{ color: "rgba(255,255,255,0.15)", textTransform: 'uppercase', fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>Or use credentials</Text>
        </Divider>

        <Form layout="vertical" onFinish={onFinish} size="large" className="premium-form">
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Email is required" }, { type: "email" }]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: "rgba(255,255,255,0.2)" }} />} 
              placeholder="Email address" 
              className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:border-amber-500/50"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: "rgba(255,255,255,0.2)" }} />} 
              placeholder="Password" 
              className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:border-amber-500/50"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              className="h-14 bg-amber-500 text-black border-none font-black rounded-2xl shadow-xl shadow-amber-500/10 hover:scale-[1.02] transition-transform"
            >
              SIGN IN
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Text style={{ color: "rgba(255,255,255,0.2)" }}>New to Sool? </Text>
          <Link href="/signup" style={{ color: "#d4af37", fontWeight: 800, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>Register Account</Link>
        </div>
      </Card>

      <style jsx global>{`
        .premium-form .ant-input, .premium-form .ant-input-password {
          background: transparent !important;
          color: white !important;
        }
        .premium-form .ant-input-affix-wrapper {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .premium-form .ant-input-affix-wrapper-focused {
          border-color: rgba(245, 158, 11, 0.5) !important;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1) !important;
        }
      `}</style>
    </div>
  );
}
