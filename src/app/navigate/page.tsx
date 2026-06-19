"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutePicker } from "@/components/navigation/RoutePicker";
import { RouteBuilder } from "@/components/navigation/RouteBuilder";
import { RainAlertCard } from "@/components/navigation/RainAlertCard";
import { SettingsPanel } from "@/components/navigation/SettingsPanel";
import { RouteMap } from "@/components/map/RouteMap";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { routeService } from "@/services/routes/routeService";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDraftRouting } from "@/hooks/useDraftRouting";
import { useRainAnalysis } from "@/hooks/useRainAnalysis";
import { useRainAlerts } from "@/hooks/useRainAlerts";
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

  const [hasGreeted, setHasGreeted] = useState(false);

  // Default-select the first route on mount (custom first, then preset).
  useEffect(() => {
    if (!selectedRouteId && allRoutes.length > 0) {
      setSelectedRouteId(allRoutes[0].id);
    }
  }, [allRoutes, selectedRouteId, setSelectedRouteId]);

  const route = useMemo(
    () => allRoutes.find((r) => r.id === selectedRouteId) ?? null,
    [allRoutes, selectedRouteId]
  );

  // OSRM road-following path between the waypoints the user has placed.
  const {
    result: routing,
    loading: routingLoading,
    error: routingError,
  } = useDraftRouting(drawingMode ? draftPath : []);

  const draftPolyline = routing?.path ?? draftPath;

  // While drawing, show the draft as the "route" preview on the map so
  // FitToRoute zooms in on where the user is working.
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

  const { position, error: geoError, supported } = useGeolocation(
    isNavigating && trackingEnabled
  );

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

  // Don't analyze the draft — only the saved/selected route.
  const { analysis, loading, error, refresh } = useRainAnalysis(
    drawingMode ? null : route
  );

  useEffect(() => {
    setAnalysis(analysis);
  }, [analysis, setAnalysis]);

  useRainAlerts(isNavigating, analysis, startedAt);

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
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="h-[320px] sm:h-[420px]">
          <RouteMap
            route={displayedRoute}
            position={position}
            analysis={drawingMode ? null : analysis}
            draftWaypoints={drawingMode ? draftPath : undefined}
            onMapClick={drawingMode ? handleMapClick : undefined}
          />
        </section>

        <aside className="space-y-4">
          <RouteBuilder
            onSaved={handleSavedNewRoute}
            routedPath={routing?.path}
            routedDistanceM={routing?.distanceM}
            routingLoading={routingLoading}
            routingError={routingError}
          />

          <RoutePicker
            routes={presets}
            customRoutes={savedCustom}
            value={selectedRouteId}
            onChange={setSelectedRouteId}
          />

          <div className="flex gap-2">
            {isNavigating ? (
              <Button
                onClick={handleStop}
                size="lg"
                variant="destructive"
                className="flex-1 gap-2"
              >
                <Pause className="h-4 w-4" /> หยุดนำทาง
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                size="lg"
                className="flex-1 gap-2"
                disabled={!route || drawingMode}
              >
                <Play className="h-4 w-4" /> เริ่มนำทาง
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={refresh}
              aria-label="วิเคราะห์ใหม่"
              disabled={loading || drawingMode}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {!drawingMode && (
            <RainAlertCard analysis={analysis} loading={loading} error={error} />
          )}

          <SettingsPanel />

          {supported === false && (
            <p className="rounded-md border border-yellow-500/40 bg-yellow-500/5 p-3 text-xs text-yellow-700 dark:text-yellow-300">
              เบราว์เซอร์นี้ไม่รองรับ GPS — ระบบจะวิเคราะห์ฝนได้ตามปกติ
              แต่ไม่สามารถแสดงตำแหน่งสดของคุณ
            </p>
          )}
          {geoError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              GPS: {geoError}
            </p>
          )}

          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" /> ดูสรุป Dashboard
            </Link>
          </Button>
        </aside>
      </div>

      <section>
        <DashboardGrid analysis={drawingMode ? null : analysis} />
      </section>
    </div>
  );
}
