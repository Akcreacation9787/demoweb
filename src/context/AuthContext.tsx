"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";

type User = { id: string; email: string; name: string; role: string; referralCode: string; phone?: string };
type AuthCtx = { user: User | null; loading: boolean; login: (email:string,password:string)=>Promise<User>; register:(data:any)=>Promise<void>; logout:()=>Promise<void>; refresh:()=>Promise<void> };

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await fetchJson<{ user: User }>("/api/v1/auth/me", { credentials: "include" });
      setUser(data.user);
    } catch { setUser(null); }
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const login = async (email:string,password:string) => {
    const data = await fetchJson<{ user: User }>("/api/v1/auth/login", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ email,password }) });
    setUser(data.user);
    return data.user as User;
  };
  const register = async (data:any) => {
    const jd = await fetchJson<{ user: User }>("/api/v1/auth/register", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(data) });
    setUser(jd.user);
  };
  const logout = async () => {
    await fetch("/api/v1/auth/logout", { method:"POST" });
    setUser(null);
  };
  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
