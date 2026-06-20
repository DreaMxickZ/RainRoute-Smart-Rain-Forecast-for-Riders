"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useCustomRouteStore } from "@/store/customRouteStore";
import { speechService } from "@/services/speech/speechService";

/**
 * Forces persisted Zustand stores to rehydrate from localStorage after the
 * client has mounted. Combined with `skipHydration: true` on each store, this
 * keeps SSR HTML and the first client paint identical (both use defaults),
 * then rehydrates on the next tick.
 *
 * Also keeps the TTS voice preference in sync with the speechService module
 * so voice alerts use the chosen voice even before the user opens settings.
 */
export function RehydrateStores() {
  useEffect(() => {
    useSettingsStore.persist.rehydrate();
    useCustomRouteStore.persist.rehydrate();

    const apply = () => {
      speechService.setPreferredVoiceURI(
        useSettingsStore.getState().preferredVoiceURI
      );
    };
    apply();
    const unsubscribe = useSettingsStore.subscribe(apply);
    return unsubscribe;
  }, []);
  return null;
}
