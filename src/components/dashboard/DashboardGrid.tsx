"use client";

import { Clock, CloudRain, Gauge, MapPin } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { formatKm } from "@/utils/geo";
import { formatClock, formatDurationShort } from "@/utils/time";
import type { RainAnalysis, RainLevel } from "@/types";

interface DashboardGridProps {
  analysis: RainAnalysis | null;
}

const LEVEL_LABEL: Record<RainLevel, string> = {
  none: "ไม่มีฝน",
  light: "ฝนเบา",
  heavy: "ฝนหนัก",
};

const LEVEL_ACCENT: Record<RainLevel, "success" | "warning" | "danger"> = {
  none: "success",
  light: "warning",
  heavy: "danger",
};

export function DashboardGrid({ analysis }: DashboardGridProps) {
  if (!analysis) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border bg-muted/30"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatsCard
        icon={<MapPin className="h-4 w-4" />}
        label="ระยะทางรวม"
        value={formatKm(analysis.totalDistanceM)}
      />
      <StatsCard
        icon={<Clock className="h-4 w-4" />}
        label="เวลาเดินทาง"
        value={formatDurationShort(analysis.totalDurationMs)}
        sub={`ถึงประมาณ ${formatClock(analysis.etaIso)}`}
      />
      <StatsCard
        icon={<CloudRain className="h-4 w-4" />}
        label="จุดตรวจฝน"
        value={analysis.events.length}
        sub={analysis.events.length === 0 ? "เส้นทางสะอาด" : "จุดที่คาดว่าจะมีฝน"}
        accent={analysis.events.length === 0 ? "success" : "warning"}
      />
      <StatsCard
        icon={<Gauge className="h-4 w-4" />}
        label="ความรุนแรง"
        value={LEVEL_LABEL[analysis.worstLevel]}
        sub={
          analysis.worstLevel === "none"
            ? "ปลอดภัย"
            : analysis.worstLevel === "heavy"
              ? "ระวังลื่น/ทัศนวิสัยต่ำ"
              : "เตรียมเสื้อกันฝน"
        }
        accent={LEVEL_ACCENT[analysis.worstLevel]}
      />
    </div>
  );
}
