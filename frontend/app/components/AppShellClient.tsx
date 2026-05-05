"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Menu, Button, Tooltip, ConfigProvider, theme, Input } from "antd";
import {
  AppstoreOutlined,
  StarOutlined,
  BarChartOutlined,
  CompassOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useAuth } from "./AuthProvider";
import AppShellProvider, { useAppShell } from "./AppShellProvider";
import AppHeader from "@/components/AppHeader";

const { Sider, Content } = Layout;

function ShellLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, search, setSearch, collapsed, setCollapsed } = useAppShell();
  const pathname = usePathname();
  const router = useRouter();
  
  const isLogged = !!user;
  const sidebarWidth = 260;
  const collapsedWidth = 80;

  const menuItems = [
    { key: "/", icon: <AppstoreOutlined style={{ fontSize: '18px' }} />, label: "Explore" },
    { key: "/Tasting", icon: <StarOutlined style={{ fontSize: '18px' }} />, label: "Tasting Notes" },
    { key: "/dashboard", icon: <BarChartOutlined style={{ fontSize: '18px' }} />, label: "Analytics" },
    { key: "/updates", icon: <CompassOutlined style={{ fontSize: '18px' }} />, label: "Discovery" },
    { key: "/community", icon: <HeartOutlined style={{ fontSize: '18px' }} />, label: "Community" },
    ...(isAdmin ? [
      { key: "admin-divider", type: "divider" as const, style: { margin: "24px 0", borderColor: "rgba(255,255,255,0.05)" } },
      { key: "/admin", icon: <SafetyCertificateOutlined style={{ fontSize: '18px' }} />, label: "Admin Console" }
    ] : [])
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#050505" }}>
      {/* Global Header - Premium Redesign Aesthetics + Unified Layout */}
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          "backdrop-blur-3xl border-b h-20 flex items-center px-8 justify-between",
          isAdmin ? "border-amber-500/20 bg-amber-950/20" : "border-white/[0.03] bg-black/40",
        ].join(" ")}
      >
        <div className="flex items-center gap-12 flex-1">
          <Link 
            href="/" 
            className="flex items-center gap-3 transition-transform active:scale-95 group"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            <span className="text-3xl">🥃</span>
            <span className="text-xl font-black tracking-[0.2em] text-white group-hover:text-amber-500 transition-colors">SOOL</span>
          </Link>

          {/* Local Premium: Command Center Search Bar */}
          <div className="max-w-xl w-full hidden md:block group">
            <div className="relative flex items-center">
              <span className="absolute left-5 text-white/20 group-focus-within:text-amber-500 transition-colors text-lg">
                <SearchOutlined />
              </span>
              <input 
                type="text"
                placeholder="Search spirits, regions, or sensory notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-14 pr-4 text-[14px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all group-hover:border-white/20"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isAdmin && pathname.startsWith("/admin") && (
            <span className="hidden lg:inline-flex text-[10px] px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-500 font-bold tracking-widest uppercase bg-amber-500/10">
              Admin System
            </span>
          )}
          <div className="flex items-center gap-2">
             <Tooltip title="Notifications">
               <Button type="text" icon={<BellOutlined />} className="text-white/30 hover:text-white" />
             </Tooltip>
          </div>
          <div className="h-5 w-[1px] bg-white/10 mx-1" />
          <AppHeader />
        </div>
      </header>

      <Layout style={{ marginTop: 80, background: "transparent" }}>
        {/* Global Sidebar - Premium Styling + Unified Logic */}
        {isLogged && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            theme="dark"
            width={sidebarWidth}
            collapsedWidth={collapsedWidth}
            className="fixed left-0 top-20 bottom-0 z-40 border-r border-white/5"
            style={{ 
              background: "#080808",
              paddingTop: 16,
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 80px)"
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 12px" }}>
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[pathname]}
                onClick={({ key }) => {
                  if (!key.includes('divider')) router.push(key);
                }}
                items={menuItems}
                style={{ background: "transparent", border: "none" }}
                className="premium-sidebar-menu"
              />
            </div>

            {/* Sidebar Toggle at Bottom */}
            <div style={{ 
              height: 80, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0, 0, 0, 0.2)"
            }}>
              <Tooltip title={collapsed ? "Expand" : "Collapse"} placement="right">
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  className="bg-white/5 border border-white/10 text-white/30 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center w-10 h-10 rounded-xl"
                />
              </Tooltip>
            </div>
          </Sider>
        )}

        {/* Main Content Area */}
        <Content 
          style={{ 
            marginLeft: isLogged ? (collapsed ? collapsedWidth : sidebarWidth) : 0, 
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            minHeight: "calc(100vh - 80px)",
            padding: "0"
          }}
        >
          {children}
        </Content>
      </Layout>

      <style jsx global>{`
        .premium-sidebar-menu .ant-menu-item { 
          height: 52px !important; 
          line-height: 52px !important; 
          border-radius: 12px !important; 
          margin-bottom: 8px !important;
          color: rgba(255,255,255,0.4) !important; 
          font-weight: 600 !important;
          transition: all 0.2s !important;
        }
        .premium-sidebar-menu .ant-menu-item-selected { 
          background: rgba(245, 158, 11, 0.1) !important; 
          color: #f59e0b !important; 
        }
        .premium-sidebar-menu .ant-menu-item:hover { 
          color: #fff !important; 
          background: rgba(255,255,255,0.05) !important; 
        }
      `}</style>
    </Layout>
  );
}

export default function AppShellClient({ children }: { children: React.ReactNode }) {
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
        <ShellLayout>{children}</ShellLayout>
      </ConfigProvider>
    </AppShellProvider>
  );
}
