import { useState, useEffect, useRef } from "react";
import { shuffle, isSolved, getMovableTiles, moveTile } from "@sliding-puzzle/game-logic";
import type { Difficulty, Screen, WinPhase, ChapterProgress, PuzzleData, MissionPhase } from "../types";
import type { NarrationHook } from "./useNarration";
import {
  INTRO_KEY, PROGRESS_KEY, HINT_GLOW_KEY, DIFFICULTY_KEY,
  NARRATION_KEY, VOICE_GENDER_KEY, MAX_STEPS, STEP_PENALTY,
  INTRO_NARRATION, PUZZLES,
} from "../constants";
import {
  loadDifficulty, persistDifficulty, loadProgress, persistProgress,
  loadSave, writeSave, clearSave, saveKeyFor,
} from "../utils/storage";
import { getStars, nextSolverMove } from "../utils/solver";

export interface GameStateHook {
  n: Difficulty;
  puzzleIdx: number;
  tiles: number[];
  moves: number;
  elapsed: number;
  timerActive: boolean;
  pressedIdx: number | null;
  winPhase: WinPhase;
  hintIdx: number | null;
  stepsLeft: number;
  penaltyKey: number;
  lastMovedValue: number | null;
  moveLocked: boolean;
  imageLoaded: boolean;
  hasShuffled: boolean;
  screen: Screen;
  startDifficulty: Difficulty;
  cinematicReady: boolean;
  chapterProgress: ChapterProgress;
  mapKey: number;
  menuOpen: boolean;
  showResetConfirm: boolean;
  hintGlow: boolean;
  missionPhase: MissionPhase;
  puzzle: PuzzleData;
  emptyIdx: number;
  movable: Set<number>;
  solved: boolean;
  frozen: boolean;
  stars: number;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowResetConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setStartDifficulty: React.Dispatch<React.SetStateAction<Difficulty>>;
  setPressedIdx: React.Dispatch<React.SetStateAction<number | null>>;
  startPuzzle: (idx: number, targetN?: Difficulty) => void;
  handlePointerDown: (idx: number) => void;
  handlePointerUp: (idx: number) => void;
  handleHint: () => void;
  handleStep: () => void;
  handleDevSolve: () => void;
  handleDifficultyChange: (newN: Difficulty) => void;
  handlePlayAgain: () => void;
  handleNextShard: () => void;
  handleViewMap: () => void;
  handleNewGame: () => void;
  handleBeginJourney: () => void;
  handleCinematicContinue: () => void;
  handleShowMap: () => void;
  handleMapSelect: (idx: number) => void;
  handleToggleHintGlow: () => void;
  handleResetRequest: () => void;
  handleResetConfirm: () => void;
  handleDismissMission: () => void;
  handleExpandMission: () => void;
}

export function useGameState(narration: NarrationHook): GameStateHook {
  const { narrate, stopNarration, narrationOnRef } = narration;

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
    localStorage.getItem(INTRO_KEY) ? "map" : "start",
  );
  const [startDifficulty, setStartDifficulty] = useState<Difficulty>(() =>
    localStorage.getItem(DIFFICULTY_KEY) ? loadDifficulty() : 3,
  );
  const [cinematicReady, setCinematicReady] = useState(false);
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress>(loadProgress);
  const [mapKey, setMapKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hintGlow, setHintGlow] = useState(() => localStorage.getItem(HINT_GLOW_KEY) !== "0");
  const [missionPhase, setMissionPhase] = useState<MissionPhase>(null);

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const empty = n * n - 1;
  const puzzle = PUZZLES[puzzleIdx] ?? PUZZLES[0]!;
  const emptyIdx = tiles.indexOf(empty);
  const movable = new Set(getMovableTiles(tiles, emptyIdx, n));
  // Guard: never evaluate win until a shuffle has been confirmed and at least 1 move made
  const solved = hasShuffled && moves > 0 && isSolved(tiles);
  const frozen = winPhase !== "none";
  const stars = getStars(moves);

  function lockMove() {
    setMoveLocked(true);
    if (moveLockTimerRef.current) clearTimeout(moveLockTimerRef.current);
    moveLockTimerRef.current = setTimeout(() => setMoveLocked(false), 100);
  }

  function clearHint() {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setHintIdx(null);
  }

  function handleDismissMission() {
    if (missionTimerRef.current) clearTimeout(missionTimerRef.current);
    setMissionPhase("exiting");
    setTimeout(() => setMissionPhase("bar"), 350);
  }

  function handleExpandMission() {
    if (missionTimerRef.current) clearTimeout(missionTimerRef.current);
    setMissionPhase("full");
    missionTimerRef.current = setTimeout(handleDismissMission, 3000);
  }

  function startMission() {
    if (missionTimerRef.current) clearTimeout(missionTimerRef.current);
    setMissionPhase("full");
    missionTimerRef.current = setTimeout(handleDismissMission, 3000);
  }

  // Show mission card on every new puzzle in the game screen
  useEffect(() => {
    if (screen !== "game") return;
    startMission();
    return () => {
      if (missionTimerRef.current) clearTimeout(missionTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, puzzleIdx]);

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

  // Confirm the initial tiles are in place before win checks run.
  useEffect(() => { setHasShuffled(true); }, []);

  // Cinematic fallback — show Continue if narration never fires (speech blocked / off)
  useEffect(() => {
    if (screen !== "cinematic") return;
    setCinematicReady(false);
    const t = setTimeout(() => setCinematicReady(true), narrationOnRef.current ? 13000 : 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Auto-narrate mission hook when game screen opens or puzzle changes
  useEffect(() => {
    if (screen !== "game") return;
    const t = setTimeout(() => narrate(puzzle.hook, "lore"), 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, puzzleIdx]);

  // Auto-narrate win text when win card appears
  useEffect(() => {
    if (winPhase !== "lore") return;
    const t = setTimeout(() => narrate(puzzle.win, "win"), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winPhase]);

  // Preload next puzzle's image while win screen is showing
  useEffect(() => {
    if (winPhase !== "lore") return;
    const nextIdx = puzzleIdx + 1;
    if (nextIdx >= PUZZLES.length) return;
    const img = new Image();
    img.src = PUZZLES[nextIdx]!.imageUrl;
  }, [winPhase, puzzleIdx]);

  // Keyboard shortcuts — no dep array so handlers always have fresh state
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
      if (moves === 0) stopNarration(); // first move — stop lore narration
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

  function saveWinProgress() {
    const newProgress = { ...chapterProgress, [puzzle.id]: { stars } };
    setChapterProgress(newProgress);
    persistProgress(newProgress);
  }

  function handleNextShard() {
    saveWinProgress();
    stopNarration();
    const isLast = puzzleIdx >= PUZZLES.length - 1;
    if (isLast) {
      setMapKey((k) => k + 1);
      setScreen("map");
    } else {
      startPuzzle(puzzleIdx + 1);
    }
  }

  function handleViewMap() {
    saveWinProgress();
    stopNarration();
    setMapKey((k) => k + 1);
    setScreen("map");
  }

  function handleNewGame() { startPuzzle(puzzleIdx); }

  function handleBeginJourney() {
    persistDifficulty(startDifficulty);
    setN(startDifficulty);
    stopNarration();
    setScreen("cinematic");
    // Gesture-triggered narration — works on mobile
    if (narrationOnRef.current) {
      narrate(INTRO_NARRATION, "intro", () => setCinematicReady(true));
    }
  }

  function handleCinematicContinue() {
    localStorage.setItem(INTRO_KEY, "1");
    stopNarration();
    setMapKey((k) => k + 1);
    setScreen("map");
  }

  function handleShowMap() {
    setTimerActive(false);
    setMenuOpen(false);
    stopNarration();
    setMapKey((k) => k + 1);
    setScreen("map");
  }

  function handleMapSelect(idx: number) {
    stopNarration();
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
    [
      INTRO_KEY, PROGRESS_KEY, DIFFICULTY_KEY, HINT_GLOW_KEY,
      NARRATION_KEY, VOICE_GENDER_KEY,
      saveKeyFor(3), saveKeyFor(4), saveKeyFor(5),
    ].forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  return {
    n, puzzleIdx, tiles, moves, elapsed, timerActive, pressedIdx, winPhase,
    hintIdx, stepsLeft, penaltyKey, lastMovedValue, moveLocked, imageLoaded,
    hasShuffled, screen, startDifficulty, cinematicReady, chapterProgress, mapKey,
    menuOpen, showResetConfirm, hintGlow, missionPhase,
    puzzle, emptyIdx, movable, solved, frozen, stars,
    setMenuOpen, setShowResetConfirm, setStartDifficulty, setPressedIdx,
    startPuzzle, handlePointerDown, handlePointerUp, handleHint, handleStep,
    handleDevSolve, handleDifficultyChange, handlePlayAgain, handleNextShard,
    handleViewMap, handleNewGame, handleBeginJourney, handleCinematicContinue,
    handleShowMap, handleMapSelect, handleToggleHintGlow, handleResetRequest,
    handleResetConfirm, handleDismissMission, handleExpandMission,
  };
}
