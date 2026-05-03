import { useState, useRef } from "react";
import { speak, stopSpeaking } from "../utils/narration";
import type { VoiceGender } from "../utils/narration";
import type { NarrationContext } from "../types";
import { NARRATION_KEY, VOICE_GENDER_KEY, VOICE_SAMPLE } from "../constants";

export interface NarrationHook {
  narrationOn: boolean;
  voiceGender: VoiceGender;
  narratingCtx: NarrationContext;
  narratingMapId: number | null;
  narrationOnRef: React.MutableRefObject<boolean>;
  voiceOption: "off" | "man" | "woman";
  setNarratingCtx: React.Dispatch<React.SetStateAction<NarrationContext>>;
  setNarratingMapId: React.Dispatch<React.SetStateAction<number | null>>;
  narrate: (text: string, ctx: NarrationContext, afterEnd?: () => void) => void;
  playSample: (gender: VoiceGender) => void;
  stopNarration: () => void;
  handleToggleNarration: () => void;
  handleStartVoiceSelect: (opt: "off" | "man" | "woman") => void;
}

export function useNarration(): NarrationHook {
  const [narrationOn, setNarrationOn] = useState(
    () => localStorage.getItem(NARRATION_KEY) !== "0",
  );
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(
    () => (localStorage.getItem(VOICE_GENDER_KEY) === "woman" ? "woman" : "man"),
  );
  const [narratingCtx, setNarratingCtx] = useState<NarrationContext>(null);
  const [narratingMapId, setNarratingMapId] = useState<number | null>(null);

  const narrationOnRef = useRef(narrationOn);
  narrationOnRef.current = narrationOn;

  const voiceOption: "off" | "man" | "woman" = !narrationOn ? "off" : voiceGender;

  function narrate(text: string, ctx: NarrationContext, afterEnd?: () => void) {
    if (!narrationOnRef.current) return;
    setNarratingCtx(ctx);
    if (ctx === "map") setNarratingMapId(null);
    speak(text, {
      gender: voiceGender,
      onStart: () => setNarratingCtx(ctx),
      onEnd: () => {
        setNarratingCtx(null);
        setNarratingMapId(null);
        afterEnd?.();
      },
    });
  }

  function playSample(gender: VoiceGender) {
    speak(VOICE_SAMPLE, { gender, rate: 0.85, pitch: 0.9, volume: 1.0 });
  }

  function stopNarration() {
    stopSpeaking();
    setNarratingCtx(null);
    setNarratingMapId(null);
  }

  function handleToggleNarration() {
    const next = !narrationOn;
    setNarrationOn(next);
    localStorage.setItem(NARRATION_KEY, next ? "1" : "0");
    if (!next) stopNarration();
  }

  function handleStartVoiceSelect(option: "off" | "man" | "woman") {
    if (option === "off") {
      setNarrationOn(false);
      localStorage.setItem(NARRATION_KEY, "0");
    } else {
      setNarrationOn(true);
      setVoiceGender(option);
      localStorage.setItem(NARRATION_KEY, "1");
      localStorage.setItem(VOICE_GENDER_KEY, option);
      playSample(option);
    }
  }

  return {
    narrationOn,
    voiceGender,
    narratingCtx,
    narratingMapId,
    narrationOnRef,
    voiceOption,
    setNarratingCtx,
    setNarratingMapId,
    narrate,
    playSample,
    stopNarration,
    handleToggleNarration,
    handleStartVoiceSelect,
  };
}
