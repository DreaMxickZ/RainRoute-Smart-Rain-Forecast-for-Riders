import type { LatLng, WeatherHourly, WeatherSample } from "@/types";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    precipitation_probability?: number[];
    rain?: number[];
    precipitation?: number[];
  };
}

interface FetchOptions {
  /** Forecast hours into the future, default 12. */
  forecastHours?: number;
  signal?: AbortSignal;
}

function buildUrl(point: LatLng, hours: number): string {
  const params = new URLSearchParams({
    latitude: point.lat.toFixed(4),
    longitude: point.lng.toFixed(4),
    hourly: "precipitation_probability,rain,precipitation",
    timezone: "auto",
    forecast_days: Math.max(1, Math.ceil(hours / 24)).toString(),
  });
  return `${OPEN_METEO_URL}?${params.toString()}`;
}

async function fetchOne(
  point: LatLng,
  opts: FetchOptions
): Promise<WeatherSample> {
  const url = buildUrl(point, opts.forecastHours ?? 12);
  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) {
    throw new Error(`Open-Meteo error ${res.status} for ${point.lat},${point.lng}`);
  }
  const json = (await res.json()) as OpenMeteoResponse;
  const times = json.hourly?.time ?? [];
  const probs = json.hourly?.precipitation_probability ?? [];
  const rain = json.hourly?.rain ?? json.hourly?.precipitation ?? [];

  const hourly: WeatherHourly[] = times.map((t, i) => ({
    time: t,
    precipitationProbability: clampNumber(probs[i] ?? 0, 0, 100),
    rain: Math.max(0, rain[i] ?? 0),
  }));

  return { point, hourly };
}

function clampNumber(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Fetch hourly precipitation forecast for many points in parallel.
 * Open-Meteo is free and rate-limited; we batch to keep this reasonable.
 */
export async function fetchWeatherForPoints(
  points: LatLng[],
  opts: FetchOptions = {}
): Promise<WeatherSample[]> {
  if (points.length === 0) return [];
  const batchSize = 8;
  const results: WeatherSample[] = [];
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map((p) => fetchOne(p, opts))
    );
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j];
      if (r.status === "fulfilled") {
        results.push(r.value);
      } else {
        // graceful fallback: empty sample so analysis can continue
        results.push({ point: batch[j], hourly: [] });
      }
    }
  }
  return results;
}

export const weatherService = {
  fetchWeatherForPoints,
};
