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
    return <Skeleton.Avatar active size="small" shape="circle" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm font-medium">
        <Link 
          className="px-4 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all" 
          href="/login"
        >
          Login
        </Link>
        <Link 
          className="px-4 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all font-bold" 
          href="/signup"
        >
          Join Free
        </Link>
      </div>
    );
  }

  const menuItems = [
    {
      key: 'profile',
      label: <Link href="/profile">My Profile</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'dashboard',
      label: <Link href="/dashboard">Analytics</Link>,
      icon: <DashboardOutlined />,
    },
    ...(user.is_admin ? [{
      key: 'admin',
      label: <Link href="/admin">Admin Console</Link>,
      icon: <SafetyCertificateOutlined />,
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems as any }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
      <div className="flex items-center gap-3 cursor-pointer group px-2 py-1 rounded-full hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
        <div className="flex flex-col items-end hidden lg:flex">
          <Text className="text-white/90 font-bold text-[13px] leading-tight group-hover:text-amber-400 transition-colors">
            {user.username}
          </Text>
          <Text className="text-white/40 text-[10px] uppercase tracking-wider leading-tight">
            {user.is_admin ? "Grand Master" : "Vault Member"}
          </Text>
        </div>
        <Avatar 
          size={36} 
          icon={<UserOutlined />} 
          className="bg-white/10 border border-white/20 group-hover:border-amber-400/50 transition-all"
        />
      </div>
    </Dropdown>
  );
}
