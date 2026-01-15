import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "./components/BackButton";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "antd/dist/reset.css";

import BuildBadge from "@/components/BuildBadge";
import HomeButton from "./components/HomeButton";

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
        {/* ✅ 헤더만 추가 (레이아웃 간섭 X) */}
       <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="px-4 py-2 flex items-center justify-start gap-3">
          <BackButton />
          <Link href="/" className="text-xs text-white/60 hover:text-white">
            SOOL
          </Link>
        </div>
      </header>


        {/* ✅ 기존 구조 그대로 유지 */}
        <div className="min-h-screen bg-black">{children}</div>

        <BuildBadge />
      </body>
    </html>
  );
}
