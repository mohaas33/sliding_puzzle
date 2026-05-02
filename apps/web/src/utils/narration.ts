export type VoiceGender = "man" | "woman";

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  gender?: VoiceGender;
  onStart?: () => void;
  onEnd?: () => void;
}

function pickVoice(gender: VoiceGender = "man"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const manNames = ["Daniel", "Google UK English Male", "Arthur", "Alex"];
  const womanNames = ["Samantha", "Google UK English Female", "Karen", "Moira", "Tessa"];
  const preferred = gender === "man" ? manNames : womanNames;

  const found = preferred
    .map((name) => voices.find((v) => v.name.includes(name)))
    .find((v): v is SpeechSynthesisVoice => v !== undefined);
  if (found) return found;

  const genderKw = new RegExp(gender === "man" ? "\\bmale\\b" : "\\bfemale\\b", "i");
  const byKeyword = voices.find((v) => v.lang.startsWith("en") && genderKw.test(v.name));
  if (byKeyword) return byKeyword;

  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}

export function speak(text: string, options: SpeechOptions = {}): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const { rate = 0.85, pitch = 0.9, volume = 1.0, gender = "man", onStart, onEnd } = options;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd();
  }

  function doSpeak() {
    const voice = pickVoice(gender);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener("voiceschanged", function handler() {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      doSpeak();
    });
  } else {
    doSpeak();
  }
}

export function stopSpeaking(): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
