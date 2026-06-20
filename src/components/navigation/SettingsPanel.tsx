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
      <ToggleRow
        icon={<Volume2 className="h-6 w-6" />}
        title="เสียงแจ้งเตือน"
        sub="ก่อนเข้าเขตฝน 15 / 10 / 5 นาที"
        checked={voiceEnabled}
        onChange={onVoiceToggle}
        ariaLabel="สลับเสียงแจ้งเตือน"
      />
      <ToggleRow
        icon={<LocateFixed className="h-6 w-6" />}
        title="ติดตามตำแหน่งสด"
        sub="ใช้ GPS แสดงจุดคุณบนแผนที่"
        checked={trackingEnabled}
        onChange={setTrackingEnabled}
        ariaLabel="สลับติดตามตำแหน่ง"
      />
    </div>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}

function ToggleRow({
  icon,
  title,
  sub,
  checked,
  onChange,
  ariaLabel,
}: ToggleRowProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(!checked);
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      onKeyDown={handleKeyDown}
      className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-accent/40 active:bg-accent"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <div className="text-base font-bold">{title}</div>
          <div className="text-sm text-muted-foreground">{sub}</div>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={ariaLabel}
      />
    </div>
  );
}
