import type { PuzzleData } from "../types";

interface MissionCardProps {
  puzzle: PuzzleData;
  phase: "full" | "exiting" | "bar";
  onDismiss: () => void;
  onExpand: () => void;
}

export function MissionCard({ puzzle, phase, onDismiss, onExpand }: MissionCardProps) {
  if (phase === "bar") {
    return (
      <div className="mission-bar" onClick={onExpand} role="button" tabIndex={0}>
        <span className="mission-bar-label">MISSION</span>
        <span className="mission-bar-sep">·</span>
        <span className="mission-bar-text">{puzzle.hook}</span>
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
        <p className="mission-hook-text">{puzzle.hook}</p>
        <p className="mission-puzzle-name">{puzzle.name}</p>
        <button className="mission-begin-btn" onClick={onDismiss}>
          Tap to Begin
        </button>
      </div>
    </div>
  );
}
