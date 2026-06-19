"use client";

import { LocateFixed, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/settingsStore";
import { speechService } from "@/services/speech/speechService";

export function SettingsPanel() {
  const voiceEnabled = useSettingsStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useSettingsStore((s) => s.setVoiceEnabled);
  const trackingEnabled = useSettingsStore((s) => s.trackingEnabled);
  const setTrackingEnabled = useSettingsStore((s) => s.setTrackingEnabled);

  function onVoiceToggle(v: boolean) {
    setVoiceEnabled(v);
    if (v) {
      speechService.unlock();
      speechService.speakRaw("เปิดเสียงแจ้งเตือนแล้ว");
    } else {
      speechService.cancel();
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-primary">
            <Volume2 className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">เสียงแจ้งเตือน</div>
            <div className="text-xs text-muted-foreground">
              ประกาศก่อนเข้าเขตฝน 15/10/5 นาที
            </div>
          </div>
        </div>
        <Switch
          checked={voiceEnabled}
          onCheckedChange={onVoiceToggle}
          aria-label="สลับเสียงแจ้งเตือน"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-primary">
            <LocateFixed className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">ติดตามตำแหน่งสด</div>
            <div className="text-xs text-muted-foreground">
              ใช้ GPS เพื่อแสดงตำแหน่งบนแผนที่
            </div>
          </div>
        </div>
        <Switch
          checked={trackingEnabled}
          onCheckedChange={setTrackingEnabled}
          aria-label="สลับติดตามตำแหน่ง"
        />
      </div>
    </div>
  );
}
