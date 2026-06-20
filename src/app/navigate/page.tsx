"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutePicker } from "@/components/navigation/RoutePicker";
import { RouteBuilder } from "@/components/navigation/RouteBuilder";
import { BigStatusCard } from "@/components/navigation/BigStatusCard";
import { SettingsPanel } from "@/components/navigation/SettingsPanel";
import { RouteMap } from "@/components/map/RouteMap";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { routeService } from "@/services/routes/routeService";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDraftRouting } from "@/hooks/useDraftRouting";
import { useRainAnalysis } from "@/hooks/useRainAnalysis";
import { useRainAlerts } from "@/hooks/useRainAlerts";
import { useRouteProgress } from "@/hooks/useRouteProgress";
import { RouteProgress } from "@/components/navigation/RouteProgress";
import { SmartSuggestion } from "@/components/navigation/SmartSuggestion";
import { ScheduleEditor } from "@/components/navigation/ScheduleEditor";
import { VoiceTester } from "@/components/navigation/VoiceTester";
import { suggestRoutes } from "@/utils/routeSuggester";
import { useNavigationStore } from "@/store/navigationStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useCustomRouteStore } from "@/store/customRouteStore";
import { speechService } from "@/services/speech/speechService";
import type { LatLng, Route } from "@/types";

export default function NavigatePage() {
  const presets = useMemo(() => routeService.list(), []);
  const savedCustom = useCustomRouteStore((s) => s.savedRoutes);
  const drawingMode = useCustomRouteStore((s) => s.drawingMode);
  const draftPath = useCustomRouteStore((s) => s.draftPath);
  const addDraftPoint = useCustomRouteStore((s) => s.addDraftPoint);

  const allRoutes = useMemo(
    () => [...savedCustom, ...presets],
    [savedCustom, presets]
  );

  const selectedRouteId = useNavigationStore((s) => s.selectedRouteId);
  const setSelectedRouteId = useNavigationStore((s) => s.setSelectedRouteId);
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const startNavigation = useNavigationStore((s) => s.startNavigation);
  const stopNavigation = useNavigationStore((s) => s.stopNavigation);
  const startedAt = useNavigationStore((s) => s.startedAt);
  const setStorePosition = useNavigationStore((s) => s.setPosition);
  const setAnalysis = useNavigationStore((s) => s.setAnalysis);

  const trackingEnabled = useSettingsStore((s) => s.trackingEnabled);
  const schedule = useSettingsStore((s) => s.schedule);

  const [hasGreeted, setHasGreeted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Track GPS whenever the page is open (not just while navigating) so the
  // suggester can recommend the right route based on where the rider is.
  const { position, error: geoError, supported } = useGeolocation(
    trackingEnabled
  );

  // Rank routes by GPS proximity + time-of-day. Recomputed when position
  // updates or every minute (clock tick).
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setClockTick((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const suggestions = useMemo(
    () => suggestRoutes(allRoutes, position, new Date(), schedule),
    // clockTick re-renders every minute so the time-of-day score stays fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRoutes, position, schedule, clockTick]
  );
  const topSuggestion = suggestions[0] ?? null;

  // On first mount (no route selected yet), pick the top suggestion if there
  // is one. Otherwise fall back to the first available route. This only fires
  // when selectedRouteId is null — never overrides a user choice.
  useEffect(() => {
    if (selectedRouteId) return;
    if (topSuggestion) {
      setSelectedRouteId(topSuggestion.route.id);
    } else if (allRoutes.length > 0) {
      setSelectedRouteId(allRoutes[0].id);
    }
  }, [allRoutes, selectedRouteId, topSuggestion, setSelectedRouteId]);

  const route = useMemo(
    () => allRoutes.find((r) => r.id === selectedRouteId) ?? null,
    [allRoutes, selectedRouteId]
  );

  const {
    result: routing,
    loading: routingLoading,
    error: routingError,
  } = useDraftRouting(drawingMode ? draftPath : []);

  const draftPolyline = routing?.path ?? draftPath;

  const draftAsRoute = useMemo<Route | null>(() => {
    if (!drawingMode || draftPolyline.length < 2) return null;
    return {
      id: "__draft__",
      name: "ร่าง",
      province: "กำหนดเอง",
      from: "เริ่มต้น",
      to: "ปลายทาง",
      avgSpeedKmh: 40,
      path: draftPolyline.map((p) => ({ lat: p.lat, lng: p.lng })),
    };
  }, [drawingMode, draftPolyline]);

  const displayedRoute = drawingMode ? draftAsRoute : route;

  useEffect(() => {
    if (position) {
      setStorePosition({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        heading: position.heading,
      });
    }
  }, [position, setStorePosition]);

  const { analysis, loading, error, refresh } = useRainAnalysis(
    drawingMode ? null : route
  );

  useEffect(() => {
    setAnalysis(analysis);
  }, [analysis, setAnalysis]);

  // Project the rider's GPS onto the chosen route so progress and ETA are
  // based on where they actually are, not on how long ago they pressed start.
  const progress = useRouteProgress(route, position);

  // Live analysis: keep only rain events ahead of the rider and recompute
  // "minutes until" from remaining distance, not from departure time.
  const liveAnalysis = useMemo(() => {
    if (!analysis) return null;
    if (!isNavigating || !progress) return analysis;
    const traveledM = progress.distanceAlongRouteM;
    const speedMps = ((route?.avgSpeedKmh ?? 40) * 1000) / 3600;
    const upcoming = analysis.events
      .filter((e) => e.distanceFromStartM > traveledM - 50)
      .map((e) => {
        const remainingM = e.distanceFromStartM - traveledM;
        const minutesUntil = Math.max(
          0,
          Math.round(remainingM / speedMps / 60)
        );
        return { ...e, minutesUntil };
      });
    return {
      ...analysis,
      events: upcoming,
      willRain: upcoming.length > 0,
    };
  }, [analysis, isNavigating, progress, route]);

  useRainAlerts({
    isNavigating,
    analysis,
    progressM: progress?.distanceAlongRouteM ?? null,
    startedAt,
    avgSpeedKmh: route?.avgSpeedKmh ?? 40,
  });

  const handleMapClick = useCallback(
    (p: LatLng) => {
      if (drawingMode) addDraftPoint(p);
    },
    [drawingMode, addDraftPoint]
  );

  function handleSavedNewRoute(saved: Route) {
    setSelectedRouteId(saved.id);
  }

  function handleStart() {
    if (!route) return;
    startNavigation(route);
    speechService.unlock();
    if (!hasGreeted) {
      speechService.speakKey("ready");
      setHasGreeted(true);
    }
    if (analysis && !analysis.willRain) {
      speechService.speakKey("no_rain");
    }
  }

  function handleStop() {
    stopNavigation();
    speechService.cancel();
  }

  return (
    <div className="space-y-4 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-4">
      {/* HERO: big status the rider can read at a glance */}
      {!drawingMode && (
        <BigStatusCard
          analysis={liveAnalysis ?? analysis}
          loading={loading}
          error={error}
        />
      )}

      {!drawingMode && isNavigating && analysis && (
        <RouteProgress
          totalDistanceM={analysis.totalDistanceM}
          projection={progress}
        />
      )}

      {/* MAP — fills the screen, large clickable area */}
      <section
        className={
          isNavigating
            ? "h-[40dvh] min-h-[280px] lg:h-[480px]"
            : "h-[50dvh] min-h-[300px] lg:h-[480px]"
        }
      >
        <RouteMap
          route={displayedRoute}
          position={position}
          analysis={drawingMode ? null : analysis}
          draftWaypoints={drawingMode ? draftPath : undefined}
          onMapClick={drawingMode ? handleMapClick : undefined}
        />
      </section>

      {/* PICKER + BUILDER */}
      <section className="space-y-3">
        <RouteBuilder
          onSaved={handleSavedNewRoute}
          routedPath={routing?.path}
          routedDistanceM={routing?.distanceM}
          routingLoading={routingLoading}
          routingError={routingError}
        />

        {!drawingMode && !isNavigating && (
          <SmartSuggestion
            suggestion={topSuggestion}
            selectedRouteId={selectedRouteId}
            onAccept={(r) => setSelectedRouteId(r.id)}
          />
        )}

        {!drawingMode && (
          <RoutePicker
            routes={presets}
            customRoutes={savedCustom}
            value={selectedRouteId}
            onChange={setSelectedRouteId}
          />
        )}
      </section>

      {/* Settings (collapsible — hidden by default to reduce clutter) */}
      {showSettings && (
        <section className="space-y-2">
          <SettingsPanel />
          <VoiceTester />
          <ScheduleEditor />
          {supported === false && (
            <p className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:text-amber-300">
              เบราว์เซอร์นี้ไม่รองรับ GPS — วิเคราะห์ฝนได้ปกติ แต่จะไม่เห็นจุดของคุณบนแผนที่
            </p>
          )}
          {geoError && (
            <p className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              GPS: {geoError}
            </p>
          )}
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link href="/dashboard" className="gap-2">
              <LayoutDashboard className="h-5 w-5" /> ดูสรุป Dashboard
            </Link>
          </Button>
        </section>
      )}

      {/* DASHBOARD summary */}
      <section>
        <DashboardGrid analysis={drawingMode ? null : analysis} />
      </section>

      {/* STICKY ACTION BAR — thumb reach on mobile, ปุ่มใหญ่อ่านง่าย */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t-2 bg-background/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none lg:backdrop-blur-0">
        <div className="container flex max-w-3xl items-center gap-2 lg:max-w-none lg:px-0">
          {isNavigating ? (
            <Button
              onClick={handleStop}
              size="2xl"
              variant="destructive"
              className="flex-1 gap-2"
            >
              <Pause className="h-6 w-6" /> หยุดนำทาง
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              size="2xl"
              className="flex-1 gap-2"
              disabled={!route || drawingMode}
            >
              <Play className="h-6 w-6" /> เริ่มนำทาง
            </Button>
          )}
          <Button
            variant="outline"
            size="icon-lg"
            onClick={refresh}
            aria-label="วิเคราะห์ใหม่"
            disabled={loading || drawingMode}
            className="border-2"
          >
            <RefreshCw className="h-6 w-6" />
          </Button>
          <Button
            variant={showSettings ? "default" : "outline"}
            size="icon-lg"
            onClick={() => setShowSettings((s) => !s)}
            aria-label="ตั้งค่า"
            className="border-2"
          >
            <SettingsIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
