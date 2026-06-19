"use client";

import { useEffect, useState } from "react";
import { geoService, type GeoPosition } from "@/services/geolocation/geoService";

interface UseGeolocationResult {
  position: GeoPosition | null;
  error: string | null;
  /**
   * `null` until the component has mounted on the client. Treat `null` as
   * "unknown — don't render UI that depends on this yet" to avoid hydration
   * mismatches when SSR sees no `navigator`.
   */
  supported: boolean | null;
}

export function useGeolocation(active: boolean): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" && "geolocation" in navigator
    );
  }, []);

  useEffect(() => {
    if (!active || supported !== true) return;
    setError(null);
    const stop = geoService.watchPosition(
      (p) => setPosition(p),
      (err) => setError(err.message || "ไม่สามารถระบุตำแหน่งได้")
    );
    return stop;
  }, [active, supported]);

  return { position, error, supported };
}
