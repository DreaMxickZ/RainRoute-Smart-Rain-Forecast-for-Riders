"use client";

import { ArrowRight, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Route } from "@/types";

interface RoutePickerProps {
  routes: Route[];
  customRoutes?: Route[];
  value: string | null;
  onChange: (id: string) => void;
}

export function RoutePicker({
  routes,
  customRoutes = [],
  value,
  onChange,
}: RoutePickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-muted-foreground">
        เส้นทาง
      </label>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className="h-14 rounded-xl border-2 text-base font-semibold">
          <SelectValue placeholder="เลือกเส้นทางที่ต้องการเดินทาง" />
        </SelectTrigger>
        <SelectContent>
          {customRoutes.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>เส้นทางของฉัน</SelectLabel>
                {customRoutes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      <Pencil className="h-3 w-3 text-purple-500" />
                      <span className="font-medium">{r.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
            </>
          )}
          <SelectGroup>
            <SelectLabel>เส้นทางสำเร็จรูป</SelectLabel>
            {routes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{r.from}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{r.to}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    · {r.province}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
