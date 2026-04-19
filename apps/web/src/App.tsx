import { useState, useEffect } from "react";
import { shuffle, isSolved, getMovableTiles, moveTile } from "@sliding-puzzle/game-logic";

const N = 5;
const EMPTY = N * N - 1;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function App() {
  const [tiles, setTiles] = useState<number[]>(() => shuffle(N));
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const emptyIdx = tiles.indexOf(EMPTY);
  const movable = new Set(getMovableTiles(tiles, emptyIdx, N));
  const solved = isSolved(tiles);

  useEffect(() => {
    if (!timerActive || solved) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, solved]);

  function handlePointerDown(idx: number) {
    if (tiles[idx] !== EMPTY) setPressedIdx(idx);
  }

  function handlePointerUp(idx: number) {
    if (pressedIdx === idx && movable.has(idx)) {
      setTiles(moveTile(tiles, idx, emptyIdx).tiles);
      setMoves((m) => m + 1);
      setTimerActive(true);
    }
    setPressedIdx(null);
  }

  function handleNewGame() {
    setTiles(shuffle(N));
    setMoves(0);
    setElapsed(0);
    setTimerActive(false);
    setPressedIdx(null);
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

      {/* Win message */}
      {solved && (
        <p
          className="text-base tracking-wide"
          style={{ fontFamily: "'Cinzel', serif", color: "#c8a96e" }}
        >
          ✦ The Eye of Ra is restored ✦
        </p>
      )}

      {/* Board */}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${N}, 4rem)` }}
      >
        {tiles.map((tile, idx) => {
          const isEmpty = tile === EMPTY;
          const isPressed = pressedIdx === idx;
          const isMovable = movable.has(idx);

          const tileClass = [
            "tile",
            isEmpty ? "tile-empty" : isPressed ? "tile-pressed" : isMovable ? "tile-movable" : "",
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
            >
              {!isEmpty && tile + 1}
            </button>
          );
        })}
      </div>

      {/* New Game button */}
      <button
        onClick={handleNewGame}
        className="mt-1 px-6 py-2 text-sm tracking-widest uppercase transition-all hover:opacity-100 opacity-70"
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
