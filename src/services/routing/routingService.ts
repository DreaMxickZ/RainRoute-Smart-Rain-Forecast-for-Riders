import type { LatLng } from "@/types";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface RoutingResult {
  /** Polyline that follows actual roads */
  path: LatLng[];
  /** Total distance in meters */
  distanceM: number;
  /** OSRM-estimated driving duration in seconds */
  durationSec: number;
}

interface OSRMResponse {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      type: "LineString";
      coordinates: [number, number][]; // [lng, lat]
    };
  }>;
}

/**
 * Fetches a driving route that follows real roads between waypoints.
 * Uses the OSRM public demo server — free, no API key, but rate-limited.
 */
export async function fetchDrivingRoute(
  waypoints: LatLng[],
  signal?: AbortSignal
): Promise<RoutingResult> {
  if (waypoints.length < 2) {
    throw new Error("ต้องการอย่างน้อย 2 จุด");
  }

  const coords = waypoints
    .map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`)
    .join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=false&alternatives=false`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`OSRM ${res.status}`);
  }
  const json = (await res.json()) as OSRMResponse;

  if (json.code !== "Ok" || !json.routes || json.routes.length === 0) {
    throw new Error(json.message || "หาเส้นทางบนถนนไม่เจอ");
  }

  const route = json.routes[0];
  const path: LatLng[] = route.geometry.coordinates.map(([lng, lat]) => ({
    lat,
    lng,
  }));

  return {
    path,
    distanceM: route.distance,
    durationSec: route.duration,
  };
}

export const routingService = { fetchDrivingRoute };
