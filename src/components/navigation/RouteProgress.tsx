"use client";

import { MapPin, Navigation2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKm } from "@/utils/geo";
import type { RouteProjection } from "@/utils/mapMatching";

interface RouteProgressProps {
  totalDistanceM: number;
  projection: RouteProjection | null;
  /** Perpendicular distance threshold (m) — flag as "off-route" beyond this. */
  offRouteThresholdM?: number;
}

export function RouteProgress({
  totalDistanceM,
  projection,
  offRouteThresholdM = 200,
}: RouteProgressProps) {
  const fraction = projection?.fraction ?? 0;
  const traveled = projection?.distanceAlongRouteM ?? 0;
  const remaining = projection?.remainingDistanceM ?? totalDistanceM;
  const offRoute =
    projection != null &&
    projection.perpendicularDistanceM > offRouteThresholdM;

  return (
    <div className="space-y-2 rounded-2xl border-2 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Navigation2
            className={cn(
              "h-5 w-5",
              projection ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="text-sm font-bold">
            {projection ? "ตำแหน่งบนเส้นทาง" : "รอตำแหน่ง GPS"}
          </span>
        </div>
        {offRoute && (
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            อยู่นอกเส้นทาง {Math.round(projection!.perpendicularDistanceM)} ม.
          </span>
        )}
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${Math.min(100, Math.round(fraction * 100))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-bold tabular-nums">{formatKm(traveled)}</span>
          <span className="text-muted-foreground">/ {formatKm(totalDistanceM)}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">เหลืออีก</div>
          <div className="text-lg font-extrabold tabular-nums">
            {formatKm(remaining)}
          </div>
        </div>
      </div>
    </div>
  );
}
