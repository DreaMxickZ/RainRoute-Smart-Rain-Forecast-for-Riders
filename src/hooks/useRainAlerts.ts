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

/**
 * Watches the rain analysis while navigation is active and triggers
 * appropriate voice alerts.
 *
 * - 15/10/5 minute heads-up before the next rain event.
 * - "Entering rain" when current ETA crosses a rain segment.
 * - "Leaving rain" when the rider passes the last rainy segment.
 */
export function useRainAlerts(
  isNavigating: boolean,
  analysis: RainAnalysis | null,
  startedAt: number | null
) {
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
    if (!isNavigating || !analysis || startedAt == null) return;

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextEvent = analysis.events.find(
        (e) => e.etaMs > elapsedMs
      );
      const passedAllEvents =
        analysis.events.length > 0 &&
        analysis.events.every((e) => e.etaMs < elapsedMs - 60_000);

      // Inside-rain logic: any event whose window contains "now".
      const insideNow = analysis.events.some(
        (e) => Math.abs(e.etaMs - elapsedMs) < 90_000
      );
      if (insideNow && !insideRainRef.current) {
        insideRainRef.current = true;
        speechService.speakKey("entering_rain");
      } else if (!insideNow && insideRainRef.current) {
        insideRainRef.current = false;
        speechService.speakKey("leaving_rain");
      }

      // Heads-up announcements.
      if (nextEvent) {
        const minutesAway = (nextEvent.etaMs - elapsedMs) / 60_000;
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

      if (passedAllEvents && insideRainRef.current) {
        insideRainRef.current = false;
        speechService.speakKey("leaving_rain");
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isNavigating, analysis, startedAt]);
}
