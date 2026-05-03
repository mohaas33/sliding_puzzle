import type { Difficulty } from "../types";
import type { VoiceGender } from "../utils/narration";
import { DIFFICULTIES, DIFFICULTY_DESCS, PUZZLES, PARTICLES } from "../constants";
import { loadProgress } from "../utils/storage";

const NAME_PRESETS = ["Kha", "Neferu", "Amenhotep", "Merit"];

interface StartScreenProps {
  voiceOption: "off" | "man" | "woman";
  startDifficulty: Difficulty;
  setStartDifficulty: (n: Difficulty) => void;
  handleStartVoiceSelect: (opt: "off" | "man" | "woman") => void;
  playSample: (gender: VoiceGender) => void;
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
  voiceOption,
  startDifficulty,
  setStartDifficulty,
  handleStartVoiceSelect,
  playSample,
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
      <div className="start-overlay" />
      <Particles />

      <div className="start-content">
        <div className="start-top">
          <div className="gold-sep" />
          <h1 className="start-title">Shards of Time</h1>
          <p className="start-subtitle">Chapter I · Ancient Egypt</p>
          <div className="gold-sep" />
          <p className="start-tagline">
            Piece history back together, one shard at a time.
          </p>
        </div>

        <div className="start-options">
          {/* Narrator */}
          <div className="start-option-group">
            <span className="start-option-label">Narrator</span>
            <div className="start-toggle-row">
              {(["off", "woman", "man"] as const).map((opt) => (
                <button
                  key={opt}
                  className={`start-toggle${voiceOption === opt ? " start-toggle-active" : ""}`}
                  onClick={() => handleStartVoiceSelect(opt)}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {opt === "off" ? "🔇 Off" : opt === "woman" ? "👩 Woman" : "👨 Man"}
                    {opt !== "off" && (
                      <span
                        className="voice-preview"
                        onClick={(e) => { e.stopPropagation(); playSample(opt); }}
                        title={`Preview ${opt} voice`}
                        role="button"
                        aria-label={`Preview ${opt} voice`}
                      >
                        ▶
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Player name */}
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
              {NAME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  className={`name-preset-btn${playerName === preset ? " name-preset-btn-active" : ""}`}
                  onClick={() => onPlayerNameChange(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="start-option-group">
            <span className="start-option-label">Difficulty</span>
            <div className="start-toggle-row">
              {DIFFICULTIES.map(({ n: dn, label }) => (
                <button
                  key={dn}
                  className={`start-toggle start-toggle-tall${startDifficulty === dn ? " start-toggle-active" : ""}`}
                  onClick={() => setStartDifficulty(dn)}
                >
                  <span>{label}</span>
                  <span className="start-toggle-desc">{DIFFICULTY_DESCS[dn]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
