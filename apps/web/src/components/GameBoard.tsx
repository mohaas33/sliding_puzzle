import type React from "react";
import type { WinPhase, PuzzleData, Difficulty } from "../types";
import { BOARD_PX, GAP_PX } from "../constants";

interface GameBoardProps {
  n: Difficulty;
  tiles: number[];
  puzzle: PuzzleData;
  imageLoaded: boolean;
  winPhase: WinPhase;
  frozen: boolean;
  moveLocked: boolean;
  movable: Set<number>;
  raLightIdx: number | null;
  hintGlow: boolean;
  visionActive: boolean;
  pressedIdx: number | null;
  onPointerDown: (idx: number) => void;
  onPointerUp: (idx: number) => void;
}

export function GameBoard({
  n,
  tiles,
  puzzle,
  imageLoaded,
  winPhase,
  frozen,
  moveLocked,
  movable,
  raLightIdx,
  hintGlow,
  visionActive,
  pressedIdx,
  onPointerDown,
  onPointerUp,
}: GameBoardProps) {
  const empty = n * n - 1;
  const boardSize = Math.min(BOARD_PX, window.innerWidth - 32);

  const boardWrap: React.CSSProperties = {
    width: "100%",
    maxWidth: "min(344px, 100vw - 32px)",
    margin: "0 auto",
    boxSizing: "border-box",
  };

  if (!imageLoaded) {
    return (
      <div style={boardWrap}>
        <div className="board-shimmer" style={{ width: boardSize, height: boardSize }} />
      </div>
    );
  }

  return (
    <div style={boardWrap}>
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        gap: GAP_PX,
        width: boardSize,
        height: boardSize,
        pointerEvents: frozen || moveLocked ? "none" : undefined,
      }}
    >
      {tiles.map((tile, idx) => {
        const isEmpty = tile === empty;
        const isRaLight = !frozen && raLightIdx === idx;
        const isPressed = pressedIdx === idx;
        const isMovable = !frozen && movable.has(idx);

        const imgRow = Math.floor(tile / n);
        const imgCol = tile % n;

        const tileClass = [
          "tile",
          isEmpty
            ? "tile-empty"
            : isRaLight
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
            onPointerDown={() => onPointerDown(idx)}
            onPointerUp={() => onPointerUp(idx)}
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

      {/* Vision of Osiris: semi-transparent solved image */}
      {visionActive && !frozen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${puzzle.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 4,
            opacity: 0.72,
            animation: "fadeIn 0.35s ease",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Win reveal: full image */}
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
    </div>
  );
}
