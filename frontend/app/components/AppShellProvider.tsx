"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

// 레이아웃 UI 상태(헤더 검색어, 사이드바 접힘)만 공유한다. 인증은 AuthProvider 담당.
type ShellCtx = {
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

export default function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const value = useMemo<ShellCtx>(
    () => ({ search, setSearch, collapsed, setCollapsed }),
    [search, collapsed]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
