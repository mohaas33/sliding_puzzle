export type { Tiles } from "./puzzle.js";
export {
  isSolved,
  isSolvable,
  getMovableTiles,
  moveTile,
  shuffle,
} from "./puzzle.js";
export {
  nextSolverMove,
  bfsNextMove,
  greedyNextMove,
  totalManhattanDistance,
} from "./solver.js";
