"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "antd";
import { clearToken, getToken } from "@/lib/auth";

type Me = {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
};

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/proxy/users/me", {
          cache: "no-store",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          clearToken();
          setMe(null);
          return;
        }

        const json = (await res.json()) as Me;
        setMe(json);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [pathname]);

  const onLogout = () => {
    clearToken();
    setMe(null);
    router.push("/login");
  };

  if (loading) {
    return <div className="text-xs text-white/40">...</div>;
  }

  if (!me) {
    return (
      <div className="flex items-center gap-6">
        <Link 
          className="text-xs font-bold text-white/70 hover:text-white transition-colors tracking-widest uppercase" 
          href="/login"
        >
          Login
        </Link>
        <Link 
          className="px-4 py-1.5 rounded bg-white text-black text-[11px] font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors" 
          href="/signup"
        >
          Join
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 pl-8 border-l border-white/10">
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-[15px] font-bold text-white tracking-tight leading-none">
          {me.username}
        </span>
        <span className="text-[11px] text-white/50 font-semibold tracking-tight">
          {me.email}
        </span>
      </div>
      
      <div className="group relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-black border border-white/20 flex items-center justify-center cursor-pointer group-hover:border-amber-500 transition-all shadow-xl overflow-hidden active:scale-95">
          <span className="text-lg font-black text-white group-hover:text-amber-500 transition-colors">
            {me.username.substring(0, 1).toUpperCase()}
          </span>
        </div>
        
        <button 
          onClick={onLogout}
          className="absolute top-14 right-0 hidden group-hover:block bg-neutral-900 border border-white/10 px-8 py-4 rounded-xl shadow-2xl text-[13px] font-black text-red-500 hover:text-white hover:bg-red-600 transition-all tracking-[0.15em] whitespace-nowrap z-[60]"
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
}
