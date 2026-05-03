import type { Difficulty } from "./types";
export { PUZZLES, CHAPTERS } from "./data/puzzles";

export const DEV_MODE = new URLSearchParams(window.location.search).get("dev") === "true";
export const BOARD_PX = 344;
export const GAP_PX = 6;

export const DIFFICULTY_KEY = "shards_of_time_difficulty_v1";
export const INTRO_KEY = "shards_of_time_chapter1_intro_seen";
export const PROGRESS_KEY = "shards_of_time_chapter1_progress";
export const HINT_GLOW_KEY = "shards_of_time_hint_glow";
export const NARRATION_KEY = "shards_of_time_narration";
export const VOICE_GENDER_KEY = "shards_of_time_voice_gender";

export const CHAPTER_LABEL = "Chapter I · Ancient Egypt";
export const MAX_STEPS = 3;
export const STEP_PENALTY = 10;
export const VOICE_SAMPLE = "The sands of time await.";

export const INTRO_NARRATION =
  "3,350 years ago, a tomb robber broke into the sacred chamber of a forgotten pharaoh. " +
  "In his greed, he shattered the enchanted tiles that held Egypt's greatest secrets. " +
  "The gods fell silent. The Nile stopped flooding. Time itself cracked. " +
  "You are the Restorer — chosen to piece history back together, one shard at a time.";

export const DIFFICULTY_DESCS: Record<3 | 4 | 5, string> = {
  3: "Beginner friendly",
  4: "A worthy challenge",
  5: "For the devoted",
};

export const DIFFICULTIES: { n: Difficulty; label: string }[] = [
  { n: 3, label: "3×3 Easy" },
  { n: 4, label: "4×4 Medium" },
  { n: 5, label: "5×5 Hard" },
];

export const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: `${4 + ((i * 4.3) % 90)}%`,
  delay: `${(i * 0.71) % 13}s`,
  duration: `${9 + ((i * 1.4) % 9)}s`,
  size: i % 4 === 0 ? 3 : 2,
  opacity: 0.25 + (i % 3) * 0.15,
}));

