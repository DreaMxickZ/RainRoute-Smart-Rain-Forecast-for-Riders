"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useCustomRouteStore } from "@/store/customRouteStore";

/**
 * Forces persisted Zustand stores to rehydrate from localStorage after the
 * client has mounted. Combined with `skipHydration: true` on each store, this
 * keeps SSR HTML and the first client paint identical (both use defaults),
 * then rehydrates on the next tick.
 */
export function RehydrateStores() {
  useEffect(() => {
    useSettingsStore.persist.rehydrate();
    useCustomRouteStore.persist.rehydrate();
  }, []);
  return null;
}
