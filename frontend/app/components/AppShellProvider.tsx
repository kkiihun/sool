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
};

const Ctx = createContext<ShellCtx | null>(null);

export function useAppShell() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppShell must be used within AppShellProvider");
  return v;
}

async function fetchMe() {
  const token = getToken();
  const r = await fetch("/proxy/users/me", {
    cache: "no-store",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!r.ok) return null;

  return (await r.json().catch(() => null)) as Me | null;
}

export default function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [search, setSearch] = useState("");

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
    return { me, loadingMe, isAdmin, refreshMe, search, setSearch };
  }, [me, loadingMe, search]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
