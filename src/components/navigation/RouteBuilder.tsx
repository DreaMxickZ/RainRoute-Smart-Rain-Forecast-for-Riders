"use client";

import { useState } from "react";
import {
  AlertTriangle,
  LocateFixed,
  Loader2,
  Pencil,
  Route as RouteIcon,
  Save,
  Trash2,
  Undo2,
  Waypoints,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomRouteStore } from "@/store/customRouteStore";
import { geoService } from "@/services/geolocation/geoService";
import { fetchDrivingRoute } from "@/services/routing/routingService";
import { formatKm } from "@/utils/geo";
import type { LatLng, Route } from "@/types";

interface RouteBuilderProps {
  onSaved: (route: Route) => void;
  /** Road-following path from OSRM (if available). */
  routedPath?: LatLng[];
  routedDistanceM?: number;
  routingLoading: boolean;
  routingError: string | null;
}

export function RouteBuilder({
  onSaved,
  routedPath,
  routedDistanceM,
  routingLoading,
  routingError,
}: RouteBuilderProps) {
  const drawingMode = useCustomRouteStore((s) => s.drawingMode);
  const setDrawingMode = useCustomRouteStore((s) => s.setDrawingMode);
  const draftPath = useCustomRouteStore((s) => s.draftPath);
  const addDraftPoint = useCustomRouteStore((s) => s.addDraftPoint);
  const undoDraftPoint = useCustomRouteStore((s) => s.undoDraftPoint);
  const clearDraft = useCustomRouteStore((s) => s.clearDraft);
  const draftName = useCustomRouteStore((s) => s.draftName);
  const setDraftName = useCustomRouteStore((s) => s.setDraftName);
  const draftSpeedKmh = useCustomRouteStore((s) => s.draftSpeedKmh);
  const setDraftSpeedKmh = useCustomRouteStore((s) => s.setDraftSpeedKmh);
  const saveDraft = useCustomRouteStore((s) => s.saveDraft);
  const savedRoutes = useCustomRouteStore((s) => s.savedRoutes);
  const deleteSavedRoute = useCustomRouteStore((s) => s.deleteSavedRoute);
  const updateSavedRoutePath = useCustomRouteStore(
    (s) => s.updateSavedRoutePath
  );

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reroutingId, setReroutingId] = useState<string | null>(null);

  async function handleSave() {
    if (draftPath.length < 2 || saving) return;
    setSaving(true);
    try {
      // Prefer the already-fetched road-following polyline. If the user hit
      // save before debounce/OSRM finished, fetch synchronously now so we
      // never persist a straight line by accident.
      let finalPath: LatLng[] | undefined = routedPath;
      if (!finalPath) {
        try {
          const result = await fetchDrivingRoute(draftPath);
          finalPath = result.path;
        } catch {
          // OSRM failed — fall back to the waypoints as a straight line.
          finalPath = undefined;
        }
      }
      const route = saveDraft(finalPath);
      if (route) onSaved(route);
    } finally {
      setSaving(false);
    }
  }

  async function handleRerouteSaved(route: Route) {
    if (route.path.length < 2 || reroutingId === route.id) return;
    setReroutingId(route.id);
    try {
      const first = route.path[0];
      const last = route.path[route.path.length - 1];
      const result = await fetchDrivingRoute([first, last]);
      updateSavedRoutePath(route.id, result.path);
    } catch {
      // ignore — UI shows no path change
    } finally {
      setReroutingId(null);
    }
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      const pos = await geoService.getCurrentPosition();
      addDraftPoint({ lat: pos.lat, lng: pos.lng });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "ระบุตำแหน่งไม่ได้";
      setLocationError(msg);
    } finally {
      setLocating(false);
    }
  }

  if (!drawingMode) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          size="xl"
          className="w-full gap-2 border-2"
          onClick={() => setDrawingMode(true)}
        >
          <Pencil className="h-5 w-5" />
          วาดเส้นทางเอง
        </Button>
        {savedRoutes.length > 0 && (
          <Card className="border-2">
            <CardContent className="space-y-2 p-3">
              <div className="text-sm font-bold text-muted-foreground">
                เส้นทางที่บันทึกไว้
              </div>
              <ul className="space-y-2">
                {savedRoutes.map((r) => {
                  const isStraightLine = r.path.length <= 3;
                  const isRerouting = reroutingId === r.id;
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 rounded-xl border-2 bg-background/60 p-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-base font-semibold">
                          {r.name}
                        </div>
                        {isStraightLine && (
                          <div className="text-xs text-amber-600 dark:text-amber-400">
                            ⚠ เส้นตรง — กดปุ่มซ้ายเพื่อปรับตามถนน
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 border-2"
                        aria-label={`ปรับเส้นทางตามถนน ${r.name}`}
                        title="ปรับเส้นทางตามถนน"
                        disabled={isRerouting}
                        onClick={() => handleRerouteSaved(r)}
                      >
                        {isRerouting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Waypoints className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 border-2 text-destructive"
                        aria-label={`ลบ ${r.name}`}
                        onClick={() => deleteSavedRoute(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="border-purple-500/40 bg-purple-500/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Pencil className="h-4 w-4 text-purple-500" />
              โหมดวาดเส้นทาง
              <Badge variant="secondary">{draftPath.length} จุด</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              แตะบนแผนที่เพื่อปักจุด — อย่างน้อย 2 จุด (เริ่มต้น & ปลายทาง)
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="ยกเลิก"
            onClick={() => setDrawingMode(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {draftPath.length >= 2 && (
          <div className="flex items-center gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs">
            {routingLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                <span>กำลังหาเส้นทางบนถนนจริง...</span>
              </>
            ) : routingError ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-muted-foreground">
                  ใช้เส้นตรงระหว่างจุด (OSRM: {routingError})
                </span>
              </>
            ) : routedPath ? (
              <>
                <RouteIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span>
                  เส้นทางตามถนนจริง · {formatKm(routedDistanceM ?? 0)} ·{" "}
                  {routedPath.length} จุดบนถนน
                </span>
              </>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">ชื่อเส้นทาง</label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="เช่น บ้าน → ที่ทำงาน"
              className="h-9 w-full rounded-md border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">ความเร็วเฉลี่ย (กม./ชม.)</label>
            <input
              type="number"
              min={5}
              max={200}
              value={draftSpeedKmh}
              onChange={(e) => setDraftSpeedKmh(Number(e.target.value) || 0)}
              className="h-9 w-full rounded-md border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="w-full gap-2 font-semibold"
        >
          <LocateFixed
            className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`}
          />
          {locating ? "กำลังหาตำแหน่ง..." : "ใช้ตำแหน่ง GPS เป็นจุดถัดไป"}
        </Button>
        {locationError && (
          <p className="text-xs text-destructive">{locationError}</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={undoDraftPoint}
            disabled={draftPath.length === 0}
            className="gap-2 border-2 font-semibold"
          >
            <Undo2 className="h-5 w-5" /> ย้อน
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={clearDraft}
            disabled={draftPath.length === 0}
            className="gap-2 border-2 font-semibold"
          >
            <Trash2 className="h-5 w-5" /> ล้าง
          </Button>
          <Button
            size="xl"
            onClick={handleSave}
            disabled={draftPath.length < 2 || saving || routingLoading}
            className="col-span-2 gap-2"
          >
            {saving || routingLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> กำลังหาเส้นทางบนถนน...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" /> บันทึก & ใช้เส้นทางนี้
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
