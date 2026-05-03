import { speak } from "../utils/narration";
import type { NarrationContext, ChapterProgress } from "../types";
import { PUZZLES, CHAPTER_LABEL } from "../constants";
import { getPuzzleState } from "../utils/solver";
import { Waveform } from "./Waveform";

interface ChapterMapProps {
  chapterProgress: ChapterProgress;
  narrationOn: boolean;
  narrationOnRef: React.MutableRefObject<boolean>;
  narratingCtx: NarrationContext;
  narratingMapId: number | null;
  setNarratingCtx: React.Dispatch<React.SetStateAction<NarrationContext>>;
  setNarratingMapId: React.Dispatch<React.SetStateAction<number | null>>;
  handleMapSelect: (idx: number) => void;
  handleResetRequest: () => void;
  stopNarration: () => void;
}

export function ChapterMap({
  chapterProgress,
  narrationOn,
  narrationOnRef,
  narratingCtx,
  narratingMapId,
  setNarratingCtx,
  setNarratingMapId,
  handleMapSelect,
  handleResetRequest,
  stopNarration,
}: ChapterMapProps) {
  return (
    <div className="map-overlay" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h2
          style={{
            fontFamily: "'Cinzel', serif",
            color: "#f0e4c4",
            fontSize: "1.4rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {CHAPTER_LABEL}
        </h2>
        <p
          style={{
            fontFamily: "'Crimson Text', serif",
            fontStyle: "italic",
            color: "#c8a96e",
            fontSize: "0.9rem",
            marginTop: 5,
            opacity: 0.85,
          }}
        >
          {Object.keys(chapterProgress).length} of {PUZZLES.length} Shards Restored
        </p>

        <div style={{ width: "100%", maxWidth: 420, margin: "10px auto 0" }}>
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
                width: `${(Object.keys(chapterProgress).length / PUZZLES.length) * 100}%`,
                background: "linear-gradient(90deg, #a07840, #c8a96e)",
                borderRadius: 2,
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* 4×2 puzzle grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          width: "100%",
          maxWidth: 480,
        }}
      >
        {PUZZLES.map((p, i) => {
          const state = getPuzzleState(p.id, chapterProgress);
          const savedStars = chapterProgress[p.id]?.stars ?? 1;
          const isLocked = state === "locked";
          const isCurrent = state === "current";
          const isCompleted = state === "completed";

          return (
            <div
              key={p.id}
              className={`map-card${isCurrent ? " map-card-current" : ""}`}
              style={{
                animationDelay: `${i * 0.055}s`,
                cursor: isLocked ? "default" : "pointer",
                opacity: isLocked ? 0.55 : 1,
              }}
              onClick={() => !isLocked && handleMapSelect(i)}
              onMouseEnter={() => {
                if (isLocked || !narrationOnRef.current) return;
                setNarratingMapId(p.id);
                speak(p.name, {
                  rate: 0.85,
                  pitch: 0.9,
                  volume: 1.0,
                  onStart: () => { setNarratingCtx("map"); setNarratingMapId(p.id); },
                  onEnd: () => { setNarratingCtx(null); setNarratingMapId(null); },
                });
              }}
              onMouseLeave={() => {
                if (narratingCtx === "map") stopNarration();
              }}
            >
              {/* Background image */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url(${p.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: isLocked
                    ? "blur(3px) brightness(0.25)"
                    : isCompleted
                    ? "brightness(0.55)"
                    : "brightness(0.75)",
                }}
              />

              {/* Dark overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: isLocked
                    ? "rgba(0,0,0,0.6)"
                    : isCompleted
                    ? "rgba(10,8,6,0.45)"
                    : "rgba(10,8,6,0.3)",
                }}
              />

              {/* Puzzle number */}
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  left: 7,
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.62rem",
                  color: isLocked ? "rgba(200,169,110,0.3)" : "#c8a96e",
                  lineHeight: 1,
                  zIndex: 1,
                }}
              >
                {p.id}
              </span>

              {isLocked && (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    opacity: 0.4,
                    zIndex: 1,
                  }}
                >
                  🔒
                </span>
              )}

              {isCompleted && (
                <span
                  style={{
                    position: "absolute",
                    top: "38%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "1.05rem",
                    color: "#c8a96e",
                    zIndex: 1,
                  }}
                >
                  ✓
                </span>
              )}

              {isCurrent && (
                <span
                  style={{
                    position: "absolute",
                    top: "38%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.48rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#0a0806",
                    background: "#c8a96e",
                    padding: "3px 7px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                    zIndex: 1,
                  }}
                >
                  ▶ Play
                </span>
              )}

              {/* Bottom: name + stars */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                  padding: "10px 4px 5px",
                  zIndex: 1,
                }}
              >
                {isCompleted && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "0.58rem",
                      color: "#c8a96e",
                      lineHeight: 1,
                      marginBottom: 2,
                    }}
                  >
                    {Array.from({ length: 3 }, (_, si) => (
                      <span key={si} style={{ opacity: si < savedStars ? 1 : 0.2 }}>
                        ★
                      </span>
                    ))}
                  </div>
                )}
                <p
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.42rem",
                    letterSpacing: "0.04em",
                    textAlign: "center",
                    color: isLocked ? "rgba(200,169,110,0.35)" : "#c8a96e",
                    margin: 0,
                    lineHeight: 1.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  {p.name}
                  {narratingMapId === p.id && narrationOn && <Waveform />}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Chapter */}
      <button
        onClick={handleResetRequest}
        style={{
          marginTop: 22,
          fontFamily: "'Cinzel', serif",
          fontSize: "0.6rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(180,80,60,0.65)",
          background: "transparent",
          border: "1px solid rgba(180,80,60,0.25)",
          borderRadius: 4,
          padding: "6px 14px",
          cursor: "pointer",
          transition: "color 0.2s, border-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(220,100,80,0.9)";
          e.currentTarget.style.borderColor = "rgba(220,100,80,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(180,80,60,0.65)";
          e.currentTarget.style.borderColor = "rgba(180,80,60,0.25)";
        }}
      >
        ↺ Reset All Progress
      </button>
    </div>
  );
}
