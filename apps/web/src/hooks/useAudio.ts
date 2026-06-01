import { useEffect, useRef, useState } from "react";
import type { Screen, WinPhase, Difficulty } from "../types";

const MUTE_KEY = "sot_muted";
const FADE_MS = 800;

type TrackName = "menu" | "ambient" | "map" | "intense" | "win";

export interface UseAudioReturn {
  isMuted: boolean;
  toggleMute: () => void;
}

// Bug 4: difficulty-based threshold for switching to intense music.
// Returns null if intense music should never play for this difficulty.
function intenseThreshold(difficulty: Difficulty): number | null {
  if (difficulty === 3) return null; // Apprentice Scribe — too short, no tension
  if (difficulty === 4) return 90; // Temple Keeper — 90s
  return 60; // High Priest — 60s
}

export function useAudio({
  screen,
  winPhase,
  elapsed,
  n,
}: {
  screen: Screen;
  winPhase: WinPhase;
  elapsed: number;
  n: Difficulty;
}): UseAudioReturn {
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem(MUTE_KEY) === "1",
  );
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const tracks = useRef<Record<TrackName, HTMLAudioElement> | null>(null);
  const activeTrack = useRef<TrackName | null>(null);
  const activeVol = useRef(0);
  const fadeTimers = useRef<
    Map<HTMLAudioElement, ReturnType<typeof setInterval>>
  >(new Map());

  // Bug 2 & 3: win sound timeout ref so it can be cancelled
  const winTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bug 3: track previous winPhase to detect dismissal
  const prevWinPhaseRef = useRef<WinPhase>("none");

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
      if (target <= 0) {
        audio.pause();
        audio.currentTime = 0;
      }
      onDone?.();
      return;
    }
    const steps = Math.ceil(duration / 40);
    const iv = duration / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      audio.volume = Math.max(
        0,
        Math.min(1, from + (effective - from) * (step / steps)),
      );
      if (step >= steps) {
        clearInterval(id);
        fadeTimers.current.delete(audio);
        if (target <= 0) {
          audio.pause();
          audio.currentTime = 0;
        }
        onDone?.();
      }
    }, iv);
    fadeTimers.current.set(audio, id);
  }

  function stopAllExcept(except?: TrackName | null) {
    if (!tracks.current) return;
    for (const [n, audio] of Object.entries(tracks.current) as [
      TrackName,
      HTMLAudioElement,
    ][]) {
      if (n !== except && !audio.paused) {
        fadeTo(audio, 0);
      }
    }
  }

  // ── Main play function ────────────────────────────────────────────────────

  function playTrack(name: TrackName, vol: number) {
    if (!tracks.current) return;

    // Same track already playing — just adjust volume if needed
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
    audio.play().catch(() => {
      /* silenced — browser may block autoplay */
    });
    fadeTo(audio, vol);
  }

  // ── Init: create Audio elements, start menu immediately (Bug 1) ──────────

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    const url = (f: string) => `${base}sounds/${f.replace(/ /g, "%20")}`;

    const t: Record<TrackName, HTMLAudioElement> = {
      menu: new Audio(url("Menu Egyptian v312.ogg")),
      ambient: new Audio(url("Calm_Socapex - Dark Ambiance - Mastered.ogg")),
      map: new Audio(url("Temple of the Mystics.ogg")),
      intense: new Audio(url("intense_ancient_ruins.mp3")),
      win: new Audio(url("LevelUp_Convert.ogg")),
    };
    t.menu.loop = true;
    t.ambient.loop = true;
    t.map.loop = true;
    t.intense.loop = true;
    t.win.loop = false;
    Object.values(t).forEach((a) => {
      a.volume = 0;
    });
    tracks.current = t;

    // Bug 1: start menu immediately without waiting for user interaction
    activeTrack.current = "menu";
    activeVol.current = 0.4;
    t.menu.play().catch(() => {});
    fadeTo(t.menu, 0.4);

    return () => {
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
      Object.values(t).forEach((a) => {
        a.pause();
      });
      fadeTimers.current.forEach((id) => clearInterval(id));
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
      // Bug 4: use difficulty-aware threshold for restored saves with elapsed > threshold
      const threshold = intenseThreshold(n);
      const useIntense = threshold !== null && elapsed >= threshold;
      playTrack(useIntense ? "intense" : "ambient", useIntense ? 0.4 : 0.3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Win screen + dismissal (Bugs 2 & 3) ──────────────────────────────────

  useEffect(() => {
    const prev = prevWinPhaseRef.current;
    prevWinPhaseRef.current = winPhase;

    if (winPhase === "lore") {
      if (!tracks.current) return;

      // Stop all ambient/loop tracks
      stopAllExcept("win");
      activeTrack.current = "win";
      activeVol.current = 0.7;

      const win = tracks.current.win;
      win.currentTime = 0;
      win.play().catch(() => {});
      fadeTo(win, 0.7, 400);

      // Bug 2: stop after 10 seconds, then fade in soft ambient
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = setTimeout(() => {
        winTimeoutRef.current = null;
        if (!tracks.current) return;
        tracks.current.win.pause();
        tracks.current.win.currentTime = 0;
        activeTrack.current = "ambient";
        activeVol.current = 0.2;
        tracks.current.ambient.play().catch(() => {});
        fadeTo(tracks.current.ambient, 0.2, FADE_MS);
      }, 10000);
    } else if (prev === "lore" && winPhase === "none") {
      // Bug 3: player clicked Next Shard or Play Again — cancel win and start gameplay music
      if (winTimeoutRef.current) {
        clearTimeout(winTimeoutRef.current);
        winTimeoutRef.current = null;
      }
      if (tracks.current) {
        tracks.current.win.pause();
        tracks.current.win.currentTime = 0;
      }
      // elapsed is 0 after startPuzzle, so always ambient here
      playTrack("ambient", 0.3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winPhase]);

  // ── Elapsed crossfade (Bug 4: difficulty-aware threshold) ────────────────

  useEffect(() => {
    if (screen !== "game" || winPhase !== "none") return;
    const threshold = intenseThreshold(n);
    if (threshold !== null && elapsed === threshold) {
      playTrack("intense", 0.4);
    } else if (elapsed === 0 && activeTrack.current === "intense") {
      // Restart — go back to ambient
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
      fadeTimers.current.forEach((id) => clearInterval(id));
      fadeTimers.current.clear();
      Object.values(tracks.current).forEach((a) => {
        a.volume = 0;
      });
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
