import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "./components/BackButton";
import { Geist, Geist_Mono } from "next/font/google";
import AppShellClient from "./components/AppShellClient";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-black text-white`}>
        <AppShellClient>{children}</AppShellClient>
        <BuildBadge />
      </body>
    </html>
  );
}
