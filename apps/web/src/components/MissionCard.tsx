import type { PuzzleData } from "../types";
import { personalize } from "../utils/solver";

interface MissionCardProps {
  puzzle: PuzzleData;
  phase: "full" | "exiting" | "bar";
  playerName: string;
  onDismiss: () => void;
  onExpand: () => void;
}

export function MissionCard({ puzzle, phase, playerName, onDismiss, onExpand }: MissionCardProps) {
  const hookText = personalize(puzzle.hook, playerName);

  if (phase === "bar") {
    return (
      <div className="mission-bar" onClick={onExpand} role="button" tabIndex={0}>
        <span className="mission-bar-label">MISSION</span>
        <span className="mission-bar-sep">·</span>
        <span className="mission-bar-text">{hookText}</span>
      </div>
    );
  }

  return (
    <div
      className={`mission-overlay${phase === "exiting" ? " mission-overlay-exit" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mission-bg" style={{ backgroundImage: `url(${puzzle.imageUrl})` }} />
      <div className="mission-dim" />

      <div className="mission-content">
        <p className="mission-label">Mission</p>
        <div className="gold-sep" style={{ width: 80, margin: "12px 0 32px" }} />
        <p className="mission-hook-text">{hookText}</p>
        <p className="mission-puzzle-name">{puzzle.name}</p>
        <button className="mission-begin-btn" onClick={onDismiss}>
          ✦ Accept Your Fate ✦
        </button>
      </div>
    </div>
  );
}
