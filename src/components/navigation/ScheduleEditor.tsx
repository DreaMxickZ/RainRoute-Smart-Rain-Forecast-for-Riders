"use client";

import { CalendarClock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_SCHEDULE,
  useSettingsStore,
  type TimeWindow,
} from "@/store/settingsStore";

export function ScheduleEditor() {
  const schedule = useSettingsStore((s) => s.schedule);
  const setSchedule = useSettingsStore((s) => s.setSchedule);
  const resetSchedule = useSettingsStore((s) => s.resetSchedule);

  function update(key: "workOut" | "homeOut", patch: Partial<TimeWindow>) {
    setSchedule({
      ...schedule,
      [key]: { ...schedule[key], ...patch },
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border-2 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="h-6 w-6" />
          </span>
          <div>
            <div className="text-base font-bold">ตารางเดินทาง</div>
            <div className="text-xs text-muted-foreground">
              ช่วยระบบเดาว่าคุณจะไปไหน
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetSchedule}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" /> ค่าเริ่มต้น
        </Button>
      </div>

      <Window
        title="ไปทำงาน — ออกจากบ้าน"
        win={schedule.workOut}
        onChange={(patch) => update("workOut", patch)}
        defaultWin={DEFAULT_SCHEDULE.workOut}
      />
      <Window
        title="กลับบ้าน — ออกจากที่ทำงาน"
        win={schedule.homeOut}
        onChange={(patch) => update("homeOut", patch)}
        defaultWin={DEFAULT_SCHEDULE.homeOut}
      />
    </div>
  );
}

function Window({
  title,
  win,
  onChange,
  defaultWin,
}: {
  title: string;
  win: TimeWindow;
  onChange: (patch: Partial<TimeWindow>) => void;
  defaultWin: TimeWindow;
}) {
  return (
    <div className="space-y-2 rounded-xl border bg-background/60 p-3">
      <div className="text-sm font-bold">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        <Field
          label="เริ่ม"
          type="time"
          value={win.start}
          onChange={(v) => onChange({ start: v })}
        />
        <Field
          label="ถึง"
          type="time"
          value={win.end}
          onChange={(v) => onChange({ end: v })}
        />
      </div>
      <Field
        label="ความคลาดเคลื่อน (± นาที)"
        type="number"
        value={String(win.toleranceMin)}
        onChange={(v) => onChange({ toleranceMin: Math.max(0, Math.min(120, Number(v) || 0)) })}
        min={0}
        max={120}
      />
      <div className="text-xs text-muted-foreground">
        ระบบจะแนะนำในช่วง {minusMinutes(win.start, win.toleranceMin)} –{" "}
        {plusMinutes(win.end, win.toleranceMin)}
        {(win.start !== defaultWin.start ||
          win.end !== defaultWin.end ||
          win.toleranceMin !== defaultWin.toleranceMin) &&
          " (ปรับแล้ว)"}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: "time" | "number";
  min?: number;
  max?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="h-11 w-full rounded-lg border-2 bg-background px-3 text-base font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}

function shiftMinutes(hm: string, delta: number): string {
  const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
  const total = ((h * 60 + m + delta) % (24 * 60) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function plusMinutes(hm: string, n: number) {
  return shiftMinutes(hm, n);
}
function minusMinutes(hm: string, n: number) {
  return shiftMinutes(hm, -n);
}
