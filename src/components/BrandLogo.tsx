import { cn } from "@/lib/utils";

export function BrandLogo({ variant = "mark", className = "" }: { variant?: "mark" | "full"; className?: string }) {
  const isMark = variant === "mark";
  return (
    <img
      src={isMark ? "/ater-kompany-mark.png" : "/ater-kompany-logo.png"}
      alt="ATER KOMPANY"
      className={cn("block shrink-0 bg-white object-contain", isMark ? "rounded-lg" : "rounded-md", className)}
    />
  );
}
