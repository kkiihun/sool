"use client";

import Link from "next/link";
import { useAuth } from "../app/components/AuthProvider";
import { Avatar, Dropdown, Typography, Skeleton } from "antd";
import { 
  UserOutlined, 
  LogoutOutlined, 
  DashboardOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";

const { Text } = Typography;

export default function AppHeader() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="flex items-center pr-4"><Skeleton.Avatar active size="small" shape="circle" /></div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-6">
        <Link 
          className="text-xs font-black text-white/40 hover:text-white transition-all tracking-[0.2em] uppercase" 
          href="/login"
        >
          Login
        </Link>
        <Link 
          className="px-6 py-2 rounded-xl bg-amber-500 text-black text-[11px] font-black tracking-widest uppercase hover:bg-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/10" 
          href="/signup"
        >
          Join
        </Link>
      </div>
    );
  }

  const menuItems = [
    {
      key: 'profile',
      label: <span className="font-bold">My Profile</span>,
      icon: <UserOutlined />,
    },
    {
      key: 'dashboard',
      label: <span className="font-bold">Analytics</span>,
      icon: <DashboardOutlined />,
    },
    ...(user.is_admin ? [{
      key: 'admin',
      label: <span className="font-bold">Admin Console</span>,
      icon: <SafetyCertificateOutlined />,
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: <span className="font-bold text-red-500">Sign Out</span>,
      icon: <LogoutOutlined className="text-red-500" />,
      onClick: logout,
    },
  ];

  return (
    <Dropdown 
      menu={{ items: menuItems as any }} 
      placement="bottomRight" 
      arrow={{ pointAtCenter: true }}
    >
      <div className="flex items-center gap-4 cursor-pointer group px-4 py-2 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
        <div className="flex flex-col items-end hidden lg:flex">
          <Text className="text-white font-black text-[14px] leading-tight group-hover:text-amber-500 transition-colors">
            {user.username}
          </Text>
          <Text className="text-amber-500/40 text-[9px] font-black uppercase tracking-[0.2em] leading-tight">
            {user.is_admin ? "Grand Master" : "Vault Member"}
          </Text>
        </div>
        <div className="relative">
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            className="bg-gradient-to-br from-neutral-800 to-black border border-white/20 group-hover:border-amber-500/50 transition-all shadow-xl"
          />
          <div className="absolute inset-0 rounded-full bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Dropdown>
  );
}
