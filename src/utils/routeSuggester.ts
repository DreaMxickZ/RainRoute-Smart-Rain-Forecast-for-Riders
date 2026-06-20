import type { LatLng, Route } from "@/types";
import {
  DEFAULT_SCHEDULE,
  type ScheduleConfig,
  type TimeWindow,
} from "@/store/settingsStore";
import { haversineMeters } from "./geo";

export interface RouteSuggestion {
  route: Route;
  /** Higher = better. Combination of GPS proximity + time-of-day fit. */
  score: number;
  /** Meters from rider position to the route's start point. */
  startDistanceM: number;
  /** Human-readable reason this route was suggested (Thai). */
  reason: string;
}

/** Rider counts as "at the start" if within this many meters. */
const NEAR_START_THRESHOLD_M = 800;
/** Below this distance, the GPS contribution maxes out. */
const STRONG_PROXIMITY_M = 150;

function isWorkRoute(name: string, _from: string, to: string): boolean {
  const t = `${name} ${to}`.toLowerCase();
  return /(ทำงาน|ออฟฟิศ|office|งาน|โรงเรียน|มหาลัย|คลาส|class)/.test(t);
}

function isHomeRoute(name: string, _from: string, to: string): boolean {
  const t = `${name} ${to}`.toLowerCase();
  return /(บ้าน|หอ|กลับ|home)/.test(t);
}

function proximityScore(distanceM: number): number {
  if (distanceM <= STRONG_PROXIMITY_M) return 100;
  if (distanceM >= NEAR_START_THRESHOLD_M) return 0;
  const span = NEAR_START_THRESHOLD_M - STRONG_PROXIMITY_M;
  return Math.round(((NEAR_START_THRESHOLD_M - distanceM) / span) * 100);
}

function parseHm(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * Returns 0-1 based on how close `nowMin` is to the window.
 * - Inside [start, end] → 1.0 (full match)
 * - In tolerance buffer at either edge → linear falloff to 0
 * - Outside tolerance entirely → 0
 */
function windowFit(nowMin: number, w: TimeWindow): number {
  const start = parseHm(w.start);
  const end = parseHm(w.end);
  const tol = Math.max(0, w.toleranceMin);
  if (nowMin >= start && nowMin <= end) return 1;
  const leftEdge = start - tol;
  const rightEdge = end + tol;
  if (nowMin < leftEdge || nowMin > rightEdge) return 0;
  if (tol === 0) return 0;
  if (nowMin < start) return (nowMin - leftEdge) / tol;
  return (rightEdge - nowMin) / tol;
}

const SCHEDULE_MAX_SCORE = 70;

/**
 * Rank a list of routes by likelihood that the rider wants this one right now,
 * given their GPS position and the current time of day.
 *
 * Only routes with score > 0 are returned, sorted desc.
 */
export function suggestRoutes(
  routes: Route[],
  position: LatLng | null,
  now: Date = new Date(),
  schedule: ScheduleConfig = DEFAULT_SCHEDULE
): RouteSuggestion[] {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const workFit = windowFit(nowMin, schedule.workOut);
  const homeFit = windowFit(nowMin, schedule.homeOut);

  const ranked = routes
    .map<RouteSuggestion | null>((route) => {
      if (route.path.length === 0) return null;

      const start = route.path[0];
      const reasons: string[] = [];
      let score = 0;
      let startDistance = Number.POSITIVE_INFINITY;

      if (position) {
        startDistance = haversineMeters(position, start);
        const ps = proximityScore(startDistance);
        if (ps > 0) {
          score += ps;
          reasons.push(
            startDistance < 100
              ? "อยู่ที่จุดเริ่มต้น"
              : `ห่างจุดเริ่ม ${Math.round(startDistance)} ม.`
          );
        }
      }

      const workish = isWorkRoute(route.name, route.from, route.to);
      const homeish = isHomeRoute(route.name, route.from, route.to);

      if (workFit > 0 && workish) {
        score += Math.round(workFit * SCHEDULE_MAX_SCORE);
        reasons.push(
          workFit === 1
            ? `เวลาไปทำงาน (${schedule.workOut.start}-${schedule.workOut.end})`
            : "ใกล้เวลาไปทำงาน"
        );
      }
      if (homeFit > 0 && homeish) {
        score += Math.round(homeFit * SCHEDULE_MAX_SCORE);
        reasons.push(
          homeFit === 1
            ? `เวลากลับบ้าน (${schedule.homeOut.start})`
            : "ใกล้เวลากลับบ้าน"
        );
      }

      if (score === 0) return null;

      return {
        route,
        score,
        startDistanceM: startDistance,
        reason: reasons.join(" · "),
      };
    })
    .filter((s): s is RouteSuggestion => s !== null);

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}
