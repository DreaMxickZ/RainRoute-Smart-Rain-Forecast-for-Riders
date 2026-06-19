"use client";

import { useEffect, useRef } from "react";
import type { RainAnalysis } from "@/types";
import { speechService, type SpeechKey } from "@/services/speech/speechService";
import { useSettingsStore } from "@/store/settingsStore";

const TARGETS: Array<{ minutes: number; key: SpeechKey }> = [
  { minutes: 15, key: "rain_15" },
  { minutes: 10, key: "rain_10" },
  { minutes: 5, key: "rain_5" },
];

interface UseRainAlertsParams {
  isNavigating: boolean;
  analysis: RainAnalysis | null;
  /** Distance the rider has traveled along the route, in meters (from GPS). */
  progressM: number | null;
  /** Time the trip started (for fallback when GPS not available). */
  startedAt: number | null;
  /** Average speed in km/h — used to convert remaining distance into minutes. */
  avgSpeedKmh: number;
}

/**
 * Watches the rain analysis while navigation is active and triggers voice
 * alerts based on the rider's *actual* progress along the route (GPS-derived)
 * rather than time elapsed.
 *
 * - 15/10/5 minute heads-up before the next rain event
 * - "Entering rain" when within ~150m of a rain segment
 * - "Leaving rain" when the rider passes the last rainy segment
 */
export function useRainAlerts({
  isNavigating,
  analysis,
  progressM,
  startedAt,
  avgSpeedKmh,
}: UseRainAlertsParams) {
  const voiceEnabled = useSettingsStore((s) => s.voiceEnabled);
  const announcedRef = useRef<Set<string>>(new Set());
  const insideRainRef = useRef(false);

  useEffect(() => {
    speechService.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  useEffect(() => {
    if (!isNavigating) {
      announcedRef.current.clear();
      insideRainRef.current = false;
      speechService.cancel();
    }
  }, [isNavigating]);

  useEffect(() => {
    if (!isNavigating || !analysis) return;
    const speedMps = (avgSpeedKmh * 1000) / 3600;

    const interval = window.setInterval(() => {
      // Prefer GPS-based progress; fall back to time-based if GPS unavailable.
      let traveledM: number;
      if (progressM != null) {
        traveledM = progressM;
      } else if (startedAt != null) {
        const elapsedSec = (Date.now() - startedAt) / 1000;
        traveledM = elapsedSec * speedMps;
      } else {
        return;
      }

      const upcoming = analysis.events.filter(
        (e) => e.distanceFromStartM > traveledM - 50
      );
      const nextEvent = upcoming[0];

      // Inside-rain logic: within ~150m of any rain sample.
      const insideNow = analysis.events.some(
        (e) => Math.abs(e.distanceFromStartM - traveledM) < 150
      );
      if (insideNow && !insideRainRef.current) {
        insideRainRef.current = true;
        speechService.speakKey("entering_rain");
      } else if (!insideNow && insideRainRef.current) {
        insideRainRef.current = false;
        speechService.speakKey("leaving_rain");
      }

      // Heads-up countdown based on remaining distance / current speed.
      if (nextEvent) {
        const remainingM = nextEvent.distanceFromStartM - traveledM;
        const minutesAway = remainingM / speedMps / 60;
        for (const t of TARGETS) {
          if (minutesAway <= t.minutes && minutesAway > t.minutes - 1) {
            const tag = `${t.key}@${nextEvent.pointIndex}`;
            if (!announcedRef.current.has(tag)) {
              announcedRef.current.add(tag);
              speechService.speakKey(t.key);
            }
          }
        }
      }

      // Passed every rain segment.
      const passedAll =
        analysis.events.length > 0 &&
        analysis.events.every((e) => e.distanceFromStartM < traveledM - 100);
      if (passedAll && insideRainRef.current) {
        insideRainRef.current = false;
        speechService.speakKey("leaving_rain");
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isNavigating, analysis, progressM, startedAt, avgSpeedKmh]);
}
