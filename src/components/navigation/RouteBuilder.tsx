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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomRouteStore } from "@/store/customRouteStore";
import { geoService } from "@/services/geolocation/geoService";
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

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function handleSave() {
    // Prefer the road-following polyline; fall back to raw waypoints if OSRM
    // failed or hasn't finished yet.
    const route = saveDraft(routedPath ?? undefined);
    if (route) onSaved(route);
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
          size="lg"
          className="w-full gap-2"
          onClick={() => setDrawingMode(true)}
        >
          <Pencil className="h-4 w-4" />
          วาดเส้นทางบนแผนที่
        </Button>
        {savedRoutes.length > 0 && (
          <Card>
            <CardContent className="space-y-2 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                เส้นทางที่บันทึกไว้
              </div>
              <ul className="space-y-1.5">
                {savedRoutes.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-md border bg-background/60 px-2.5 py-1.5 text-sm"
                  >
                    <span className="truncate">{r.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      aria-label={`ลบ ${r.name}`}
                      onClick={() => deleteSavedRoute(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
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
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="w-full gap-1.5"
        >
          <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "กำลังหาตำแหน่ง..." : "ใช้ตำแหน่ง GPS เป็นจุดถัดไป"}
        </Button>
        {locationError && (
          <p className="text-xs text-destructive">{locationError}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undoDraftPoint}
            disabled={draftPath.length === 0}
            className="gap-1.5"
          >
            <Undo2 className="h-3.5 w-3.5" /> ย้อน
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearDraft}
            disabled={draftPath.length === 0}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" /> ล้าง
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={draftPath.length < 2}
            className="ml-auto gap-1.5"
          >
            <Save className="h-3.5 w-3.5" /> บันทึก & ใช้เส้นทางนี้
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
