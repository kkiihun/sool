"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Menu, Button, Tooltip, ConfigProvider, theme, Input, App, Drawer } from "antd";
import {
  AppstoreOutlined,
  StarOutlined,
  BarChartOutlined,
  CompassOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  DeploymentUnitOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  FileSearchOutlined,
  ShopOutlined,
  MenuOutlined,
  ProfileOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useAuth } from "./AuthProvider";
import AppShellProvider, { useAppShell } from "./AppShellProvider";
import AppHeader from "@/components/AppHeader";

const { Sider, Content } = Layout;

function ShellLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { search, setSearch, collapsed, setCollapsed } = useAppShell();
  const pathname = usePathname();
  const router = useRouter();
  
  const [moreOpen, setMoreOpen] = useState(false);   // 모바일 '더보기' 서랍
  const isLogged = !!user;
  const isAdmin = !!user?.is_admin;
  const sidebarWidth = 260;
  const collapsedWidth = 80;

  const menuItems = [
    { key: "/", icon: <AppstoreOutlined style={{ fontSize: '18px' }} />, label: "술 탐색" },
    { key: "/breweries", icon: <EnvironmentOutlined style={{ fontSize: '18px' }} />, label: "양조장 지도" },
    { key: "/owners/restaurant", icon: <ShopOutlined style={{ fontSize: '18px' }} />, label: "식당 사장님" },
    { key: "/owners/restaurant/report", icon: <FileTextOutlined style={{ fontSize: '18px' }} />, label: "식당 리포트" },
    { key: "/owners/menu-board", icon: <ProfileOutlined style={{ fontSize: '18px' }} />, label: "술 메뉴판" },
    { key: "/owners/brewery", icon: <FileSearchOutlined style={{ fontSize: '18px' }} />, label: "양조장 리포트" },
    { key: "/Tasting", icon: <StarOutlined style={{ fontSize: '18px' }} />, label: "시음 노트" },
    { key: "/dashboard", icon: <BarChartOutlined style={{ fontSize: '18px' }} />, label: "통계" },
    { key: "/updates", icon: <CompassOutlined style={{ fontSize: '18px' }} />, label: "업데이트" },
    { key: "/community", icon: <HeartOutlined style={{ fontSize: '18px' }} />, label: "커뮤니티" },
    ...(isAdmin ? [
      { key: "admin-divider", type: "divider" as const, style: { margin: "24px 0", borderColor: "rgba(255,255,255,0.05)" } },
      { key: "/admin", icon: <SafetyCertificateOutlined style={{ fontSize: '18px' }} />, label: "Admin Console" },
      { key: "/admin/pipeline", icon: <DeploymentUnitOutlined style={{ fontSize: '18px' }} />, label: "Data Pipeline" }
    ] : [])
  ];

  // 메뉴 강조: 하위 페이지(/owners/brewery/123)도 상위 메뉴로
  const activeKey = menuItems.map((m) => m.key).filter((k) => k !== "/" && !k.includes("divider") && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0] ?? pathname;
  // 모바일 하단 탭바 (768px 미만). 나머지 메뉴는 '더보기' 서랍
  const tabs = [
    { key: "/", icon: <AppstoreOutlined />, label: "탐색" },
    { key: "/breweries", icon: <EnvironmentOutlined />, label: "지도" },
    { key: "/owners/restaurant", icon: <ShopOutlined />, label: "식당" },
    { key: "/owners/brewery", icon: <FileSearchOutlined />, label: "양조장" },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#050505" }}>
      {/* Global Header - Premium Redesign Aesthetics + Unified Layout */}
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          "backdrop-blur-3xl border-b h-16 md:h-20 flex items-center px-4 md:px-8 justify-between",
          isAdmin ? "border-amber-500/20 bg-amber-950/20" : "border-white/[0.03] bg-black/40",
        ].join(" ")}
      >
        <div className="flex items-center gap-4 md:gap-12 flex-1 min-w-0">
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
            <span className="text-2xl md:text-3xl">🥃</span>
            <span className="text-lg md:text-xl font-black tracking-[0.2em] text-white group-hover:text-amber-500 transition-colors">SOOL</span>
          </Link>

          {/* Local Premium: Command Center Search Bar */}
          <div className="max-w-xl w-full hidden md:block group">
            <div className="relative flex items-center">
              <span className="absolute left-5 text-white/20 group-focus-within:text-amber-500 transition-colors text-lg">
                <SearchOutlined />
              </span>
              <input 
                type="text"
                placeholder="술 이름, 양조장 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-14 pr-4 text-[14px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.05] transition-all group-hover:border-white/20"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          {isAdmin && pathname.startsWith("/admin") && (
            <span className="hidden lg:inline-flex text-[10px] px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-500 font-bold tracking-widest uppercase bg-amber-500/10">
              Admin System
            </span>
          )}
          <div className="hidden md:flex items-center gap-2">
             <Tooltip title="Notifications">
               <Button type="text" icon={<BellOutlined />} className="text-white/30 hover:text-white" />
             </Tooltip>
          </div>
          <div className="hidden md:block h-5 w-[1px] bg-white/10 mx-1" />
          <AppHeader />
        </div>
      </header>

      <Layout className="app-body" style={{ marginTop: 80, background: "transparent", minHeight: "calc(100vh - 80px)" }}>
        {/* Global Sidebar - Premium Styling + Unified Logic */}
        <Sider
          className="app-sider"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          onBreakpoint={(broken) => setCollapsed(broken)}   // 좁은 화면(태블릿·모바일)에선 아이콘만
          trigger={null}
          theme="dark"
          width={sidebarWidth}
          collapsedWidth={collapsedWidth}
          style={{ 
            background: "#080808",
            paddingTop: 16,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            position: "sticky",
            top: 80,
            height: "calc(100vh - 80px)",
            zIndex: 40
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 12px" }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[activeKey]}
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

        {/* Main Content Area */}
        <Content 
          className="app-content"
          style={{ 
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            minHeight: "calc(100vh - 80px)",
            flex: "1 1 0%",   // antd 스타일이 붙기 전 첫 화면에서도 본문이 남은 폭을 차지하게
            minWidth: 0,      // 가로 스크롤 칩 줄이 본문 폭을 밀어내지 않게 (flex 기본 min-width:auto)
            padding: "0",
            background: "transparent"
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* 모바일 하단 탭바 */}
      <nav className="app-tabbar md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 flex">
        {tabs.map((t) => {
          const on = activeKey === t.key;
          return (
            <Link key={t.key} href={t.key} className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-bold ${on ? "text-amber-500" : "text-white/45"}`}>
              <span className="text-lg leading-none">{t.icon}</span>{t.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-bold text-white/45">
          <span className="text-lg leading-none"><MenuOutlined /></span>더보기
        </button>
      </nav>
      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} placement="bottom" size={480} title="전체 메뉴"
        styles={{ body: { padding: "8px 12px 24px" }, header: { borderBottom: "1px solid rgba(255,255,255,0.06)" } }}>
        <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={menuItems} className="premium-sidebar-menu"
          style={{ background: "transparent", border: "none" }}
          onClick={({ key }) => { if (!key.includes("divider")) { setMoreOpen(false); router.push(key); } }} />
      </Drawer>

      <style jsx global>{`
        /* 모바일(768px 미만): 사이드바 숨김 → 하단 탭바, 본문 아래 여백, iOS 입력 확대 방지(16px) */
        @media (max-width: 767px) {
          .app-sider { display: none !important; }
          .app-body { margin-top: 64px !important; }
          .app-content { padding-bottom: calc(56px + env(safe-area-inset-bottom)) !important; }
          .app-tabbar { padding-bottom: env(safe-area-inset-bottom); }
          .build-badge { display: none !important; }
          input, textarea { font-size: 16px !important; }
        }
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
        <App>
          <ShellLayout>{children}</ShellLayout>
        </App>
      </ConfigProvider>
    </AppShellProvider>
  );
}
