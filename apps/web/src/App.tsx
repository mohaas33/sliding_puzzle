import { useState, useEffect, useRef } from "react";
import { shuffle, isSolved, getMovableTiles, moveTile } from "@sliding-puzzle/game-logic";

const DEV_MODE = new URLSearchParams(window.location.search).get("dev") === "true";
const BOARD_PX = 344; // fixed physical size for all grid sizes
const GAP_PX = 6;
const DIFFICULTY_KEY = "shards_of_time_difficulty_v1";
const INTRO_KEY = "shards_of_time_chapter1_intro_seen";
const PROGRESS_KEY = "shards_of_time_chapter1_progress";
const HINT_GLOW_KEY = "shards_of_time_hint_glow";
const CHAPTER_LABEL = "Chapter I · Ancient Egypt";
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

type Screen = "intro" | "map" | "game";

interface PuzzleProgress { stars: number; }
type ChapterProgress = Record<number, PuzzleProgress>;

function loadProgress(): ChapterProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ChapterProgress) : {};
  } catch { return {}; }
}

function persistProgress(p: ChapterProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function getPuzzleState(
  id: number,
  progress: ChapterProgress,
): "completed" | "current" | "locked" {
  if (progress[id]) return "completed";
  if (id === 1 || progress[id - 1]) return "current";
  return "locked";
}

interface PuzzleData {
  id: number;
  name: string;
  imageUrl: string;
  lore: string;
  win: string;
}

const PUZZLES: PuzzleData[] = [
  {
    id: 1,
    name: "The Eye of Ra",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_1.jpg`,
    lore: "The sun god's gaze has been shattered across the temple floor. Darkness falls on Egypt — restore the Eye before Ra can no longer find his way across the sky.",
    win: "The Eye opens. Ra sees Egypt once more and the sun climbs the sky. But something is wrong — the scales of judgment in the Hall of Two Truths lie broken. A soul cannot pass until they are restored.",
  },
  {
    id: 2,
    name: "Anubis Weighs the Heart",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_2.jpg`,
    lore: "A soul stands before Anubis in the Hall of Two Truths. The scales of judgment lie in pieces. Without them, the dead cannot pass into the Field of Reeds.",
    win: "The scales balance. A worthy soul crosses into the Field of Reeds. But whispers of drought are spreading — without the Nile's calendar, Egypt will starve.",
  },
  {
    id: 3,
    name: "The Nile's Gift",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_3.jpg`,
    lore: "The flooding season approaches. Farmers stand idle — the sacred calendar that tells them when to plant has been scattered. Without it, the fields will wither.",
    win: "The floods come at exactly the right moment. The fields turn green. But in the palace, the great pharaoh's image has been erased from his own battle monument.",
  },
  {
    id: 4,
    name: "Pharaoh's Procession",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_4.jpg`,
    lore: "Ramses the Great rides to battle at Kadesh — but his image has been struck from the stone by jealous enemies. A pharaoh forgotten is a pharaoh unmade.",
    win: "Ramses rides again, eternal and victorious. His name is restored. But deeper in the tomb, the sacred spells that guide the dead have been scrambled.",
  },
  {
    id: 5,
    name: "The Book of the Dead",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_5.jpg`,
    lore: "The sacred papyrus of Hunefer — filled with spells to navigate the underworld — has been torn apart. Without it, the pharaoh wanders the darkness forever.",
    win: "The spells are whole again. The path through the underworld is clear. Yet Osiris himself has been torn apart once more, just as he was by Set.",
  },
  {
    id: 6,
    name: "Osiris Reborn",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_6.jpg`,
    lore: "Set has scattered the pieces of Osiris across Egypt once more. Isis weeps. The god of resurrection cannot rise until every fragment is found and restored.",
    win: "Osiris rises again. Death and rebirth return to balance. Now only one thing remains — the sacred scarab that pushes the sun across the sky has gone still.",
  },
  {
    id: 7,
    name: "The Sacred Scarab",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_7.jpg`,
    lore: "Khepri, the sacred scarab, rolls the sun across the sky each dawn. But the amulet has shattered and the sun hangs motionless. Dawn cannot come.",
    win: "Khepri takes flight, pushing the golden disc from horizon to horizon. One final task awaits — the Valley of the Kings must be sealed, or the pharaohs' power will never rest.",
  },
  {
    id: 8,
    name: "Valley of the Kings",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_8.jpg`,
    lore: "The ceiling of Ramses IV's tomb blazes with stars and sacred texts — but the pattern has been broken. Until it is restored, the king cannot ascend to the heavens.",
    win: "The last tomb is sealed. Egypt breathes again. But as you place the final shard, a cold wind blows from the north. Someone has been watching you — and they have begun scattering the shards of another civilization. The work is not done.",
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
  const [screen, setScreen] = useState<Screen>(() =>
    localStorage.getItem(INTRO_KEY) ? "map" : "intro",
  );
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress>(loadProgress);
  const [mapKey, setMapKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hintGlow, setHintGlow] = useState(() => localStorage.getItem(HINT_GLOW_KEY) !== "0");

  const drawerRef = useRef<HTMLDivElement>(null);

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
    img.src = puzzle.imageUrl;
    if (img.complete) { setImageLoaded(true); return; }
    setImageLoaded(false);
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // show board even on error
    return () => { img.onload = null; img.onerror = null; };
  }, [puzzle.imageUrl]);

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
      if (e.key === "Escape") {
        setMenuOpen(false);
        setShowResetConfirm(false);
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
  function handleNextShard() {
    // Mark puzzle complete, save progress, then go to map
    const newProgress = { ...chapterProgress, [puzzle.id]: { stars } };
    setChapterProgress(newProgress);
    persistProgress(newProgress);
    setMapKey((k) => k + 1);
    setScreen("map");
  }
  function handleNewGame() { startPuzzle(puzzleIdx); }
  function handleClearSave() { clearSave(n); startPuzzle(puzzleIdx); }
  function handleBeginChapter() {
    localStorage.setItem(INTRO_KEY, "1");
    setMapKey((k) => k + 1);
    setScreen("map");
  }
  function handleShowMap() {
    setTimerActive(false);
    setMenuOpen(false);
    setMapKey((k) => k + 1);
    setScreen("map");
  }
  function handleMapSelect(idx: number) {
    startPuzzle(idx);
    setScreen("game");
  }
  function handleToggleHintGlow() {
    const next = !hintGlow;
    setHintGlow(next);
    localStorage.setItem(HINT_GLOW_KEY, next ? "1" : "0");
  }
  function handleResetRequest() {
    setShowResetConfirm(true);
  }
  function handleResetConfirm() {
    [INTRO_KEY, PROGRESS_KEY, DIFFICULTY_KEY, HINT_GLOW_KEY,
      saveKeyFor(3), saveKeyFor(4), saveKeyFor(5)].forEach((k) =>
      localStorage.removeItem(k),
    );
    window.location.reload();
  }

  const stars = getStars(moves);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-10"
      onPointerUp={() => setPressedIdx(null)}
    >
      {/* Title + Map button row */}
      <div style={{ position: "relative", width: "100%", maxWidth: 480, textAlign: "center" }}>
        <button
          onClick={() => setMenuOpen(true)}
          className="hamburger-btn"
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
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
          {CHAPTER_LABEL}
        </p>
        <p
          className="mt-0.5 text-base tracking-wide"
          style={{ fontFamily: "'Cinzel', serif", color: "#f0e4c4", opacity: 0.85 }}
        >
          {puzzle.name}
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
                ? `tile-movable${hintGlow ? " tile-movable-glow" : ""}`
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
                        backgroundImage: `url(${puzzle.imageUrl})`,
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
                backgroundImage: `url(${puzzle.imageUrl})`,
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
        {puzzle.lore}
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

      {/* Chapter intro overlay */}
      {screen === "intro" && (
        <div className="intro-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="intro-card">
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#c8a96e",
                opacity: 0.7,
                marginBottom: 20,
              }}
            >
              {CHAPTER_LABEL}
            </p>
            <div className="gold-sep" style={{ marginBottom: 24 }} />
            <p
              style={{
                fontFamily: "'Crimson Text', serif",
                fontStyle: "italic",
                color: "#d4b896",
                fontSize: "1.15rem",
                lineHeight: 1.8,
                textAlign: "center",
                maxWidth: 360,
              }}
            >
              3,350 years ago, a tomb robber broke into the sacred chamber of a forgotten pharaoh.
              In his greed, he shattered the enchanted tiles that held Egypt's greatest secrets.
              The gods fell silent. The Nile stopped flooding. Time itself cracked.
            </p>
            <p
              style={{
                fontFamily: "'Crimson Text', serif",
                fontStyle: "italic",
                color: "#f0e4c4",
                fontSize: "1.15rem",
                lineHeight: 1.8,
                textAlign: "center",
                maxWidth: 360,
                marginTop: 16,
              }}
            >
              You are the Restorer — chosen to piece history back together, one shard at a time.
            </p>
            <div className="gold-sep" style={{ margin: "24px 0" }} />
            <button className="win-btn win-btn-primary" onClick={handleBeginChapter}>
              Begin
            </button>
          </div>
        </div>
      )}

      {/* Chapter Map overlay */}
      {screen === "map" && (
        <div className="map-overlay" key={mapKey} onClick={(e) => e.stopPropagation()}>
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

            {/* Chapter progress bar */}
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

                  {/* State icon / action */}
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

                  {/* Bottom: name + stars for completed */}
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
                      }}
                    >
                      {p.name}
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

            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#c8a96e",
                opacity: 0.7,
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              {puzzle.id} of {PUZZLES.length}
            </p>

            {/* Chapter I progress bar */}
            <div style={{ width: "100%", marginBottom: 6 }}>
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
                    width: `${(puzzle.id / PUZZLES.length) * 100}%`,
                    background: "linear-gradient(90deg, #a07840, #c8a96e)",
                    borderRadius: 2,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>

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
              {puzzle.win}
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

      {/* Side drawer backdrop */}
      {menuOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side drawer */}
      <div ref={drawerRef} className={`game-drawer${menuOpen ? " game-drawer-open" : ""}`}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.65rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#c8a96e",
            opacity: 0.55,
            padding: "0 24px 16px",
            borderBottom: "1px solid rgba(200,169,110,0.15)",
            marginBottom: 8,
          }}
        >
          {CHAPTER_LABEL}
        </div>

        <button className="drawer-item" onClick={handleShowMap}>
          <span className="drawer-icon">📜</span> Chapter Map
        </button>

        <button
          className="drawer-item"
          onClick={() => { startPuzzle(puzzleIdx); setMenuOpen(false); }}
        >
          <span className="drawer-icon">🔁</span> Restart Puzzle
        </button>

        <button className="drawer-item drawer-item-danger" onClick={() => { setMenuOpen(false); handleResetRequest(); }}>
          <span className="drawer-icon">↺</span> Reset Chapter
        </button>

        <div className="drawer-divider" />

        <button className="drawer-item" onClick={handleToggleHintGlow}>
          <span className="drawer-icon">💡</span>
          Movable Tile Glow
          <span className={`drawer-toggle${hintGlow ? " drawer-toggle-on" : ""}`} />
        </button>

        <button className="drawer-item" disabled>
          <span className="drawer-icon" style={{ opacity: 0.35 }}>🔊</span>
          <span style={{ opacity: 0.35 }}>Sound</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.52rem",
              letterSpacing: "0.08em",
              color: "#c8a96e",
              opacity: 0.3,
              fontFamily: "'Crimson Text', serif",
              fontStyle: "italic",
              textTransform: "none",
            }}
          >
            Coming soon
          </span>
        </button>
      </div>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div
          className="confirm-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="confirm-card">
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#c8a96e",
                marginBottom: 16,
              }}
            >
              Reset Chapter
            </p>
            <div className="gold-sep" style={{ marginBottom: 20 }} />
            <p
              style={{
                fontFamily: "'Crimson Text', serif",
                fontStyle: "italic",
                color: "#d4b896",
                fontSize: "1rem",
                lineHeight: 1.65,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              This will erase all progress — stars, unlocks, and saves.
              <br />Are you sure?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="win-btn" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                style={{
                  padding: "10px 22px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#fff",
                  background: "rgba(180,60,50,0.7)",
                  border: "1px solid rgba(220,80,60,0.6)",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,80,60,0.85)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(180,60,50,0.7)")}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
