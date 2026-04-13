"use client";

import { useAuth } from "./AuthProvider";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { Tooltip, Layout, Menu, Button } from "antd";
import { 
  BellOutlined,
  AppstoreOutlined,
  StarOutlined,
  BarChartOutlined,
  CompassOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const { Sider, Content } = Layout;

function ShellLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const isLogged = !!user;
  const isAdmin = !!user?.is_admin;

  const sidebarWidth = 200;
  const collapsedWidth = 80;

  const menuItems = [
    { key: "/", icon: <AppstoreOutlined />, label: "Explore" },
    { key: "/Tasting", icon: <StarOutlined />, label: "Tasting Notes" },
    { key: "/dashboard", icon: <BarChartOutlined />, label: "Analytics" },
    { key: "/updates", icon: <CompassOutlined />, label: "Discovery" },
    { key: "/community", icon: <HeartOutlined />, label: "Community" },
    ...(isAdmin ? [
      { key: "divider", type: "divider" as const, style: { margin: '8px 0', opacity: 0.05 } },
      { key: "/admin", icon: <SafetyCertificateOutlined />, label: "Admin Console" }
    ] : [])
  ];

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      {/* 전역 헤더 */}
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl h-16 flex items-center px-6 justify-between transition-all",
          isAdmin ? "border-amber-500/20 bg-amber-950/10" : "border-white/5 bg-black/60",
        ].join(" ")}
      >
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="text-xl font-black tracking-tighter text-white hover:text-amber-500 transition-all flex items-center gap-2"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            <span className="tracking-tight">SOOL</span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {isAdmin && pathname.startsWith("/admin") && (
            <span className="hidden lg:inline-flex text-[9px] px-2 py-0.5 rounded-md border border-amber-500/20 text-amber-500/60 font-bold tracking-widest uppercase bg-amber-500/5">
              Admin System
            </span>
          )}
          <div className="flex items-center gap-2">
             <Tooltip title="Notifications">
               <Button type="text" icon={<BellOutlined />} className="text-white/20 hover:text-white" />
             </Tooltip>
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <AppHeader />
        </div>
      </header>

      <Layout style={{ marginTop: 64, background: "transparent" }}>
        {/* 전역 사이드바 */}
        {isLogged && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            theme="dark"
            width={sidebarWidth}
            collapsedWidth={collapsedWidth}
            className="fixed left-0 top-16 bottom-0 z-40 border-r border-white/5"
            style={{ 
              background: "rgba(5, 5, 5, 0.9)", 
              backdropFilter: "blur(30px)",
              paddingTop: 8,
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 64px)"
            }}
          >
            {/* 상단 메뉴 영역 */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[pathname]}
                onClick={({ key }) => {
                  if (key !== 'divider') router.push(key);
                }}
                items={menuItems}
                style={{ background: "transparent", border: "none" }}
                className="premium-menu"
              />
            </div>

            {/* 화면 최하단(푸터 위치)에 고정된 접기 버튼 */}
            <div style={{ 
              height: 70, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0, 0, 0, 0.2)"
            }}>
              <Tooltip title={collapsed ? "Expand Menu" : "Collapse Menu"} placement="right">
                <Button
                  type="text"
                  shape="circle"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  className="bg-white/5 border border-white/10 text-white/30 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center w-10 h-10"
                />
              </Tooltip>
            </div>
          </Sider>
        )}

        {/* 메인 콘텐츠 영역 */}
        <Content 
          style={{ 
            marginLeft: isLogged ? (collapsed ? collapsedWidth : sidebarWidth) : 0, 
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            minHeight: "calc(100vh - 64px)",
            padding: "0"
          }}
        >
          {children}
        </Content>
      </Layout>

      <style jsx global>{`
        /* 텍스트가 늘어나 보이는 현상 해결 (line-height 및 높이 최적화) */
        .premium-menu .ant-menu-item { 
          height: 40px !important; 
          line-height: 40px !important; 
          border-radius: 8px !important; 
          margin: 4px 12px !important; 
          width: calc(100% - 24px) !important; 
          color: rgba(255,255,255,0.4) !important; 
          font-size: 13px !important; 
          font-weight: 600 !important;
          padding: 0 12px !important;
          transition: all 0.2s !important;
        }
        /* 텍스트 세로 정렬 보정 (늘어남 방지) */
        .premium-menu .ant-menu-title-content {
          margin-left: 10px !important;
          display: inline-block !important;
          vertical-align: top !important; /* middle 대신 top으로 고정하여 stretch 방지 */
        }
        .premium-menu .ant-menu-item-selected { 
          background: rgba(245, 158, 11, 0.1) !important; 
          color: #f59e0b !important; 
        }
        .premium-menu .ant-menu-item:hover { 
          color: #fff !important; 
          background: rgba(255,255,255,0.05) !important; 
        }
        .premium-menu .ant-menu-item .anticon { 
          font-size: 16px !important; 
        }
        /* 접혔을 때 아이콘 정렬 최적화 */
        .premium-menu.ant-menu-inline-collapsed .ant-menu-item {
          padding: 0 20px !important;
          margin: 4px 16px !important;
          width: calc(100% - 32px) !important;
        }
      `}</style>
    </Layout>
  );
}

export default function AppShellClient({ children }: { children: React.ReactNode }) {
  return (
    <ShellLayout>{children}</ShellLayout>
  );
}
