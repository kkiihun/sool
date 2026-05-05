"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";

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
  search: string;
  setSearch: (v: string) => void;
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
  // Try to get token using the library function first, fall back to localStorage
  const token = getToken() || (typeof window !== "undefined" ? localStorage.getItem("sool_token") : null);
  
  if (!token) return null;

  // Use the remote's API path /api/proxy/users/me
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
  const [search, setSearch] = useState("");
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
  }, []);

  const value = useMemo<ShellCtx>(() => {
    const isAdmin = !!me?.is_admin;
    return { me, loadingMe, isAdmin, refreshMe, search, setSearch, collapsed, setCollapsed };
  }, [me, loadingMe, search, collapsed]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
