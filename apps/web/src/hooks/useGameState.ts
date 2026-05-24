import { useState, useEffect, useRef } from "react";
import { shuffle, isSolved, getMovableTiles, moveTile } from "@sliding-puzzle/game-logic";
import type { Difficulty, Screen, WinPhase, PuzzleProgress, PuzzleData, MissionPhase } from "../types";
import {
  INTRO_KEY, CINEMATIC_SEEN_KEY, PROGRESS_KEY, PROGRESS_KEY_2, HINT_GLOW_KEY, DIFFICULTY_KEY,
  NARRATION_KEY, VOICE_GENDER_KEY, NARRATOR_KEY,
  RA_LIGHT_MAX, RA_LIGHT_COST, THOTH_HAND_MAX, THOTH_HAND_COST,
  VISION_MAX, VISION_DURATION_MS,
  PUZZLES, CHAPTERS, PLAYER_NAME_KEY, DEFAULT_PLAYER_NAME, AUTH_PROVIDER_KEY,
  DIFFICULTY_INFO,
} from "../constants";
import {
  loadDifficulty, persistDifficulty, loadProgress, persistProgress,
  loadSave, writeSave, clearSave, saveKeyFor,
} from "../utils/storage";
import { getStars, nextSolverMove, calculatePoints, type PointsResult } from "../utils/solver";

export interface ChapterProgress {
  stars: number;
  completed: number;
}

export interface GameStateHook {
  n: Difficulty;
  puzzleIdx: number;
  currentChapterId: number;
  tiles: number[];
  moves: number;
  elapsed: number;
  timerActive: boolean;
  pressedIdx: number | null;
  winPhase: WinPhase;
  raLightIdx: number | null;
  raLightUsed: number;
  thothUsed: number;
  visionUsed: number;
  visionActive: boolean;
  penaltyKey: number;
  lastPenalty: number;
  moveLocked: boolean;
  imageLoaded: boolean;
  hasShuffled: boolean;
  screen: Screen;
  startDifficulty: Difficulty;
  cinematicReady: boolean;
  puzzleProgress: Record<number, PuzzleProgress>;
  chapterProgress: Record<number, ChapterProgress>;
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
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowResetConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setStartDifficulty: React.Dispatch<React.SetStateAction<Difficulty>>;
  setPressedIdx: React.Dispatch<React.SetStateAction<number | null>>;
  startPuzzle: (idx: number, targetN?: Difficulty) => void;
  handlePointerDown: (idx: number) => void;
  handlePointerUp: (idx: number) => void;
  handleRaLight: () => void;
  handleThothHand: () => void;
  handleVisionOfOsiris: () => void;
  handleDevSolve: () => void;
  handleDifficultyChange: (newN: Difficulty) => void;
  handlePlayAgain: () => void;
  handleNextShard: () => void;
  handleViewMap: () => void;
  handleNewGame: () => void;
  handleBeginJourney: () => void;
  handleContinue: () => void;
  handleNameConfirm: () => void;
  handleAuthComplete: () => void;
  handleSkipAuth: () => void;
  handleShowAuth: () => void;
  handleShowLeaderboard: () => void;
  handleBackFromLeaderboard: () => void;
  handleCinematicContinue: () => void;
  handleBackToStart: () => void;
  handleShowMap: () => void;
  handleMapSelect: (chapterId: number) => void;
  handleToggleHintGlow: () => void;
  handleResetRequest: () => void;
  handleResetConfirm: () => void;
  handleDismissMission: () => void;
  handleExpandMission: () => void;
  nameSet: boolean;
  playerName: string;
  handleSetPlayerName: (name: string) => void;
  lastPuzzlePoints: PointsResult;
}

export function useGameState(): GameStateHook {
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
  const [raLightIdx, setRaLightIdx] = useState<number | null>(null);
  const [raLightUsed, setRaLightUsed] = useState(() => savedRef.current?.raLightUsed ?? 0);
  const [thothUsed, setThothUsed] = useState(() => savedRef.current?.thothUsed ?? 0);
  const [visionUsed, setVisionUsed] = useState(() => savedRef.current?.visionUsed ?? 0);
  const [visionActive, setVisionActive] = useState(false);
  const [penaltyKey, setPenaltyKey] = useState(0);
  const [lastPenalty, setLastPenalty] = useState(0);
  const [lastMovedValue, setLastMovedValue] = useState<number | null>(null);
  const [moveLocked, setMoveLocked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [screen, setScreen] = useState<Screen>("start");
  const [startDifficulty, setStartDifficulty] = useState<Difficulty>(() =>
    localStorage.getItem(DIFFICULTY_KEY) ? loadDifficulty() : 3,
  );
  const [cinematicReady, setCinematicReady] = useState(false);
  const [puzzleProgress, setPuzzleProgress] = useState<Record<number, PuzzleProgress>>(loadProgress);
  const [mapKey, setMapKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hintGlow, setHintGlow] = useState(() => localStorage.getItem(HINT_GLOW_KEY) !== "0");
  const [missionPhase, setMissionPhase] = useState<MissionPhase>(null);
  const [nameSet, setNameSet] = useState(() => localStorage.getItem(PLAYER_NAME_KEY) !== null);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem(PLAYER_NAME_KEY) ?? DEFAULT_PLAYER_NAME,
  );

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raLightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authOriginRef = useRef<"journey" | "menu">("menu");
  const prevScreenRef = useRef<Screen>("start");

  const currentChapterId = Math.ceil((puzzleIdx + 1) / 8);
  const empty = n * n - 1;
  const puzzle = PUZZLES[puzzleIdx] ?? PUZZLES[0]!;
  const emptyIdx = tiles.indexOf(empty);
  const movable = new Set(getMovableTiles(tiles, emptyIdx, n));
  // Guard: never evaluate win until a shuffle has been confirmed and at least 1 move made
  const solved = hasShuffled && moves > 0 && isSolved(tiles);
  const frozen = winPhase !== "none";
  const stars = getStars(raLightUsed, thothUsed);
  // Computed when win screen is visible so it shows immediately without waiting for a button click
  const lastPuzzlePoints: PointsResult = winPhase === "lore"
    ? calculatePoints(stars, moves, elapsed, raLightUsed, thothUsed)
    : { total: 0, breakdown: "" };

  // Aggregate puzzle-level progress into per-chapter summaries (8 puzzles per chapter)
  const chapterProgress: Record<number, ChapterProgress> = {};
  for (const [idStr, prog] of Object.entries(puzzleProgress)) {
    const puzzleId = Number(idStr);
    const chapterId = Math.ceil(puzzleId / 8);
    if (!chapterProgress[chapterId]) chapterProgress[chapterId] = { stars: 0, completed: 0 };
    chapterProgress[chapterId].stars += prog.stars ?? 0;
    chapterProgress[chapterId].completed += 1;
  }

  function lockMove() {
    setMoveLocked(true);
    if (moveLockTimerRef.current) clearTimeout(moveLockTimerRef.current);
    moveLockTimerRef.current = setTimeout(() => setMoveLocked(false), 100);
  }

  function clearRaLight() {
    if (raLightTimerRef.current) {
      clearTimeout(raLightTimerRef.current);
      raLightTimerRef.current = null;
    }
    setRaLightIdx(null);
  }

  function clearVision() {
    if (visionTimerRef.current) {
      clearTimeout(visionTimerRef.current);
      visionTimerRef.current = null;
    }
    setVisionActive(false);
  }

  function handleSetPlayerName(raw: string) {
    const cleaned = raw.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 20);
    setPlayerName(cleaned);
    localStorage.setItem(PLAYER_NAME_KEY, cleaned);
    setNameSet(true);
  }

  function handleDismissMission() {
    setMissionPhase("exiting");
    setTimeout(() => setMissionPhase("bar"), 350);
  }

  function handleExpandMission() {
    setMissionPhase("full");
  }

  // Show mission card on every new puzzle in the game screen
  useEffect(() => {
    if (screen !== "game") return;
    setMissionPhase("full");
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
      revealTimerRef.current = setTimeout(() => setWinPhase("lore"), 3500);
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
    img.onload = () => { console.log("[imageLoaded] loaded:", img.src); setImageLoaded(true); };
    img.onerror = () => { console.warn("[imageLoaded] failed to load:", img.src); setImageLoaded(true); };
    return () => { img.onload = null; img.onerror = null; };
  }, [puzzle.imageUrl]);

  // Confirm the initial tiles are in place before win checks run.
  useEffect(() => { setHasShuffled(true); }, []);

  // Cinematic fallback — show Continue button after brief delay
  useEffect(() => {
    if (screen !== "cinematic") return;
    setCinematicReady(false);
    const t = setTimeout(() => setCinematicReady(true), 2200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

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
      clearRaLight();
      const movedValue = tiles[idx]!;
      const newTiles = moveTile(tiles, idx, emptyIdx).tiles;
      const newMoves = moves + 1;
      setTiles(newTiles);
      setMoves(newMoves);
      setLastMovedValue(movedValue);
      setTimerActive(true);
      lockMove();
      writeSave(n, { tiles: newTiles, moves: newMoves, elapsed, raLightUsed, thothUsed, visionUsed });
    }
    setPressedIdx(null);
  }

  function handleRaLight() {
    if (frozen || raLightUsed >= RA_LIGHT_MAX) return;
    clearRaLight();
    const best = nextSolverMove(tiles, n, lastMovedValue);
    setRaLightIdx(best);
    const newRaLightUsed = raLightUsed + 1;
    const newMoves = moves + RA_LIGHT_COST;
    setRaLightUsed(newRaLightUsed);
    setMoves(newMoves);
    setLastPenalty(RA_LIGHT_COST);
    setPenaltyKey((k) => k + 1);
    if (best !== null) {
      raLightTimerRef.current = setTimeout(() => setRaLightIdx(null), 3000);
    }
    writeSave(n, { tiles, moves: newMoves, elapsed, raLightUsed: newRaLightUsed, thothUsed, visionUsed });
  }

  function handleThothHand() {
    if (frozen || thothUsed >= THOTH_HAND_MAX || moveLocked) return;
    const best = nextSolverMove(tiles, n, lastMovedValue);
    if (best === null) return;
    clearRaLight();
    const movedValue = tiles[best]!;
    const newTiles = moveTile(tiles, best, emptyIdx).tiles;
    const newMoves = moves + THOTH_HAND_COST;
    const newThothUsed = thothUsed + 1;
    setTiles(newTiles);
    setMoves(newMoves);
    setThothUsed(newThothUsed);
    setLastMovedValue(movedValue);
    setTimerActive(true);
    lockMove();
    setLastPenalty(THOTH_HAND_COST);
    setPenaltyKey((k) => k + 1);
    writeSave(n, { tiles: newTiles, moves: newMoves, elapsed, raLightUsed, thothUsed: newThothUsed, visionUsed });
  }

  function handleVisionOfOsiris() {
    if (frozen || visionUsed >= VISION_MAX || visionActive) return;
    clearVision();
    const newVisionUsed = visionUsed + 1;
    setVisionUsed(newVisionUsed);
    setVisionActive(true);
    visionTimerRef.current = setTimeout(() => setVisionActive(false), VISION_DURATION_MS);
    writeSave(n, { tiles, moves, elapsed, raLightUsed, thothUsed, visionUsed: newVisionUsed });
  }

  function handleDevSolve() {
    if (frozen) return;
    clearRaLight();
    setTiles(Array.from({ length: n * n }, (_, i) => i));
    setTimerActive(false);
  }

  function startPuzzle(idx: number, targetN: Difficulty = n) {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    if (moveLockTimerRef.current) clearTimeout(moveLockTimerRef.current);
    clearRaLight();
    clearVision();
    setMoveLocked(false);
    setTiles(shuffle(targetN));
    setMoves(0);
    setElapsed(0);
    setTimerActive(false);
    setPressedIdx(null);
    setWinPhase("none");
    setPuzzleIdx(idx);
    setN(targetN);
    setRaLightUsed(0);
    setThothUsed(0);
    setVisionUsed(0);
    setPenaltyKey(0);
    setLastPenalty(0);
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
    const pts = calculatePoints(stars, moves, elapsed, raLightUsed, thothUsed).total;
    const prev = puzzleProgress[puzzle.id];
    const newPuzzleProgress: Record<number, PuzzleProgress> = {
      ...puzzleProgress,
      [puzzle.id]: {
        stars: Math.max(stars, prev?.stars ?? 0),
        points: Math.max(pts, prev?.points ?? 0),
      },
    };
    console.log('[saveWinProgress] puzzle.id:', puzzle.id, 'stars:', stars, 'newPuzzleProgress:', JSON.stringify(newPuzzleProgress));
    setPuzzleProgress(newPuzzleProgress);
    persistProgress(newPuzzleProgress);
  }

  function handleNextShard() {
    saveWinProgress();
    if (puzzleIdx >= PUZZLES.length - 1) {
      setWinPhase("none");
      setMapKey((k) => k + 1);
      setScreen("map");
    } else {
      startPuzzle(puzzleIdx + 1); // resets winPhase to "none" internally
      setScreen("game");
    }
  }

  function handleViewMap() {
    saveWinProgress();
    setWinPhase("none");
    setTimerActive(false);
    setMenuOpen(false);
    setMapKey((k) => k + 1);
    setScreen("map");
  }

  function handleNewGame() { startPuzzle(puzzleIdx); }

  function handleBeginJourney() {
    persistDifficulty(startDifficulty);
    setN(startDifficulty);
    if (localStorage.getItem(PLAYER_NAME_KEY) === null) {
      setScreen("name");
    } else {
      setMapKey((k) => k + 1);
      setScreen("map");
    }
  }

  function handleContinue() {
    persistDifficulty(startDifficulty);
    const completedIds = Object.keys(puzzleProgress).map(Number);
    // puzzle IDs are 1-based; highest completed ID == next puzzleIdx (0-based)
    const nextIdx = completedIds.length > 0
      ? Math.min(Math.max(...completedIds), PUZZLES.length - 1)
      : 0;
    startPuzzle(nextIdx, startDifficulty);
    setScreen("game");
  }

  function handleNameConfirm() {
    authOriginRef.current = "journey";
    setScreen("auth");
  }

  function _proceedAfterAuth() {
    if (authOriginRef.current === "menu") {
      setScreen("start");
      return;
    }
    setMapKey((k) => k + 1);
    setScreen("map");
  }

  function handleAuthComplete() {
    _proceedAfterAuth();
  }

  function handleSkipAuth() {
    localStorage.setItem(AUTH_PROVIDER_KEY, "guest");
    _proceedAfterAuth();
  }

  function handleShowAuth() {
    authOriginRef.current = "menu";
    setScreen("auth");
  }

  function handleShowLeaderboard() {
    prevScreenRef.current = screen;
    setMenuOpen(false);
    setScreen("leaderboard");
  }

  function handleBackFromLeaderboard() {
    setScreen(prevScreenRef.current);
  }

  function handleCinematicContinue() {
    const cinematicKey = `shards_cinematic_seen_ch_${currentChapterId}`;
    localStorage.setItem(cinematicKey, "1");
    localStorage.setItem(CINEMATIC_SEEN_KEY, "1"); // backwards compat
    startPuzzle((currentChapterId - 1) * 8);
    setScreen("game");
  }

  function handleBackToStart() {
    setScreen("start");
  }

  function handleShowMap() {
    if (winPhase === "lore") saveWinProgress(); // save if navigating away from win screen
    setWinPhase("none");
    setTimerActive(false);
    setMenuOpen(false);
    setMapKey((k) => k + 1);
    setScreen("map");
  }

  function handleMapSelect(chapterId: number) {
    const cinematicKey = `shards_cinematic_seen_ch_${chapterId}`;
    if (!localStorage.getItem(cinematicKey)) {
      setPuzzleIdx((chapterId - 1) * 8);
      setScreen("cinematic");
    } else {
      startPuzzle((chapterId - 1) * 8);
      setScreen("game");
    }
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
      INTRO_KEY, CINEMATIC_SEEN_KEY, PROGRESS_KEY, PROGRESS_KEY_2, DIFFICULTY_KEY, HINT_GLOW_KEY,
      NARRATION_KEY, VOICE_GENDER_KEY, NARRATOR_KEY, PLAYER_NAME_KEY, AUTH_PROVIDER_KEY,
      saveKeyFor(3), saveKeyFor(4), saveKeyFor(5),
    ].forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  return {
    n, puzzleIdx, currentChapterId, tiles, moves, elapsed, timerActive, pressedIdx, winPhase,
    raLightIdx, raLightUsed, thothUsed, visionUsed, visionActive,
    penaltyKey, lastPenalty, moveLocked, imageLoaded,
    hasShuffled, screen, startDifficulty, cinematicReady, puzzleProgress, chapterProgress, mapKey,
    menuOpen, showResetConfirm, hintGlow, missionPhase,
    puzzle, emptyIdx, movable, solved, frozen, stars,
    setScreen, setMenuOpen, setShowResetConfirm, setStartDifficulty, setPressedIdx,
    startPuzzle, handlePointerDown, handlePointerUp,
    handleRaLight, handleThothHand, handleVisionOfOsiris, handleDevSolve,
    handleDifficultyChange, handlePlayAgain, handleNextShard,
    handleViewMap, handleNewGame, handleBeginJourney, handleContinue, handleNameConfirm,
    handleAuthComplete, handleSkipAuth, handleShowAuth, handleShowLeaderboard, handleBackFromLeaderboard, handleCinematicContinue, handleBackToStart,
    handleShowMap, handleMapSelect, handleToggleHintGlow, handleResetRequest,
    handleResetConfirm, handleDismissMission, handleExpandMission,
    nameSet, playerName, handleSetPlayerName, lastPuzzlePoints,
  };
}
