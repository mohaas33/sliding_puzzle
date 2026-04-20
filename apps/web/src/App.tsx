import { useState, useEffect, useRef } from "react";
import { shuffle, isSolved, getMovableTiles, moveTile } from "@sliding-puzzle/game-logic";

const N = 5;
const EMPTY = N * N - 1;
const PUZZLE_IMAGE = "/eye_Ra.jpg";
const SAVE_KEY = "shards_of_time_v1";

type WinPhase = "none" | "reveal" | "lore";

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

export function App() {
  const saved = useRef(loadSave());

  const [tiles, setTiles] = useState<number[]>(() => saved.current?.tiles ?? shuffle(N));
  const [moves, setMoves] = useState(() => saved.current?.moves ?? 0);
  const [elapsed, setElapsed] = useState(() => saved.current?.elapsed ?? 0);
  const [timerActive, setTimerActive] = useState(() => (saved.current?.moves ?? 0) > 0);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [winPhase, setWinPhase] = useState<WinPhase>("none");
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emptyIdx = tiles.indexOf(EMPTY);
  const movable = new Set(getMovableTiles(tiles, emptyIdx, N));
  const solved = isSolved(tiles);

  useEffect(() => {
    if (!timerActive || solved) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, solved]);

  useEffect(() => {
    if (solved && winPhase === "none") {
      setWinPhase("reveal");
      revealTimerRef.current = setTimeout(() => setWinPhase("lore"), 2000);
    }
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [solved, winPhase]);

  function handlePointerDown(idx: number) {
    if (tiles[idx] !== EMPTY) setPressedIdx(idx);
  }

  function handlePointerUp(idx: number) {
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

  function handleNewGame() {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    const newTiles = shuffle(N);
    setTiles(newTiles);
    setMoves(0);
    setElapsed(0);
    setTimerActive(false);
    setPressedIdx(null);
    setWinPhase("none");
    clearSave();
  }

  function handleClearSave() {
    clearSave();
    handleNewGame();
  }

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
          Chapter I · Ancient Egypt
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
      <div className="relative">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${N}, 4rem)` }}
        >
          {tiles.map((tile, idx) => {
            const isEmpty = tile === EMPTY;
            const isPressed = pressedIdx === idx;
            const isMovable = movable.has(idx);

            const row = Math.floor(tile / N);
            const col = tile % N;

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
                key={idx}
                onPointerDown={() => handlePointerDown(idx)}
                onPointerUp={() => handlePointerUp(idx)}
                disabled={isEmpty}
                className={tileClass}
                style={
                  isEmpty
                    ? undefined
                    : {
                        backgroundImage: `url(${PUZZLE_IMAGE})`,
                        backgroundSize: `calc(100% * ${N}) calc(100% * ${N})`,
                        backgroundPosition: `calc(${col} * -100%) calc(${row} * -100%)`,
                      }
                }
              />
            );
          })}
        </div>

        {/* Win reveal: full image + lore text overlay */}
        {(winPhase === "reveal" || winPhase === "lore") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${PUZZLE_IMAGE})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 4,
              animation: "fadeIn 0.4s ease",
            }}
          >
            {winPhase === "lore" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(10, 8, 6, 0.55)",
                  borderRadius: 4,
                  animation: "fadeIn 0.6s ease",
                }}
              >
                <p
                  className="text-base tracking-wide text-center px-4"
                  style={{ fontFamily: "'Cinzel', serif", color: "#f0e4c4", textShadow: "0 1px 8px #000" }}
                >
                  ✦ The Eye of Ra is restored ✦
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Game + Clear save */}
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

      {/* Lore */}
      <p
        className="max-w-xs text-center text-sm leading-relaxed opacity-50"
        style={{ fontFamily: "'Crimson Text', serif", fontStyle: "italic", color: "#d4b896" }}
      >
        The priests of Ra scattered the sacred tiles. Only by restoring the Eye can the sun rise again…
      </p>
    </main>
  );
}
