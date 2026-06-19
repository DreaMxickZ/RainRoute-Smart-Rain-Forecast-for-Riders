import type { LatLng } from "./route";

export type RainLevel = "none" | "light" | "heavy";

export interface WeatherHourly {
  /** ISO timestamp */
  time: string;
  /** Probability of precipitation 0-100 */
  precipitationProbability: number;
  /** Rain intensity mm/h */
  rain: number;
}

export interface WeatherSample {
  point: LatLng;
  hourly: WeatherHourly[];
}

export interface RainEvent {
  /** Index in the route path */
  pointIndex: number;
  /** Coordinates */
  location: LatLng;
  /** Distance from route start in meters — used for GPS-based ETA. */
  distanceFromStartM: number;
  /** ETA to reach this point from start (time-based, fallback) */
  etaMs: number;
  /** ISO time we expect to be at this point */
  expectedAt: string;
  /** Minutes from "now" until we hit this point */
  minutesUntil: number;
  /** Probability of precipitation 0-100 at the expected hour */
  probability: number;
  /** mm/h rain intensity at the expected hour */
  intensity: number;
  /** Bucketed level */
  level: RainLevel;
}

export interface RainAnalysis {
  /** total distance along the route in meters */
  totalDistanceM: number;
  /** total travel duration ms */
  totalDurationMs: number;
  /** ETA timestamp ISO */
  etaIso: string;
  /** sampled points along the route with rain assessment */
  events: RainEvent[];
  /** highest level encountered */
  worstLevel: RainLevel;
  /** any point flagged as rainy */
  willRain: boolean;
}
