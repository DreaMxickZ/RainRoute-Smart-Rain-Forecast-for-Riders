import type {
  LatLng,
  RainAnalysis,
  RainEvent,
  RainLevel,
  Route,
  WeatherSample,
} from "@/types";
import {
  cumulativeDistances,
  haversineMeters,
  sampleRoutePoints,
  totalDistanceM,
  totalDurationMs,
} from "@/utils/geo";
import { weatherService } from "./weatherService";

export interface AnalyzeRainParams {
  route: Route;
  /** Default "now". */
  currentTime?: Date;
  /**
   * Optional override for ETA in ms. If omitted, computed from route distance
   * and the route's average speed.
   */
  etaMs?: number;
  /** Distance between sample points along the route, default 1500 m. */
  sampleEveryMeters?: number;
  signal?: AbortSignal;
  /** Allow injecting weather (used for tests / dashboard re-renders). */
  weather?: WeatherSample[];
  /**
   * Probability threshold (0-100) to consider the segment "rainy" even if
   * intensity is low. Default 60.
   */
  probabilityThreshold?: number;
}

const LIGHT_RAIN_MM_PER_H = 0.2;
const HEAVY_RAIN_MM_PER_H = 2.5;

function classify(probability: number, intensity: number, probThreshold: number): RainLevel {
  if (intensity >= HEAVY_RAIN_MM_PER_H) return "heavy";
  if (intensity >= LIGHT_RAIN_MM_PER_H) return "light";
  if (probability >= probThreshold && intensity > 0.05) return "light";
  return "none";
}

function worstOf(levels: RainLevel[]): RainLevel {
  if (levels.includes("heavy")) return "heavy";
  if (levels.includes("light")) return "light";
  return "none";
}

/** Find the index in `samples` closest to `point`. */
function nearestSampleIndex(samples: WeatherSample[], point: LatLng): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const d = haversineMeters(samples[i].point, point);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** Pick the hourly forecast closest in time to `targetIso`. */
function pickHourly(
  sample: WeatherSample,
  targetIso: string
): { probability: number; rain: number } {
  if (sample.hourly.length === 0) return { probability: 0, rain: 0 };
  const target = new Date(targetIso).getTime();
  let best = sample.hourly[0];
  let bestDelta = Math.abs(new Date(best.time).getTime() - target);
  for (const h of sample.hourly) {
    const d = Math.abs(new Date(h.time).getTime() - target);
    if (d < bestDelta) {
      best = h;
      bestDelta = d;
    }
  }
  return { probability: best.precipitationProbability, rain: best.rain };
}

/**
 * Sample the route, fetch weather, and build a list of points where the rider
 * is expected to encounter rain.
 */
export async function analyzeRainAlongRoute(
  params: AnalyzeRainParams
): Promise<RainAnalysis> {
  const now = params.currentTime ?? new Date();
  const sampleEvery = params.sampleEveryMeters ?? 1500;
  const probThreshold = params.probabilityThreshold ?? 60;

  const samples = sampleRoutePoints(params.route, sampleEvery);
  const cum = cumulativeDistances(samples);
  const distance = totalDistanceM(params.route);
  const duration = params.etaMs ?? totalDurationMs(params.route);
  const etaIso = new Date(now.getTime() + duration).toISOString();

  const weather =
    params.weather ??
    (await weatherService.fetchWeatherForPoints(samples, {
      forecastHours: Math.max(2, Math.ceil(duration / 3600000) + 1),
      signal: params.signal,
    }));

  const events: RainEvent[] = [];
  for (let i = 0; i < samples.length; i++) {
    const point = samples[i];
    const fractionOfRoute = distance === 0 ? 0 : cum[i] / distance;
    const etaToPointMs = duration * fractionOfRoute;
    const expectedAt = new Date(now.getTime() + etaToPointMs).toISOString();

    const sampleIdx = nearestSampleIndex(weather, point);
    const { probability, rain } = pickHourly(weather[sampleIdx], expectedAt);
    const level = classify(probability, rain, probThreshold);
    if (level === "none") continue;

    events.push({
      pointIndex: i,
      location: point,
      etaMs: etaToPointMs,
      expectedAt,
      minutesUntil: Math.round(etaToPointMs / 60000),
      probability,
      intensity: rain,
      level,
    });
  }

  return {
    totalDistanceM: distance,
    totalDurationMs: duration,
    etaIso,
    events,
    worstLevel: worstOf(events.map((e) => e.level)),
    willRain: events.length > 0,
  };
}

export const rainAnalyzer = { analyzeRainAlongRoute };
