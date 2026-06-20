"use client";

import { Lightbulb, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Route } from "@/types";
import type { RouteSuggestion } from "@/utils/routeSuggester";

interface SmartSuggestionProps {
  suggestion: RouteSuggestion | null;
  selectedRouteId: string | null;
  onAccept: (route: Route) => void;
}

/**
 * Surfaces the highest-scoring route from `suggestRoutes()` as a one-tap
 * suggestion. Hidden when no suggestion exists or when the user is already
 * on the suggested route.
 */
export function SmartSuggestion({
  suggestion,
  selectedRouteId,
  onAccept,
}: SmartSuggestionProps) {
  if (!suggestion) return null;
  if (suggestion.route.id === selectedRouteId) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-primary/40 bg-primary/10 p-3.5 dark:bg-primary/15">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
        <Lightbulb className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-wide text-primary">
          แนะนำตอนนี้
        </div>
        <div className="truncate text-base font-bold">
          {suggestion.route.name}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {suggestion.reason}
        </div>
      </div>
      <Button
        onClick={() => onAccept(suggestion.route)}
        size="lg"
        className="shrink-0 gap-1.5"
      >
        <Navigation2 className="h-4 w-4" /> ใช้เลย
      </Button>
    </div>
  );
}
