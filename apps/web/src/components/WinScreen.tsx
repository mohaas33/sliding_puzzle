import type { PuzzleData, NarrationContext } from "../types";
import { PUZZLES } from "../constants";
import { formatTime } from "../utils/solver";
import { Waveform } from "./Waveform";

interface WinScreenProps {
  puzzle: PuzzleData;
  puzzleIdx: number;
  moves: number;
  elapsed: number;
  stars: number;
  narrationOn: boolean;
  narratingCtx: NarrationContext;
  handlePlayAgain: () => void;
  handleNextShard: () => void;
  handleViewMap: () => void;
}

export function WinScreen({
  puzzle,
  puzzleIdx,
  moves,
  elapsed,
  stars,
  narrationOn,
  narratingCtx,
  handlePlayAgain,
  handleNextShard,
  handleViewMap,
}: WinScreenProps) {
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
            color: "#c8a96e",
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
              background: "rgba(200,169,110,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(puzzle.id / PUZZLES.length) * 100}%`,
                background: "linear-gradient(90deg, #a07840, #c8a96e)",
                borderRadius: 2,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        <div
          style={{
            fontSize: "1.6rem",
            letterSpacing: "0.2em",
            color: "#c8a96e",
            margin: "10px 0 12px",
          }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} style={{ opacity: i < stars ? 1 : 0.18 }}>
              ★
            </span>
          ))}
        </div>

        {/* Restored image */}
        <div className="win-image-section">
          <p className="win-image-label">Restored</p>
          <div className="win-image-frame">
            <img src={puzzle.imageUrl} alt={puzzle.name} />
          </div>
          <p className="win-image-name">{puzzle.name}</p>
        </div>

        <p
          style={{
            fontFamily: "'Crimson Text', serif",
            fontStyle: "italic",
            color: "#d4b896",
            fontSize: "1.05rem",
            lineHeight: 1.7,
            margin: "16px 0 16px",
            textAlign: "center",
          }}
        >
          {puzzle.win}
          {narratingCtx === "win" && narrationOn && <Waveform />}
        </p>

        <div
          style={{
            display: "flex",
            gap: 36,
            justifyContent: "center",
            fontFamily: "'Cinzel', serif",
            color: "#c8a96e",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", opacity: 0.55, marginBottom: 3 }}>Moves</div>
            <div style={{ fontSize: "1.25rem" }}>{moves}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", opacity: 0.55, marginBottom: 3 }}>Time</div>
            <div style={{ fontSize: "1.25rem" }}>{formatTime(elapsed)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
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
            color: "#c8a96e",
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
