import type { PuzzleData } from "../types";
import { PUZZLES } from "../constants";
import { formatTime, personalize } from "../utils/solver";

const CHAPTER_ACCENT: Record<number, { primary: string; dim: string; bg: string }> = {
  1: { primary: "#c8a96e", dim: "rgba(200,169,110,0.5)",  bg: "rgba(200,169,110,0.08)" },
  2: { primary: "#7eb8e8", dim: "rgba(126,184,232,0.5)",  bg: "rgba(126,184,232,0.08)" },
  3: { primary: "#5dcaa5", dim: "rgba(93,202,165,0.5)",   bg: "rgba(93,202,165,0.08)"  },
  4: { primary: "#ef9f27", dim: "rgba(239,159,39,0.5)",   bg: "rgba(239,159,39,0.08)"  },
  5: { primary: "#afa9ec", dim: "rgba(175,169,236,0.5)",  bg: "rgba(175,169,236,0.08)" },
};

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
  handlePlayAgain: () => void;
  handleNextShard: () => void;
  handleViewMap: () => void;
}

function anubisComment(stars: number, name: string): string {
  if (stars === 3) return `Anubis nods. "Worthy of a scribe, ${name}."`;
  if (stars === 2) return `Anubis tilts his head. "Acceptable. Barely."`;
  return `Anubis sighs. "The feather outweighs your effort."`;
}

function divineFavorLine(raLightUsed: number, thothUsed: number, visionUsed: number): string {
  if (thothUsed > 0) {
    const times = thothUsed === 1 ? "once" : `${thothUsed} times`;
    return `Thoth guided your hand ${times}. The scales reflect this.`;
  }
  if (raLightUsed > 0) {
    const steps = raLightUsed === 1 ? "1 step" : `${raLightUsed} steps`;
    return `Ra illuminated ${steps} of your path.`;
  }
  if (visionUsed > 0) {
    return `You sought only vision, not intervention. Wise.`;
  }
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
  handlePlayAgain,
  handleNextShard,
  handleViewMap,
}: WinScreenProps) {
  const chapterId = Math.ceil((puzzleIdx + 1) / 8);
  const accent = CHAPTER_ACCENT[chapterId] ?? CHAPTER_ACCENT[1]!;
  console.log('[WinScreen] chapterId:', chapterId, 'accent.primary:', accent.primary);

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
          Shard Restored
        </h2>

        <p
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: accent.primary,
            opacity: 0.7,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          {puzzle.id} of {PUZZLES.length}
        </p>

        {/* Chapter progress bar */}
        <div style={{ width: "100%", marginBottom: 6 }}>
          <div
            style={{
              height: 3,
              borderRadius: 2,
              background: accent.bg,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(puzzle.id / PUZZLES.length) * 100}%`,
                background: `linear-gradient(90deg, ${accent.dim}, ${accent.primary})`,
                borderRadius: 2,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Stars */}
        <div
          style={{
            fontSize: "1.6rem",
            letterSpacing: "0.2em",
            color: accent.primary,
            margin: "10px 0 6px",
          }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ opacity: i < stars ? 1 : 0.18 }}>★</span>
          ))}
        </div>

        {/* Anubis commentary */}
        <p className="anubis-comment">{anubisComment(stars, playerName)}</p>
        <p className="divine-favor-line">{divineFavorLine(raLightUsed, thothUsed, visionUsed)}</p>

        {/* Restored image */}
        <div className="win-image-section">
          <p className="win-image-label">Restored</p>
          <div className="win-image-frame">
            <img src={puzzle.imageUrl} alt={puzzle.name} />
          </div>
          <p className="win-image-name">{puzzle.name}</p>
        </div>

        {/* Win paragraph */}
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
          {personalize(puzzle.win, playerName)}
        </p>

        {/* Personalized stats bar */}
        <p className="win-stats-bar">
          {playerName} · Shard {puzzle.id} of {PUZZLES.length} · {moves} moves · {formatTime(elapsed)}
        </p>

        {/* Points earned */}
        {puzzlePoints > 0 && (
          <p className="win-points-earned">✦ {puzzlePoints} Points</p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="win-btn" onClick={handlePlayAgain}>
            Play Again
          </button>
          <button className="win-btn win-btn-primary" onClick={handleNextShard}>
            {puzzleIdx >= PUZZLES.length - 1 ? "View Map →" : "Next Shard →"}
          </button>
        </div>

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
            color: accent.primary,
            opacity: 0.45,
            letterSpacing: "0.04em",
            transition: "opacity 0.2s",
            padding: "2px 0",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.45")}
        >
          View Chapter Map
        </button>
      </div>
    </div>
  );
}
