import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LatLng, Route } from "@/types";

interface CustomRouteState {
  drawingMode: boolean;
  draftPath: LatLng[];
  draftName: string;
  draftSpeedKmh: number;
  savedRoutes: Route[];

  setDrawingMode: (v: boolean) => void;
  addDraftPoint: (p: LatLng) => void;
  undoDraftPoint: () => void;
  clearDraft: () => void;
  setDraftName: (n: string) => void;
  setDraftSpeedKmh: (n: number) => void;
  /**
   * Builds a Route from draft and persists it. Returns the new route.
   * Pass `finalPath` to use a different geometry (e.g. road-following from
   * OSRM) instead of the raw waypoints.
   */
  saveDraft: (finalPath?: LatLng[]) => Route | null;
  deleteSavedRoute: (id: string) => void;
}

export const useCustomRouteStore = create<CustomRouteState>()(
  persist(
    (set, get) => ({
      drawingMode: false,
      draftPath: [],
      draftName: "",
      draftSpeedKmh: 40,
      savedRoutes: [],

      setDrawingMode: (v) =>
        set({
          drawingMode: v,
          // reset draft when leaving draw mode without saving
          ...(v ? {} : { draftPath: [], draftName: "" }),
        }),
      addDraftPoint: (p) =>
        set((s) => ({ draftPath: [...s.draftPath, p] })),
      undoDraftPoint: () =>
        set((s) => ({ draftPath: s.draftPath.slice(0, -1) })),
      clearDraft: () => set({ draftPath: [], draftName: "" }),
      setDraftName: (n) => set({ draftName: n }),
      setDraftSpeedKmh: (n) =>
        set({ draftSpeedKmh: Math.max(5, Math.min(200, Math.round(n))) }),

      saveDraft: (finalPath) => {
        const s = get();
        const path = finalPath ?? s.draftPath;
        if (path.length < 2) return null;
        const trimmed = s.draftName.trim();
        const name = trimmed || `เส้นทางของฉัน ${s.savedRoutes.length + 1}`;
        const route: Route = {
          id: `custom-${Date.now()}`,
          name,
          province: "กำหนดเอง",
          from: name,
          to: "ปลายทาง",
          avgSpeedKmh: s.draftSpeedKmh,
          path: path.map((p, i) => ({
            lat: p.lat,
            lng: p.lng,
            name:
              i === 0
                ? "เริ่มต้น"
                : i === path.length - 1
                  ? "ปลายทาง"
                  : undefined,
          })),
        };
        set({
          savedRoutes: [...s.savedRoutes, route],
          draftPath: [],
          draftName: "",
          drawingMode: false,
        });
        return route;
      },

      deleteSavedRoute: (id) =>
        set((s) => ({
          savedRoutes: s.savedRoutes.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "rainroute-custom-routes",
      partialize: (s) => ({
        savedRoutes: s.savedRoutes,
        draftSpeedKmh: s.draftSpeedKmh,
      }),
      skipHydration: true,
    }
  )
);
