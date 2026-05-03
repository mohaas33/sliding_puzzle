import type { Difficulty } from "../types";
import type { VoiceGender } from "../utils/narration";
import { DIFFICULTIES, DIFFICULTY_DESCS, PUZZLES, PARTICLES, CHAPTER_LABEL } from "../constants";

interface StartScreenProps {
  voiceOption: "off" | "man" | "woman";
  startDifficulty: Difficulty;
  setStartDifficulty: (n: Difficulty) => void;
  handleStartVoiceSelect: (opt: "off" | "man" | "woman") => void;
  playSample: (gender: VoiceGender) => void;
  handleBeginJourney: () => void;
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
}: StartScreenProps) {
  return (
    <div className="start-screen" onClick={(e) => e.stopPropagation()}>
      <div
        className="start-bg"
        style={{ backgroundImage: `url(${PUZZLES[0]!.imageUrl})` }}
      />
      <div className="start-overlay" />
      <Particles />

      <div className="start-content">
        <div className="start-top">
          <div className="gold-sep" />
          <h1 className="start-title">Shards of Time</h1>
          <p className="start-subtitle">{CHAPTER_LABEL}</p>
          <div className="gold-sep" />
          <p className="start-tagline">
            Piece history back together, one shard at a time.
          </p>
        </div>

        <div className="start-options">
          <div className="start-option-group">
            <span className="start-option-label">Narrator</span>
            <div className="start-toggle-row">
              {(["off", "woman", "man"] as const).map((opt) => (
                <button
                  key={opt}
                  className={`start-toggle${voiceOption === opt ? " start-toggle-active" : ""}`}
                  onClick={() => handleStartVoiceSelect(opt)}
                  onMouseEnter={() => opt !== "off" && playSample(opt)}
                >
                  {opt === "off" ? "🔇 Off" : opt === "woman" ? "👩 Woman" : "👨 Man"}
                </button>
              ))}
            </div>
          </div>

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
            Begin Your Journey
          </button>
          <p className="start-save-hint">Your progress is saved automatically</p>
        </div>
      </div>
    </div>
  );
}
