import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "antd/dist/reset.css";

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
  description: "Traditional liquor data & tasting MVP",
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
        {/* Root는 전역 배경/폰트만. 헤더/사이드바는 각 페이지(앱 레이아웃)가 담당 */}
        <div className="min-h-screen bg-black">{children}</div>
      </body>
    </html>
  );
}
