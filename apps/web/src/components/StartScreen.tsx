import type { Difficulty } from "../types";
import { DIFFICULTY_INFO, PUZZLES, PARTICLES, AUTH_PROVIDER_KEY } from "../constants";
import { loadProgress } from "../utils/storage";

const DIFFICULTIES: (3 | 4 | 5)[] = [3, 4, 5];

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  email: "Email",
};

interface StartScreenProps {
  startDifficulty: Difficulty;
  setStartDifficulty: (n: Difficulty) => void;
  handleBeginJourney: () => void;
  handleContinue: () => void;
  handleShowAuth: () => void;
  handleShowLeaderboard: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

function Particles() {
  return (
    <div className="particles-container" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export function StartScreen({
  startDifficulty,
  setStartDifficulty,
  handleBeginJourney,
  handleContinue,
  handleShowAuth,
  handleShowLeaderboard,
  isMuted,
  onToggleMute,
}: StartScreenProps) {
  const hasProgress = Object.keys(loadProgress()).length > 0;
  const authProvider = localStorage.getItem(AUTH_PROVIDER_KEY);

  return (
    <div className="start-screen" onClick={(e) => e.stopPropagation()}>
      <div
        className="start-bg"
        style={{
          backgroundImage: `url(${PUZZLES[0]!.imageUrl})`,
          filter: "blur(12px) brightness(0.15) saturate(0.5)",
        }}
      />
      <div className="start-overlay" style={{ background: "rgba(10,8,6,0.85)" }} />
      <Particles />

      <div className="start-content">
        {/* ── Title ── */}
        <div className="start-top">
          <div className="gold-sep" />
          <h1 className="start-title">Shards of Time</h1>
          <div className="gold-sep" />
          <p className="start-tagline">Restore the fragments of history</p>
        </div>

        {/* ── Difficulty ── */}
        <div className="start-options">
          <div className="start-option-group">
            <span className="start-option-label">Difficulty</span>
            <div className="difficulty-rows">
              {DIFFICULTIES.map((dn) => {
                const info = DIFFICULTY_INFO[dn];
                const active = startDifficulty === dn;
                return (
                  <button
                    key={dn}
                    className={`diff-row${active ? " diff-row-active" : ""}`}
                    onClick={() => setStartDifficulty(dn)}
                  >
                    <span className="diff-row-stars">{info.starsSymbol}</span>
                    <span className="diff-row-label">{info.label}</span>
                    <span className="diff-row-meta">{info.tiles} tiles</span>
                    <span className="diff-row-mult">×{info.multiplier}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="start-bottom">
          <button className="start-begin-btn" onClick={handleBeginJourney}>
            Begin Journey
          </button>
          {hasProgress ? (
            <button className="start-new-game-link" onClick={handleContinue}>
              Continue
            </button>
          ) : (
            <p className="start-save-hint">Your progress is saved automatically</p>
          )}
          <button className="start-new-game-link" onClick={handleShowLeaderboard}>
            🏆 Leaderboard
          </button>
          <button className="start-new-game-link" onClick={handleShowAuth}>
            {authProvider && authProvider !== "guest"
              ? `${PROVIDER_LABELS[authProvider] ?? authProvider} ✓`
              : "Sign In"}
          </button>
        </div>
      </div>

      <button
        className="narration-btn"
        onClick={onToggleMute}
        title={isMuted ? "Unmute music" : "Mute music"}
        aria-label={isMuted ? "Unmute music" : "Mute music"}
        style={{ position: "absolute", bottom: 20, right: 20 }}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}
