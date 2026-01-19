import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "antd/dist/reset.css";

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
  title: "SOOL",
  description: "Traditional liquor data-driven analysis & recommendation (MVP)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-black text-white`}
      >
        {/* ✅ App 전체 구조는 AppShellClient가 책임 */}
        <AppShellClient>{children}</AppShellClient>

        <BuildBadge />
      </body>
    </html>
  );
}
