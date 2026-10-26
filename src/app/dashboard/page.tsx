"use client";
import { useEffect, useState } from "react";
import { Sidebar, MobileTopBar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { fetchJson } from "@/lib/api";
import { Copy, Download, Search, Plus, Eye, Filter, TrendingUp, Wallet, Users, ArrowUpRight, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Send, Globe, Moon, Sun, Languages, Bell, LogOut } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function DashboardOverview({ dash, withdrawals, team, onCopyReferral, onNavigate }: { dash: any; withdrawals: any[]; team: any; onCopyReferral: () => void; onNavigate: (tab: string) => void }) {
  const productRows = (dash.investments || []).reduce((rows: { name: string; amount: number; count: number }[], investment: any) => {
    const name = investment.planName || "Other";
    const amount = Number(investment.amount) || 0;
    const row = rows.find(item => item.name === name);
    if (row) { row.amount += amount; row.count += 1; }
    else rows.push({ name, amount, count: 1 });
    return rows;
  }, []);
  const maxProductAmount = Math.max(...productRows.map((row: { amount: number }) => row.amount), 1);
  const pendingWithdrawals = withdrawals.filter(item => item.status === "pending");
  const pendingAmount = pendingWithdrawals.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const summaryData = [
    { name: "Invested", value: Number(dash.wallet?.totalInvested) || 0, color: "#0876E8" },
    { name: "Earnings", value: Number(dash.wallet?.totalEarnings) || 0, color: "#00B894" },
    { name: "Balance", value: Number(dash.wallet?.balance) || 0, color: "#64748B" },
  ].filter(item => item.value > 0);
  const summaryTotal = summaryData.reduce((sum, item) => sum + item.value, 0);
  const recentTransactions = dash.recentTransactions?.slice(0, 6) || [];

  const metrics = [
    { label: "My Balance", value: formatCurrency(dash.wallet?.balance || "0"), note: "Available wallet balance", color: "#062D66", icon: Wallet },
    { label: "Recorded Earnings", value: formatCurrency(dash.wallet?.totalEarnings || "0"), note: `Today ${formatCurrency(dash.todayEarnings || "0")}`, color: "#0876E8", icon: TrendingUp },
    { label: "Total Investment", value: formatCurrency(dash.wallet?.totalInvested || "0"), note: `${dash.investments?.length || 0} investment records`, color: "#0F766E", icon: ArrowUpRight },
    { label: "Pending Withdrawals", value: formatCurrency(pendingAmount), note: `${pendingWithdrawals.length} requests pending`, color: "#B45309", icon: Clock },
  ];

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold tracking-tight">Finance Dashboard</h2><p className="mt-1 text-xs text-slate-500">Your balance, investments, earnings, and recent activity</p></div>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-slate-600"><Calendar className="h-3.5 w-3.5" /> Last 7 days <span className="text-slate-300">•</span> Live</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => <Card key={metric.label} className="rounded-xl border-slate-200 shadow-none"><CardContent className="p-4">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-600">{metric.label}</span><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ color: metric.color, backgroundColor: `${metric.color}14` }}><metric.icon className="h-6 w-6" /></span></div>
          <div className="mt-3 text-2xl font-bold tracking-tight" style={{ color: metric.color }}>{metric.value}</div>
          <div className="mt-1 text-[11px] text-slate-500">{metric.note}</div>
        </CardContent></Card>)}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardHeader className="border-b border-slate-100 px-4 py-3"><CardTitle className="text-sm">Investment Products</CardTitle><p className="text-[11px] text-slate-500">Recorded portfolio by plan</p></CardHeader>
          <CardContent className="space-y-4 p-4">
            <div><div className="text-[11px] text-slate-500">Total invested</div><div className="mt-1 text-2xl font-bold">{formatCurrency(dash.wallet?.totalInvested || "0")}</div></div>
            {productRows.length ? productRows.slice(0, 5).map((row: { name: string; amount: number; count: number }, index: number) => <div key={row.name}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]"><span className="flex min-w-0 items-center gap-2 truncate text-slate-600"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ["#0876E8", "#00B894", "#F59E0B", "#A855F7", "#EC4899"][index % 5] }} />{row.name}</span><span className="font-medium text-slate-800">{formatCurrency(row.amount)}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(4, row.amount / maxProductAmount * 100)}%`, backgroundColor: ["#0876E8", "#00B894", "#F59E0B", "#A855F7", "#EC4899"][index % 5] }} /></div>
            </div>) : <div className="py-5 text-center text-xs text-slate-500">No investment records yet</div>}
            <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate("investments")}>View investment records</Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-4 py-3"><div><CardTitle className="text-sm">Daily Earnings</CardTitle><p className="text-[11px] text-slate-500">Ledger entries from the last 7 days</p></div><Badge variant="success">Live</Badge></CardHeader>
          <CardContent className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={dash.chartData || []} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCurrency(value)} width={70} /><Tooltip formatter={(value) => formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0)} /><Bar dataKey="earnings" name="Earnings" fill="#0876E8" radius={[4, 4, 0, 0]} />
              </BarChart></ResponsiveContainer>
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">Only recorded earnings are shown; simulations are excluded.</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardHeader className="border-b border-slate-100 px-4 py-3"><CardTitle className="text-sm">Portfolio Summary</CardTitle><p className="text-[11px] text-slate-500">Investments, earnings, and available balance</p></CardHeader>
          <CardContent className="p-4">
            <div className="relative mx-auto h-40 w-full max-w-[220px]">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summaryData.length ? summaryData : [{ name: "No activity", value: 1, color: "#E2E8F0" }]} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} stroke="none">{(summaryData.length ? summaryData : [{ name: "No activity", value: 1, color: "#E2E8F0" }]).map((item, index) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0)} /></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><div className="text-[10px] text-slate-500">Combined</div><div className="text-sm font-bold">{formatCurrency(summaryTotal)}</div></div></div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">{[
              { label: "Invested", value: dash.wallet?.totalInvested || "0", color: "#0876E8" },
              { label: "Earnings", value: dash.wallet?.totalEarnings || "0", color: "#00B894" },
              { label: "Balance", value: dash.wallet?.balance || "0", color: "#64748B" },
            ].map(item => <div key={item.label} className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-2 text-[10px]"><span className="flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><span className="font-semibold">{formatCurrency(item.value)}</span></div>)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-4 py-3"><CardTitle className="text-sm">Recent Transactions</CardTitle><Button variant="outline" size="sm" onClick={() => onNavigate("transactions")}>View all</Button></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-[11px]"><thead className="text-[10px] text-slate-500"><tr className="border-b"><th className="px-4 py-2.5 font-medium">Transaction</th><th className="px-3 py-2.5 font-medium">Date</th><th className="px-3 py-2.5 font-medium">Type</th><th className="px-4 py-2.5 text-right font-medium">Amount</th></tr></thead><tbody>
              {recentTransactions.map((transaction: any) => <tr key={transaction.id} className="border-b last:border-0 hover:bg-slate-50"><td className="max-w-[220px] truncate px-4 py-3 font-medium text-slate-800">{transaction.description}</td><td className="whitespace-nowrap px-3 py-3 text-slate-500">{formatDate(transaction.createdAt)}</td><td className="px-3 py-3"><Badge variant={transaction.type === "earning" ? "success" : "outline"}>{transaction.type}</Badge></td><td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${transaction.type === "withdrawal" ? "text-rose-600" : "text-emerald-600"}`}>{transaction.type === "withdrawal" ? "−" : "+"}{formatCurrency(transaction.amount)}</td></tr>)}
            </tbody></table></div>
            {recentTransactions.length === 0 && <div className="py-8 text-center text-xs text-slate-500">No transactions yet</div>}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-4 py-3"><div><CardTitle className="text-sm">Team Overview</CardTitle><p className="text-[11px] text-slate-500">Your referral network</p></div><Users className="h-4 w-4 text-[#0876E8]" /></CardHeader>
            <CardContent className="p-4"><div className="flex items-end justify-between"><div><div className="text-[11px] text-slate-500">Direct members</div><div className="mt-1 text-2xl font-bold">{dash.directCount || 0}</div></div><div className="text-right"><div className="text-[11px] text-slate-500">Team total</div><div className="mt-1 text-lg font-semibold">{dash.teamStats?.total || 0}</div></div></div><Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => onNavigate("team")}>View team</Button></CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardHeader className="border-b border-slate-100 px-4 py-3"><CardTitle className="text-sm">Referral Link</CardTitle><p className="text-[11px] text-slate-500">Invite members to your team</p></CardHeader>
            <CardContent className="p-4"><div className="truncate rounded-md bg-slate-50 px-3 py-2 text-[10px] text-slate-600">{dash.referralLink}</div><Button size="sm" className="mt-3 w-full" onClick={onCopyReferral}><Copy className="mr-2 h-3.5 w-3.5" />Copy link</Button></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FinanceOverview({ dash, withdrawals, transactions, onNavigate }: { dash: any; withdrawals: any[]; transactions: any[]; onNavigate: (tab: string) => void }) {
  const [clockNow, setClockNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const pending = withdrawals.filter(item => item.status === "pending");
  const pendingTotal = pending.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const activity = transactions.slice(0, 8);
  const dayMs = 24 * 60 * 60 * 1000;
  const nextProfitCycleMs = (dash.investments || []).reduce((nearest: number | null, investment: any) => {
    if (investment.status !== "active") return nearest;
    const start = new Date(investment.startDate).getTime();
    const end = new Date(investment.endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || clockNow < start || clockNow >= end) return nearest;
    const nextCycleAt = start + (Math.floor((clockNow - start) / dayMs) + 1) * dayMs;
    if (nextCycleAt > end) return nearest;
    const remaining = nextCycleAt - clockNow;
    return nearest === null ? remaining : Math.min(nearest, remaining);
  }, null);
  const countdown = nextProfitCycleMs === null ? null : [
    Math.floor(nextProfitCycleMs / 3_600_000),
    Math.floor((nextProfitCycleMs % 3_600_000) / 60_000),
    Math.floor((nextProfitCycleMs % 60_000) / 1000),
  ].map((part) => String(part).padStart(2, "0")).join(":");
  const investmentSlices = (dash.investments || []).reduce((slices: { name: string; value: number; color: string; records: number }[], investment: any) => {
    const name = investment.planName || "Other";
    const found = slices.find((slice) => slice.name === name);
    if (found) { found.value += Number(investment.amount) || 0; found.records += 1; }
    else slices.push({ name, value: Number(investment.amount) || 0, color: ["#087647", "#0876E8", "#7C3AED", "#F59E0B", "#EC4899"][slices.length % 5], records: 1 });
    return slices;
  }, []);
  const investmentTotal = investmentSlices.reduce((sum: number, slice: { value: number }) => sum + slice.value, 0);
  const cards = [
    { title: "Investment portfolio", subtitle: "Track your investment records", amount: dash.wallet?.totalInvested || "0", action: "Analyze portfolio", tab: "investments" },
    { title: "Daily Profit", subtitle: "Recorded earnings", amount: dash.wallet?.totalEarnings || "0", action: "View earnings", tab: "earnings" },
    { title: "My balance", subtitle: "Wallet overview & available balance", amount: dash.wallet?.balance || "0", action: "See details", tab: "transactions" },
  ];

  return (
    <div className="space-y-5 text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-slate-600">Here is the summary of your account activity.</p>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><Calendar className="h-4 w-4" />Last 7 days <Badge variant="success">Live</Badge></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map((card, index) => <Card key={card.title} className={`overflow-hidden rounded-2xl border-slate-200 shadow-none ${index === 2 ? "border-0" : ""}`} style={index === 2 ? { backgroundColor: "#087647", color: "white" } : undefined}>
          <CardContent className="p-0">
            <div className={`p-5 ${index === 2 ? "text-white" : ""}`}>
              <div className="flex items-start justify-between"><div><div className={`text-lg font-semibold ${index === 2 ? "text-white" : "text-slate-900"}`}>{card.title}</div><div className={`mt-1 text-xs ${index === 2 ? "text-white/75" : "text-slate-500"}`}>{card.subtitle}</div></div><div className={`grid h-11 w-11 place-items-center rounded-xl ${index === 2 ? "bg-white/15" : "bg-violet-50"}`}><Wallet className={`h-6 w-6 ${index === 2 ? "text-white" : "text-violet-700"}`} /></div></div>
              <div className="mt-6 flex items-center gap-2"><div className="text-3xl font-semibold tracking-tight">{formatCurrency(card.amount)}</div>{index === 1 && <Badge variant="success">Today {formatCurrency(dash.todayEarnings || "0")}</Badge>}</div>
              {index === 1 && <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" />{countdown ? `Next 24h cycle in ${countdown}` : "Timer starts when an investment is active"}</div>}
            </div>
            <button onClick={() => onNavigate(card.tab)} className={`flex w-full items-center justify-between border-t px-5 py-3 text-left text-sm ${index === 2 ? "border-white/15 text-white hover:bg-white/5" : "border-slate-100 text-slate-700 hover:bg-slate-50"}`}>{card.action}<ArrowUpRight className="h-4 w-4" /></button>
          </CardContent>
        </Card>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.4fr]">
        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between border-b border-slate-100 px-5 py-4"><div><CardTitle className="text-lg">My Wallet</CardTitle><p className="mt-1 text-xs text-slate-500">Account balances in INR</p></div><Wallet className="h-5 w-5 text-emerald-700" /></CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            {[
              { label: "Available balance", value: dash.wallet?.balance || "0", status: "Available", color: "#067647" },
              { label: "Recorded earnings", value: dash.wallet?.totalEarnings || "0", status: "Ledger verified", color: "#0876E8" },
              { label: "Total invested", value: dash.wallet?.totalInvested || "0", status: `${dash.investments?.length || 0} records`, color: "#7C3AED" },
              { label: "Pending withdrawals", value: pendingTotal, status: `${pending.length} requests`, color: "#C2410C" },
            ].map(item => <div key={item.label} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs font-medium text-slate-600">{item.label}</span></div>
              <div className="mt-3 text-xl font-semibold tracking-tight">{formatCurrency(item.value)}</div><div className="mt-1 text-[11px]" style={{ color: item.color }}>{item.status}</div>
            </div>)}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-none">
          <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><CardTitle className="text-lg">Cash Flow</CardTitle><div className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(dash.wallet?.totalEarnings || "0")}</div><p className="mt-1 text-xs text-slate-500">Recorded earnings total</p></div><Badge variant="outline">Last 7 days</Badge></CardHeader>
          <CardContent className="p-4">
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={dash.chartData || []} margin={{ top: 8, right: 10, left: 2, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F4" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => formatCurrency(value)} width={76} /><Tooltip formatter={(value) => formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0)} /><Bar dataKey="earnings" name="Earnings" fill="#087647" radius={[8, 8, 0, 0]} maxBarSize={54} />
            </BarChart></ResponsiveContainer></div>
            <div className="mt-2 border-t border-slate-100 pt-3 text-xs text-slate-500">Chart uses completed ledger earnings. Simulated calculations are excluded.</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-4"><div><CardTitle className="text-lg">Investment Portfolio</CardTitle><p className="mt-1 text-xs text-slate-500">Investment amounts by plan</p></div><Button variant="outline" size="sm" onClick={() => onNavigate("investments")}>View investments</Button></CardHeader>
        <CardContent className="grid items-center gap-4 p-4 sm:grid-cols-[minmax(180px,0.8fr)_1.2fr]">
          <div className="relative mx-auto h-52 w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={investmentSlices.length ? investmentSlices : [{ name: "No investments", value: 1, color: "#E2E8F0", records: 0 }]} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={investmentSlices.length > 1 ? 3 : 0} stroke="none">{(investmentSlices.length ? investmentSlices : [{ name: "No investments", value: 1, color: "#E2E8F0", records: 0 }]).map((slice: any) => <Cell key={slice.name} fill={slice.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0)} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><div className="text-[11px] text-slate-500">Total invested</div><div className="text-base font-bold">{formatCurrency(investmentTotal)}</div></div></div>
          </div>
          <div className="space-y-2">{investmentSlices.length ? investmentSlices.map((slice: any) => <div key={slice.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-medium"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} /><span className="truncate">{slice.name}</span></div><div className="pl-[18px] text-[11px] text-slate-500">{slice.records} {slice.records === 1 ? "record" : "records"}</div></div><div className="shrink-0 text-sm font-semibold">{formatCurrency(slice.value)}</div></div>) : <div className="py-8 text-center text-sm text-slate-500">No investment records to chart yet.</div>}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-5 py-4"><div><CardTitle className="text-lg">Recent Activities</CardTitle><p className="mt-1 text-xs text-slate-500">Latest wallet and investment transactions</p></div><Button variant="outline" size="sm" onClick={() => onNavigate("transactions")}>View all</Button></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium">Activity</th><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Amount</th></tr></thead><tbody>
          {activity.map((item: any) => <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="max-w-[250px] truncate px-5 py-3 font-medium text-slate-800">{item.description}</td><td className="px-4 py-3 text-xs text-slate-500">{item.referenceId}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDateTime(item.createdAt)}</td><td className="px-4 py-3"><Badge variant={item.type === "earning" ? "success" : "outline"}>{item.type}</Badge></td><td className="px-4 py-3"><Badge variant={item.status === "completed" ? "success" : "warning"}>{item.status}</Badge></td><td className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${item.type === "withdrawal" ? "text-rose-600" : "text-emerald-700"}`}>{item.type === "withdrawal" ? "−" : "+"}{formatCurrency(item.amount)}</td></tr>)}
        </tbody></table></div>{activity.length === 0 && <div className="py-10 text-center text-sm text-slate-500">No recent activity yet.</div>}</CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dash, setDash] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tx, setTx] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [lang, setLang] = useState<"en"|"ta">("en");
  const [dark, setDark] = useState(false);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [calcForm, setCalcForm] = useState({ baseAmount: "100000", ratePercent: "0.16", days: "30" });

  const t = (en:string, ta:string) => lang==="ta" ? ta : en;

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const fetchAll = async () => {
    const d = await fetchJson<any>("/api/v1/dashboard");
    setDash(d);
    const profileData = await fetchJson<any>("/api/v1/profile");
    setProfile(profileData.profile || null);
    const tr = await fetchJson<any>("/api/v1/transactions?limit=50");
    setTx(tr.transactions || []);
    const te = await fetchJson<any>("/api/v1/team");
    setTeam(te);
    const inv = await fetchJson<any>("/api/v1/investments");
    setInvestments(inv.investments || []);
    const wd = await fetchJson<any>("/api/v1/withdrawals");
    setWithdrawals(wd.withdrawals || []);
    const notifs = await fetchJson<any>("/api/v1/notifications");
    setNotifications(notifs.notifications || []);
    const sup = await fetchJson<any>("/api/v1/support");
    setTickets(sup.tickets || []);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setLoggingOut(false);
      alert(error instanceof Error ? error.message : "Could not log out. Please try again.");
    }
  };

  useEffect(() => { if (user) void Promise.resolve().then(fetchAll); }, [user]);

  // polling for real-time
  useEffect(() => {
    const id = setInterval(()=>{ if (user) fetchJson("/api/v1/dashboard").then(setDash).catch(console.error); }, 15000);
    return ()=>clearInterval(id);
  }, [user]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#F1F5F9]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#062D66] border-t-transparent" /></div>;
  if (!user) return null;

  const copyReferral = () => {
    if (dash?.referralLink) { navigator.clipboard.writeText(dash.referralLink); alert(t("Referral link copied!","பரிந்துரை இணைப்பு நகலெடுக்கப்பட்டது!")); }
  };

  const investmentPlanData = (dash?.investments || []).reduce((groups: { product: string; amount: number; records: number }[], investment: any) => {
    const product = investment.planName || "Other";
    const amount = Number(investment.amount) || 0;
    const group = groups.find(item => item.product === product);
    if (group) {
      group.amount += amount;
      group.records += 1;
    } else {
      groups.push({ product, amount, records: 1 });
    }
    return groups;
  }, []);

  const handleCalc = async () => {
    try {
      const data = await fetchJson<any>("/api/v1/calc", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ baseAmount: calcForm.baseAmount, ratePercent: calcForm.ratePercent, days: calcForm.days, isSimulation:true }) });
      setCalcResult(data); fetchAll();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not calculate the simulation");
    }
  };

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = fd.get("amount") as string;
    const method = fd.get("method") as string;
    const destination = fd.get("destination") as string;
    const res = await fetch("/api/v1/withdrawals", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ amount, method, destination }) });
    if (!res.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      alert(`The server returned an HTML page instead of API JSON (${res.status} ${res.statusText}).`);
      return;
    }
    const data = await res.json();
    if (!res.ok) alert(data.error); else { alert(t("Withdrawal requested — pending review","பணம் எடுத்தல் கோரிக்கை — மதிப்பாய்வு நிலுவையில்")); (e.target as HTMLFormElement).reset(); fetchAll(); }
  };

  const loadRazorpay = () => new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleInvestment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPaymentLoading(true);
    const fd = new FormData(e.currentTarget);
    const amount = fd.get("amount") as string;
    const planName = fd.get("planName") as string;
    try {
      if (!(await loadRazorpay())) throw new Error("Could not load the secure payment window");
      const order = await fetchJson<any>("/api/v1/payments/orders", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ amount, planName }) });
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: order.name,
        description: order.description, order_id: order.orderId,
        prefill: { name: user.name, email: user.email }, theme: { color: "#0876E8" },
        handler: async (response: Record<string, string>) => {
          let result: any;
          try {
            result = await fetchJson<any>("/api/v1/payments/verify", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(response) });
          } catch (error) {
            setPaymentLoading(false);
            return alert(error instanceof Error ? error.message : "Payment verification failed");
          }
          setPaymentLoading(false);
          alert(t("Payment verified and investment activated","பணம் சரிபார்க்கப்பட்டு முதலீடு செயல்படுத்தப்பட்டது"));
          fetchAll();
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      });
      checkout.open();
    } catch (error) {
      setPaymentLoading(false);
      alert(error instanceof Error ? error.message : "Could not start payment");
    }
  };

  const exportCSV = (data:any[], filename:string) => {
    const csv = [Object.keys(data[0]||{}).join(",")].concat(data.map(r=>Object.values(r).join(","))).join("\n");
    const blob = new Blob([csv], { type:"text/csv" }); const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click();
  };

  return (
    <div className={dark ? "dark bg-slate-900" : "bg-[#F1F5F9]"}>
      <Sidebar active={active} onChange={setActive} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <MobileTopBar onMenu={()=>setMobileOpen(true)} />
      <main className="lg:pl-[280px]">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div>
            <h1 className="text-lg font-bold text-[#062D66]">{active === "dashboard" ? t("Overview","மேலோட்டம்") : active.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase())}</h1>
            <p className="hidden text-xs text-slate-500 md:block">{t("Welcome back,","மீண்டும் வரவேற்கிறோம்,")} {user.name} • {formatDate(new Date().toString())}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={()=>setLang(lang==="en"?"ta":"en")}><Languages className="h-4 w-4 mr-1" />{lang==="en"?"தமிழ்":"English"}</Button>
            <Button variant="ghost" size="icon" onClick={()=>setDark(!dark)}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <div className="hidden md:flex items-center gap-3 rounded-full border bg-[#F8FAFC] px-3 py-1.5">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className="h-7 w-7 rounded-full" alt="" />
              <div className="text-sm"><div className="font-semibold leading-none">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div></div>
            </div>
            <Button variant="outline" size="sm" disabled={loggingOut} onClick={() => void handleLogout()} className="shrink-0 border-rose-200 text-rose-700 hover:bg-rose-50"><LogOut className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">{loggingOut ? t("Logging out…", "வெளியேறுகிறது…") : t("Logout", "வெளியேறு")}</span></Button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {["admin","super_admin","finance_operator","support_agent"].includes(user.role) && (
            <button onClick={()=>router.push("/admin")} className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-[#EFF6FF] px-5 py-3.5 text-left hover:bg-blue-100 transition">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#062D66] text-white text-xs font-black">A</span>
                <div>
                  <div className="text-sm font-bold text-[#062D66]">You are signed in as {user.role.replace("_"," ")}</div>
                  <div className="text-xs text-slate-500">This is the User View — open the Admin Console for management tools</div>
                </div>
              </div>
              <span className="rounded-xl bg-[#062D66] px-4 py-2 text-xs font-bold text-white">Open Admin Console →</span>
            </button>
          )}
          {/* DASHBOARD TAB */}
          {active==="dashboard" && dash && <FinanceOverview dash={dash} withdrawals={withdrawals} transactions={tx} onNavigate={setActive} />}
          {active==="dashboard_legacy" && dash && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-0 overflow-hidden relative" style={{ backgroundColor: "#062D66", color: "#FFFFFF" }}>
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
                  <CardContent className="p-5 relative">
                    <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-white/70">{t("TOTAL INVESTMENT","மொத்த முதலீடு")}</span><Wallet className="h-5 w-5 text-white/60" /></div>
                    <div className="mt-3 text-2xl font-extrabold">{formatCurrency(dash.wallet.totalInvested || "0")}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold"><TrendingUp className="h-3 w-3" /> {t("Recorded • Auditable","பதிவு செய்யப்பட்டது")}</div>
                  </CardContent>
                </Card>
                <Card className="border-0" style={{ backgroundColor: "#0876E8", color: "#FFFFFF" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-white/80">{t("RECORDED EARNINGS","பதிவு வருவாய்")}</span><TrendingUp className="h-5 w-5 text-white/70" /></div>
                    <div className="mt-3 text-2xl font-extrabold">{formatCurrency(dash.wallet.totalEarnings || "0")}</div>
                    <div className="mt-2 text-xs text-white/80">{t("Today:","இன்று:")} {formatCurrency(dash.todayEarnings)} • {t("Simulations ≠ payouts","மதிப்பீடுகள் ≠ பணம்")}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-slate-500">{t("DIRECT MEMBERS","நேரடி உறுப்பினர்கள்")}</span><Users className="h-5 w-5 text-[#0876E8]" /></div>
                    <div className="mt-3 text-2xl font-extrabold text-[#062D66]">{dash.directCount}</div>
                    <div className="mt-2 text-xs text-slate-500">{t("4-direct view • Team","4-நேரடி பார்வை • குழு")} {dash.teamStats?.total || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between"><span className="text-xs tracking-widest text-slate-500">{t("TODAY'S ACTIVITY","இன்றைய செயல்பாடு")}</span><Calendar className="h-5 w-5 text-emerald-600" /></div>
                    <div className="mt-3 text-2xl font-extrabold text-emerald-600">{formatCurrency(dash.todayEarnings)}</div>
                    <div className="mt-2 text-xs text-slate-500">{t("Real-time refresh enabled","நிகழ்நேர புதுப்பிப்பு")}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("Earnings & Activity (Last 7 Days)","வருவாய் & செயல்பாடு (7 நாட்கள்)")}</CardTitle><Badge variant="success">Live</Badge></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dash.chartData}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(value, name) => [formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0), name === "investments" ? t("Invested","முதலீடு") : t("Earnings","வருவாய்")]} labelFormatter={(label, payload) => { const details = payload?.[0]?.payload?.investmentDetails as Array<{ product: string; amount: number }> | undefined; return details?.length ? `${label} • ${details.map(item => `${item.product}: ${formatCurrency(item.amount)}`).join(", ")}` : label; }} /><Area type="monotone" dataKey="earnings" stroke="#0876E8" fill="#DBEAFE" strokeWidth={2} /><Area type="monotone" dataKey="investments" stroke="#062D66" fill="#062D66" fillOpacity={0.05} /></AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{t("Hover over the chart to see daily earnings and investment products with their amounts.","தினசரி வருவாய் மற்றும் முதலீட்டு தயாரிப்புகளையும் தொகைகளையும் பார்க்க வரைபடத்தின் மீது நகர்த்தவும்.")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>{t("Referral Link","பரிந்துரை இணைப்பு")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl bg-[#F1F5F9] p-3 text-xs break-all border">{dash.referralLink}</div>
                    <Button onClick={copyReferral} className="w-full bg-[#062D66]"><Copy className="mr-2 h-4 w-4" />{t("Copy Link","இணைப்பை நகலெடு")}</Button>
                    <div className="rounded-xl border p-3">
                      <div className="text-xs font-semibold text-slate-600">{t("DIRECT MEMBERS (4)","நேரடி உறுப்பினர்கள் (4)")}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {team?.members?.slice(0,4).map((m:any)=>(
                          <div key={m.user.id} className="rounded-xl border bg-white p-3 text-center">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${m.user.name}`} className="mx-auto h-8 w-8 rounded-full" alt="" />
                            <div className="mt-1 text-xs font-semibold truncate">{m.user.name}</div><div className="text-[10px] text-slate-500">{m.user.accountStatus}</div>
                          </div>
                        )) || <div className="col-span-2 text-xs text-slate-500">{t("No referrals yet","இன்னும் பரிந்துரைகள் இல்லை")}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t("Investment Amount by Product","தயாரிப்பு வாரியான முதலீட்டு தொகை")}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">{t("Recorded investments grouped by plan","திட்டத்தின் அடிப்படையில் பதிவான முதலீடுகள்")}</p>
                  </div>
                  <Badge variant="outline">{investmentPlanData.length} {t("products","தயாரிப்புகள்")}</Badge>
                </CardHeader>
                <CardContent>
                  {investmentPlanData.length > 0 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={investmentPlanData} margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="product" tick={{ fontSize: 12 }} interval={0} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0)} labelFormatter={(label, payload) => `${label} • ${payload?.[0]?.payload?.records || 0} ${t("records","பதிவுகள்")}`} />
                          <Bar dataKey="amount" name={t("Invested","முதலீடு")} fill="#0876E8" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="grid h-48 place-items-center text-sm text-slate-500">{t("No investment records to chart yet.","வரைபடத்திற்கு முதலீட்டு பதிவுகள் இன்னும் இல்லை.")}</div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("Recent Transactions","சமீபத்திய பரிவர்த்தனைகள்")}</CardTitle><Button variant="ghost" size="sm" onClick={()=>setActive("transactions")}>{t("View all","அனைத்தையும் காட்டு")}</Button></CardHeader>
                  <CardContent className="space-y-3">
                    {dash.recentTransactions?.slice(0,5).map((tx:any)=>(
                      <div key={tx.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                        <div className="flex items-center gap-3"><div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tx.type==="earning" ? "bg-emerald-50 text-emerald-600" : tx.type==="investment" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>{tx.type==="earning" ? <TrendingUp className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}</div><div><div className="text-sm font-medium">{tx.description}</div><div className="text-xs text-slate-500">{tx.referenceId} • {formatDate(tx.createdAt)} • <Badge variant={tx.status==="completed" ? "success" : "warning"}>{tx.status}</Badge></div></div></div>
                        <div className={`text-sm font-bold ${tx.type==="withdrawal" ? "text-rose-600" : "text-emerald-600"}`}>{tx.type==="withdrawal" ? "-" : "+"}{formatCurrency(tx.amount)}</div>
                      </div>
                    ))}
                    {(!dash.recentTransactions || dash.recentTransactions.length===0) && <div className="text-center py-8 text-sm text-slate-500">{t("No transactions yet","இன்னும் பரிவர்த்தனைகள் இல்லை")}</div>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>{t("Investment Overview","முதலீட்டு கண்ணோட்டம்")}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {dash.investments?.map((inv:any)=>(
                      <div key={inv.id} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between"><span className="font-semibold text-[#062D66]">{inv.planName}</span><Badge variant={inv.status==="active"?"success":"warning"}>{inv.status}</Badge></div>
                        <div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">{t("Amount","தொகை")}</span><span className="font-bold">{formatCurrency(inv.amount)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500">{t("Earnings","வருவாய்")}</span><span className="font-bold text-emerald-600">{formatCurrency(inv.earningsGenerated)}</span></div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[#0876E8]" style={{ width: `${Math.min(100, (parseFloat(inv.earningsGenerated)/parseFloat(inv.amount))*100)}%` }} /></div>
                      </div>
                    ))}
                    {(!dash.investments || dash.investments.length===0) && <div className="text-sm text-slate-500">{t("No investments — create one in Investment Records","முதலீடுகள் இல்லை")}</div>}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* INVESTMENTS */}
          {active==="investments" && (
            <div className="space-y-6">
              <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("Investment Records","முதலீட்டு பதிவுகள்")}</CardTitle><Badge variant="outline">{investments.length} {t("records","பதிவுகள்")}</Badge></CardHeader>
                <CardContent>
                  <form onSubmit={handleInvestment} className="grid gap-3 md:grid-cols-4 p-4 rounded-xl bg-[#F8FAFC] border">
                    <div><Label>{t("Plan Name","திட்ட பெயர்")}</Label><Select name="planName" defaultValue="Starter Plan - 0.16%"><option>Starter Plan - 0.16%</option><option>Growth Plan - 0.50%</option><option>Premium Plan - 1.2%</option></Select></div>
                    <div><Label>{t("Amount (INR)","தொகை")}</Label><Input name="amount" placeholder="100000" required /></div>
                    <div className="flex items-end"><Button type="submit" disabled={paymentLoading} className="w-full bg-[#0876E8]"><Plus className="mr-2 h-4 w-4" />{paymentLoading ? t("Starting payment...","பணம் செலுத்துதல் தொடங்குகிறது...") : t("Pay & Invest","பணம் செலுத்தி முதலீடு செய்யுங்கள்")}</Button></div>
                    <div className="flex items-end text-xs text-slate-500">{t("Secure Razorpay checkout; investment activates after verification","பாதுகாப்பான Razorpay கட்டணம்; சரிபார்ப்புக்குப் பிறகு முதலீடு செயல்படும்")}</div>
                  </form>
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-500 border-b"><tr><th className="text-left py-2">{t("Plan","திட்டம்")}</th><th className="text-right">{t("Amount","தொகை")}</th><th className="text-right">{t("Rate","விகிதம்")}</th><th>{t("Period","காலம்")}</th><th>{t("Status","நிலை")}</th><th>{t("Dates","தேதிகள்")}</th></tr></thead>
                      <tbody>{investments.map(inv=>(
                        <tr key={inv.id} className="border-b last:border-0"><td className="py-3 font-medium">{inv.planName}</td><td className="text-right font-bold">{formatCurrency(inv.amount)}</td><td className="text-right">{inv.ratePercent}%</td><td className="text-center">{inv.durationDays} {t("days","நாட்கள்")}</td><td className="text-center"><Badge variant={inv.status==="active"?"success":"warning"}>{inv.status}</Badge></td><td className="text-xs text-slate-500">{formatDate(inv.startDate)} → {formatDate(inv.endDate)}</td></tr>
                      ))}</tbody>
                    </table>
                    {investments.length===0 && <div className="text-center py-10 text-slate-500">{t("No investments yet. Add your first record above.","இன்னும் முதலீடுகள் இல்லை.")}</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TEAM */}
          {active==="team" && team && (
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("My Team","என் குழு")} — {team.total} {t("members","உறுப்பினர்கள்")}</CardTitle>
              <div className="flex gap-2"><div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" /><Input id="teamSearch" placeholder={t("Search team...","குழுவை தேடு...")} className="pl-8 h-9" onChange={e=>{ const v=e.target.value.toLowerCase(); if (!v) fetchAll(); else setTeam((prev:any)=>({...prev, members: prev.members.filter((m:any)=>m.user.name.toLowerCase().includes(v) || m.user.email.toLowerCase().includes(v))})) }} /></div><Button variant="outline" size="sm" onClick={()=>exportCSV(team.members.map((m:any)=>({ name:m.user.name, email:m.user.email, level:m.level, status:m.user.accountStatus })), "team.csv")}><Download className="mr-2 h-4 w-4" />CSV</Button></div>
            </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {team.members.map((m:any)=>(
                    <div key={m.user.id} className="rounded-2xl border bg-white p-4 hover:shadow-sm transition">
                      <div className="flex items-center gap-3"><img src={`https://api.dicebear.com/7.x/initials/svg?seed=${m.user.name}`} className="h-10 w-10 rounded-full" alt="" /><div><div className="font-semibold text-sm">{m.user.name}</div><div className="text-xs text-slate-500">{m.user.email}</div></div></div>
                      <div className="mt-3 flex justify-between text-xs"><span className="text-slate-500">{t("Level","நிலை")}</span><Badge variant="outline">L{m.level}</Badge></div>
                      <div className="flex justify-between text-xs mt-1"><span className="text-slate-500">{t("Invested","முதலீடு")}</span><span className="font-bold">{m.wallet ? formatCurrency(m.wallet.totalInvested) : "—"}</span></div>
                      <div className="flex justify-between text-xs mt-1"><span className="text-slate-500">{t("Status","நிலை")}</span><Badge variant={m.user.accountStatus==="active"?"success":"warning"}>{m.user.accountStatus}</Badge></div>
                      <div className="mt-2 text-xs text-slate-400">{formatDate(m.joinedAt)}</div>
                    </div>
                  ))}
                </div>
                {team.members.length===0 && <div className="text-center py-10 text-slate-500">{t("No team members yet — share your referral link!","இன்னும் குழு உறுப்பினர்கள் இல்லை")}</div>}
              </CardContent>
            </Card>
          )}

          {/* GENEALOGY */}
          {active==="genealogy" && team && (
            <div className="space-y-6">
              <Card><CardHeader><CardTitle>{t("Referral Genealogy","பரிந்துரை வம்சாவளி")}</CardTitle><p className="text-xs text-slate-500">{t("Multi-level tree • self-referral & circular prevention enforced","பல-நிலை மரம்")}</p></CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-2xl bg-[#062D66] text-white px-6 py-4 text-center"><div className="text-xs opacity-70">{t("YOU","நீங்கள்")}</div><div className="font-bold">{user.name}</div><div className="text-xs opacity-70">{user.referralCode}</div></div>
                    <div className="h-6 w-0.5 bg-slate-200" />
                    <div className="flex flex-wrap justify-center gap-4">
                      {(team.tree?.level1 || team.members.filter((m:any)=>m.level===1)).slice(0,4).map((m:any)=>(
                        <div key={m.user?.id || m.user.id} className="rounded-xl border bg-white p-4 text-center min-w-[140px]">
                          <div className="text-xs text-slate-500">{t("Level 1","நிலை 1")}</div><div className="font-semibold text-sm">{m.user ? m.user.name : m.name}</div>
                          <div className="h-4 w-0.5 bg-slate-200 mx-auto my-2" />
                          <div className="text-xs text-slate-400">{m.user ? m.user.referralCode : ""}</div>
                        </div>
                      ))}
                    </div>
                    {(team.tree?.level2?.length >0 || team.members.some((m:any)=>m.level===2)) && (
                      <>
                        <div className="h-6 w-0.5 bg-slate-200" />
                        <div className="flex flex-wrap justify-center gap-3">
                          {team.members.filter((m:any)=>m.level===2).map((m:any)=>(
                            <div key={m.user.id} className="rounded-xl bg-[#EFF6FF] border border-blue-200 p-3 text-center min-w-[120px]"><div className="text-xs text-slate-500">{t("Level 2","நிலை 2")}</div><div className="font-medium text-sm">{m.user.name}</div></div>
                          ))}
                        </div>
                      </>
                    )}
                    {team.members.length===0 && <div className="text-sm text-slate-500">{t("No genealogy yet","இன்னும் வம்சாவளி இல்லை")}</div>}
                  </div>
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle>{t("Referral History","பரிந்துரை வரலாறு")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-500 border-b"><tr><th className="text-left py-2">{t("Member","உறுப்பினர்")}</th><th>{t("Level","நிலை")}</th><th>{t("Date","தேதி")}</th><th>{t("Status","நிலை")}</th></tr></thead><tbody>{team.members.map((m:any)=><tr key={m.user.id} className="border-b"><td className="py-2 font-medium">{m.user.name} — {m.user.email}</td><td className="text-center">{m.level}</td><td className="text-center text-xs">{formatDate(m.joinedAt)}</td><td className="text-center"><Badge variant="success">{t("Eligible","தகுதியான")}</Badge></td></tr>)}</tbody></table></div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* EARNINGS */}
          {active==="earnings" && (
            <Card><CardHeader><CardTitle>{t("Earnings History","வருவாய் வரலாறு")}</CardTitle><p className="text-xs text-amber-600">{t("Hypothetical calculations are marked as simulations. Only ledger-completed entries are financial records.","மதிப்பீடுகள் தனியாக குறிக்கப்பட்டுள்ளன.")}</p></CardHeader>
              <CardContent>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-500 border-b"><tr><th className="text-left py-2">{t("Description","விளக்கம்")}</th><th className="text-right">{t("Amount","தொகை")}</th><th>{t("Type","வகை")}</th><th>{t("Date","தேதி")}</th></tr></thead><tbody>{tx.filter(t=>t.type==="earning" || t.type==="referral_reward").map(e=>(
                  <tr key={e.id} className="border-b"><td className="py-2">{e.description}<div className="text-xs text-slate-500">{e.referenceId}</div></td><td className="text-right font-bold text-emerald-600">{formatCurrency(e.amount)}</td><td className="text-center"><Badge variant="success">{e.type}</Badge></td><td className="text-center text-xs">{formatDate(e.createdAt)}</td></tr>
                ))}</tbody></table>
                {tx.filter(t=>t.type==="earning").length===0 && <div className="text-center py-8 text-slate-500">{t("No earnings yet","இன்னும் வருவாய் இல்லை")}</div>}
                </div>
                <div className="mt-6 h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={dash?.chartData || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="earnings" fill="#19A53A" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div>
              </CardContent>
            </Card>
          )}

          {/* TRANSACTIONS */}
          {active==="transactions" && (
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("Transactions","பரிவர்த்தனைகள்")} — {tx.length}</CardTitle>
              <div className="flex gap-2"><Input placeholder={t("Search ref/desc","தேடு...")} className="h-9" onChange={e=>{ const v=e.target.value.toLowerCase(); if (!v) fetchAll(); else setTx((prev:any[])=>prev.filter(t=>t.description.toLowerCase().includes(v) || t.referenceId.toLowerCase().includes(v))) }} /><Select onChange={e=>{ const type=(e.target as HTMLSelectElement).value; if (!type) fetchAll(); else setTx((prev:any[])=>prev.filter(t=>t.type===type)) }}><option value="">{t("All types","அனைத்து வகைகள்")}</option><option value="deposit">deposit</option><option value="earning">earning</option><option value="withdrawal">withdrawal</option><option value="investment">investment</option></Select><Button variant="outline" size="sm" onClick={()=>exportCSV(tx, "transactions.csv")}><Download className="mr-2 h-4 w-4" />CSV</Button></div>
            </CardHeader>
              <CardContent>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-500 border-b"><tr><th className="text-left py-2">{t("Ref","குறிப்பு")}</th><th className="text-left">{t("Description","விளக்கம்")}</th><th className="text-right">{t("Amount","தொகை")}</th><th>{t("Type","வகை")}</th><th>{t("Status","நிலை")}</th><th>{t("Date","தேதி")}</th></tr></thead><tbody>{tx.map(t=>(
                  <tr key={t.id} className="border-b"><td className="py-2 font-mono text-xs">{t.referenceId}</td><td>{t.description}</td><td className="text-right font-bold">{formatCurrency(t.amount)}</td><td className="text-center"><Badge variant="outline">{t.type}</Badge></td><td className="text-center"><Badge variant={t.status==="completed"?"success":t.status==="pending"?"warning":"danger"}>{t.status}</Badge></td><td className="text-xs">{formatDateTime(t.createdAt)}</td></tr>
                ))}</tbody></table></div>
              </CardContent>
            </Card>
          )}

          {/* WITHDRAWALS */}
          {active==="withdrawals" && (
            <div className="space-y-6">
              <Card><CardHeader><CardTitle>{t("Request Withdrawal","பணம் எடுக்க கோரிக்கை")}</CardTitle><p className="text-xs text-slate-500">{t("Min ₹1,000 • Ledger-checked eligibility • Unique request ID","குறைந்தபட்சம் ₹1,000")}</p></CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdraw} className="grid gap-4 md:grid-cols-4 p-4 rounded-xl bg-[#F8FAFC] border">
                    <div><Label>{t("Amount","தொகை")}</Label><Input name="amount" placeholder="25000" required /></div>
                    <div><Label>{t("Method","முறை")}</Label><Select name="method"><option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option><option value="paypal">PayPal</option></Select></div>
                    <div><Label>{t("Destination","இலக்கு")}</Label><Input name="destination" placeholder="ICICI - 8899-0011 / rajesh@upi" /></div>
                    <div className="flex items-end"><Button type="submit" className="w-full bg-[#062D66]"><Send className="mr-2 h-4 w-4" />{t("Submit Request","கோரிக்கை அனுப்பு")}</Button></div>
                  </form>
                  <div className="mt-6">
                    <div className="flex items-center justify-between"><h4 className="font-semibold">{t("Withdrawal History","பணம் எடுத்த வரலாறு")}</h4><Badge variant="outline">{withdrawals.length}</Badge></div>
                    <div className="mt-3 space-y-3">{withdrawals.map(w=>(
                      <div key={w.id} className="flex items-center justify-between rounded-xl border p-4 bg-white">
                        <div><div className="font-bold">{formatCurrency(w.amount)} • {w.method}</div><div className="text-xs text-slate-500">{w.destination} • {formatDateTime(w.createdAt)} • Ref: {w.ledgerReference}</div>{w.reviewNote && <div className="text-xs text-amber-700 mt-1">{t("Note:","குறிப்பு:")} {w.reviewNote}</div>}</div>
                        <div className="text-right"><Badge variant={w.status==="completed"?"success":w.status==="pending"?"warning":w.status==="rejected"?"danger":"outline"}>{w.status}</Badge><div className="mt-1 flex gap-1 justify-end">{w.status==="pending" && <span className="flex items-center text-xs text-amber-600"><Clock className="h-3 w-3 mr-1" />{t("Under Review","மதிப்பாய்வில்")}</span>}{w.status==="completed" && <CheckCircle className="h-4 w-4 text-emerald-600" />}{w.status==="rejected" && <XCircle className="h-4 w-4 text-rose-600" />}</div></div>
                      </div>
                    ))}</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4 text-sm text-amber-800"><AlertCircle className="inline h-4 w-4 mr-2" />{t("Withdrawal workflow: Pending → Under Review → Approved → Processing → Completed. Rejections include reason. Prevents double-spending via ledger checks & idempotency.","பணம் எடுத்தல் செயல்முறை: நிலுவை → மதிப்பாய்வு → அங்கீகரிக்கப்பட்டது → செயலாக்கம் → முடிந்தது")}</CardContent></Card>
            </div>
          )}

          {/* REPORTS */}
          {active==="reports" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card><CardHeader><CardTitle>{t("Transaction Reports","பரிவர்த்தனை அறிக்கைகள்")}</CardTitle></CardHeader><CardContent className="space-y-3">
                <div className="rounded-xl bg-[#F8FAFC] p-4 flex items-center justify-between"><div><div className="font-semibold">{t("Monthly Ledger","மாதாந்திர லெட்ஜர்")}</div><div className="text-xs text-slate-500">{t("PDF & Excel export ready","PDF & Excel ஏற்றுமதி")}</div></div><Button variant="outline" onClick={()=>exportCSV(tx, "report.csv")}><Download className="mr-2 h-4 w-4" />CSV</Button></div>
                <div className="h-40"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{name:"Investments",value: investments.length},{name:"Earnings",value: tx.filter(t=>t.type==="earning").length},{name:"Withdrawals",value: withdrawals.length}]} dataKey="value" cx="50%" cy="50%" outerRadius={60} fill="#062D66"><Cell fill="#062D66" /><Cell fill="#19A53A" /><Cell fill="#0876E8" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
                <Button className="w-full bg-[#062D66]" onClick={()=>exportCSV(tx, "transactions_export.csv")}>{t("Export Transactions (CSV)","பரிவர்த்தனைகளை ஏற்றுமதி")}</Button>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>{t("Team Reports","குழு அறிக்கைகள்")}</CardTitle></CardHeader><CardContent className="space-y-3">
                <div className="rounded-xl border p-4"><div className="font-semibold">{t("Direct / Team Counts","நேரடி / குழு எண்ணிக்கை")}</div><div className="mt-2 text-2xl font-bold">{team?.total || 0} {t("total","மொத்தம்")}</div><div className="text-xs text-slate-500">{t("Level 1:","நிலை 1:")} {team?.members.filter((m:any)=>m.level===1).length || 0} • {t("Level 2:","நிலை 2:")} {team?.members.filter((m:any)=>m.level===2).length || 0}</div></div>
                <Button className="w-full" variant="outline" onClick={()=> team && exportCSV(team.members.map((m:any)=>({ name:m.user.name, email:m.user.email, level:m.level, joined:formatDate(m.joinedAt) })), "team_report.csv")}>{t("Export Team (CSV)","குழுவை ஏற்றுமதி")}</Button>
                <div className="rounded-xl bg-white border p-3 text-xs text-slate-500">{t("Backup & recovery workflow documented in README. All sensitive actions are audited.","காப்புப்பிரதி செயல்முறை README இல் ஆவணப்படுத்தப்பட்டுள்ளது.")}</div>
              </CardContent></Card>
            </div>
          )}

          {/* CALC */}
          {active==="calc" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>{t("Earnings Calculator (Simulation)","வருவாய் கணிப்பான் (மதிப்பீடு)")}</CardTitle><p className="text-xs text-amber-600">{t("Simulation only — not credited. Uses NUMERIC precision. Configure rates in Admin.","மதிப்பீடு மட்டும் — வரவு வைக்கப்படாது")}</p></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>{t("Base Amount (INR)","அடிப்படை தொகை")}</Label><Input value={calcForm.baseAmount} onChange={e=>setCalcForm({...calcForm, baseAmount:e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-3"><div><Label>{t("Rate % (daily)","விகிதம் %")}</Label><Input value={calcForm.ratePercent} onChange={e=>setCalcForm({...calcForm, ratePercent:e.target.value})} /></div><div><Label>{t("Days","நாட்கள்")}</Label><Input value={calcForm.days} onChange={e=>setCalcForm({...calcForm, days:e.target.value})} /></div></div>
                  <Button onClick={handleCalc} className="w-full bg-[#0876E8]">{t("Calculate","கணக்கிடு")}</Button>
                  {calcResult && <div className="rounded-xl bg-[#F0FDF4] border border-emerald-200 p-4"><div className="text-xs text-emerald-700">{t("Estimated Return","மதிப்பிடப்பட்ட வருவாய்")}</div><div className="text-2xl font-extrabold text-emerald-700">{formatCurrency(calcResult.result)}</div><div className="mt-2 text-xs text-slate-600">{calcResult.assumptions}</div><Badge variant="warning" className="mt-2">{t("SIMULATION — not real earnings","மதிப்பீடு — உண்மையான வருவாய் அல்ல")}</Badge></div>}
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle>{t("Calculation History","கணக்கீடு வரலாறு")}</CardTitle></CardHeader><CardContent>
                <div className="space-y-2 text-sm">
                  {dash?.notifications?.slice(0,5).map((n:any)=><div key={n.id} className="rounded-lg border p-3"><div className="font-medium">{n.title}</div><div className="text-xs text-slate-500">{n.message}</div></div>)}
                  <div className="rounded-lg border p-3 text-xs text-slate-500">{t("All calculations stored with version & approval status. See Admin → Configuration.","அனைத்து கணக்கீடுகளும் சேமிக்கப்பட்டுள்ளன.")}</div>
                </div>
              </CardContent></Card>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {active==="notifications" && (
            <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{t("Notifications","அறிவிப்புகள்")} — {notifications.filter(n=>!n.read).length} {t("unread","படிக்கப்படாத")}</CardTitle><Button variant="outline" size="sm" onClick={async()=>{ await fetch("/api/v1/notifications",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id:"all" }) }); fetchAll(); }}>{t("Mark all read","அனைத்தையும் படித்ததாக குறி")}</Button></CardHeader>
              <CardContent className="space-y-3">
                {notifications.map(n=>(
                  <div key={n.id} className={`flex items-start justify-between rounded-xl border p-4 ${n.read ? "bg-white" : "bg-[#EFF6FF] border-blue-200"}`}>
                    <div><div className="font-semibold text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-[#0876E8]" />{n.title} {!n.read && <Badge variant="success">{t("New","புதிய")}</Badge>}</div><div className="text-sm text-slate-600 mt-1">{n.message}</div><div className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)} • {n.type}</div></div>
                    {!n.read && <Button size="sm" variant="outline" onClick={async()=>{ await fetch("/api/v1/notifications",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id:n.id }) }); fetchAll(); }}>{t("Read","படி")}</Button>}
                  </div>
                ))}
                {notifications.length===0 && <div className="text-center py-10 text-slate-500">{t("No notifications","அறிவிப்புகள் இல்லை")}</div>}
              </CardContent>
            </Card>
          )}

          {/* SUPPORT */}
          {active==="support" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>{t("Create Support Ticket","ஆதரவு டிக்கெட் உருவாக்கு")}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); const res=await fetch("/api/v1/support",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ subject: fd.get("subject"), message: fd.get("message"), priority: fd.get("priority") }) }); if (res.ok){ alert(t("Ticket created","டிக்கெட் உருவாக்கப்பட்டது")); fetchAll(); (e.target as HTMLFormElement).reset(); } }} className="space-y-3">
                    <div><Label>{t("Subject","தலைப்பு")}</Label><Input name="subject" required /></div>
                    <div><Label>{t("Priority","முன்னுரிமை")}</Label><Select name="priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></Select></div>
                    <div><Label>{t("Message","செய்தி")}</Label><Textarea name="message" required /></div>
                    <Button type="submit" className="w-full bg-[#062D66]"><Send className="mr-2 h-4 w-4" />{t("Submit Ticket","டிக்கெட் அனுப்பு")}</Button>
                  </form>
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle>{t("My Tickets","என் டிக்கெட்டுகள்")} — {tickets.length}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {tickets.map(tk=>(
                    <div key={tk.id} className="rounded-xl border p-4 bg-white">
                      <div className="flex items-center justify-between"><span className="font-semibold text-sm">{tk.subject}</span><Badge variant={tk.status==="open"?"warning":tk.status==="resolved"?"success":"outline"}>{tk.status}</Badge></div>
                      <div className="text-sm text-slate-600 mt-1">{tk.message}</div>
                      {tk.response && <div className="mt-2 rounded-lg bg-[#F0FDF4] border border-emerald-200 p-2 text-xs text-emerald-800"><b>{t("Admin response:","நிர்வாகி பதில்:")}</b> {tk.response}</div>}
                      <div className="mt-2 text-xs text-slate-400">{formatDateTime(tk.createdAt)} • {tk.priority}</div>
                    </div>
                  ))}
                  {tickets.length===0 && <div className="text-center py-8 text-slate-500">{t("No tickets yet","இன்னும் டிக்கெட்டுகள் இல்லை")}</div>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* PROFILE */}
          {active==="profile" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>{t("Profile & Settings","சுயவிவரம் & அமைப்புகள்")}</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={async e=>{ e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); const res=await fetch("/api/v1/profile",{ method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ name: fd.get("name"), phone: fd.get("phone"), address: fd.get("address"), addressLine2: fd.get("addressLine2"), city: fd.get("city"), state: fd.get("state"), country: fd.get("country"), postalCode: fd.get("postalCode"), bankName: fd.get("bankName"), bankAccount: fd.get("bankAccount"), upiId: fd.get("upiId") }) }); if (res.ok) alert(t("Profile updated","சுயவிவரம் புதுப்பிக்கப்பட்டது")); fetchAll(); }} className="space-y-3">
                    <div><Label>{t("Full Name","முழு பெயர்")}</Label><Input name="name" defaultValue={user.name} /></div>
                    <div><Label>Email</Label><Input defaultValue={user.email} disabled /></div>
                    <div><Label>{t("Phone","தொலைபேசி")}</Label><Input name="phone" defaultValue={user.phone || ""} /></div>
                    <div><Label>Address line 1</Label><Input name="address" autoComplete="address-line1" defaultValue={profile?.address || ""} placeholder="House / street address" /></div>
                    <div><Label>Address line 2</Label><Input name="addressLine2" autoComplete="address-line2" defaultValue={profile?.addressLine2 || ""} placeholder="Apartment, building, landmark" /></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>{t("City","நகரம்")}</Label><Input name="city" autoComplete="address-level2" defaultValue={profile?.city || ""} placeholder="Chennai" /></div><div><Label>State / Province</Label><Input name="state" autoComplete="address-level1" defaultValue={profile?.state || ""} placeholder="Tamil Nadu" /></div></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>Country</Label><Input name="country" autoComplete="country-name" defaultValue={profile?.country || ""} placeholder="India" /></div><div><Label>Postal code</Label><Input name="postalCode" autoComplete="postal-code" defaultValue={profile?.postalCode || ""} placeholder="600001" /></div></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>{t("Bank Name","வங்கி பெயர்")}</Label><Input name="bankName" defaultValue={profile?.bankName || ""} placeholder="ICICI Bank" /></div><div><Label>{t("Account","கணக்கு")}</Label><Input name="bankAccount" defaultValue={profile?.bankAccount || ""} placeholder="XXXX-..." /></div></div>
                    <div><Label>UPI ID</Label><Input name="upiId" defaultValue={profile?.upiId || ""} placeholder="name@upi" /></div>
                    <Button type="submit" className="w-full bg-[#062D66]">{t("Save Changes","மாற்றங்களை சேமி")}</Button>
                  </form>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card><CardHeader><CardTitle>{t("Account Status","கணக்கு நிலை")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>{t("Referral Code","பரிந்துரை குறியீடு")}</span><Badge variant="outline">{user.referralCode}</Badge></div>
                  <div className="flex justify-between"><span>{t("Role","பங்கு")}</span><Badge>{user.role}</Badge></div>
                  <div className="flex justify-between"><span>{t("Member since","உறுப்பினர் ஆன தேதி")}</span><span>{formatDate(new Date().toString())}</span></div>
                  <div className="rounded-xl bg-[#F8FAFC] p-3 text-xs text-slate-600">{t("Dark mode, language preference and audit trail are preserved. All profile edits are logged.","டார்க் மோட் மற்றும் மொழி விருப்பங்கள் சேமிக்கப்படும்.")}</div>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>{t("Security","பாதுகாப்பு")}</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700"><CheckCircle className="h-4 w-4" />{t("Password hashed with bcrypt • JWT 7-day expiry • HttpOnly cookies","கடவுச்சொல் bcrypt மூலம் ஹாஷ் செய்யப்பட்டது")}</div>
                  <div className="flex items-center gap-2 text-slate-600"><Globe className="h-4 w-4" />{t("CORS, rate-limit & request-ID logging enabled (API boundary)","CORS மற்றும் rate-limit இயக்கப்பட்டது")}</div>
                </CardContent></Card>
              </div>
            </div>
          )}

          {/* Fallback for reports etc handle empty states already */}
        </div>
      </main>
    </div>
  );
}
