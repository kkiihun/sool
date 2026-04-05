"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Form, Input, Typography, message } from "antd";
import { setToken, TOKEN_KEY, clearToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `login failed: ${res.status}`);
      }

      const data = await res.json();
      const token = data?.access_token;
      if (!token) throw new Error("No access_token");

      setToken(token);
      message.success(`로그인 성공! (저장키: ${TOKEN_KEY})`);
      router.push("/"); // 메인 페이지로 이동
    } catch (e) {
      console.error(e);
      clearToken();
      message.error("로그인 실패(이메일/비번 확인)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow">
        <Typography.Title level={2} style={{ color: "white", marginBottom: 16 }}>
          Login
        </Typography.Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span className="text-gray-200">Email</span>}
            name="email"
            rules={[{ required: true, message: "이메일을 입력해줘" }, { type: "email", message: "이메일 형식이 아님" }]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-200">Password</span>}
            name="password"
            rules={[{ required: true, message: "비밀번호를 입력해줘" }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>

          <div className="mt-3 text-sm text-gray-300">
            계정 없음?{" "}
            <Link className="text-blue-400 hover:text-blue-300" href="/signup">
              회원가입
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
