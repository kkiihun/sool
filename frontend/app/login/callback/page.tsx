"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { Spin, Typography } from "antd";

const { Text } = Typography;

export default function SocialCallbackPage() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: verify origin if needed
      if (event.data && event.data.token) {
        await login(event.data.token);
        router.push("/");
      }
    };

    window.addEventListener("message", handleMessage);
    
    // In case the popup didn't work and we used a direct redirect instead
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      login(token).then(() => router.push("/"));
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [login, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-6">
      <Spin size="large" />
      <Text className="text-amber-500 font-black tracking-widest animate-pulse">SYNCHRONIZING SOCIAL IDENTITY...</Text>
    </div>
  );
}
