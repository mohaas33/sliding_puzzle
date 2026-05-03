export type NarrationContext = "intro" | "lore" | "win" | "map" | null;
export type Screen = "start" | "cinematic" | "map" | "game";
export type Difficulty = 3 | 4 | 5;
export type WinPhase = "none" | "frozen" | "reveal" | "lore";

export interface PuzzleData {
  id: number;
  name: string;
  imageUrl: string;
  hook: string;
  lore: string;
  win: string;
}

export type MissionPhase = "full" | "exiting" | "bar" | null;

export interface PuzzleProgress {
  stars: number;
}

export type ChapterProgress = Record<number, PuzzleProgress>;

export interface SaveState {
  tiles: number[];
  moves: number;
  elapsed: number;
  stepsLeft: number;
}
