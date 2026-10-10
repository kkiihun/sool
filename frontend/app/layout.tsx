import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "antd/dist/reset.css";
import { AuthProvider } from "./components/AuthProvider";

import BuildBadge from "@/components/BuildBadge";
import AppShellClient from "./components/AppShellClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOOL — Premium Traditional Spirits",
  description: "Explore the rich heritage of Korean traditional spirits.",
};

// 아이폰 노치·홈 인디케이터 영역까지 쓰고(safe-area 로 여백 처리), 주소창 색을 배경과 맞춤
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-black text-white`}
      >
        <AuthProvider>
          {/* ✅ App 전체 구조는 AppShellClient가 책임 */}
          <AppShellClient>{children}</AppShellClient>
        </AuthProvider>
      </body>
    </html>
  );
}
