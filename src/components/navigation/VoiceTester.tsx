"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Play,
  Square,
  UserRound,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  speechService,
  type SpeechKey,
} from "@/services/speech/speechService";
import { useSettingsStore } from "@/store/settingsStore";

interface TestEntry {
  key: SpeechKey;
  label: string;
}

const TESTS: TestEntry[] = [
  { key: "rain_15", label: "ฝน 15 นาที" },
  { key: "rain_10", label: "ฝน 10 นาที" },
  { key: "rain_5", label: "ฝน 5 นาที" },
  { key: "entering_rain", label: "เข้าเขตฝน" },
  { key: "leaving_rain", label: "พ้นเขตฝน" },
];

export function VoiceTester() {
  const preferredVoiceURI = useSettingsStore((s) => s.preferredVoiceURI);
  const setPreferredVoiceURI = useSettingsStore((s) => s.setPreferredVoiceURI);

  const [voice, setVoice] = useState(() => speechService.getVoiceInfo());
  const [speaking, setSpeaking] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  // Sync the user's preferred voice into the speechService module each time.
  useEffect(() => {
    speechService.setPreferredVoiceURI(preferredVoiceURI);
    setVoice(speechService.getVoiceInfo());
  }, [preferredVoiceURI]);

  // Voices on most browsers load asynchronously after the page mounts.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const refresh = () => setVoice(speechService.getVoiceInfo());
    refresh();
    window.speechSynthesis.addEventListener?.("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", refresh);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const id = window.setInterval(() => {
      setSpeaking(window.speechSynthesis.speaking);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  function play(key: SpeechKey) {
    speechService.unlock();
    speechService.preview(speechService.messages[key]);
  }

  function stop() {
    speechService.cancel();
  }

  const hasThai = voice.thaiAvailable && voice.thaiVoices.length > 0;
  const femaleAvailable = voice.thaiVoices.some((v) => v.isFemale);

  return (
    <div className="space-y-3 rounded-2xl border-2 bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Volume2 className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold">ทดสอบเสียงแจ้งเตือน</div>
          <VoiceStatus voice={voice} />
        </div>
        {speaking && (
          <Button
            variant="destructive"
            size="icon-lg"
            onClick={stop}
            aria-label="หยุดเสียง"
          >
            <Square className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Voice picker — shown only when at least one Thai voice exists */}
      {hasThai && (
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" /> เลือกเสียง
            {femaleAvailable && preferredVoiceURI === null && (
              <span className="ml-1 rounded bg-pink-500/15 px-1.5 py-0.5 text-[10px] text-pink-700 dark:text-pink-300">
                อัตโนมัติ — เลือกเสียงผู้หญิงให้
              </span>
            )}
          </label>
          <Select
            value={preferredVoiceURI ?? "auto"}
            onValueChange={(v) =>
              setPreferredVoiceURI(v === "auto" ? null : v)
            }
          >
            <SelectTrigger className="h-12 rounded-xl border-2 text-base font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                อัตโนมัติ (ใช้เสียงผู้หญิงถ้ามี)
              </SelectItem>
              {voice.thaiVoices.map((v) => (
                <SelectItem key={v.voiceURI} value={v.voiceURI}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({v.lang})
                    </span>
                    {v.isFemale && (
                      <span className="rounded bg-pink-500/20 px-1.5 py-0.5 text-[10px] text-pink-700 dark:text-pink-300">
                        หญิง
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {TESTS.map((t) => (
          <Button
            key={t.key}
            variant="outline"
            size="lg"
            onClick={() => play(t.key)}
            disabled={!voice.supported}
            className="gap-2 border-2 font-semibold"
          >
            <Play className="h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      {/* Install instructions — surfaces when no Thai voice is present */}
      {voice.supported && !hasThai && (
        <div className="space-y-2 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            เครื่องนี้ยังไม่มีเสียงไทย
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstall((v) => !v)}
            className="h-auto gap-1.5 p-0 text-xs text-amber-700 underline-offset-2 hover:bg-transparent hover:underline dark:text-amber-300"
          >
            <Download className="h-3.5 w-3.5" /> วิธีติดตั้ง{showInstall ? " (ซ่อน)" : ""}
          </Button>
          {showInstall && <InstallGuide />}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 ทิป: เปิดเพลงในแอปอื่นไว้ แล้วกดปุ่มข้างบน
        ระบบจะลดเสียงเพลงให้ขณะประกาศ (Android Chrome)
      </p>
    </div>
  );
}

function VoiceStatus({
  voice,
}: {
  voice: ReturnType<typeof speechService.getVoiceInfo>;
}) {
  if (!voice.supported) {
    return (
      <div className="flex items-center gap-1 text-xs text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
        เบราว์เซอร์ไม่รองรับเสียงพูด
      </div>
    );
  }
  if (voice.thaiAvailable) {
    return (
      <div className="flex items-center gap-1 truncate text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          ใช้เสียง: {voice.voiceName} ({voice.voiceLang})
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5" />
      ไม่พบเสียงไทย — จะใช้เสียงเริ่มต้นของเครื่อง
    </div>
  );
}

function InstallGuide() {
  return (
    <div className="space-y-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
      <div>
        <div className="font-bold">📱 iPhone / iPad</div>
        <div className="opacity-90">
          การตั้งค่า → การช่วยการเข้าถึง → เนื้อหาพูด → เสียง → ไทย →
          ดาวน์โหลด <strong>กัญญา (Kanya)</strong> หรือ{" "}
          <strong>นริศา (Narisa)</strong>
        </div>
      </div>
      <div>
        <div className="font-bold">📱 Android</div>
        <div className="opacity-90">
          การตั้งค่า → ภาษาและการป้อนข้อมูล → เสียงพูด → Google Text-to-speech →
          ติดตั้งภาษาไทย (มี <strong>เสียงผู้หญิง</strong> ในรายการ)
        </div>
      </div>
      <div>
        <div className="font-bold">💻 Windows 10/11</div>
        <div className="opacity-90">
          Settings → Time &amp; Language → Speech → Manage voices → Add voices →
          Thai → ติดตั้ง <strong>Premwadee</strong> (หญิง) /{" "}
          <strong>Pattara</strong> (ชาย)
        </div>
      </div>
      <div>
        <div className="font-bold">💻 Mac</div>
        <div className="opacity-90">
          System Settings → Accessibility → Spoken Content → System voice →
          Manage Voices → Thai → <strong>Kanya</strong>
        </div>
      </div>
      <div className="rounded-md bg-amber-500/10 p-2 text-[11px]">
        หลังติดตั้งเสียงเสร็จ ปิด-เปิดเบราว์เซอร์ใหม่ แล้ว refresh หน้านี้
      </div>
    </div>
  );
}
