"use client";

import { AlertTriangle, CheckCircle2, CloudRain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKm } from "@/utils/geo";
import { formatDurationShort } from "@/utils/time";
import type { RainAnalysis } from "@/types";

interface BigStatusCardProps {
  analysis: RainAnalysis | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hero card that tells the rider — at a glance, while moving — whether they
 * should expect rain and how soon. Designed for one-second comprehension:
 * giant icon, giant number, color-coded background.
 */
export function BigStatusCard({ analysis, loading, error }: BigStatusCardProps) {
  if (loading) {
    return (
      <Shell tone="neutral">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <Headline>กำลังวิเคราะห์...</Headline>
        <Sub>ดึงข้อมูลฝนตลอดเส้นทาง</Sub>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell tone="warn">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <Headline>โหลดข้อมูลฝนไม่ได้</Headline>
        <Sub>{error}</Sub>
      </Shell>
    );
  }

  if (!analysis) {
    return (
      <Shell tone="neutral">
        <CloudRain className="h-12 w-12 text-muted-foreground" />
        <Headline>เลือกเส้นทาง</Headline>
        <Sub>เลือกหรือวาดเส้นทางเพื่อเริ่ม</Sub>
      </Shell>
    );
  }

  if (!analysis.willRain) {
    return (
      <Shell tone="safe">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <Headline>ไม่มีฝน — ไปได้เลย</Headline>
        <Sub>
          {formatKm(analysis.totalDistanceM)} ·{" "}
          {formatDurationShort(analysis.totalDurationMs)}
        </Sub>
      </Shell>
    );
  }

  const first = analysis.events[0];
  const isHeavy = analysis.worstLevel === "heavy";

  return (
    <Shell tone={isHeavy ? "danger" : "warn"}>
      <CloudRain
        className={cn(
          "h-14 w-14",
          isHeavy ? "text-rose-500" : "text-amber-500"
        )}
      />
      <Headline>
        ฝนใน <span className="text-5xl tabular-nums">{first.minutesUntil}</span>{" "}
        นาที
      </Headline>
      <Sub>
        {isHeavy ? "ฝนหนัก" : "ฝนเบา"} · โอกาส {Math.round(first.probability)}%
        · พบฝน {analysis.events.length} จุด
      </Sub>
    </Shell>
  );
}

const TONE: Record<"neutral" | "safe" | "warn" | "danger", string> = {
  neutral: "border-border bg-card",
  safe: "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15",
  warn: "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15",
  danger: "border-rose-500/50 bg-rose-500/10 dark:bg-rose-500/15",
};

function Shell({
  tone,
  children,
}: {
  tone: keyof typeof TONE;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border-2 p-5 shadow-sm sm:p-6",
        TONE[tone]
      )}
    >
      <div className="shrink-0">{children && extractChild(children, 0)}</div>
      <div className="min-w-0 flex-1 space-y-1">
        {extractChild(children, 1)}
        {extractChild(children, 2)}
      </div>
    </div>
  );
}

function extractChild(children: React.ReactNode, index: number) {
  const arr = Array.isArray(children) ? children : [children];
  return arr[index] ?? null;
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-base text-muted-foreground sm:text-lg">{children}</div>
  );
}
