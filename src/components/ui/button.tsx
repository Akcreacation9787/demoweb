"use client";
import { cn } from "@/lib/utils";
export function Button({ className, variant="default", size="default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"outline"|"ghost"|"secondary", size?: "default"|"sm"|"lg"|"icon" }) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0876E8] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string,string> = {
    default: "bg-[#062D66] text-white hover:bg-[#08417F] shadow-sm",
    secondary: "bg-[#0876E8] text-white hover:bg-[#0665C7]",
    outline: "border border-slate-200 bg-white hover:bg-slate-50",
    ghost: "hover:bg-slate-100",
  };
  const sizes: Record<string,string> = {
    default: "h-10 px-5 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-11 px-8 text-base",
    icon: "h-10 w-10",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
