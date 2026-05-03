import type { PuzzleData } from "../types";

export interface ChapterMeta {
  id: number;
  label: string;
  introNarration: string;
}

export const CHAPTERS: Record<number, ChapterMeta> = {
  1: {
    id: 1,
    label: "Chapter I · Ancient Egypt",
    introNarration:
      "3,350 years ago, a tomb robber broke into the sacred chamber of a forgotten pharaoh. " +
      "In his greed, he shattered the enchanted tiles that held Egypt's greatest secrets. " +
      "The gods fell silent. The Nile stopped flooding. Time itself cracked. " +
      "You are the Restorer — chosen to piece history back together, one shard at a time.",
  },
};

export const PUZZLES: PuzzleData[] = [
  {
    id: 1,
    name: "The Eye of Ra",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_1.png`,
    hook: "Ra cannot see, {name}. Every hour of darkness is another hour your name is cursed.",
    lore: "The sun god's gaze has been shattered across the temple floor. Darkness falls on Egypt — restore the Eye before Ra can no longer find his way across the sky.",
    win: "The Eye opens. Ra sees you, {name} — and for a moment, his gaze is not unkind. But Anubis is watching.",
  },
  {
    id: 2,
    name: "Anubis Weighs the Heart",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_2.png`,
    hook: "A soul is trapped at the scales, {name}. It has been waiting three days.",
    lore: "A soul stands before Anubis in the Hall of Two Truths. The scales of judgment lie in pieces. Without them, the dead cannot pass into the Field of Reeds.",
    win: "The soul passes. It whispers your name as it crosses — the first blessing you have received since the robbery.",
  },
  {
    id: 3,
    name: "The Nile's Gift",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_3.png`,
    hook: "The farmers kneel in dry fields, {name}. They do not know why the Nile refuses to rise. You do.",
    lore: "The flooding season approaches. Farmers stand idle — the sacred calendar that tells them when to plant has been scattered. Without it, the fields will wither.",
    win: "The flood comes. A child runs to the water laughing. You did that, {name}. Remember this feeling.",
  },
  {
    id: 4,
    name: "Pharaoh's Procession",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_4.png`,
    hook: "Someone is erasing Ramses from history, {name}. The same hand that shattered your tiles.",
    lore: "Ramses the Great rides to battle at Kadesh — but his image has been struck from the stone by jealous enemies. A pharaoh forgotten is a pharaoh unmade.",
    win: "Ramses rides again. You see it — a symbol scratched in stone. The robber's mark. You know this hand.",
  },
  {
    id: 5,
    name: "The Book of the Dead",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_5.png`,
    hook: "The dead are screaming in the darkness, {name}. You can hear them if you listen.",
    lore: "The sacred papyrus of Hunefer — filled with spells to navigate the underworld — has been torn apart. Without it, the pharaoh wanders the darkness forever.",
    win: "Silence. The dead find their paths. One voice lingers: 'Hurry, scribe. He is already in Mesopotamia.'",
  },
  {
    id: 6,
    name: "Osiris Reborn",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_6.png`,
    hook: "Even Osiris has been broken, {name}. If the god of resurrection cannot rise — nothing can.",
    lore: "Set has scattered the pieces of Osiris across Egypt once more. Isis weeps. The god of resurrection cannot rise until every fragment is found and restored.",
    win: "Osiris stands and looks at you directly — a god, looking at you — and nods. The scales shift in your favor.",
  },
  {
    id: 7,
    name: "The Sacred Scarab",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_7.png`,
    hook: "Without the scarab, {name}, there will be no tomorrow. Literally.",
    lore: "Khepri, the sacred scarab, rolls the sun across the sky each dawn. But the amulet has shattered and the sun hangs motionless. Dawn cannot come.",
    win: "Dawn breaks for the first time in days. People weep in the streets. They don't know your name. But the gods do.",
  },
  {
    id: 8,
    name: "Valley of the Kings",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_8.png`,
    hook: "This is the last shard in Egypt, {name}. But the robber is already gone. And he took something.",
    lore: "The ceiling of Ramses IV's tomb blazes with stars and sacred texts — but the pattern has been broken. Until it is restored, the king cannot ascend to the heavens.",
    win: "Anubis weighs your heart and smiles for the first time in ten thousand years. 'Well done, {name}. But the trail leads north. To Babylon. The work is not finished.'",
  },
];
