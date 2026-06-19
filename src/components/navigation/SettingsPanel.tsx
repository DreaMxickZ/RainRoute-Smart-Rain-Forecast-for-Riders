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
    <div className="divide-y divide-border rounded-2xl border-2 bg-card">
      <button
        type="button"
        onClick={() => onVoiceToggle(!voiceEnabled)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-accent/40 active:bg-accent"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Volume2 className="h-6 w-6" />
          </span>
          <div>
            <div className="text-base font-bold">เสียงแจ้งเตือน</div>
            <div className="text-sm text-muted-foreground">
              ก่อนเข้าเขตฝน 15 / 10 / 5 นาที
            </div>
          </div>
        </div>
        <Switch
          checked={voiceEnabled}
          onCheckedChange={onVoiceToggle}
          aria-label="สลับเสียงแจ้งเตือน"
        />
      </button>

      <button
        type="button"
        onClick={() => setTrackingEnabled(!trackingEnabled)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-accent/40 active:bg-accent"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LocateFixed className="h-6 w-6" />
          </span>
          <div>
            <div className="text-base font-bold">ติดตามตำแหน่งสด</div>
            <div className="text-sm text-muted-foreground">
              ใช้ GPS แสดงจุดคุณบนแผนที่
            </div>
          </div>
        </div>
        <Switch
          checked={trackingEnabled}
          onCheckedChange={setTrackingEnabled}
          aria-label="สลับติดตามตำแหน่ง"
        />
      </button>
    </div>
  );
}
