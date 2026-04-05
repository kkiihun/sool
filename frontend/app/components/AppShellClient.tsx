"use client";

import AppShellProvider, { useAppShell } from "./AppShellProvider";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

function HeaderBar() {
  const { isAdmin } = useAppShell();

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b backdrop-blur",
        isAdmin ? "border-amber-400/30 bg-amber-950/30" : "border-white/10 bg-black/70",
      ].join(" ")}
    >
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center justify-start gap-3">
          {/* BackButton은 서버/클라이언트 여부에 따라 그대로 유지 */}
          <Link href="/" className="text-xs text-white/60 hover:text-white">
            SOOL
          </Link>

          {isAdmin && (
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-300/40 text-amber-200">
              ADMIN MODE
            </span>
          )}
        </div>

        <AppHeader />
      </div>
    </header>
  );
}

export default function AppShellClient({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProvider>
      <HeaderBar />
      <div className="min-h-screen bg-black">{children}</div>
    </AppShellProvider>
  );
}
