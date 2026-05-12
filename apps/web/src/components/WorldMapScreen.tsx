import type { ChapterProgress } from "../hooks/useGameState";

const CHAPTERS = [
  {
    id: 1,
    name: "Ancient Egypt",
    tagline: "Gods, pharaohs & the Nile",
    emoji: "🏺",
    accentBg: "#3d2a0a",
    accentColor: "#c8a96e",
    puzzleCount: 8,
  },
  {
    id: 2,
    name: "Ancient Greece",
    tagline: "Myths, gods & marble temples",
    emoji: "🏛️",
    accentBg: "#0a1f3d",
    accentColor: "#7eb8e8",
    puzzleCount: 8,
  },
  {
    id: 3,
    name: "Imperial China",
    tagline: "Dynasties, dragons & the Silk Road",
    emoji: "🐉",
    accentBg: "#0d2e1a",
    accentColor: "#5dcaa5",
    puzzleCount: 8,
  },
  {
    id: 4,
    name: "Medieval Europe",
    tagline: "Knights, cathedrals & manuscripts",
    emoji: "⚔️",
    accentBg: "#2e1a0d",
    accentColor: "#ef9f27",
    puzzleCount: 8,
  },
  {
    id: 5,
    name: "Maya Civilization",
    tagline: "Calendars, temples & astronomy",
    emoji: "🌿",
    accentBg: "#1a0d2e",
    accentColor: "#afa9ec",
    puzzleCount: 8,
  },
] as const;

interface Props {
  chapterProgress: Record<number, ChapterProgress>;
  // For now only chapter 1 is built — others show as "coming soon"
  builtChapters?: number[];
  onSelectChapter: (chapterId: number) => void;
  onResetRequest: () => void;
}

function Stars({ earned, max }: { earned: number; max: number }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 12,
            color: i < earned ? "#c8a96e" : "rgba(200,169,110,0.2)",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
      <span
        style={{
          fontSize: 11,
          color: "rgba(200,169,110,0.5)",
          marginLeft: 5,
          fontFamily: "'Cinzel', serif",
          letterSpacing: "0.05em",
        }}
      >
        {earned}/{max}
      </span>
    </div>
  );
}

export function WorldMapScreen({ chapterProgress, builtChapters = [1], onSelectChapter, onResetRequest }: Props) {
  const totalStars = Object.values(chapterProgress).reduce(
    (sum, p) => sum + (p.stars ?? 0),
    0
  );
  const totalMaxStars = builtChapters.reduce(
    (sum, id) => sum + (CHAPTERS.find((c) => c.id === id)?.puzzleCount ?? 0) * 3,
    0
  );

  // Chapter 1 is always unlocked; chapter N unlocks when chapter N-1 has any completed puzzle
  function isUnlocked(chapterId: number): boolean {
    if (!builtChapters.includes(chapterId)) return false;
    if (chapterId === 1) return true;
    const prev = chapterProgress[chapterId - 1];
    return prev != null && (prev.completed ?? 0) > 0;
  }

  function getStatus(chapterId: number): "complete" | "unlocked" | "coming" | "locked" {
    if (!builtChapters.includes(chapterId)) return "coming";
    const prog = chapterProgress[chapterId];
    const puzzleCount = CHAPTERS.find((c) => c.id === chapterId)?.puzzleCount ?? 8;
    if ((prog?.completed ?? 0) >= puzzleCount) return "complete";
    if (isUnlocked(chapterId)) return "unlocked";
    return "locked";
  }

  return (
    <div
      className="world-map-screen"
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(200,169,110,0.5)",
            margin: "0 0 6px",
          }}
        >
          Shards of Time
        </p>
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#c8a96e",
            margin: "0 0 8px",
            letterSpacing: "0.06em",
          }}
        >
          World Map
        </h1>
        {totalMaxStars > 0 && (
          <p
            style={{
              fontSize: 13,
              color: "rgba(200,169,110,0.6)",
              margin: 0,
              fontFamily: "'Cinzel', serif",
              letterSpacing: "0.04em",
            }}
          >
            ★ {totalStars} / {totalMaxStars} stars collected
          </p>
        )}
      </div>

      {/* Chapter cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CHAPTERS.map((chapter) => {
          const status = getStatus(chapter.id);
          const prog = chapterProgress[chapter.id];
          const earnedStars = prog?.stars ?? 0;
          const maxStars = chapter.puzzleCount * 3;
          const completedPuzzles = prog?.completed ?? 0;
          const isClickable = status === "unlocked" || status === "complete";

          return (
            <div
              key={chapter.id}
              onClick={() => isClickable && onSelectChapter(chapter.id)}
              style={{
                background: "rgba(15,10,5,0.6)",
                border: `1px solid ${
                  status === "complete"
                    ? "rgba(200,169,110,0.4)"
                    : status === "unlocked"
                    ? "rgba(200,169,110,0.2)"
                    : "rgba(200,169,110,0.08)"
                }`,
                borderRadius: 12,
                overflow: "hidden",
                cursor: isClickable ? "pointer" : "default",
                opacity: status === "locked" ? 0.45 : status === "coming" ? 0.35 : 1,
                transition: "border-color 0.2s, opacity 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                }}
              >
                {/* Era icon */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    background: chapter.accentBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    flexShrink: 0,
                  }}
                >
                  {chapter.emoji}
                </div>

                {/* Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(200,169,110,0.4)",
                      margin: "0 0 2px",
                    }}
                  >
                    Chapter {chapter.id}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: chapter.accentColor,
                      margin: "0 0 3px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {chapter.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(200,169,110,0.5)",
                      margin: "0 0 8px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {chapter.tagline}
                  </p>

                  {status !== "coming" && (
                    <Stars earned={earnedStars} max={maxStars} />
                  )}

                  {/* Progress bar */}
                  {(status === "complete" || status === "unlocked") && (
                    <div
                      style={{
                        height: 2,
                        background: "rgba(200,169,110,0.12)",
                        borderRadius: 2,
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          height: 2,
                          borderRadius: 2,
                          background: chapter.accentColor,
                          width: `${Math.round((completedPuzzles / chapter.puzzleCount) * 100)}%`,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Right side badge */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {status === "complete" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: "rgba(29,158,117,0.15)",
                        color: "#5dcaa5",
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Complete
                    </span>
                  )}
                  {status === "unlocked" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: "rgba(200,169,110,0.12)",
                        color: "#c8a96e",
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Active
                    </span>
                  )}
                  {status === "locked" && (
                    <span style={{ fontSize: 18, color: "rgba(200,169,110,0.3)" }}>🔒</span>
                  )}
                  {status === "coming" && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        borderRadius: 20,
                        background: "rgba(200,169,110,0.06)",
                        color: "rgba(200,169,110,0.35)",
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Soon
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(200,169,110,0.35)",
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    {chapter.puzzleCount} shards
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "rgba(200,169,110,0.3)",
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.04em",
          }}
        >
          Complete a chapter to unlock the next era
        </p>
        <button
          onClick={onResetRequest}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.7rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(200,169,110,0.35)",
            background: "transparent",
            border: "1px solid rgba(200,169,110,0.12)",
            borderRadius: 4,
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
