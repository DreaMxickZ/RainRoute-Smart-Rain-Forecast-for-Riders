import type { LatLng, Route } from "@/types";
import { haversineMeters } from "./geo";

export interface RouteProjection {
  /** Closest point on the route polyline to the input position. */
  point: LatLng;
  /** Which segment of the polyline contains the projection (0..path.length-2). */
  segmentIndex: number;
  /** Parametric position along that segment, [0,1]. */
  t: number;
  /** How far the input position is from the route (perpendicular distance, m). */
  perpendicularDistanceM: number;
  /** Cumulative distance from route start to the projected point, in meters. */
  distanceAlongRouteM: number;
  /** Distance still to go on the route, in meters. */
  remainingDistanceM: number;
  /** Fraction of route completed [0,1]. */
  fraction: number;
}

/**
 * Project a point onto a single segment using a small-area equirectangular
 * approximation. Accurate to <1m at city scales, much cheaper than great-circle.
 */
function projectOnSegment(
  p: LatLng,
  a: LatLng,
  b: LatLng
): { point: LatLng; t: number } {
  const latRef = (a.lat + b.lat) / 2;
  const cosLatRef = Math.cos((latRef * Math.PI) / 180);

  const ax = a.lng * cosLatRef;
  const ay = a.lat;
  const bx = b.lng * cosLatRef;
  const by = b.lat;
  const px = p.lng * cosLatRef;
  const py = p.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { point: a, t: 0 };

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return {
    point: {
      lat: a.lat + t * (b.lat - a.lat),
      lng: a.lng + t * (b.lng - a.lng),
    },
    t,
  };
}

/**
 * Find the closest point on the route to the rider's current GPS position.
 * Returns null if the route has fewer than 2 points.
 */
export function projectOntoRoute(
  route: Route,
  position: LatLng
): RouteProjection | null {
  if (route.path.length < 2) return null;

  let best: RouteProjection | null = null;
  let cumDist = 0;
  let totalDist = 0;

  // Precompute segment lengths once for total + per-segment use.
  const segLens: number[] = [];
  for (let i = 0; i < route.path.length - 1; i++) {
    const len = haversineMeters(route.path[i], route.path[i + 1]);
    segLens.push(len);
    totalDist += len;
  }

  for (let i = 0; i < route.path.length - 1; i++) {
    const a = route.path[i];
    const b = route.path[i + 1];
    const { point: proj, t } = projectOnSegment(position, a, b);
    const perp = haversineMeters(position, proj);
    if (!best || perp < best.perpendicularDistanceM) {
      const along = cumDist + t * segLens[i];
      best = {
        point: proj,
        segmentIndex: i,
        t,
        perpendicularDistanceM: perp,
        distanceAlongRouteM: along,
        remainingDistanceM: Math.max(0, totalDist - along),
        fraction: totalDist === 0 ? 0 : along / totalDist,
      };
    }
    cumDist += segLens[i];
  }

  return best;
}
