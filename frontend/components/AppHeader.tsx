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
        // ✅ backend에 실제로 존재하는 endpoint는 /users/me
        const res = await fetch("/users/me", {
          cache: "no-store",
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
      <Button size="small" onClick={onLogout}>
        Logout
      </Button>
    </div>
  );
}
