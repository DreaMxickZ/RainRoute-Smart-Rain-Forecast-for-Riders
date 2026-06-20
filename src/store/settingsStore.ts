import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * A time-of-day window the rider typically travels in.
 * `start`/`end` are HH:MM 24h strings. `toleranceMin` is the soft buffer added
 * to each edge (used by the route suggester for a linear-falloff bonus).
 */
export interface TimeWindow {
  start: string;
  end: string;
  toleranceMin: number;
}

export interface ScheduleConfig {
  /** When the rider leaves home for work. */
  workOut: TimeWindow;
  /** When the rider leaves work for home. */
  homeOut: TimeWindow;
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  workOut: { start: "07:00", end: "07:30", toleranceMin: 15 },
  homeOut: { start: "17:00", end: "17:00", toleranceMin: 20 },
};

interface SettingsState {
  voiceEnabled: boolean;
  trackingEnabled: boolean;
  probabilityThreshold: number;
  schedule: ScheduleConfig;
  /** voiceURI of the TTS voice the user has chosen. null = auto-pick (prefer female). */
  preferredVoiceURI: string | null;
  setVoiceEnabled: (v: boolean) => void;
  setTrackingEnabled: (v: boolean) => void;
  setProbabilityThreshold: (v: number) => void;
  setSchedule: (s: ScheduleConfig) => void;
  resetSchedule: () => void;
  setPreferredVoiceURI: (uri: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceEnabled: true,
      trackingEnabled: true,
      probabilityThreshold: 60,
      schedule: DEFAULT_SCHEDULE,
      preferredVoiceURI: null,
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setTrackingEnabled: (v) => set({ trackingEnabled: v }),
      setProbabilityThreshold: (v) => set({ probabilityThreshold: v }),
      setSchedule: (s) => set({ schedule: s }),
      resetSchedule: () => set({ schedule: DEFAULT_SCHEDULE }),
      setPreferredVoiceURI: (uri) => set({ preferredVoiceURI: uri }),
    }),
    {
      name: "rainroute-settings",
      // Skip auto-hydration so SSR + first client paint use the same defaults,
      // then RehydrateStores triggers rehydrate() after mount.
      skipHydration: true,
    }
  )
);
