"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { LatLng, RainAnalysis, Route } from "@/types";

const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      กำลังโหลดแผนที่...
    </div>
  ),
});

interface RouteMapProps {
  route: Route | null;
  position: (LatLng & { heading?: number | null }) | null;
  analysis: RainAnalysis | null;
  className?: string;
  draftPath?: LatLng[];
  draftWaypoints?: LatLng[];
  onMapClick?: (p: LatLng) => void;
}

export function RouteMap(props: RouteMapProps) {
  return (
    <div
      className={cn(
        "relative isolate h-full min-h-[280px] w-full overflow-hidden rounded-xl border bg-muted/30 shadow-inner",
        props.className
      )}
    >
      <MapClient {...props} />
    </div>
  );
}
