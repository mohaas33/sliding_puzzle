import type { Difficulty } from "../types";
import { DIFFICULTY_INFO, PUZZLES, PARTICLES } from "../constants";
import { loadProgress } from "../utils/storage";

const NAME_PRESETS = [
  { name: "Kha",       meaning: "To Rise · Scribe"            },
  { name: "Neferu",    meaning: "Beautiful One · Noble"        },
  { name: "Amenhotep", meaning: "Amun is Satisfied · Pharaoh" },
  { name: "Merit",     meaning: "Beloved · Priestess"          },
];

const DIFFICULTIES: (3 | 4 | 5)[] = [3, 4, 5];

interface StartScreenProps {
  startDifficulty: Difficulty;
  setStartDifficulty: (n: Difficulty) => void;
  handleBeginJourney: () => void;
  handleNewGame: () => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
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
  handleNewGame,
  playerName,
  onPlayerNameChange,
}: StartScreenProps) {
  const hasProgress = Object.keys(loadProgress()).length > 0;

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
          <p className="start-subtitle">Chapter I · Ancient Egypt</p>
          <div className="gold-sep" />
          <p className="start-tagline">Piece history back together, one shard at a time.</p>
        </div>

        <div className="start-options">
          {/* ── Narrator ── */}
          {/* ── Player name ── */}
          <div className="start-option-group">
            <span className="start-option-label">Your name in the Book of the Dead</span>
            <input
              type="text"
              className="name-input"
              value={playerName}
              maxLength={20}
              placeholder="Enter your name"
              onChange={(e) => onPlayerNameChange(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            <div className="name-presets">
              {NAME_PRESETS.map(({ name, meaning }) => (
                <button
                  key={name}
                  className={`name-preset-btn${playerName === name ? " name-preset-btn-active" : ""}`}
                  onClick={() => onPlayerNameChange(name)}
                  title={meaning}
                >
                  <span className="name-preset-name">{name}</span>
                  <span className="name-preset-meaning">{meaning}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Difficulty ── */}
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

        {/* ── Begin ── */}
        <div className="start-bottom">
          <button className="start-begin-btn" onClick={handleBeginJourney}>
            {hasProgress ? "Continue Your Journey" : "Begin Your Journey"}
          </button>
          {hasProgress ? (
            <button className="start-new-game-link" onClick={handleNewGame}>
              Start New Game
            </button>
          ) : (
            <p className="start-save-hint">Your progress is saved automatically</p>
          )}
        </div>
      </div>

      <p className="start-chapter-footer">Chapter I of V · Ancient Egypt</p>
    </div>
  );
}
