import { useState, useRef } from "react";
import { speak, stopSpeaking } from "../utils/narration";
import type { NarrationContext, Narrator } from "../types";
import { NARRATION_KEY, NARRATOR_KEY, NARRATOR_VOICE_SAMPLE, NARRATORS } from "../constants";

export interface NarrationHook {
  narrator: Narrator;
  narrationOn: boolean;
  narratingCtx: NarrationContext;
  narratingMapId: number | null;
  narrationOnRef: React.MutableRefObject<boolean>;
  setNarratingCtx: React.Dispatch<React.SetStateAction<NarrationContext>>;
  setNarratingMapId: React.Dispatch<React.SetStateAction<number | null>>;
  narrate: (text: string, ctx: NarrationContext, afterEnd?: () => void) => void;
  playSample: (narrator: Narrator) => void;
  stopNarration: () => void;
  handleToggleNarration: () => void;
  handleSetNarrator: (narrator: Narrator) => void;
}

function loadNarrator(): Narrator {
  const stored = localStorage.getItem(NARRATOR_KEY);
  if (stored === "osiris" || stored === "isis" || stored === "thoth") return stored;
  // Backward compat: if old narration was turned off
  if (localStorage.getItem(NARRATION_KEY) === "0") return "off";
  return "osiris";
}

export function useNarration(): NarrationHook {
  const [narrator, setNarrator] = useState<Narrator>(loadNarrator);
  const [narratingCtx, setNarratingCtx] = useState<NarrationContext>(null);
  const [narratingMapId, setNarratingMapId] = useState<number | null>(null);

  const narrationOn = narrator !== "off";
  const narrationOnRef = useRef(narrationOn);
  narrationOnRef.current = narrationOn;

  // Remember last active narrator so toggle can restore it
  const lastActiveRef = useRef<Exclude<Narrator, "off">>(
    narrator !== "off" ? narrator : "osiris",
  );
  if (narrator !== "off") lastActiveRef.current = narrator;

  function narratorInfo(id: Narrator) {
    return NARRATORS.find((n) => n.id === id) ?? NARRATORS[0]!;
  }

  function narrate(text: string, ctx: NarrationContext, afterEnd?: () => void) {
    if (!narrationOnRef.current) return;
    const info = narratorInfo(narrator);
    if (!info.gender) return;
    setNarratingCtx(ctx);
    if (ctx === "map") setNarratingMapId(null);
    speak(text, {
      gender: info.gender,
      rate: info.rate,
      onStart: () => setNarratingCtx(ctx),
      onEnd: () => {
        setNarratingCtx(null);
        setNarratingMapId(null);
        afterEnd?.();
      },
    });
  }

  function playSample(id: Narrator) {
    const info = narratorInfo(id);
    if (!info.gender) return;
    speak(NARRATOR_VOICE_SAMPLE, { gender: info.gender, rate: info.rate, pitch: 0.9, volume: 1.0 });
  }

  function stopNarration() {
    stopSpeaking();
    setNarratingCtx(null);
    setNarratingMapId(null);
  }

  function handleSetNarrator(id: Narrator) {
    setNarrator(id);
    localStorage.setItem(NARRATOR_KEY, id);
    localStorage.setItem(NARRATION_KEY, id === "off" ? "0" : "1");
    if (id === "off") stopNarration();
  }

  function handleToggleNarration() {
    if (narrator === "off") {
      handleSetNarrator(lastActiveRef.current);
    } else {
      handleSetNarrator("off");
    }
  }

  return {
    narrator,
    narrationOn,
    narratingCtx,
    narratingMapId,
    narrationOnRef,
    setNarratingCtx,
    setNarratingMapId,
    narrate,
    playSample,
    stopNarration,
    handleToggleNarration,
    handleSetNarrator,
  };
}
