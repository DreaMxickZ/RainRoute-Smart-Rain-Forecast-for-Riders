"use client";

import { AlertTriangle, CloudRain, CloudSun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RainAnalysis } from "@/types";

interface RainAlertCardProps {
  analysis: RainAnalysis | null;
  loading: boolean;
  error: string | null;
}

export function RainAlertCard({ analysis, loading, error }: RainAlertCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <div className="h-3 w-3 animate-pulse-soft rounded-full bg-primary" />
          กำลังวิเคราะห์ฝนตลอดเส้นทาง...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <div className="font-semibold">วิเคราะห์ฝนไม่สำเร็จ</div>
            <div className="text-xs opacity-80">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  if (!analysis.willRain) {
    return (
      <Card className="border-rain-none/40 bg-rain-none/5">
        <CardContent className="flex items-center gap-3 p-5">
          <CloudSun className="h-6 w-6 text-rain-none" />
          <div className="flex-1">
            <div className="font-semibold text-rain-none">ไม่มีฝนตลอดเส้นทาง</div>
            <div className="text-xs text-muted-foreground">
              เดินทางได้สบาย ๆ — โอกาสฝนต่ำใน {analysis.events.length || 0} จุด
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const first = analysis.events[0];
  return (
    <Card
      className={cn(
        "border-2",
        analysis.worstLevel === "heavy"
          ? "border-rain-heavy/60 bg-rain-heavy/5"
          : "border-rain-light/60 bg-rain-light/5"
      )}
    >
      <CardContent className="flex items-start gap-3 p-5">
        <CloudRain
          className={cn(
            "h-6 w-6",
            analysis.worstLevel === "heavy"
              ? "text-rain-heavy"
              : "text-rain-light"
          )}
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              จะพบฝนในอีก {first.minutesUntil} นาที
            </span>
            <Badge
              variant={analysis.worstLevel === "heavy" ? "danger" : "warning"}
            >
              {analysis.worstLevel === "heavy" ? "ฝนหนัก" : "ฝนเบา"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            โอกาสฝน {Math.round(first.probability)}% · ความหนัก{" "}
            {first.intensity.toFixed(2)} mm/h · พบฝนรวม{" "}
            {analysis.events.length} จุด
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
