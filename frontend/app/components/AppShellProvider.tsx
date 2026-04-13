"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Me = {
  id?: number;
  email?: string;
  is_admin?: boolean;
};

type ShellCtx = {
  me: Me | null;
  loadingMe: boolean;
  isAdmin: boolean;
  refreshMe: () => Promise<void>;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
};

const Ctx = createContext<ShellCtx | null>(null);

export function useAppShell() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppShell must be used within AppShellProvider");
  return v;
}

async function fetchMe() {
  // localStorage에서 토큰 가져오기 (클라이언트 사이드 환경 확인)
  const token = typeof window !== "undefined" ? localStorage.getItem("sool_token") : null;
  
  if (!token) return null;

  const r = await fetch("/api/proxy/users/me", {
    cache: "no-store",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
  });

  if (!r.ok) return null;

  return (await r.json().catch(() => null)) as Me | null;
}

export default function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const refreshMe = async () => {
    setLoadingMe(true);
    try {
      const data = await fetchMe();
      setMe(data);
    } finally {
      setLoadingMe(false);
    }
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<ShellCtx>(() => {
    const isAdmin = !!me?.is_admin;
    return { me, loadingMe, isAdmin, refreshMe, collapsed, setCollapsed };
  }, [me, loadingMe, collapsed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
