import { useState, useEffect, useRef } from "react";
import { shuffle, isSolved, getMovableTiles, moveTile } from "@sliding-puzzle/game-logic";

const DEV_MODE = new URLSearchParams(window.location.search).get("dev") === "true";
const BOARD_PX = 344; // fixed physical size for all grid sizes
const GAP_PX = 6;
const DIFFICULTY_KEY = "shards_of_time_difficulty_v1";
const MAX_STEPS = 3;
const STEP_PENALTY = 10;

type Difficulty = 3 | 4 | 5;

const DIFFICULTIES: { n: Difficulty; label: string }[] = [
  { n: 3, label: "3×3 Easy" },
  { n: 4, label: "4×4 Medium" },
  { n: 5, label: "5×5 Hard" },
];

function saveKeyFor(n: Difficulty): string {
  return `shards_of_time_${n}x${n}_v1`;
}

function loadDifficulty(): Difficulty {
  const raw = localStorage.getItem(DIFFICULTY_KEY);
  if (raw === "3" || raw === "4" || raw === "5") return Number(raw) as Difficulty;
  return 5;
}

function persistDifficulty(n: Difficulty) {
  localStorage.setItem(DIFFICULTY_KEY, String(n));
}

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
  stepsLeft: number;
}

function loadSave(n: Difficulty): SaveState | null {
  try {
    const raw = localStorage.getItem(saveKeyFor(n));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SaveState>;
    if (!Array.isArray(data.tiles) || data.tiles.length !== n * n) return null;
    if (typeof data.moves !== "number" || typeof data.elapsed !== "number") return null;
    // Discard a solved save — restoring it would trigger the win screen immediately
    if (isSolved(data.tiles)) return null;
    return {
      tiles: data.tiles,
      moves: data.moves,
      elapsed: data.elapsed,
      stepsLeft: typeof data.stepsLeft === "number" ? data.stepsLeft : MAX_STEPS,
    };
  } catch {
    return null;
  }
}

function writeSave(n: Difficulty, state: SaveState) {
  localStorage.setItem(saveKeyFor(n), JSON.stringify(state));
}

function clearSave(n: Difficulty) {
  localStorage.removeItem(saveKeyFor(n));
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

function totalManhattanDistance(tiles: readonly number[], n: number): number {
  const emptyVal = n * n - 1;
  let total = 0;
  for (let i = 0; i < tiles.length; i++) {
    const v = tiles[i]!;
    if (v === emptyVal) continue;
    total += Math.abs(Math.floor(i / n) - Math.floor(v / n)) + Math.abs((i % n) - (v % n));
  }
  return total;
}

// BFS: exact optimal next move for 3×3 (state space ≤ 181440).
function bfsNextMove(tiles: readonly number[], n: number): number | null {
  if (isSolved(tiles)) return null;
  const emptyVal = n * n - 1;
  const startKey = tiles.join(",");
  type Entry = { state: number[]; emptyIdx: number; firstMove: number };
  const visited = new Set<string>([startKey]);
  const queue: Entry[] = [];

  const startEmpty = (tiles as number[]).indexOf(emptyVal);
  for (const tileIdx of getMovableTiles(tiles as number[], startEmpty, n)) {
    const res = moveTile(tiles as number[], tileIdx, startEmpty);
    if (isSolved(res.tiles)) return tileIdx;
    const key = res.tiles.join(",");
    if (!visited.has(key)) {
      visited.add(key);
      queue.push({ state: res.tiles, emptyIdx: res.emptyIdx, firstMove: tileIdx });
    }
  }

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const tileIdx of getMovableTiles(cur.state, cur.emptyIdx, n)) {
      const res = moveTile(cur.state, tileIdx, cur.emptyIdx);
      if (isSolved(res.tiles)) return cur.firstMove;
      const key = res.tiles.join(",");
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ state: res.tiles, emptyIdx: res.emptyIdx, firstMove: cur.firstMove });
      }
    }
  }
  return null;
}

// Greedy: pick the move that minimises total Manhattan distance of the resulting board.
// Excludes the tile that was last moved to prevent immediate reversal.
function greedyNextMove(
  tiles: readonly number[],
  n: number,
  lastMovedValue: number | null,
): number | null {
  const emptyVal = n * n - 1;
  const eIdx = (tiles as number[]).indexOf(emptyVal);
  const candidates = getMovableTiles(tiles as number[], eIdx, n);
  if (candidates.length === 0) return null;

  let bestIdx: number | null = null;
  let bestScore = Infinity;

  for (const tileIdx of candidates) {
    if (tiles[tileIdx] === lastMovedValue) continue; // skip reversal
    const res = moveTile(tiles as number[], tileIdx, eIdx);
    const score = totalManhattanDistance(res.tiles, n);
    if (score < bestScore) { bestScore = score; bestIdx = tileIdx; }
  }

  // Fallback if every candidate was the last-moved tile (shouldn't normally happen)
  if (bestIdx === null) {
    for (const tileIdx of candidates) {
      const res = moveTile(tiles as number[], tileIdx, eIdx);
      const score = totalManhattanDistance(res.tiles, n);
      if (score < bestScore) { bestScore = score; bestIdx = tileIdx; }
    }
  }

  return bestIdx;
}

function nextSolverMove(
  tiles: readonly number[],
  n: number,
  lastMovedValue: number | null,
): number | null {
  if (isSolved(tiles)) return null;
  return n === 3
    ? bfsNextMove(tiles, n)
    : greedyNextMove(tiles, n, lastMovedValue);
}

export function App() {
  const initialN = useRef<Difficulty>(loadDifficulty()).current;
  const savedRef = useRef(loadSave(initialN));

  const [n, setN] = useState<Difficulty>(initialN);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [tiles, setTiles] = useState<number[]>(() => savedRef.current?.tiles ?? shuffle(initialN));
  const [moves, setMoves] = useState(() => savedRef.current?.moves ?? 0);
  const [elapsed, setElapsed] = useState(() => savedRef.current?.elapsed ?? 0);
  const [timerActive, setTimerActive] = useState(() => (savedRef.current?.moves ?? 0) > 0);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [winPhase, setWinPhase] = useState<WinPhase>("none");
  const [hintIdx, setHintIdx] = useState<number | null>(null);
  const [stepsLeft, setStepsLeft] = useState(() => savedRef.current?.stepsLeft ?? MAX_STEPS);
  const [penaltyKey, setPenaltyKey] = useState(0);
  const [lastMovedValue, setLastMovedValue] = useState<number | null>(null);
  const [moveLocked, setMoveLocked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function lockMove() {
    setMoveLocked(true);
    if (moveLockTimerRef.current) clearTimeout(moveLockTimerRef.current);
    moveLockTimerRef.current = setTimeout(() => setMoveLocked(false), 100);
  }

  const empty = n * n - 1;

  const puzzle = PUZZLES[puzzleIdx] ?? PUZZLES[0]!;
  const emptyIdx = tiles.indexOf(empty);
  const movable = new Set(getMovableTiles(tiles, emptyIdx, n));
  // Guard: never evaluate win until a shuffle has been confirmed and at least 1 move made
  const solved = hasShuffled && moves > 0 && isSolved(tiles);
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

  useEffect(() => {
    const img = new Image();
    img.src = puzzle.image;
    if (img.complete) { setImageLoaded(true); return; }
    setImageLoaded(false);
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // show board even on error
    return () => { img.onload = null; img.onerror = null; };
  }, [puzzle.image]);

  // Confirm the initial tiles (from save or shuffle) are in place before win checks run.
  useEffect(() => { setHasShuffled(true); }, []);

  function clearHint() {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setHintIdx(null);
  }

  function handleHint() {
    if (frozen) return;
    clearHint();
    const best = nextSolverMove(tiles, n, lastMovedValue);
    setHintIdx(best);
    if (best !== null) {
      hintTimerRef.current = setTimeout(() => setHintIdx(null), 2000);
    }
  }

  function handleStep() {
    if (frozen || stepsLeft <= 0 || moveLocked) return;
    const best = nextSolverMove(tiles, n, lastMovedValue);
    if (best === null) return;
    clearHint();
    const movedValue = tiles[best]!;
    const newTiles = moveTile(tiles, best, emptyIdx).tiles;
    const newMoves = moves + STEP_PENALTY;
    const newStepsLeft = stepsLeft - 1;
    setTiles(newTiles);
    setMoves(newMoves);
    setStepsLeft(newStepsLeft);
    setLastMovedValue(movedValue);
    setTimerActive(true);
    lockMove();
    setPenaltyKey((k) => k + 1);
    writeSave(n, { tiles: newTiles, moves: newMoves, elapsed, stepsLeft: newStepsLeft });
  }

  function handleDevSolve() {
    if (frozen) return;
    clearHint();
    setTiles(Array.from({ length: n * n }, (_, i) => i));
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
    if (frozen || moveLocked) return;
    if (tiles[idx] !== empty) setPressedIdx(idx);
  }

  function handlePointerUp(idx: number) {
    if (frozen || moveLocked) {
      setPressedIdx(null);
      return;
    }
    if (pressedIdx === idx && movable.has(idx)) {
      clearHint();
      const movedValue = tiles[idx]!;
      const newTiles = moveTile(tiles, idx, emptyIdx).tiles;
      const newMoves = moves + 1;
      setTiles(newTiles);
      setMoves(newMoves);
      setLastMovedValue(movedValue);
      setTimerActive(true);
      lockMove();
      writeSave(n, { tiles: newTiles, moves: newMoves, elapsed, stepsLeft });
    }
    setPressedIdx(null);
  }

  function startPuzzle(idx: number, targetN: Difficulty = n) {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (moveLockTimerRef.current) clearTimeout(moveLockTimerRef.current);
    clearHint();
    setMoveLocked(false);
    setTiles(shuffle(targetN));
    setMoves(0);
    setElapsed(0);
    setTimerActive(false);
    setPressedIdx(null);
    setWinPhase("none");
    setPuzzleIdx(idx);
    setN(targetN);
    setStepsLeft(MAX_STEPS);
    setPenaltyKey(0);
    setLastMovedValue(null);
    persistDifficulty(targetN);
    clearSave(targetN);
  }

  function handleDifficultyChange(newN: Difficulty) {
    if (newN === n || frozen) return;
    clearSave(n);
    startPuzzle(puzzleIdx, newN);
  }

  function handlePlayAgain() { startPuzzle(puzzleIdx); }
  function handleNextShard() { startPuzzle((puzzleIdx + 1) % PUZZLES.length); }
  function handleNewGame() { startPuzzle(puzzleIdx); }
  function handleClearSave() { clearSave(n); startPuzzle(puzzleIdx); }

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
        <div style={{ position: "relative" }}>
          <div className="text-xs opacity-60">Moves</div>
          <div className="text-lg">{moves}</div>
          {penaltyKey > 0 && (
            <span key={penaltyKey} className="penalty-pop">+{STEP_PENALTY}</span>
          )}
        </div>
        <div>
          <div className="text-xs opacity-60">Time</div>
          <div className="text-lg">{formatTime(elapsed)}</div>
        </div>
      </div>

      {/* Difficulty selector + hint controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div className="diff-selector">
          {DIFFICULTIES.map(({ n: dn, label }) => (
            <button
              key={dn}
              className={`diff-btn${dn === n ? " diff-btn-active" : ""}`}
              onClick={() => handleDifficultyChange(dn)}
              disabled={frozen}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div
          style={{
            width: 1,
            height: 20,
            background: "rgba(200,169,110,0.25)",
            alignSelf: "center",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button className="hint-btn" onClick={handleHint} disabled={frozen}>
            Hint
          </button>
          <button
            className={`hint-btn${stepsLeft === 0 ? " hint-btn-exhausted" : ""}`}
            onClick={handleStep}
            disabled={frozen || stepsLeft === 0}
            title={stepsLeft === 0 ? "No steps remaining" : undefined}
          >
            Step ({stepsLeft} left)
          </button>
        </div>
      </div>

      {/* Board */}
      {!imageLoaded ? (
        <div className="board-shimmer" style={{ width: BOARD_PX, height: BOARD_PX }} />
      ) : (
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gap: GAP_PX,
            width: BOARD_PX,
            height: BOARD_PX,
            pointerEvents: frozen || moveLocked ? "none" : undefined,
          }}
        >
          {tiles.map((tile, idx) => {
            const isEmpty = tile === empty;
            const isHint = !frozen && hintIdx === idx;
            const isPressed = pressedIdx === idx;
            const isMovable = !frozen && movable.has(idx);

            const imgRow = Math.floor(tile / n);
            const imgCol = tile % n;

            const tileClass = [
              "tile",
              isEmpty
                ? "tile-empty"
                : isHint
                ? "tile-hint"
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
                key={idx}
                onPointerDown={() => handlePointerDown(idx)}
                onPointerUp={() => handlePointerUp(idx)}
                disabled={isEmpty || frozen}
                className={tileClass}
                style={
                  isEmpty
                    ? undefined
                    : {
                        backgroundImage: `url(${puzzle.image})`,
                        backgroundSize: `calc(100% * ${n}) calc(100% * ${n})`,
                        backgroundPosition: `calc(${imgCol} * -100%) calc(${imgRow} * -100%)`,
                      }
                }
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
      )}

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
