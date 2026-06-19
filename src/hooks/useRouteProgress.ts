"use client";

import { useMemo } from "react";
import type { LatLng, Route } from "@/types";
import { projectOntoRoute, type RouteProjection } from "@/utils/mapMatching";

/**
 * Project the rider's GPS position onto the chosen route. Re-computes only
 * when the position actually changes (lat/lng to 5 decimal places ≈ 1m).
 */
export function useRouteProgress(
  route: Route | null,
  position: LatLng | null
): RouteProjection | null {
  const lat = position?.lat;
  const lng = position?.lng;

  return useMemo(() => {
    if (!route || lat == null || lng == null) return null;
    return projectOntoRoute(route, { lat, lng });
  }, [route, lat, lng]);
}
