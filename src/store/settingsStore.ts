import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  voiceEnabled: boolean;
  trackingEnabled: boolean;
  probabilityThreshold: number;
  setVoiceEnabled: (v: boolean) => void;
  setTrackingEnabled: (v: boolean) => void;
  setProbabilityThreshold: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceEnabled: true,
      trackingEnabled: true,
      probabilityThreshold: 60,
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setTrackingEnabled: (v) => set({ trackingEnabled: v }),
      setProbabilityThreshold: (v) => set({ probabilityThreshold: v }),
    }),
    {
      name: "rainroute-settings",
      // Skip auto-hydration so SSR + first client paint use the same defaults,
      // then RehydrateStores triggers rehydrate() after mount.
      skipHydration: true,
    }
  )
);
