"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { API_BASE } from "@/lib/api";

interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 인증 상태의 단일 출처: HttpOnly 쿠키 → /users/me
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/me`, { cache: "no-store" });
      setUser(res.ok ? await res.json() : null);
    } catch (err) {
      console.error("Auth Error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // 실패 시 Error(detail) 를 던진다 → 로그인 페이지에서 메시지 표시
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Login failed. Check your credentials.");
    }
    setUser(await res.json());
    router.push('/');
    message.success("Welcome back!");
  };

  const logout = async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST" }).catch(() => {});
    setUser(null);
    router.push('/');
    message.info("Logged out safely.");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
