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

// Known Thai female voice identifiers across major platforms:
//   iOS / macOS: Kanya, Narisa
//   Windows:     Premwadee, Achara
//   Google TTS:  th-TH-Standard-A, th-TH-Wavenet-A, th-TH-Neural2-A
//   Generic:     anything containing "female"
const FEMALE_VOICE_RE =
  /(premwadee|kanya|narisa|achara|standard-?a|wavenet-?a|neural2-?a|female|หญิง)/i;

let preferredVoiceURI: string | null = null;

function setPreferredVoiceURI(uri: string | null) {
  preferredVoiceURI = uri;
}

function getThaiVoices(): SpeechSynthesisVoice[] {
  if (!isSupported()) return [];
  const voices = window.speechSynthesis.getVoices() ?? [];
  return voices.filter((v) => v.lang?.toLowerCase().startsWith("th"));
}

function pickThaiVoice(): SpeechSynthesisVoice | null {
  const thai = getThaiVoices();
  if (thai.length === 0) return null;

  // 1) Honor explicit user choice if it still exists.
  if (preferredVoiceURI) {
    const chosen = thai.find((v) => v.voiceURI === preferredVoiceURI);
    if (chosen) return chosen;
  }

  // 2) Prefer female voices by name heuristic.
  const female = thai.find(
    (v) => FEMALE_VOICE_RE.test(v.name) || FEMALE_VOICE_RE.test(v.voiceURI)
  );
  if (female) return female;

  // 3) Fall back to whatever Thai voice exists.
  return thai[0];
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

/**
 * Force-play a message — bypasses the cooldown and the voice-enabled toggle.
 * Used by the "ทดสอบเสียง" buttons so the rider can preview alerts even when
 * voice is currently disabled or has just played.
 */
function preview(text: string, opts: SpeakOptions = {}): void {
  if (!isSupported()) return;
  cancel();
  rawSpeak(text, opts);
}

export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  isFemale: boolean;
}

export interface VoiceInfo {
  supported: boolean;
  thaiAvailable: boolean;
  voiceName?: string;
  voiceLang?: string;
  voiceURI?: string;
  thaiVoices: VoiceOption[];
}

function getVoiceInfo(): VoiceInfo {
  if (!isSupported()) {
    return { supported: false, thaiAvailable: false, thaiVoices: [] };
  }
  const thai = getThaiVoices();
  const thaiVoices: VoiceOption[] = thai.map((v) => ({
    voiceURI: v.voiceURI,
    name: v.name,
    lang: v.lang,
    isFemale: FEMALE_VOICE_RE.test(v.name) || FEMALE_VOICE_RE.test(v.voiceURI),
  }));
  const picked = pickThaiVoice();
  if (picked) {
    return {
      supported: true,
      thaiAvailable: true,
      voiceName: picked.name,
      voiceLang: picked.lang,
      voiceURI: picked.voiceURI,
      thaiVoices,
    };
  }
  return { supported: true, thaiAvailable: false, thaiVoices };
}

export const speechService = {
  isSupported,
  setEnabled,
  setPreferredVoiceURI,
  speakKey,
  speakRaw,
  preview,
  cancel,
  unlock,
  getVoiceInfo,
  getThaiVoices,
  messages: MESSAGES,
};
