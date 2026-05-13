import type { Difficulty, Narrator } from "./types";
import type { VoiceGender } from "./utils/narration";
export { PUZZLES, CHAPTERS } from "./data/puzzles";

export const DEV_MODE = new URLSearchParams(window.location.search).get("dev") === "true";
export const BOARD_PX = 344;
export const GAP_PX = 6;

export const DIFFICULTY_KEY = "shards_of_time_difficulty_v1";
export const INTRO_KEY = "shards_of_time_chapter1_intro_seen";
export const CINEMATIC_SEEN_KEY = "shards_of_time_cinematic_seen";
export const PROGRESS_KEY = "shards_of_time_chapter1_progress";
export const PROGRESS_KEY_2 = "shards_of_time_chapter2_progress";
export const HINT_GLOW_KEY = "shards_of_time_hint_glow";
export const NARRATION_KEY = "shards_of_time_narration";
export const VOICE_GENDER_KEY = "shards_of_time_voice_gender";
export const NARRATOR_KEY = "shards_of_time_narrator";
export const PLAYER_NAME_KEY = "shards_of_time_player_name";
export const DEFAULT_PLAYER_NAME = "Kha";

export const CHAPTER_LABEL = "Chapter I · Ancient Egypt";
export const RA_LIGHT_MAX = 5;
export const RA_LIGHT_COST = 2;
export const THOTH_HAND_MAX = 3;
export const THOTH_HAND_COST = 5;
export const VISION_MAX = 2;
export const VISION_DURATION_MS = 3000;
export const NARRATOR_VOICE_SAMPLE = "The sands of time await, brave soul.";

export const INTRO_NARRATION = (name: string): string =>
  `You are ${name}, scribe of the Temple of Karnak. ` +
  `On the night of the spring flood, a tomb robber broke through the walls you were sworn to protect. ` +
  `Ra has gone blind. The Nile has stopped. The dead wander lost. ` +
  `Anubis has spoken your judgment: restore every shattered shard before the next eclipse — ` +
  `or your soul will be weighed against a stone, not a feather. ` +
  `Begin, ${name}.`;

export interface NarratorInfo {
  id: Narrator;
  name: string;
  role: string;
  gender: VoiceGender | null;
  rate: number;
}

export const NARRATORS: NarratorInfo[] = [
  { id: "osiris", name: "Osiris", role: "God of Resurrection · Deep & Authoritative", gender: "man", rate: 0.85 },
  { id: "isis",   name: "Isis",   role: "Goddess of Magic · Warm & Mysterious",       gender: "woman", rate: 0.85 },
  { id: "thoth",  name: "Thoth",  role: "God of Wisdom · Calm & Neutral",             gender: "man",  rate: 0.80 },
  { id: "off",    name: "Off",    role: "No Narration",                                gender: null,   rate: 0.85 },
];

export interface DifficultyInfo {
  n: Difficulty;
  label: string;
  tiles: number;
  desc: string;
  multiplier: number;
  par: number;
  starsSymbol: string;
}

export const DIFFICULTY_INFO: Record<3 | 4 | 5, DifficultyInfo> = {
  3: { n: 3, label: "Apprentice Scribe", tiles: 8,  desc: "Learn the sacred arts",   multiplier: 1, par: 20,  starsSymbol: "✦"   },
  4: { n: 4, label: "Temple Keeper",     tiles: 15, desc: "Prove your devotion",      multiplier: 2, par: 50,  starsSymbol: "✦✦"  },
  5: { n: 5, label: "High Priest",       tiles: 24, desc: "Face the gods themselves", multiplier: 3, par: 100, starsSymbol: "✦✦✦" },
};

export const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: `${4 + ((i * 4.3) % 90)}%`,
  delay: `${(i * 0.71) % 13}s`,
  duration: `${9 + ((i * 1.4) % 9)}s`,
  size: i % 4 === 0 ? 3 : 2,
  opacity: 0.25 + (i % 3) * 0.15,
}));
