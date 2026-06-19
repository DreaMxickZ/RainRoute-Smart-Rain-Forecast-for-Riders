import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const ACCENT: Record<NonNullable<StatsCardProps["accent"]>, string> = {
  default: "text-primary",
  success: "text-rain-none",
  warning: "text-rain-light",
  danger: "text-rain-heavy",
};

export function StatsCard({
  icon,
  label,
  value,
  sub,
  accent = "default",
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("h-full border-2", className)}>
      <CardContent className="flex h-full flex-col justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60",
              ACCENT[accent]
            )}
          >
            {icon}
          </span>
        </div>
        <div>
          <div className="text-3xl font-extrabold leading-tight tracking-tight tabular-nums sm:text-4xl">
            {value}
          </div>
          {sub && (
            <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
