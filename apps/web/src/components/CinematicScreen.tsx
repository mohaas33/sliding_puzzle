import { useState, useEffect, useRef } from "react";
import type { ChapterTheme } from "../theme";
import { CHAPTERS, CHAPTER_LABEL } from "../constants";

interface CinematicScreenProps {
  currentChapterId: number;
  theme: ChapterTheme;
  onBack: () => void;
  onContinue: () => void;
}

export function CinematicScreen({ currentChapterId, theme, onBack, onContinue }: CinematicScreenProps) {
  const loreText = CHAPTERS[currentChapterId]?.introNarration ?? "";
  const words = loreText.split(" ");
  const [revealedWords, setRevealedWords] = useState(0);
  const [buttonVisible, setButtonVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buttonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRevealedWords(0);
    setButtonVisible(false);

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (buttonTimerRef.current) clearTimeout(buttonTimerRef.current);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterId]);

  return (
    <div className="cinematic-overlay" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontFamily: "'Cinzel', serif",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: theme.primaryBorderBright,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "6px 4px",
        }}
      >
        ← Back
      </button>

      <p className="cinematic-label">{CHAPTERS[currentChapterId]?.label ?? CHAPTER_LABEL}</p>
      <div className="gold-sep" style={{ width: 120, marginBottom: 40 }} />

      <div className="cinematic-body">
        <p className="cinematic-p1" style={{ fontStyle: "italic", textAlign: "center", maxWidth: 520 }}>
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                display: "inline",
                opacity: revealedWords > i ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            >
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
          background: theme.gradient,
          borderColor: theme.primary,
          color: "#0a0806",
        }}
      >
        Enter the Chapter →
      </button>
    </div>
  );
}
