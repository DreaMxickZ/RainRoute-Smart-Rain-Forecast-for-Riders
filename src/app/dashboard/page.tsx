"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoutePicker } from "@/components/navigation/RoutePicker";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { RainTimeline } from "@/components/dashboard/RainTimeline";
import { RouteMap } from "@/components/map/RouteMap";
import { routeService } from "@/services/routes/routeService";
import { useNavigationStore } from "@/store/navigationStore";
import { useCustomRouteStore } from "@/store/customRouteStore";
import { useRainAnalysis } from "@/hooks/useRainAnalysis";

export default function DashboardPage() {
  const presets = useMemo(() => routeService.list(), []);
  const savedCustom = useCustomRouteStore((s) => s.savedRoutes);
  const routes = useMemo(
    () => [...savedCustom, ...presets],
    [savedCustom, presets]
  );
  const selectedRouteId = useNavigationStore((s) => s.selectedRouteId);
  const setSelectedRouteId = useNavigationStore((s) => s.setSelectedRouteId);
  const currentPosition = useNavigationStore((s) => s.currentPosition);

  useEffect(() => {
    if (!selectedRouteId && routes.length > 0) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId, setSelectedRouteId]);

  const route = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  const { analysis, loading, error } = useRainAnalysis(route);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            สรุประยะทาง เวลาเดินทาง และจุดที่คาดว่าจะเจอฝน
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/navigate">
            ไปหน้าเริ่มนำทาง <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="max-w-md">
        <RoutePicker
          routes={presets}
          customRoutes={savedCustom}
          value={selectedRouteId}
          onChange={setSelectedRouteId}
        />
      </div>

      <DashboardGrid analysis={loading ? null : analysis} />

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>เส้นทางและจุดฝน</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] p-0 sm:h-[420px]">
            <RouteMap
              route={route}
              position={currentPosition}
              analysis={analysis}
              className="rounded-none border-0"
            />
          </CardContent>
        </Card>

        <RainTimeline analysis={analysis} />
      </div>

      {route && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              รายละเอียดเส้นทาง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">ชื่อ:</span> {route.name}
            </div>
            <div>
              <span className="font-medium text-foreground">จังหวัด:</span> {route.province}
            </div>
            <div>
              <span className="font-medium text-foreground">ความเร็วเฉลี่ย:</span>{" "}
              {route.avgSpeedKmh} กม./ชม.
            </div>
            <div>
              <span className="font-medium text-foreground">จำนวนจุด:</span>{" "}
              {route.path.length}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
