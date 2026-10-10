"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/components/AuthProvider";
import { Avatar, Dropdown, Typography, Skeleton, Space } from "antd";
import { 
  UserOutlined, 
  LogoutOutlined, 
  DashboardOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";

const { Text } = Typography;

export default function AppHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex items-center pr-4"><Skeleton.Avatar active size="small" shape="circle" /></div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 md:gap-6">
        <Link 
          className="whitespace-nowrap text-xs font-bold text-white/50 hover:text-white transition-all" 
          href="/login"
        >
          로그인
        </Link>
        <Link 
          className="whitespace-nowrap px-3 md:px-6 py-2 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/10" 
          href="/signup"
        >
          회원가입
        </Link>
      </div>
    );
  }

  const menuItems = [
    {
      key: 'profile',
      label: <span className="font-bold">내 프로필</span>,
      icon: <UserOutlined />,
      onClick: () => router.push('/profile'),
    },
    {
      key: 'dashboard',
      label: <span className="font-bold">통계</span>,
      icon: <DashboardOutlined />,
      onClick: () => router.push('/dashboard'),
    },
    ...(user.is_admin ? [{
      key: 'admin',
      label: <span className="font-bold">관리자</span>,
      icon: <SafetyCertificateOutlined />,
      onClick: () => router.push('/admin'),
    }] : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: <span className="font-bold text-red-500">로그아웃</span>,
      icon: <LogoutOutlined className="text-red-500" />,
      onClick: logout,
    },
  ];

  return (
    <Dropdown 
      menu={{ items: menuItems as any }} 
      placement="bottomRight" 
      arrow={{ pointAtCenter: true }}
      styles={{ root: { 
        background: '#111', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '16px',
        padding: '8px'
      } }}
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
