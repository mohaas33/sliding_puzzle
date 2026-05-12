import { useRef, useState } from "react";
import type { Difficulty } from "../types";
import { CHAPTER_LABEL, DIFFICULTY_INFO } from "../constants";

interface GameMenuProps {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  showResetConfirm: boolean;
  setShowResetConfirm: (v: boolean) => void;
  hintGlow: boolean;
  currentDifficulty: Difficulty;
  musicMuted: boolean;
  handleShowMap: () => void;
  handleRestartPuzzle: () => void;
  handleResetRequest: () => void;
  handleResetConfirm: () => void;
  handleToggleHintGlow: () => void;
  onChangeDifficulty: (n: Difficulty) => void;
  onToggleMusic: () => void;
}

export function GameMenu({
  menuOpen,
  setMenuOpen,
  showResetConfirm,
  setShowResetConfirm,
  hintGlow,
  currentDifficulty,
  musicMuted,
  handleShowMap,
  handleRestartPuzzle,
  handleResetRequest,
  handleResetConfirm,
  handleToggleHintGlow,
  onChangeDifficulty,
  onToggleMusic,
}: GameMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [pendingDiff, setPendingDiff] = useState<Difficulty | null>(null);

  function confirmDiffChange(n: Difficulty) {
    onChangeDifficulty(n);
    setPendingDiff(null);
  }

  const currentInfo = DIFFICULTY_INFO[currentDifficulty];

  return (
    <>
      {menuOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div ref={drawerRef} className={`game-drawer${menuOpen ? " game-drawer-open" : ""}`}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.65rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#c8a96e",
            opacity: 0.55,
            padding: "0 24px 16px",
            borderBottom: "1px solid rgba(200,169,110,0.15)",
            marginBottom: 8,
          }}
        >
          {CHAPTER_LABEL}
        </div>

        <button className="drawer-item" onClick={handleShowMap}>
          <span className="drawer-icon">📜</span> Chapter Map
        </button>

        <button className="drawer-item" onClick={handleRestartPuzzle}>
          <span className="drawer-icon">🔁</span> Restart Puzzle
        </button>

        {/* Change Difficulty */}
        <div className="drawer-diff-section">
          <p className="drawer-diff-label">
            Difficulty · <span style={{ color: "#c8a96e" }}>{currentInfo.label}</span>
          </p>
          <div className="drawer-diff-buttons">
            {([3, 4, 5] as const).map((dn) => {
              const info = DIFFICULTY_INFO[dn];
              return (
                <button
                  key={dn}
                  className={`drawer-diff-btn${currentDifficulty === dn ? " drawer-diff-btn-active" : ""}`}
                  onClick={() => currentDifficulty !== dn && setPendingDiff(dn)}
                  disabled={currentDifficulty === dn}
                >
                  {info.starsSymbol}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="drawer-item"
          style={{ color: "rgba(200,169,110,0.4)" }}
          onClick={() => {
            setMenuOpen(false);
            if (window.confirm("Reset all progress in Chapter I? This cannot be undone.")) {
              handleResetConfirm();
            }
          }}
        >
          <span className="drawer-icon">↺</span> Reset Chapter
        </button>

        <div className="drawer-divider" />

        <button className="drawer-item" onClick={handleToggleHintGlow}>
          <span className="drawer-icon">💡</span>
          Movable Tile Glow
          <span className={`drawer-toggle${hintGlow ? " drawer-toggle-on" : ""}`} />
        </button>

        <button className="drawer-item" onClick={onToggleMusic}>
          <span className="drawer-icon">{musicMuted ? "🔇" : "🔊"}</span>
          Music
          <span className={`drawer-toggle${!musicMuted ? " drawer-toggle-on" : ""}`} />
        </button>
      </div>

      {/* Difficulty change confirm */}
      {pendingDiff !== null && (
        <div className="confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-card">
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#c8a96e",
                marginBottom: 16,
              }}
            >
              Change Difficulty
            </p>
            <div className="gold-sep" style={{ marginBottom: 20 }} />
            <p
              style={{
                fontFamily: "'Crimson Text', serif",
                fontStyle: "italic",
                color: "#d4b896",
                fontSize: "1rem",
                lineHeight: 1.65,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Switch to <strong style={{ color: "#c8a96e" }}>{DIFFICULTY_INFO[pendingDiff].label}</strong>?
              <br />This will restart the current puzzle.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="win-btn" onClick={() => setPendingDiff(null)}>
                Cancel
              </button>
              <button className="win-btn win-btn-primary" onClick={() => confirmDiffChange(pendingDiff)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm */}
      {showResetConfirm && (
        <div className="confirm-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-card">
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#c8a96e",
                marginBottom: 16,
              }}
            >
              Reset Chapter
            </p>
            <div className="gold-sep" style={{ marginBottom: 20 }} />
            <p
              style={{
                fontFamily: "'Crimson Text', serif",
                fontStyle: "italic",
                color: "#d4b896",
                fontSize: "1rem",
                lineHeight: 1.65,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              This will erase all progress — stars, unlocks, and saves.
              <br />Are you sure?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="win-btn" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                style={{
                  padding: "10px 22px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#fff",
                  background: "rgba(180,60,50,0.7)",
                  border: "1px solid rgba(220,80,60,0.6)",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,80,60,0.85)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(180,60,50,0.7)")}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
