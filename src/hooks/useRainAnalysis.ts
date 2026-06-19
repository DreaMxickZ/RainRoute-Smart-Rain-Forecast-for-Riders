"use client";

import { useCallback, useEffect, useState } from "react";
import type { RainAnalysis, Route } from "@/types";
import { analyzeRainAlongRoute } from "@/services/weather/rainAnalyzer";
import { useSettingsStore } from "@/store/settingsStore";

interface UseRainAnalysisResult {
  analysis: RainAnalysis | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRainAnalysis(route: Route | null): UseRainAnalysisResult {
  const probabilityThreshold = useSettingsStore((s) => s.probabilityThreshold);
  const [analysis, setAnalysis] = useState<RainAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!route) {
      setAnalysis(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    analyzeRainAlongRoute({
      route,
      currentTime: new Date(),
      signal: controller.signal,
      probabilityThreshold,
    })
      .then((result) => setAnalysis(result))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : "วิเคราะห์ฝนล้มเหลว";
        setError(msg);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [route, probabilityThreshold, tick]);

  return { analysis, loading, error, refresh };
}
