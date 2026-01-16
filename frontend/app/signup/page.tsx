"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Form, Input, Typography, message } from "antd";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `signup failed: ${res.status}`);
      }

      message.success("회원가입 완료! 로그인 해주세요.");
      router.push("/login");
    } catch (e) {
      console.error(e);
      message.error("회원가입 실패(이메일 중복/형식 확인)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow">
        <Typography.Title level={2} style={{ color: "white", marginBottom: 16 }}>
          Sign Up
        </Typography.Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span className="text-gray-200">Email</span>}
            name="email"
            rules={[
              { required: true, message: "이메일을 입력해줘" },
              { type: "email", message: "이메일 형식이 아님" },
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-200">Username</span>}
            name="username"
            rules={[
              { required: true, message: "닉네임을 입력해줘" },
              { min: 2, message: "닉네임은 2글자 이상" },
            ]}
          >
            <Input placeholder="nickname" />
          </Form.Item>

          <Form.Item
            label={<span className="text-gray-200">Password</span>}
            name="password"
            rules={[
              { required: true, message: "비밀번호를 입력해줘" },
              { min: 4, message: "비밀번호는 4글자 이상" },
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            Create account
          </Button>

          <div className="mt-3 text-sm text-gray-300">
            이미 계정 있음?{" "}
            <Link className="text-blue-400 hover:text-blue-300" href="/login">
              로그인
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
