import { useState } from "react";
import type { PuzzleProgress } from "../types";
import { PUZZLES } from "../constants";

interface LeaderboardEntry {
  rank: number;
  name: string;
  stars: number;
  points: number;
  chapter: number;
}

interface LeaderboardScreenProps {
  puzzleProgress: Record<number, PuzzleProgress>;
  playerName: string;
  onBack: () => void;
}

const TABS = ["Global", "Friends", "This Chapter"] as const;
type Tab = (typeof TABS)[number];

const GLOBAL_PLACEHOLDER: LeaderboardEntry[] = [
  { rank: 1,  name: "Amenhotep",   stars: 24, points: 8420, chapter: 3 },
  { rank: 2,  name: "Nefertari",   stars: 22, points: 7650, chapter: 3 },
  { rank: 3,  name: "Khufu",       stars: 21, points: 7200, chapter: 2 },
  { rank: 4,  name: "Thutmose",    stars: 20, points: 6890, chapter: 2 },
  { rank: 5,  name: "Hatshepsut",  stars: 19, points: 6300, chapter: 2 },
  { rank: 6,  name: "Ramesses",    stars: 18, points: 5820, chapter: 2 },
  { rank: 7,  name: "Cleopatra",   stars: 17, points: 5400, chapter: 1 },
  { rank: 8,  name: "Nefertiti",   stars: 15, points: 4900, chapter: 1 },
  { rank: 9,  name: "Tutankhamun", stars: 14, points: 4200, chapter: 1 },
  { rank: 10, name: "Akhenaten",   stars: 12, points: 3600, chapter: 1 },
];

const MEDAL: Record<number, { color: string; bg: string; border: string }> = {
  1: { color: "#ffd700", bg: "rgba(255,215,0,0.08)",    border: "rgba(255,215,0,0.25)"    },
  2: { color: "#c0c0c0", bg: "rgba(192,192,192,0.07)",  border: "rgba(192,192,192,0.2)"   },
  3: { color: "#cd7f32", bg: "rgba(205,127,50,0.08)",   border: "rgba(205,127,50,0.25)"   },
};

const COL = "40px 1fr 52px 76px 40px";

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: COL,
      gap: 8,
      padding: "6px 10px",
      marginBottom: 4,
    }}>
      {cols.map((c) => (
        <span key={c} style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "9px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(200,169,110,0.4)",
        }}>{c}</span>
      ))}
    </div>
  );
}

function EntryRow({
  entry,
  isPlayer = false,
}: {
  entry: LeaderboardEntry;
  isPlayer?: boolean;
}) {
  const medal = MEDAL[entry.rank];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: COL,
      gap: 8,
      padding: "9px 10px",
      borderRadius: 6,
      background: isPlayer
        ? "rgba(200,169,110,0.1)"
        : medal ? medal.bg : "rgba(255,255,255,0.02)",
      border: `1px solid ${
        isPlayer ? "rgba(200,169,110,0.35)"
        : medal ? medal.border
        : "transparent"
      }`,
      alignItems: "center",
    }}>
      <span style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.72rem",
        fontWeight: 700,
        color: isPlayer ? "#c8a96e" : medal ? medal.color : "rgba(200,169,110,0.45)",
      }}>
        {isPlayer ? "—" : `#${entry.rank}`}
      </span>
      <span style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.72rem",
        color: isPlayer ? "#f0e4c4" : "rgba(240,228,196,0.8)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {entry.name}{isPlayer ? " ✦" : ""}
      </span>
      <span style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.68rem",
        color: isPlayer ? "#c8a96e" : "rgba(200,169,110,0.65)",
      }}>
        {entry.stars} ★
      </span>
      <span style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.68rem",
        color: isPlayer ? "#c8a96e" : "rgba(200,169,110,0.65)",
      }}>
        {entry.points.toLocaleString()}
      </span>
      <span style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.65rem",
        color: "rgba(200,169,110,0.4)",
      }}>
        {entry.chapter}
      </span>
    </div>
  );
}

function GlobalTab({ puzzleProgress, playerName }: { puzzleProgress: Record<number, PuzzleProgress>; playerName: string }) {
  const totalStars = Object.values(puzzleProgress).reduce((s, p) => s + (p.stars ?? 0), 0);
  const totalPoints = Object.values(puzzleProgress).reduce((s, p) => s + (p.points ?? 0), 0);
  const ids = Object.keys(puzzleProgress).map(Number);
  const highestChapter = ids.length > 0 ? Math.ceil(Math.max(...ids) / 8) : 1;

  const playerEntry: LeaderboardEntry = {
    rank: 0,
    name: playerName,
    stars: totalStars,
    points: totalPoints,
    chapter: highestChapter,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        marginBottom: 8,
        background: "rgba(200,169,110,0.04)",
        border: "1px solid rgba(200,169,110,0.14)",
        borderRadius: 6,
      }}>
        <span style={{ fontSize: 13 }}>🔒</span>
        <span style={{
          fontFamily: "'Crimson Text', serif",
          fontStyle: "italic",
          fontSize: "0.82rem",
          color: "rgba(200,169,110,0.6)",
        }}>
          Sign in to see global rankings
        </span>
      </div>

      <TableHeader cols={["Rank", "Name", "Stars", "Points", "Ch."]} />
      {GLOBAL_PLACEHOLDER.map((entry) => (
        <EntryRow key={entry.rank} entry={entry} />
      ))}

      <div style={{ height: 1, background: "rgba(200,169,110,0.15)", margin: "8px 0 4px" }} />
      <EntryRow entry={playerEntry} isPlayer />
    </div>
  );
}

function FriendsTab() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      padding: "32px 16px",
    }}>
      <span style={{ fontSize: 36, opacity: 0.4 }}>👥</span>
      <p style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "0.8rem",
        letterSpacing: "0.08em",
        color: "rgba(200,169,110,0.5)",
        textAlign: "center",
        margin: 0,
      }}>
        Invite friends to compete
      </p>
      <p style={{
        fontFamily: "'Crimson Text', serif",
        fontStyle: "italic",
        fontSize: "0.88rem",
        color: "rgba(200,169,110,0.35)",
        textAlign: "center",
        margin: 0,
        maxWidth: 260,
        lineHeight: 1.55,
      }}>
        Challenge fellow historians and see who can restore history the fastest.
      </p>
      <button
        onClick={() => console.log("Share stub clicked")}
        style={{
          marginTop: 8,
          padding: "10px 24px",
          fontFamily: "'Cinzel', serif",
          fontSize: "0.72rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#c8a96e",
          background: "rgba(200,169,110,0.07)",
          border: "1px solid rgba(200,169,110,0.3)",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Share Game
      </button>
    </div>
  );
}

function ThisChapterTab({ puzzleProgress, playerName }: { puzzleProgress: Record<number, PuzzleProgress>; playerName: string }) {
  const completed = Object.entries(puzzleProgress)
    .map(([idStr, prog]) => {
      const id = Number(idStr);
      const puzzle = PUZZLES.find((p) => p.id === id);
      return { id, name: puzzle?.name ?? `Puzzle ${id}`, stars: prog.stars ?? 0, points: prog.points ?? 0, chapter: Math.ceil(id / 8) };
    })
    .sort((a, b) => b.points - a.points);

  if (completed.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 16px" }}>
        <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: "italic", color: "rgba(200,169,110,0.4)", margin: 0 }}>
          No puzzles completed yet.
        </p>
      </div>
    );
  }

  const totalStars = completed.reduce((s, p) => s + p.stars, 0);
  const totalPoints = completed.reduce((s, p) => s + p.points, 0);

  const COL_LOCAL = "28px 1fr 52px 76px 40px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: COL_LOCAL,
        gap: 8,
        padding: "6px 10px",
        marginBottom: 4,
      }}>
        {["#", "Puzzle", "Stars", "Points", "Ch."].map((c) => (
          <span key={c} style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "9px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(200,169,110,0.4)",
          }}>{c}</span>
        ))}
      </div>

      {completed.map((entry, i) => (
        <div key={entry.id} style={{
          display: "grid",
          gridTemplateColumns: COL_LOCAL,
          gap: 8,
          padding: "9px 10px",
          borderRadius: 6,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid transparent",
          alignItems: "center",
        }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", color: "rgba(200,169,110,0.35)" }}>{i + 1}</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", color: "rgba(240,228,196,0.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name}</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", color: "rgba(200,169,110,0.6)" }}>{entry.stars} ★</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", color: "rgba(200,169,110,0.6)" }}>{entry.points.toLocaleString()}</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(200,169,110,0.35)" }}>{entry.chapter}</span>
        </div>
      ))}

      <div style={{ height: 1, background: "rgba(200,169,110,0.15)", margin: "8px 0 4px" }} />

      {/* Total row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: COL_LOCAL,
        gap: 8,
        padding: "9px 10px",
        borderRadius: 6,
        background: "rgba(200,169,110,0.1)",
        border: "1px solid rgba(200,169,110,0.35)",
        alignItems: "center",
      }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(200,169,110,0.45)" }}>—</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", color: "#f0e4c4" }}>{playerName} ✦</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", color: "#c8a96e" }}>{totalStars} ★</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", color: "#c8a96e" }}>{totalPoints.toLocaleString()}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(200,169,110,0.4)" }}>—</span>
      </div>
    </div>
  );
}

export function LeaderboardScreen({ puzzleProgress, playerName, onBack }: LeaderboardScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Global");

  return (
    <div className="cinematic-overlay" onClick={(e) => e.stopPropagation()} style={{ overflowY: "auto" }}>
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontFamily: "'Cinzel', serif",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(200,169,110,0.6)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "6px 4px",
        }}
      >
        ← Back
      </button>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: 480,
        paddingTop: 8,
      }}>
        <span style={{ fontSize: 28, marginBottom: 8 }}>🏆</span>
        <h2 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(18px, 4vw, 24px)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#f0e4c4",
          margin: "0 0 4px",
        }}>
          Hall of Scribes
        </h2>
        <div className="gold-sep" style={{ width: 100, marginBottom: 24 }} />

        {/* Tab bar */}
        <div style={{
          display: "flex",
          gap: 6,
          width: "100%",
          marginBottom: 20,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "9px 6px",
                fontFamily: "'Cinzel', serif",
                fontSize: "0.62rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: activeTab === tab ? "#f0e4c4" : "rgba(200,169,110,0.45)",
                background: activeTab === tab ? "rgba(200,169,110,0.12)" : "rgba(200,169,110,0.04)",
                border: `1px solid ${activeTab === tab ? "rgba(200,169,110,0.45)" : "rgba(200,169,110,0.12)"}`,
                borderRadius: 5,
                cursor: "pointer",
                transition: "color 0.15s, background 0.15s, border-color 0.15s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Global" && (
          <GlobalTab puzzleProgress={puzzleProgress} playerName={playerName} />
        )}
        {activeTab === "Friends" && <FriendsTab />}
        {activeTab === "This Chapter" && (
          <ThisChapterTab puzzleProgress={puzzleProgress} playerName={playerName} />
        )}
      </div>
    </div>
  );
}
