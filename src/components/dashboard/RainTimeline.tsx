"use client";

import { CheckCircle2, CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatClock } from "@/utils/time";
import type { RainAnalysis } from "@/types";

interface RainTimelineProps {
  analysis: RainAnalysis | null;
}

export function RainTimeline({ analysis }: RainTimelineProps) {
  if (!analysis) return null;

  if (analysis.events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>จุดตรวจฝน</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-rain-none">
          <CheckCircle2 className="h-5 w-5" />
          ไม่พบจุดที่จะมีฝนตามเส้นทางนี้
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>จุดตรวจฝนตลอดเส้นทาง</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-s pl-4">
          {analysis.events.map((e, i) => (
            <li key={`${e.pointIndex}-${i}`} className="relative">
              <span
                className={cn(
                  "absolute -start-[9px] mt-1 h-3 w-3 rounded-full ring-2 ring-background",
                  e.level === "heavy" ? "bg-rain-heavy" : "bg-rain-light"
                )}
              />
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CloudRain
                  className={cn(
                    "h-4 w-4",
                    e.level === "heavy" ? "text-rain-heavy" : "text-rain-light"
                  )}
                />
                ประมาณ {formatClock(e.expectedAt)} · อีก {e.minutesUntil} นาที
                <Badge variant={e.level === "heavy" ? "danger" : "warning"}>
                  {e.level === "heavy" ? "ฝนหนัก" : "ฝนเบา"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                โอกาสฝน {Math.round(e.probability)}% · ความหนัก{" "}
                {e.intensity.toFixed(2)} mm/h ·{" "}
                {e.location.lat.toFixed(4)}, {e.location.lng.toFixed(4)}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
