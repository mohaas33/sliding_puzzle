import type { PuzzleProgress } from "../types";

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
  // Raw per-puzzle progress keyed by puzzle.id (1-based)
  puzzleProgress: Record<number, PuzzleProgress>;
  // For now only chapter 1 is built — others show as "coming soon"
  builtChapters?: number[];
  onSelectChapter: (chapterId: number) => void;
  onResetRequest: () => void;
}

// Puzzles are numbered 1–8 per chapter: chapter 1 → puzzles 1-8, chapter 2 → 9-16, etc.
function chapterStats(
  puzzleProgress: Record<number, PuzzleProgress>,
  chapterId: number,
  puzzleCount: number,
): { stars: number; completed: number } {
  const first = (chapterId - 1) * puzzleCount + 1;
  const last = chapterId * puzzleCount;
  let stars = 0, completed = 0;
  for (let id = first; id <= last; id++) {
    const p = puzzleProgress[id];
    if (p) { stars += p.stars ?? 0; completed++; }
  }
  return { stars, completed };
}

function StarRow({ earned, max }: { earned: number; max: number }) {
  if (max === 0) return null;
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: 11,
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
          marginLeft: 4,
          fontFamily: "'Cinzel', serif",
          letterSpacing: "0.05em",
        }}
      >
        {earned}/{max}
      </span>
    </div>
  );
}

export function WorldMapScreen({
  puzzleProgress,
  builtChapters = [1],
  onSelectChapter,
  onResetRequest,
}: Props) {
  // Debug: log the raw progress so we can verify the data shape
  console.log('[WorldMapScreen] puzzleProgress:', JSON.stringify(puzzleProgress));

  // Total stars across all built chapters
  let totalStars = 0;
  let totalMaxStars = 0;
  for (const ch of CHAPTERS) {
    if (!builtChapters.includes(ch.id)) continue;
    const { stars, completed } = chapterStats(puzzleProgress, ch.id, ch.puzzleCount);
    totalStars += stars;
    totalMaxStars += completed * 3; // max for puzzles actually attempted
  }

  // Chapter 1 always unlocked; chapter N unlocks when chapter N-1 has any completion
  function isUnlocked(chapterId: number): boolean {
    if (!builtChapters.includes(chapterId)) return false;
    if (chapterId === 1) return true;
    const prev = chapterStats(puzzleProgress, chapterId - 1, CHAPTERS[chapterId - 2]!.puzzleCount);
    return prev.completed > 0;
  }

  function getStatus(chapterId: number): "complete" | "unlocked" | "coming" | "locked" {
    if (!builtChapters.includes(chapterId)) return "coming";
    const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
    const { completed } = chapterStats(puzzleProgress, chapterId, chapter.puzzleCount);
    if (completed >= chapter.puzzleCount) return "complete";
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
        {totalStars > 0 && (
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
          const { stars: earnedStars, completed: completedPuzzles } = chapterStats(
            puzzleProgress,
            chapter.id,
            chapter.puzzleCount,
          );
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
                      margin: "0 0 6px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {chapter.tagline}
                  </p>

                  {/* Stars: only shown once at least one puzzle is done */}
                  {completedPuzzles > 0 && (
                    <StarRow earned={earnedStars} max={completedPuzzles * 3} />
                  )}

                  {/* Puzzle completion progress bar */}
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
                    {completedPuzzles}/{chapter.puzzleCount}
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
