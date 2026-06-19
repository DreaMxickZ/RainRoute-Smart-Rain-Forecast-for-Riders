import { create } from "zustand";
import type { LatLng, RainAnalysis, Route } from "@/types";

interface NavigationState {
  selectedRouteId: string | null;
  isNavigating: boolean;
  currentPosition: (LatLng & { accuracy: number; heading: number | null }) | null;
  analysis: RainAnalysis | null;
  analysisLoading: boolean;
  analysisError: string | null;
  startedAt: number | null;

  setSelectedRouteId: (id: string | null) => void;
  startNavigation: (route: Route) => void;
  stopNavigation: () => void;
  setPosition: (pos: NavigationState["currentPosition"]) => void;
  setAnalysis: (a: RainAnalysis | null) => void;
  setAnalysisLoading: (v: boolean) => void;
  setAnalysisError: (msg: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  selectedRouteId: null,
  isNavigating: false,
  currentPosition: null,
  analysis: null,
  analysisLoading: false,
  analysisError: null,
  startedAt: null,

  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  startNavigation: (route) =>
    set({
      selectedRouteId: route.id,
      isNavigating: true,
      startedAt: Date.now(),
    }),
  stopNavigation: () =>
    set({
      isNavigating: false,
      startedAt: null,
    }),
  setPosition: (pos) => set({ currentPosition: pos }),
  setAnalysis: (a) => set({ analysis: a }),
  setAnalysisLoading: (v) => set({ analysisLoading: v }),
  setAnalysisError: (msg) => set({ analysisError: msg }),
}));
