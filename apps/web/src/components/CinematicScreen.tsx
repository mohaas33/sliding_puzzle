import { useState, useEffect } from "react";
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
  const sentences = loreText.split(". ").filter(Boolean);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    const timers = sentences.map((_, i) =>
      setTimeout(() => setRevealed(i + 1), 300 + i * 900),
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterId]);

  const allRevealed = revealed >= sentences.length;

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
          {sentences.map((sentence, i) => (
            <span
              key={i}
              style={{
                display: "block",
                marginBottom: "0.5em",
                opacity: revealed > i ? 1 : 0,
                transform: revealed > i ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              {sentence}
            </span>
          ))}
        </p>
      </div>

      {allRevealed && (
        <button
          className="win-btn win-btn-primary cinematic-continue"
          onClick={onContinue}
          style={{
            animation: "fadeIn 0.5s ease",
            background: theme.gradient,
            borderColor: theme.primary,
            color: "#0a0806",
          }}
        >
          Enter the Chapter →
        </button>
      )}
    </div>
  );
}
