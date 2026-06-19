"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";
import { AppHeader } from "./AppHeader";
import { RehydrateStores } from "./RehydrateStores";

export function AppShell({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <RehydrateStores />
      <AppHeader />
      <main className="container flex-1 py-4 sm:py-6">{children}</main>
      <footer className="border-t py-4">
        <div className="container text-center text-xs text-muted-foreground">
          ☔ RainRoute · ขับขี่ปลอดภัย · Powered by Open-Meteo
        </div>
      </footer>
    </div>
  );
}
