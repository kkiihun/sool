import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "./components/BackButton";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "antd/dist/reset.css";

import BuildBadge from "@/components/BuildBadge";
import AppHeader from "@/components/AppHeader"; // ✅ auth 영역 포함 헤더 컴포넌트로 사용할 거면 유지

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOOL",
  description: "Traditional liquor data-driven analysis & recommendation (MVP)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-black text-white`}
      >
        {/* ✅ 기존 헤더 유지 + 오른쪽에 AppHeader(로그인 영역)만 추가 */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
          <div className="px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center justify-start gap-3">
              <BackButton />
              <Link href="/" className="text-xs text-white/60 hover:text-white">
                SOOL
              </Link>
            </div>

            {/* ✅ 오른쪽: 로그인 상태/로그아웃/링크 */}
            <AppHeader />
          </div>
        </header>

        {/* ✅ 기존 구조 그대로 유지 */}
        <div className="min-h-screen bg-black">{children}</div>

        <BuildBadge />
      </body>
    </html>
  );
}
