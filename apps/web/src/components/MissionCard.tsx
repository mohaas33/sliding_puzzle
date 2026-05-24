import type { PuzzleData } from "../types";
import type { ChapterTheme } from "../theme";
import { personalize } from "../utils/solver";

interface MissionCardProps {
  puzzle: PuzzleData;
  phase: "full" | "exiting" | "bar";
  playerName: string;
  theme: ChapterTheme;
  onDismiss: () => void;
  onExpand: () => void;
}

export function MissionCard({ puzzle, phase, playerName, theme, onDismiss, onExpand }: MissionCardProps) {
  const hookText = personalize(puzzle.hook, playerName);

  if (phase === "bar") {
    return (
      <div className="mission-bar" onClick={onExpand} role="button" tabIndex={0}>
        <span className="mission-bar-label" style={{ color: theme.primary }}>{puzzle.name}</span>
        <span className="mission-bar-sep" style={{ color: theme.primaryBorderBright }}>·</span>
        <span className="mission-bar-text">{hookText}</span>
      </div>
    );
  }

  return (
    <div
      className={`mission-overlay${phase === "exiting" ? " mission-overlay-exit" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mission-bg" style={{ backgroundImage: `url(${puzzle.imageUrl})`, backgroundColor: theme.primaryBg }} />
      <div className="mission-dim" />

      <div className="mission-content">
        <p className="mission-label" style={{ color: theme.primary }}>Mission</p>
        <div className="gold-sep" style={{ width: 80, margin: "12px 0 32px" }} />
        <p className="mission-hook-text">{hookText}</p>
        <p className="mission-puzzle-name" style={{ color: theme.primary }}>{puzzle.name}</p>
        <button
          className="mission-begin-btn"
          onClick={onDismiss}
          style={{
            background: theme.primaryBg,
            border: `1px solid ${theme.primaryBorderBright}`,
            color: theme.primary,
            boxShadow: `0 0 32px ${theme.primaryBorder}`,
          }}
        >
          ✦ Accept Your Fate ✦
        </button>
      </div>
    </div>
  );
}
