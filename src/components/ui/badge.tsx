import { cn } from "@/lib/utils";
export function Badge({ className, variant="default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default"|"success"|"warning"|"danger"|"outline" }) {
  const variants: Record<string,string> = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    outline: "border border-slate-200 bg-white text-slate-600",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}
