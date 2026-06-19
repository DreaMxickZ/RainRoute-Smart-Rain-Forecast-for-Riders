"use client";

import { useEffect, useState } from "react";
import type { LatLng } from "@/types";
import {
  fetchDrivingRoute,
  type RoutingResult,
} from "@/services/routing/routingService";

interface UseDraftRoutingResult {
  result: RoutingResult | null;
  loading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 500;

/**
 * Given an array of user-clicked waypoints, return the road-following polyline
 * between them. Debounced so rapid clicks don't spam OSRM.
 */
export function useDraftRouting(waypoints: LatLng[]): UseDraftRoutingResult {
  const [result, setResult] = useState<RoutingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serialize waypoints for stable dep comparison.
  const key = waypoints
    .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
    .join("|");

  useEffect(() => {
    if (waypoints.length < 2) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      fetchDrivingRoute(waypoints, controller.signal)
        .then((r) => {
          if (controller.signal.aborted) return;
          setResult(r);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          const msg =
            e instanceof Error ? e.message : "หาเส้นทางบนถนนไม่สำเร็จ";
          setError(msg);
          setResult(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // waypoints array reference changes each call, but key tracks content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { result, loading, error };
}
