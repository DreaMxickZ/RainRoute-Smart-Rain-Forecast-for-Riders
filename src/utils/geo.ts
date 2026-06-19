import type { LatLng, Route, RouteSegment } from "@/types";

const EARTH_RADIUS_M = 6371000;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in meters (Haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function routeSegments(route: Route): RouteSegment[] {
  const segs: RouteSegment[] = [];
  for (let i = 0; i < route.path.length - 1; i++) {
    const start = route.path[i];
    const end = route.path[i + 1];
    segs.push({
      index: i,
      start,
      end,
      distanceM: haversineMeters(start, end),
    });
  }
  return segs;
}

export function totalDistanceM(route: Route): number {
  return routeSegments(route).reduce((sum, s) => sum + s.distanceM, 0);
}

export function totalDurationMs(route: Route): number {
  const distanceKm = totalDistanceM(route) / 1000;
  const hours = distanceKm / Math.max(1, route.avgSpeedKmh);
  return hours * 3600 * 1000;
}

/**
 * Sample points along the route at roughly `everyMeters` spacing.
 * Always includes the first and last point.
 */
export function sampleRoutePoints(route: Route, everyMeters = 1500): LatLng[] {
  if (route.path.length === 0) return [];
  if (route.path.length === 1) return [route.path[0]];

  const segments = routeSegments(route);
  const total = segments.reduce((s, x) => s + x.distanceM, 0);
  if (total === 0) return [route.path[0]];

  const count = Math.max(2, Math.ceil(total / everyMeters) + 1);
  const step = total / (count - 1);

  const samples: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    samples.push(interpolateAlong(segments, i * step));
  }
  return samples;
}

function interpolateAlong(segments: RouteSegment[], distFromStart: number): LatLng {
  let acc = 0;
  for (const s of segments) {
    if (distFromStart <= acc + s.distanceM) {
      const t = s.distanceM === 0 ? 0 : (distFromStart - acc) / s.distanceM;
      return {
        lat: s.start.lat + (s.end.lat - s.start.lat) * t,
        lng: s.start.lng + (s.end.lng - s.start.lng) * t,
      };
    }
    acc += s.distanceM;
  }
  return segments[segments.length - 1].end;
}

/**
 * Cumulative distance to each sampled point (in meters), used to derive ETA.
 */
export function cumulativeDistances(points: LatLng[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    out.push(out[i - 1] + haversineMeters(points[i - 1], points[i]));
  }
  return out;
}

export function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} ม.`;
  return `${(meters / 1000).toFixed(1)} กม.`;
}
