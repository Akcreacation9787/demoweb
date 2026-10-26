"use client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wallet, Users, Network, TrendingUp, CreditCard, ArrowUpRight, FileText, Bell, Ticket, Settings, Shield, LogOut, Menu, X, Calculator } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "investments", label: "Investment Records", icon: Wallet },
  { id: "calc", label: "Calculator", icon: Calculator },
  { id: "team", label: "My Team", icon: Users },
  { id: "earnings", label: "Earnings History", icon: TrendingUp },
  { id: "genealogy", label: "Referral Genealogy", icon: Network },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "support", label: "Support Tickets", icon: Ticket },
  { id: "profile", label: "Profile & Settings", icon: Settings },
];

export function Sidebar({ active, onChange, mobileOpen, setMobileOpen }: { active: string; onChange: (id:string)=>void; mobileOpen: boolean; setMobileOpen:(b:boolean)=>void }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.includes("admin") || user?.role==="super_admin";
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={()=>setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white text-slate-900 shadow-sm transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" className="h-10 w-10" />
            <div>
              <div className="text-sm font-bold leading-none tracking-wide text-slate-900">ATER KOMPANY</div>
              <div className="text-[10px] tracking-widest text-slate-500">FINANCIAL GROUP</div>
            </div>
          </div>
          <button className="text-slate-600 lg:hidden" onClick={()=>setMobileOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={()=>{ onChange(item.id); setMobileOpen(false); }} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active===item.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}>
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
              {item.id==="notifications" && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">5</span>}
            </button>
          ))}
          {isAdmin && (
            <>
              <div className="mt-4 border-t border-slate-100 px-3 pt-4 text-xs font-semibold tracking-widest text-slate-400">ADMIN</div>
              <button onClick={()=>{ window.location.href="/admin"; }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <Shield className="h-4 w-4" /> Admin Panel
              </button>
            </>
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "A"}`} className="h-9 w-9 rounded-full bg-white" alt="" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name || "Guest"}</div>
              <div className="truncate text-xs text-slate-500">{user?.email || "Not logged in"}</div>
            </div>
          </div>
          <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </aside>
    </>
  );
}

export function MobileTopBar({ onMenu }: { onMenu: ()=>void }) {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
      <div className="flex items-center gap-2"><BrandLogo variant="mark" className="h-9 w-9 border border-slate-200" /><span className="font-bold text-[#062D66]">ATER KOMPANY</span></div>
      <button onClick={onMenu} className="rounded-lg border p-2"><Menu className="h-5 w-5" /></button>
    </div>
  );
}
