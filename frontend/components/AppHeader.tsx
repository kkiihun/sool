"use client";

import Link from "next/link";
import { Button } from "antd";
import { useAuth } from "@/app/components/AuthProvider";

export default function AppHeader() {
  const { user: me, loading, logout } = useAuth();

  if (loading) {
    return <div className="text-xs text-white/40">...</div>;
  }

  if (!me) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Link className="text-blue-300 hover:text-blue-200" href="/login">
          Login
        </Link>
        <span className="text-white/20">|</span>
        <Link className="text-blue-300 hover:text-blue-200" href="/signup">
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/60">
        <b className="text-white/80">{me.username}</b>
      </span>
      <Button size="small" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}
