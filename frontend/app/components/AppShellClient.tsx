"use client";

import AppShellProvider, { useAppShell } from "./AppShellProvider";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { useState } from "react";
import { Layout, Menu, Button, Space, Typography, ConfigProvider, theme } from "antd";
import {
  AppstoreOutlined,
  StarOutlined,
  BarChartOutlined,
  CompassOutlined,
  HeartOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useAuth } from "./AuthProvider";

const { Sider, Content } = Layout;
const { Text } = Typography;

function GlobalSidebar({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const { isAdmin } = useAppShell();

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={280}
      theme="dark"
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        background: "#080808",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        zIndex: 101,
      }}
    >
      <div className="h-24 flex items-center justify-center border-b border-white/5 mb-6">
        <Link href="/" className="flex items-center gap-4 transition-transform active:scale-95">
          <span className="text-4xl">🥃</span>
          {!collapsed && (
            <span className="text-2xl font-black tracking-[0.25em] text-white">SOOL</span>
          )}
        </Link>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["explore"]}
        className="sidebar-menu"
        style={{ background: "transparent", border: "none", padding: "0 16px" }}
        items={[
          { key: "explore", icon: <AppstoreOutlined style={{ fontSize: '20px' }} />, label: <Link href="/" className="text-[15px] font-semibold">Explore</Link> },
          { key: "tasting", icon: <StarOutlined style={{ fontSize: '20px' }} />, label: <Link href="/Tasting" className="text-[15px] font-semibold">Tasting Notes</Link> },
          { key: "analytics", icon: <BarChartOutlined style={{ fontSize: '20px' }} />, label: <Link href="/dashboard" className="text-[15px] font-semibold">Analytics</Link> },
          { key: "updates", icon: <CompassOutlined style={{ fontSize: '20px' }} />, label: <Link href="/updates" className="text-[15px] font-semibold">Discovery</Link> },
          { key: "community", icon: <HeartOutlined style={{ fontSize: '20px' }} />, label: <Link href="/community" className="text-[15px] font-semibold">Community</Link> },
          ...(user ? [{ key: "profile", icon: <UserOutlined style={{ fontSize: '20px' }} />, label: <Link href="/profile" className="text-[15px] font-semibold">My Page</Link> }] : []),
          ...(isAdmin ? [
            { key: "admin-divider", type: "divider", style: { margin: "24px 0", borderColor: "rgba(255,255,255,0.1)" } },
            { key: "admin", icon: <AppstoreOutlined style={{ fontSize: '20px' }} />, label: <Link href="/admin" className="text-[15px] font-bold text-amber-500">Admin Panel</Link> }
          ] : []),
        ]}
      />
      <style jsx global>{`
        .sidebar-menu .ant-menu-item {
          height: 54px !important;
          line-height: 54px !important;
          margin-bottom: 8px !important;
          border-radius: 12px !important;
        }
        .sidebar-menu .ant-menu-item-selected {
          background-color: rgba(245, 158, 11, 0.1) !important;
          color: #f59e0b !important;
        }
      `}</style>
    </Sider>
  );
}

function HeaderBar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { isAdmin, search, setSearch } = useAppShell();

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-all duration-500",
        "backdrop-blur-3xl border-b",
        isAdmin ? "border-amber-500/20 bg-amber-950/30" : "border-white/[0.03] bg-black/40",
      ].join(" ")}
    >
      <div className="px-10 h-24 flex items-center justify-between gap-12">
        <div className="flex items-center flex-1 gap-12">
          {/* Subtle Minimalist Toggle */}
          <div 
            onClick={onToggle}
            className="cursor-pointer group flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/5 transition-all"
          >
            <div className="relative w-5 h-4">
              <span className={`absolute h-0.5 bg-white/40 group-hover:bg-amber-500 transition-all duration-300 ${collapsed ? 'w-5 top-0' : 'w-3 top-0'}`} />
              <span className="absolute h-0.5 w-5 bg-white/40 group-hover:bg-amber-500 top-1.5 transition-all duration-300" />
              <span className={`absolute h-0.5 bg-white/40 group-hover:bg-amber-500 transition-all duration-300 ${collapsed ? 'w-5 bottom-0' : 'w-4 bottom-0'}`} />
            </div>
          </div>
          
          {/* Command Center Search Bar */}
          <div className="max-w-2xl w-full hidden md:block group">
            <div className="relative flex items-center">
              <span className="absolute left-6 text-white/20 group-focus-within:text-amber-500 transition-colors text-xl">
                <SearchOutlined />
              </span>
              <input 
                type="text"
                placeholder="Search spirits, regions, or sensory notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-16 pr-6 text-[15px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] group-hover:border-white/20"
              />
              <div className="absolute right-4 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-black text-white/20 tracking-tighter group-focus-within:opacity-0 transition-opacity">
                CMD + K
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AppHeader />
        </div>
      </div>
    </header>
  );
}

export default function AppShellClient({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AppShellProvider>
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
        <Layout style={{ minHeight: "100vh", background: "#050505" }}>
          <GlobalSidebar collapsed={collapsed} />
          
          <Layout className="transition-all duration-300" style={{ marginLeft: collapsed ? 80 : 280, background: "transparent" }}>
            <HeaderBar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <Content style={{ minHeight: "calc(100vh - 96px)" }}>
              {children}
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </AppShellProvider>
  );
}
