import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "antd/dist/reset.css";

import BuildBadge from "@/components/BuildBadge";

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
<<<<<<< Updated upstream
  description: "Traditional liquor data & tasting MVP",
=======
  description: "Traditional liquor data-driven analysis & recommendation (MVP)",
>>>>>>> Stashed changes
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< Updated upstream
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-black text-white`}
      >
        {/* Root는 전역 배경/폰트만. 헤더/사이드바는 각 페이지(앱 레이아웃)가 담당 */}
        <div className="min-h-screen bg-black">{children}</div>
=======
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b border-gray-800 p-4">
          <Link href="/" className="text-yellow-400 font-bold">
            🏠 SOOL
          </Link>
        </header>

        <main>{children}</main>

        {/* 브랜치/커밋 배지 */}
        <BuildBadge />
>>>>>>> Stashed changes
      </body>
    </html>
  );
}
