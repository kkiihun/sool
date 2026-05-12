import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider, App, theme } from "antd";

import "./globals.css";
import "antd/dist/reset.css";
import { AuthProvider } from "./components/AuthProvider";
import AppShellProvider from "./components/AppShellProvider";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-black text-white`}
      >
        <ConfigProvider 
          theme={{ 
            algorithm: theme.darkAlgorithm,
            token: {
              colorPrimary: '#f59e0b',
              colorBgBase: '#050505',
              colorText: 'rgba(255, 255, 255, 0.95)',
              colorTextPlaceholder: 'rgba(255, 255, 255, 0.3)',
            },
            components: {
              Select: {
                optionSelectedColor: '#f59e0b',
                optionSelectedBg: 'rgba(245, 158, 11, 0.15)',
                selectorBg: 'rgba(255, 255, 255, 0.05)',
              },
              Table: {
                headerBg: 'rgba(255, 255, 255, 0.03)',
                headerColor: 'rgba(255, 255, 255, 0.5)',
              }
            }
          }}
        >
          <App>
            <AppShellProvider>
              <AuthProvider>
                <AppShellClient>{children}</AppShellClient>
              </AuthProvider>
            </AppShellProvider>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
