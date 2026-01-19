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
};

const Ctx = createContext<ShellCtx | null>(null);

export function useAppShell() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppShell must be used within AppShellProvider");
  return v;
}

async function fetchMe() {
  const r = await fetch("/proxy/users/me", { cache: "no-store" });
  if (!r.ok) return null;
  return (await r.json().catch(() => null)) as Me | null;
}

export default function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const refreshMe = async () => {
    setLoadingMe(true);
    const data = await fetchMe();
    setMe(data);
    setLoadingMe(false);
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<ShellCtx>(() => {
    const isAdmin = !!me?.is_admin;
    return { me, loadingMe, isAdmin, refreshMe };
  }, [me, loadingMe]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
