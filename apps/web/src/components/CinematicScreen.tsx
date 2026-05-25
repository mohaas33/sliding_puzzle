import { useState, useEffect, useRef } from "react";
import type { ChapterTheme } from "../theme";
import { CHAPTERS, CHAPTER_LABEL } from "../constants";

interface CinematicScreenProps {
  currentChapterId: number;
  theme: ChapterTheme;
  onBack: () => void;
  onContinue: () => void;
}

const FALLBACK_NARRATION: Record<number, string> = {
  1: "3,350 years ago, a tomb robber broke into the sacred chamber of a forgotten pharaoh. In his greed, he shattered the enchanted tiles that held Egypt's greatest secrets. The gods fell silent. The Nile stopped flooding. Time itself cracked. You are the Restorer — chosen to piece history back together, one shard at a time.",
  2: "Two thousand years before your birth, a hero shattered the mirror of Athena and scattered its fragments across the Aegean. The gods fell to quarreling. Heroes lost their way. Troy burns for the wrong reasons. You are the Restorer — called now to the land of marble and myth.",
};

export function CinematicScreen({ currentChapterId, theme, onBack, onContinue }: CinematicScreenProps) {
  const chId = Number(currentChapterId);
  const textColor = chId === 2 ? "#c8dff0" : "#d4b896";
  const loreText = CHAPTERS[chId]?.introNarration ?? FALLBACK_NARRATION[chId] ?? "";
  const words = loreText.split(" ").filter(Boolean);

  const [revealedWords, setRevealedWords] = useState(0);
  const [buttonVisible, setButtonVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buttonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRevealedWords(0);
    setButtonVisible(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (buttonTimerRef.current) clearTimeout(buttonTimerRef.current);

    if (words.length === 0) return;

    let count = 0;
    intervalRef.current = setInterval(() => {
      count += 1;
      setRevealedWords(count);
      if (count >= words.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        buttonTimerRef.current = setTimeout(() => setButtonVisible(true), 500);
      }
    }, 80);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (buttonTimerRef.current) clearTimeout(buttonTimerRef.current);
    };
  }, [chId, words.length]);

  return (
    <div className="cinematic-overlay" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onBack}
        style={{
          position: "absolute", top: 16, left: 20,
          fontFamily: "'Cinzel', serif", fontSize: "0.65rem",
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: theme.primaryBorderBright,
          background: "transparent", border: "none",
          cursor: "pointer", padding: "6px 4px",
        }}
      >
        ← Back
      </button>

      <p className="cinematic-label" style={{ color: theme.primary }}>
        {CHAPTERS[chId]?.label ?? CHAPTER_LABEL}
      </p>
      <div className="gold-sep" style={{ width: 120, marginBottom: 40 }} />

      <div className="cinematic-body">
        <p className="cinematic-p1" style={{
          fontStyle: "italic", textAlign: "center",
          maxWidth: 520, animation: "none", color: textColor,
        }}>
          {words.map((word, i) => (
            <span key={i} style={{
              display: "inline",
              opacity: revealedWords > i ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}>
              {word}{" "}
            </span>
          ))}
        </p>
      </div>

      <button
        className="win-btn win-btn-primary cinematic-continue"
        onClick={onContinue}
        style={{
          opacity: buttonVisible ? 1 : 0,
          transition: "opacity 0.6s ease",
          pointerEvents: buttonVisible ? "auto" : "none",
          background: theme.primaryBg,
          borderColor: theme.primaryBorderBright,
          color: theme.primary,
        }}
      >
        Enter the Chapter →
      </button>
    </div>
  );
}
