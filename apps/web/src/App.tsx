import { useState, useEffect, useRef } from "react";
import { shuffle, isSolved, getMovableTiles, moveTile } from "@sliding-puzzle/game-logic";

const N = 5;
const DEV_MODE = new URLSearchParams(window.location.search).get("dev") === "true";
const SOLVED_TILES = Array.from({ length: N * N }, (_, i) => i);
const EMPTY = N * N - 1;
const SAVE_KEY = "shards_of_time_v1";
const TILE_PX = 64;
const GAP_PX = 6;
const STRIDE = TILE_PX + GAP_PX;
const BOARD_PX = N * TILE_PX + (N - 1) * GAP_PX;

interface PuzzleData {
  image: string;
  chapter: string;
  teaser: string;
  winLore: string;
}

const PUZZLES: PuzzleData[] = [
  {
    image: `${import.meta.env.BASE_URL}eye_Ra.jpg`,
    chapter: "Chapter I · Ancient Egypt",
    teaser: "The priests of Ra scattered the sacred tiles. Only by restoring the Eye can the sun rise again…",
    winLore:
      "The priests of Ra scattered the sacred tiles across the desert sands. As the last fragment clicks into place, the Eye opens — and the Nile rises once more.",
  },
];

type WinPhase = "none" | "frozen" | "reveal" | "lore";

interface SaveState {
  tiles: number[];
  moves: number;
  elapsed: number;
}

function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveState;
    if (!Array.isArray(data.tiles) || data.tiles.length !== N * N) return null;
    if (typeof data.moves !== "number" || typeof data.elapsed !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

function writeSave(state: SaveState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getStars(moves: number): number {
  if (moves < 30) return 3;
  if (moves < 60) return 2;
  return 1;
}

export function App() {
  const saved = useRef(loadSave());

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [tiles, setTiles] = useState<number[]>(() => saved.current?.tiles ?? shuffle(N));
  const [moves, setMoves] = useState(() => saved.current?.moves ?? 0);
  const [elapsed, setElapsed] = useState(() => saved.current?.elapsed ?? 0);
  const [timerActive, setTimerActive] = useState(() => (saved.current?.moves ?? 0) > 0);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [winPhase, setWinPhase] = useState<WinPhase>("none");
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const puzzle = PUZZLES[puzzleIdx] ?? PUZZLES[0]!;
  const emptyIdx = tiles.indexOf(EMPTY);
  const movable = new Set(getMovableTiles(tiles, emptyIdx, N));
  const solved = isSolved(tiles);
  const frozen = winPhase !== "none";

  useEffect(() => {
    if (!timerActive || solved) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, solved]);

  useEffect(() => {
    if (solved && winPhase === "none") {
      setWinPhase("frozen");
    } else if (winPhase === "frozen") {
      revealTimerRef.current = setTimeout(() => setWinPhase("reveal"), 1000);
    } else if (winPhase === "reveal") {
      revealTimerRef.current = setTimeout(() => setWinPhase("lore"), 2000);
    }
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [solved, winPhase]);

  function handleDevSolve() {
    if (frozen) return;
    setTiles(SOLVED_TILES);
    setTimerActive(false);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "W") {
        e.preventDefault();
        handleDevSolve();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handlePointerDown(idx: number) {
    if (frozen) return;
    if (tiles[idx] !== EMPTY) setPressedIdx(idx);
  }

  function handlePointerUp(idx: number) {
    if (frozen) {
      setPressedIdx(null);
      return;
    }
    if (pressedIdx === idx && movable.has(idx)) {
      const newTiles = moveTile(tiles, idx, emptyIdx).tiles;
      const newMoves = moves + 1;
      setTiles(newTiles);
      setMoves(newMoves);
      setTimerActive(true);
      writeSave({ tiles: newTiles, moves: newMoves, elapsed });
    }
    setPressedIdx(null);
  }

  function startPuzzle(idx: number) {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    const newTiles = shuffle(N);
    setTiles(newTiles);
    setMoves(0);
    setElapsed(0);
    setTimerActive(false);
    setPressedIdx(null);
    setWinPhase("none");
    setPuzzleIdx(idx);
    clearSave();
  }

  function handlePlayAgain() {
    startPuzzle(puzzleIdx);
  }

  function handleNextShard() {
    startPuzzle((puzzleIdx + 1) % PUZZLES.length);
  }

  function handleNewGame() {
    startPuzzle(puzzleIdx);
  }

  function handleClearSave() {
    clearSave();
    startPuzzle(puzzleIdx);
  }

  const stars = getStars(moves);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-10"
      onPointerUp={() => setPressedIdx(null)}
    >
      {/* Title */}
      <div className="text-center">
        <h1
          className="text-4xl tracking-widest uppercase"
          style={{ fontFamily: "'Cinzel', serif", color: "#f0e4c4" }}
        >
          Shards of Time
        </h1>
        <p
          className="mt-1 text-sm tracking-wider opacity-60"
          style={{ fontFamily: "'Crimson Text', serif", fontStyle: "italic", color: "#c8a96e" }}
        >
          {puzzle.chapter}
        </p>
      </div>

      {/* Stats row */}
      <div
        className="flex gap-10 text-center text-sm tracking-widest uppercase opacity-70"
        style={{ fontFamily: "'Cinzel', serif", color: "#c8a96e" }}
      >
        <div>
          <div className="text-xs opacity-60">Moves</div>
          <div className="text-lg">{moves}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Time</div>
          <div className="text-lg">{formatTime(elapsed)}</div>
        </div>
      </div>

      {/* Board */}
      <div
        className="relative"
        style={{
          width: BOARD_PX,
          height: BOARD_PX,
          pointerEvents: frozen ? "none" : undefined,
        }}
      >
        {tiles.map((tile, idx) => {
          const isEmpty = tile === EMPTY;
          const isPressed = pressedIdx === idx;
          const isMovable = !frozen && movable.has(idx);

          const gridRow = Math.floor(idx / N);
          const gridCol = idx % N;
          const imgRow = Math.floor(tile / N);
          const imgCol = tile % N;

          const tileClass = [
            "tile",
            isEmpty
              ? "tile-empty"
              : isPressed
              ? "tile-pressed"
              : isMovable
              ? "tile-movable"
              : "",
          ]
            .join(" ")
            .trim();

          return (
            <button
              key={tile}
              onPointerDown={() => handlePointerDown(idx)}
              onPointerUp={() => handlePointerUp(idx)}
              disabled={isEmpty || frozen}
              className={tileClass}
              style={{
                left: gridCol * STRIDE,
                top: gridRow * STRIDE,
                ...(isEmpty
                  ? undefined
                  : {
                      backgroundImage: `url(${puzzle.image})`,
                      backgroundSize: `calc(100% * ${N}) calc(100% * ${N})`,
                      backgroundPosition: `calc(${imgCol} * -100%) calc(${imgRow} * -100%)`,
                    }),
              }}
            />
          );
        })}

        {/* Win reveal: full image fades in over 0.5s */}
        {(winPhase === "reveal" || winPhase === "lore") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${puzzle.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 4,
              animation: "fadeIn 0.5s ease",
            }}
          />
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleNewGame}
          className="px-6 py-2 text-sm tracking-widest uppercase transition-all hover:opacity-100 opacity-70"
          style={{
            fontFamily: "'Cinzel', serif",
            color: "#c8a96e",
            border: "1px solid #c8a96e",
            background: "transparent",
            borderRadius: "4px",
          }}
        >
          New Game
        </button>
        <button
          onClick={handleClearSave}
          className="text-xs tracking-wider uppercase transition-all hover:opacity-70 opacity-40"
          style={{
            fontFamily: "'Cinzel', serif",
            color: "#c8a96e",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          Clear save
        </button>
      </div>

      {/* Teaser lore */}
      <p
        className="max-w-xs text-center text-sm leading-relaxed opacity-50"
        style={{ fontFamily: "'Crimson Text', serif", fontStyle: "italic", color: "#d4b896" }}
      >
        {puzzle.teaser}
      </p>

      {/* Dev shortcut button */}
      {DEV_MODE && (
        <button
          onClick={handleDevSolve}
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            fontFamily: "'Cinzel', serif",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#c8a96e",
            background: "rgba(200, 169, 110, 0.08)",
            border: "1px solid rgba(200, 169, 110, 0.25)",
            borderRadius: 4,
            padding: "6px 12px",
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          Dev: Solve
        </button>
      )}

      {/* Win overlay */}
      {winPhase === "lore" && (
        <div className="win-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="win-card">
            <div className="gold-sep" />

            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                color: "#f0e4c4",
                fontSize: "1.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "12px 0 4px",
                textAlign: "center",
              }}
            >
              Shard Restored
            </h2>

            <div
              style={{
                fontSize: "1.6rem",
                letterSpacing: "0.2em",
                color: "#c8a96e",
                margin: "10px 0 12px",
              }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} style={{ opacity: i < stars ? 1 : 0.18 }}>
                  ★
                </span>
              ))}
            </div>

            <div className="gold-sep" />

            <p
              style={{
                fontFamily: "'Crimson Text', serif",
                fontStyle: "italic",
                color: "#d4b896",
                fontSize: "1.05rem",
                lineHeight: 1.7,
                margin: "18px 0 16px",
                textAlign: "center",
              }}
            >
              {puzzle.winLore}
            </p>

            <div
              style={{
                display: "flex",
                gap: 36,
                justifyContent: "center",
                fontFamily: "'Cinzel', serif",
                color: "#c8a96e",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", opacity: 0.55, marginBottom: 3 }}>Moves</div>
                <div style={{ fontSize: "1.25rem" }}>{moves}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", opacity: 0.55, marginBottom: 3 }}>Time</div>
                <div style={{ fontSize: "1.25rem" }}>{formatTime(elapsed)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="win-btn" onClick={handlePlayAgain}>
                Play Again
              </button>
              <button className="win-btn win-btn-primary" onClick={handleNextShard}>
                Next Shard →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
