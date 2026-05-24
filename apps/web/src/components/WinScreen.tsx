import { useState, useEffect } from "react";
import type { PuzzleData } from "../types";
import type { ChapterTheme } from "../theme";
import { PUZZLES } from "../constants";
import { formatTime, personalize } from "../utils/solver";

interface WinScreenProps {
  puzzle: PuzzleData;
  puzzleIdx: number;
  moves: number;
  elapsed: number;
  stars: number;
  playerName: string;
  raLightUsed: number;
  thothUsed: number;
  visionUsed: number;
  puzzlePoints: number;
  theme: ChapterTheme;
  handlePlayAgain: () => void;
  handleNextShard: () => void;
  handleViewMap: () => void;
}

function starComment(stars: number, name: string, chapter: number): string {
  if (chapter === 2) {
    if (stars === 3) return `Athena nods. "Your mind is sharp, ${name}."`;
    if (stars === 2) return `The Olympians watched in silence.`;
    return `Apollo frowns. "Even a mortal should do better."`;
  }
  if (stars === 3) return `Anubis nods. "Worthy of a scribe, ${name}."`;
  if (stars === 2) return `The gods watched. You needed no help.`;
  return `Anubis sighs. "The feather outweighs your effort."`;
}

function divineFavorLine(raLightUsed: number, thothUsed: number, visionUsed: number, chapter: number): string {
  if (chapter === 2) {
    if (thothUsed > 0) return `Athena lent her wisdom ${thothUsed} time${thothUsed === 1 ? "" : "s"}. Olympus is watching.`;
    if (raLightUsed > 0) return `Apollo guided your hand ${raLightUsed} time${raLightUsed === 1 ? "" : "s"}. The gods noted this.`;
    if (visionUsed > 0) return `You sought only vision, not intervention. Wise.`;
    return `The Olympians watched in silence.`;
  }
  if (thothUsed > 0) {
    const times = thothUsed === 1 ? "once" : `${thothUsed} times`;
    return `Thoth guided your hand ${times}. The scales reflect this.`;
  }
  if (raLightUsed > 0) {
    const steps = raLightUsed === 1 ? "1 step" : `${raLightUsed} steps`;
    return `Ra illuminated ${steps} of your path.`;
  }
  if (visionUsed > 0) return `You sought only vision, not intervention. Wise.`;
  return `The gods watched in silence — you needed no help.`;
}

export function WinScreen({
  puzzle,
  puzzleIdx,
  moves,
  elapsed,
  stars,
  playerName,
  raLightUsed,
  thothUsed,
  visionUsed,
  puzzlePoints,
  theme,
  handlePlayAgain,
  handleNextShard,
  handleViewMap,
}: WinScreenProps) {
  const chapter = puzzleIdx < 8 ? 1 : 2;
  const winText = personalize(puzzle.win, playerName);
  const winSentences = winText.split(". ").filter(Boolean);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    const timers = winSentences.map((_, i) =>
      setTimeout(() => setRevealed(i + 1), 300 + i * 900),
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  return (
    <div className="win-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="win-card">
        <div className="gold-sep" />

        <h2
          style={{
            fontFamily: "'Cinzel', serif",
            color: "#f0e4c4",
            fontSize: "1.75rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            margin: "12px 0 4px",
            textAlign: "center",
          }}
        >
          {chapter === 2 ? "Fragment Restored" : "Shard Restored"}
        </h2>

        {/* N of Total */}
        <p
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: theme.primary,
            opacity: 0.7,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          {puzzle.id} of {PUZZLES.length}
        </p>

        {/* Chapter progress bar */}
        <div style={{ width: "100%", marginBottom: 6 }}>
          <div style={{ height: 3, borderRadius: 2, background: theme.primaryBg, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(puzzle.id / PUZZLES.length) * 100}%`,
                background: `linear-gradient(90deg, ${theme.primaryDim}, ${theme.primary})`,
                borderRadius: 2,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Stars */}
        <div style={{ fontSize: "1.6rem", letterSpacing: "0.2em", color: theme.primary, margin: "10px 0 6px" }}>
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ opacity: i < stars ? 1 : 0.18 }}>★</span>
          ))}
        </div>

        {/* Anubis commentary */}
        <p
          style={{
            fontFamily: "'Crimson Text', serif",
            fontStyle: "italic",
            fontSize: "0.88rem",
            color: theme.primary,
            opacity: 0.75,
            margin: "0 0 8px",
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          {starComment(stars, playerName, chapter)}
        </p>

        {/* Divine favor */}
        <p
          style={{
            fontFamily: "'Crimson Text', serif",
            fontStyle: "italic",
            fontSize: "0.78rem",
            color: theme.primaryDim,
            opacity: 0.9,
            margin: "0 0 4px",
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          {divineFavorLine(raLightUsed, thothUsed, visionUsed, chapter)}
        </p>

        {/* Restored image */}
        <div className="win-image-section">
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.5rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: theme.primaryDim,
              margin: 0,
            }}
          >
            Restored
          </p>
          <div
            className="win-image-frame"
            style={{
              border: `2px solid ${theme.primary}`,
              boxShadow: `0 0 0 1px ${theme.primaryBg}, 0 0 20px ${theme.primaryBorder}, 0 0 50px ${theme.primaryBg}`,
            }}
          >
            <img src={puzzle.imageUrl} alt={puzzle.name} />
          </div>
          <p
            style={{
              fontFamily: "'Crimson Text', serif",
              fontStyle: "italic",
              fontSize: "0.82rem",
              color: theme.primary,
              opacity: 0.6,
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            {puzzle.name}
          </p>
        </div>

        {/* Win paragraph — staggered sentence reveal */}
        <p
          style={{
            fontFamily: "'Crimson Text', serif",
            fontStyle: "italic",
            color: "#d4b896",
            fontSize: "1.05rem",
            lineHeight: 1.7,
            margin: "16px 0 20px",
            textAlign: "center",
          }}
        >
          {winSentences.map((sentence, i) => (
            <span
              key={i}
              style={{
                display: "block",
                marginBottom: "0.25em",
                opacity: revealed > i ? 1 : 0,
                transform: revealed > i ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              {sentence}
            </span>
          ))}
        </p>

        {/* Stats bar */}
        <p
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.58rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: theme.primaryDim,
            opacity: 0.9,
            textAlign: "center",
            margin: 0,
          }}
        >
          {playerName} · {chapter === 2 ? "Fragment" : "Shard"} {puzzle.id} of {PUZZLES.length} · {moves} moves · {formatTime(elapsed)}
        </p>

        {/* Points earned */}
        {puzzlePoints > 0 && (
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.85rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: theme.primary,
              margin: "8px 0 2px",
              textAlign: "center",
              textShadow: `0 0 20px ${theme.primaryDim}`,
            }}
          >
            ✦ {puzzlePoints} Points
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            className="win-btn"
            onClick={handlePlayAgain}
            style={{ color: theme.primary, border: `1px solid ${theme.primaryDim}` }}
          >
            Play Again
          </button>
          <button
            className="win-btn win-btn-primary"
            onClick={handleNextShard}
            style={{
              background: theme.primaryBg,
              borderColor: theme.primaryBorderBright,
              color: theme.primary,
            }}
          >
            {puzzleIdx >= PUZZLES.length - 1 ? "View Map →" : "Next Shard →"}
          </button>
        </div>

        {/* View map link */}
        <button
          onClick={handleViewMap}
          style={{
            marginTop: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Crimson Text', serif",
            fontStyle: "italic",
            fontSize: "0.82rem",
            color: theme.primaryDim,
            opacity: 0.9,
            letterSpacing: "0.04em",
            transition: "opacity 0.2s",
            padding: "2px 0",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
        >
          View Chapter Map
        </button>
      </div>
    </div>
  );
}
