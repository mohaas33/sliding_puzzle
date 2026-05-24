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
  const chapterId = Number(currentChapterId);
  const textColor = currentChapterId === 2 ? "#c8dff0" : "#d4b896";

  const loreText = CHAPTERS[Number(currentChapterId)]?.introNarration ?? "";
  const words = loreText.split(" ").filter(Boolean);

  const [revealedWords, setRevealedWords] = useState(0);
  const [buttonVisible, setButtonVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buttonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (words.length === 0) return;
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

  if (words.length === 0) return (
    <div className="cinematic-overlay">
      <p style={{ color: "white" }}>Loading...</p>
    </div>
  );

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

      <p className="cinematic-label" style={{ color: theme.primary }}>{CHAPTERS[chapterId]?.label ?? CHAPTER_LABEL}</p>
      <div className="gold-sep" style={{ width: 120, marginBottom: 40 }} />

      <div className="cinematic-body">
        <p className="cinematic-p1" style={{ fontStyle: "italic", textAlign: "center", maxWidth: 520, animation: "none", color: textColor }}>
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
