import { useState, useEffect } from "react";
import type { PuzzleProgress } from "../types";

const CHAPTERS = [
  { id: 1, name: "Ancient Egypt",     tagline: "Gods, pharaohs & the Nile",           emoji: "🏺", accentBg: "#3d2a0a", accentColor: "#c8a96e", puzzleCount: 8 },
  { id: 2, name: "Ancient Greece",    tagline: "Myths, gods & marble temples",         emoji: "🏛️", accentBg: "#0a1f3d", accentColor: "#7eb8e8", puzzleCount: 8 },
  { id: 3, name: "Imperial China",    tagline: "Dynasties, dragons & the Silk Road",  emoji: "🐉", accentBg: "#0d2e1a", accentColor: "#5dcaa5", puzzleCount: 8 },
  { id: 4, name: "Medieval Europe",   tagline: "Knights, cathedrals & manuscripts",   emoji: "⚔️", accentBg: "#2e1a0d", accentColor: "#ef9f27", puzzleCount: 8 },
  { id: 5, name: "Maya Civilization", tagline: "Calendars, temples & astronomy",      emoji: "🌿", accentBg: "#1a0d2e", accentColor: "#afa9ec", puzzleCount: 8 },
] as const;

const IS_PREMIUM_KEY = "isPremium";

// Progress ring constants
const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R; // ≈ 163.36

// Staggered entrance delays per card index
const CARD_DELAYS = [0, 60, 120, 180, 240];

type ChapterStatus = "complete" | "unlocked" | "locked" | "coming" | "paywalled";

interface Props {
  puzzleProgress: Record<number, PuzzleProgress>;
  builtChapters?: number[];
  onSelectChapter: (chapterId: number) => void;
  onResetRequest: () => void;
}

function chapterStats(
  puzzleProgress: Record<number, PuzzleProgress>,
  chapterId: number,
  puzzleCount: number,
): { stars: number; completed: number } {
  const first = (chapterId - 1) * puzzleCount + 1;
  const last  = chapterId * puzzleCount;
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
        <span key={i} style={{ fontSize: 11, color: i < earned ? "#c8a96e" : "rgba(200,169,110,0.2)", lineHeight: 1 }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: "rgba(200,169,110,0.5)", marginLeft: 4, fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>
        {earned}/{max}
      </span>
    </div>
  );
}

// SVG progress ring around the era icon
function ProgressRing({
  pct,
  accentColor,
  mounted,
}: {
  pct: number;
  accentColor: string;
  mounted: boolean;
}) {
  const dashLen = (mounted ? pct : 0) * RING_C;
  return (
    <svg
      width={56}
      height={56}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        transform: "rotate(-90deg)",
        overflow: "visible",
        filter: mounted && pct >= 1 ? `drop-shadow(0 0 4px ${accentColor})` : undefined,
      }}
    >
      {/* Track */}
      <circle
        cx={28} cy={28} r={RING_R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={2.5}
      />
      {/* Fill arc — only when there is progress */}
      {pct > 0 && (
        <circle
          cx={28} cy={28} r={RING_R}
          fill="none"
          stroke={accentColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${dashLen} ${RING_C}`}
          style={{
            transition: mounted
              ? "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)"
              : "none",
          }}
        />
      )}
    </svg>
  );
}

// Upgrade modal with entrance + exit animations
function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  const bullets = [
    "Ancient Greece — myths & marble temples",
    "Imperial China — dynasties & the Silk Road",
    "Medieval Europe · Maya Civilization — coming soon",
  ];

  return (
    <div
      onClick={handleClose}
      style={{
        position: "absolute",
        inset: 0,
        minHeight: "100%",
        background: "rgba(0,0,0,0.82)",
        opacity: visible ? 1 : 0,
        transition: "opacity 220ms",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #1a1208 0%, #0d0a05 100%)",
          border: "1px solid rgba(200,169,110,0.35)",
          borderRadius: 16,
          padding: "32px 28px 28px",
          maxWidth: 380,
          width: "100%",
          position: "relative",
          boxSizing: "border-box",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          transition: "opacity 220ms ease, transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Close X */}
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "transparent",
            border: "none",
            color: "rgba(200,169,110,0.45)",
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>

        {/* Top divider */}
        <div style={{ width: 48, height: 1, background: "rgba(200,169,110,0.4)", margin: "0 auto 22px" }} />

        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.25rem", fontWeight: 700, color: "#c8a96e", textAlign: "center", margin: "0 0 8px", letterSpacing: "0.05em" }}>
          Unlock All Chapters
        </h2>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", color: "rgba(200,169,110,0.5)", textAlign: "center", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 26px" }}>
          Five chapters · 40 puzzles · Five ancient civilizations
        </p>

        <ul style={{ listStyle: "none", margin: "0 0 26px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {bullets.map((item) => (
            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(200,169,110,0.8)", lineHeight: 1.5 }}>
              <span style={{ color: "#c8a96e", flexShrink: 0, marginTop: 2 }}>✦</span>
              {item}
            </li>
          ))}
        </ul>

        <div style={{ height: 1, background: "rgba(200,169,110,0.12)", margin: "0 0 22px" }} />

        <p style={{ textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: "1.15rem", fontWeight: 700, color: "#c8a96e", margin: "0 0 4px", letterSpacing: "0.04em" }}>
          $4.99
        </p>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(200,169,110,0.4)", margin: "0 0 22px", letterSpacing: "0.04em" }}>
          One-time purchase · No subscription
        </p>

        <a
          href="/upgrade"
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: "13px 0",
            borderRadius: 8,
            background: "linear-gradient(135deg, #c8a96e 0%, #a07c3c 100%)",
            color: "#0d0a05",
            fontFamily: "'Cinzel', serif",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            marginBottom: 12,
            boxSizing: "border-box",
            boxShadow: "0 2px 14px rgba(200,169,110,0.3)",
          }}
        >
          Unlock Now
        </a>

        <button
          onClick={handleClose}
          style={{
            display: "block",
            width: "100%",
            padding: "11px 0",
            background: "transparent",
            border: "1px solid rgba(200,169,110,0.18)",
            borderRadius: 8,
            color: "rgba(200,169,110,0.45)",
            fontFamily: "'Cinzel', serif",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}

export function WorldMapScreen({
  puzzleProgress,
  builtChapters = [1],
  onSelectChapter,
  onResetRequest,
}: Props) {
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem(IS_PREMIUM_KEY) === "1");
  const [modalOpen, setModalOpen] = useState(false);
  const [tapCount,  setTapCount]  = useState(0);
  const [mounted,   setMounted]   = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Trigger entrance animations one frame after mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  // 5-tap on "World Map" title toggles isPremium for testing
  function handleTitleTap() {
    const next = tapCount + 1;
    if (next >= 5) {
      const newVal = !isPremium;
      setIsPremium(newVal);
      localStorage.setItem(IS_PREMIUM_KEY, newVal ? "1" : "0");
      setTapCount(0);
    } else {
      setTapCount(next);
    }
  }

  function getStatus(chapterId: number): ChapterStatus {
    if (chapterId === 1) {
      const { completed } = chapterStats(puzzleProgress, 1, CHAPTERS[0].puzzleCount);
      return completed >= CHAPTERS[0].puzzleCount ? "complete" : "unlocked";
    }
    if (!builtChapters.includes(chapterId)) {
      return isPremium ? "coming" : "paywalled";
    }
    const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
    const { completed } = chapterStats(puzzleProgress, chapterId, chapter.puzzleCount);
    if (completed >= chapter.puzzleCount) return "complete";
    const prev = chapterStats(puzzleProgress, chapterId - 1, CHAPTERS[chapterId - 2]!.puzzleCount);
    return prev.completed > 0 ? "unlocked" : "locked";
  }

  let totalStars = 0, totalMaxStars = 0;
  for (const ch of CHAPTERS) {
    if (!builtChapters.includes(ch.id)) continue;
    const { stars, completed } = chapterStats(puzzleProgress, ch.id, ch.puzzleCount);
    totalStars += stars;
    totalMaxStars += completed * 3;
  }

  return (
    <div className="world-map-screen" style={{ position: "relative", width: "100%", minHeight: "100vh" }}>

      {/* Shimmer keyframe injected once */}
      <style>{`
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(250%); }
        }
      `}</style>

      {/* Centered content column */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          paddingBottom: 48,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(200,169,110,0.5)", margin: "0 0 6px" }}>
            Shards of Time
          </p>
          <h1
            onClick={handleTitleTap}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "#c8a96e",
              margin: "0 0 8px",
              letterSpacing: "0.06em",
              cursor: "default",
              userSelect: "none",
            }}
          >
            World Map
          </h1>
          {/* Decorative separator */}
          <div style={{ width: 48, height: 1, background: "rgba(200,169,110,0.4)", margin: "10px auto 16px" }} />
          {isPremium && (
            <p style={{ fontSize: 10, color: "rgba(200,169,110,0.35)", fontFamily: "'Cinzel', serif", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 4px" }}>
              ✦ Premium
            </p>
          )}
          {totalStars > 0 && (
            <p style={{ fontSize: 13, color: "rgba(200,169,110,0.6)", margin: 0, fontFamily: "'Cinzel', serif", letterSpacing: "0.04em" }}>
              ★ {totalStars} / {totalMaxStars} stars collected
            </p>
          )}
        </div>

        {/* Chapter cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CHAPTERS.map((chapter, idx) => {
            const status         = getStatus(chapter.id);
            const { stars: earnedStars, completed: completedPuzzles } = chapterStats(puzzleProgress, chapter.id, chapter.puzzleCount);
            const isClickable    = status === "unlocked" || status === "complete";
            const isPaywalled    = status === "paywalled";
            const isHovered      = hoveredId === chapter.id && isClickable;
            const delay          = CARD_DELAYS[idx] ?? 0;
            const pct            = completedPuzzles / chapter.puzzleCount;

            const baseBorder = status === "complete" ? "rgba(200,169,110,0.4)"
              : status === "unlocked"               ? "rgba(200,169,110,0.2)"
              : isPaywalled                         ? "rgba(200,169,110,0.22)"
              : "rgba(200,169,110,0.08)";

            const borderColor = isHovered ? `${chapter.accentColor}80` : baseBorder;

            const baseOpacity = status === "locked" ? 0.45 : status === "coming" ? 0.35 : 1;

            return (
              // Outer wrapper: hover lift only (separate transform so it doesn't interfere with entrance)
              <div
                key={chapter.id}
                onMouseEnter={() => isClickable && setHoveredId(chapter.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                  transition: "transform 0.18s ease",
                  borderRadius: 12,
                }}
              >
                {/* Inner card: entrance animation, border, background, shimmer container */}
                <div
                  onClick={() => {
                    if (isPaywalled) setModalOpen(true);
                    else if (isClickable) onSelectChapter(chapter.id);
                  }}
                  style={{
                    position: "relative",
                    background: "rgba(15,10,5,0.6)",
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    cursor: isClickable || isPaywalled ? "pointer" : "default",
                    // Entrance: fade + slide up; hover: border-color + box-shadow via same transition
                    opacity: mounted ? baseOpacity : 0,
                    transform: mounted ? "translateY(0)" : "translateY(16px)",
                    boxShadow: isHovered
                      ? `0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px ${chapter.accentColor}33`
                      : "none",
                    transition: `opacity 350ms ease-out ${delay}ms, transform 350ms ease-out ${delay}ms, border-color 0.18s ease, box-shadow 0.18s ease`,
                  }}
                >
                  {/* Complete chapter shimmer sweep */}
                  {status === "complete" && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        width: "40%",
                        background: `linear-gradient(90deg, transparent, ${chapter.accentColor}12, transparent)`,
                        animation: "shimmer 3s infinite ease-in-out",
                        pointerEvents: "none",
                        zIndex: 0,
                      }}
                    />
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", position: "relative", zIndex: 1 }}>

                    {/* Era icon + SVG progress ring */}
                    <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
                      <div style={{
                        position: "absolute",
                        top: 2, right: 2, bottom: 2, left: 2,
                        borderRadius: 10,
                        background: chapter.accentBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}>
                        {chapter.emoji}
                      </div>
                      <ProgressRing pct={pct} accentColor={chapter.accentColor} mounted={mounted} />
                    </div>

                    {/* Meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(200,169,110,0.4)", margin: "0 0 2px" }}>
                        Chapter {chapter.id}
                      </p>
                      <p style={{ fontFamily: "'Cinzel', serif", fontSize: "15px", fontWeight: 700, color: chapter.accentColor, margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {chapter.name}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(200,169,110,0.5)", margin: "0 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {chapter.tagline}
                      </p>

                      {completedPuzzles > 0 && (
                        <StarRow earned={earnedStars} max={completedPuzzles * 3} />
                      )}

                      {(status === "complete" || status === "unlocked") && (
                        <div style={{ height: 2, background: "rgba(200,169,110,0.12)", borderRadius: 2, marginTop: 8 }}>
                          <div style={{ height: 2, borderRadius: 2, background: chapter.accentColor, width: `${Math.round((completedPuzzles / chapter.puzzleCount) * 100)}%`, transition: "width 0.4s ease" }} />
                        </div>
                      )}
                    </div>

                    {/* Right badge */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                      {status === "complete" && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: "rgba(29,158,117,0.15)", color: "#5dcaa5", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Complete
                        </span>
                      )}
                      {status === "unlocked" && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: "rgba(200,169,110,0.12)", color: "#c8a96e", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Active
                        </span>
                      )}
                      {status === "locked" && (
                        <span style={{ fontSize: 18, color: "rgba(200,169,110,0.3)" }}>🔒</span>
                      )}
                      {isPaywalled && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "rgba(200,169,110,0.14)", color: "#c8a96e", fontFamily: "'Cinzel', serif", letterSpacing: "0.07em", textTransform: "uppercase", border: "1px solid rgba(200,169,110,0.3)", whiteSpace: "nowrap" }}>
                          🔒 Unlock
                        </span>
                      )}
                      {status === "coming" && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(200,169,110,0.06)", color: "rgba(200,169,110,0.35)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Soon
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "rgba(200,169,110,0.35)", fontFamily: "'Cinzel', serif" }}>
                        {completedPuzzles}/{chapter.puzzleCount}
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 28, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(200,169,110,0.3)", fontFamily: "'Cinzel', serif", letterSpacing: "0.04em" }}>
            Complete a chapter to unlock the next era
          </p>
          <button
            onClick={onResetRequest}
            style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(200,169,110,0.35)", background: "transparent", border: "1px solid rgba(200,169,110,0.12)", borderRadius: 4, padding: "6px 14px", cursor: "pointer" }}
          >
            New Game
          </button>
        </div>
      </div>

      {/* Paywall modal — position:absolute inside position:relative parent */}
      {modalOpen && <UpgradeModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
