import { useEffect, useRef, useState } from "react";
import type { Screen, WinPhase } from "../types";

const MUTE_KEY = "sot_muted";
const FADE_MS = 800;

type TrackName = "menu" | "ambient" | "map" | "intense" | "win";

export interface UseAudioReturn {
  isMuted: boolean;
  toggleMute: () => void;
}

export function useAudio({
  screen,
  winPhase,
  elapsed,
}: {
  screen: Screen;
  winPhase: WinPhase;
  elapsed: number;
}): UseAudioReturn {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem(MUTE_KEY) === "1");
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const tracks = useRef<Record<TrackName, HTMLAudioElement> | null>(null);
  const activeTrack = useRef<TrackName | null>(null);
  const activeVol = useRef(0);
  const hasInteracted = useRef(false);
  const pendingPlay = useRef<{ name: TrackName; vol: number } | null>(null);
  const fadeTimers = useRef<Map<HTMLAudioElement, ReturnType<typeof setInterval>>>(new Map());

  // ── Fade helpers ─────────────────────────────────────────────────────────

  function cancelFade(audio: HTMLAudioElement) {
    const id = fadeTimers.current.get(audio);
    if (id !== undefined) {
      clearInterval(id);
      fadeTimers.current.delete(audio);
    }
  }

  function fadeTo(
    audio: HTMLAudioElement,
    target: number,
    duration = FADE_MS,
    onDone?: () => void,
  ) {
    cancelFade(audio);
    const effective = isMutedRef.current ? 0 : target;
    const from = audio.volume;
    if (duration <= 0 || Math.abs(effective - from) < 0.005) {
      audio.volume = effective;
      if (target <= 0) { audio.pause(); audio.currentTime = 0; }
      onDone?.();
      return;
    }
    const steps = Math.ceil(duration / 40);
    const iv = duration / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      audio.volume = Math.max(0, Math.min(1, from + (effective - from) * (step / steps)));
      if (step >= steps) {
        clearInterval(id);
        fadeTimers.current.delete(audio);
        if (target <= 0) { audio.pause(); audio.currentTime = 0; }
        onDone?.();
      }
    }, iv);
    fadeTimers.current.set(audio, id);
  }

  function stopAllExcept(except?: TrackName | null) {
    if (!tracks.current) return;
    for (const [n, audio] of Object.entries(tracks.current) as [TrackName, HTMLAudioElement][]) {
      if (n !== except && !audio.paused) {
        fadeTo(audio, 0);
      }
    }
  }

  // ── Main play function ────────────────────────────────────────────────────

  function playTrack(name: TrackName, vol: number) {
    if (!hasInteracted.current) {
      pendingPlay.current = { name, vol };
      return;
    }
    if (!tracks.current) return;

    // Same track playing — just adjust volume if needed
    if (activeTrack.current === name) {
      if (Math.abs(activeVol.current - vol) > 0.01) {
        activeVol.current = vol;
        fadeTo(tracks.current[name], vol);
      }
      return;
    }

    stopAllExcept(name);

    activeTrack.current = name;
    activeVol.current = vol;

    const audio = tracks.current[name];
    if (name === "win") audio.currentTime = 0;
    audio.play().catch(() => { /* autoplay blocked — will play on next interaction */ });
    fadeTo(audio, vol);
  }

  // ── Init: create Audio elements, wire up interaction unlock ──────────────

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    const url = (f: string) => `${base}sounds/${f.replace(/ /g, "%20")}`;

    const t: Record<TrackName, HTMLAudioElement> = {
      menu:    new Audio(url("Menu Egyptian v312.ogg")),
      ambient: new Audio(url("Calm_Socapex - Dark Ambiance - Mastered.ogg")),
      map:     new Audio(url("Temple of the Mystics.wav")),
      intense: new Audio(url("intense_ancient_ruins.mp3")),
      win:     new Audio(url("LevelUp_Convert.wav")),
    };
    t.menu.loop    = true;
    t.ambient.loop = true;
    t.map.loop     = true;
    t.intense.loop = true;
    t.win.loop     = false;
    Object.values(t).forEach(a => { a.volume = 0; });
    tracks.current = t;

    const onInteract = () => {
      if (hasInteracted.current) return;
      hasInteracted.current = true;
      if (pendingPlay.current) {
        const { name, vol } = pendingPlay.current;
        pendingPlay.current = null;
        playTrack(name, vol);
      }
    };
    window.addEventListener("click",      onInteract, { passive: true });
    window.addEventListener("keydown",    onInteract, { passive: true });
    window.addEventListener("touchstart", onInteract, { passive: true });

    return () => {
      window.removeEventListener("click",      onInteract);
      window.removeEventListener("keydown",    onInteract);
      window.removeEventListener("touchstart", onInteract);
      Object.values(t).forEach(a => { a.pause(); });
      fadeTimers.current.forEach(id => clearInterval(id));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Screen routing ────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen === "start" || screen === "cinematic") {
      playTrack("menu", 0.4);
    } else if (screen === "map") {
      playTrack("map", 0.35);
    } else if (screen === "game" && winPhase === "none") {
      // Pick track based on elapsed (handles restored saves with elapsed > 60)
      playTrack(elapsed >= 60 ? "intense" : "ambient", elapsed >= 60 ? 0.4 : 0.3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Win screen ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (winPhase !== "lore" || !tracks.current) return;
    stopAllExcept("win");
    activeTrack.current = "win";
    activeVol.current = 0.7;
    const win = tracks.current.win;
    win.currentTime = 0;
    win.play().catch(() => {});
    fadeTo(win, 0.7, 400);
    win.onended = () => {
      if (!tracks.current) return;
      activeTrack.current = "ambient";
      activeVol.current = 0.2;
      const amb = tracks.current.ambient;
      amb.play().catch(() => {});
      fadeTo(amb, 0.2, FADE_MS);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winPhase]);

  // ── Elapsed crossfade: ambient → intense at 60s, back to ambient on restart

  useEffect(() => {
    if (screen !== "game" || winPhase !== "none") return;
    if (elapsed === 60) {
      playTrack("intense", 0.4);
    } else if (elapsed === 0 && activeTrack.current === "intense") {
      playTrack("ambient", 0.3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  // ── Mute toggle ───────────────────────────────────────────────────────────

  function toggleMute() {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");

    if (!tracks.current) return;
    if (next) {
      fadeTimers.current.forEach(id => clearInterval(id));
      fadeTimers.current.clear();
      Object.values(tracks.current).forEach(a => { a.volume = 0; });
    } else {
      const name = activeTrack.current;
      if (name) {
        const audio = tracks.current[name];
        if (!audio.paused) fadeTo(audio, activeVol.current, 300);
      }
    }
  }

  return { isMuted, toggleMute };
}
