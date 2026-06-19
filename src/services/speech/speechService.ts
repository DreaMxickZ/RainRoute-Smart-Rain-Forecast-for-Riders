export type SpeechKey =
  | "rain_15"
  | "rain_10"
  | "rain_5"
  | "entering_rain"
  | "leaving_rain"
  | "ready"
  | "no_rain";

const MESSAGES: Record<SpeechKey, string> = {
  rain_15: "อีก 15 นาทีจะพบฝน",
  rain_10: "อีก 10 นาทีจะพบฝน",
  rain_5: "อีก 5 นาทีจะพบฝน",
  entering_rain: "กำลังเข้าสู่พื้นที่ฝน",
  leaving_rain: "พ้นพื้นที่ฝนแล้ว",
  ready: "เริ่มต้นนำทางแล้ว",
  no_rain: "เส้นทางนี้ไม่พบฝน",
};

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

function isSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickThaiVoice(): SpeechSynthesisVoice | null {
  if (!isSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const thai = voices.find((v) => v.lang?.toLowerCase().startsWith("th"));
  return thai ?? null;
}

function rawSpeak(text: string, opts: SpeakOptions): void {
  if (!isSupported()) return;
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickThaiVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = "th-TH";
  }
  u.rate = opts.rate ?? 1;
  u.pitch = opts.pitch ?? 1;
  u.volume = opts.volume ?? 1;
  window.speechSynthesis.speak(u);
}

let enabled = true;
let lastSpoken: { key: SpeechKey; at: number } | null = null;
const COOLDOWN_MS = 30_000;

function setEnabled(value: boolean): void {
  enabled = value;
  if (!value) cancel();
}

function speakKey(key: SpeechKey, opts: SpeakOptions = {}): void {
  if (!enabled || !isSupported()) return;
  const now = Date.now();
  if (lastSpoken && lastSpoken.key === key && now - lastSpoken.at < COOLDOWN_MS) {
    return;
  }
  lastSpoken = { key, at: now };
  rawSpeak(MESSAGES[key], opts);
}

function speakRaw(text: string, opts: SpeakOptions = {}): void {
  if (!enabled || !isSupported()) return;
  rawSpeak(text, opts);
}

function cancel(): void {
  if (!isSupported()) return;
  window.speechSynthesis.cancel();
}

/**
 * Some browsers require user interaction before voices are populated.
 * Call this from a click handler to "unlock" speech.
 */
function unlock(): void {
  if (!isSupported()) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

export const speechService = {
  isSupported,
  setEnabled,
  speakKey,
  speakRaw,
  cancel,
  unlock,
  messages: MESSAGES,
};
