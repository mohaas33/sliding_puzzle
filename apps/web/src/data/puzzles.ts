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
    hook: "The sun god has gone blind. Restore the Eye before darkness falls.",
    lore: "The sun god's gaze has been shattered across the temple floor. Darkness falls on Egypt — restore the Eye before Ra can no longer find his way across the sky.",
    win: "The Eye opens. Ra sees Egypt once more and the sun climbs the sky. But something is wrong — the scales of judgment in the Hall of Two Truths lie broken. A soul cannot pass until they are restored.",
  },
  {
    id: 2,
    name: "Anubis Weighs the Heart",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_2.png`,
    hook: "A soul stands at judgment. The scales are broken. Justice cannot be served.",
    lore: "A soul stands before Anubis in the Hall of Two Truths. The scales of judgment lie in pieces. Without them, the dead cannot pass into the Field of Reeds.",
    win: "The scales balance. A worthy soul crosses into the Field of Reeds. But whispers of drought are spreading — without the Nile's calendar, Egypt will starve.",
  },
  {
    id: 3,
    name: "The Nile's Gift",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_3.png`,
    hook: "The Nile will not flood. The sacred calendar has been shattered.",
    lore: "The flooding season approaches. Farmers stand idle — the sacred calendar that tells them when to plant has been scattered. Without it, the fields will wither.",
    win: "The floods come at exactly the right moment. The fields turn green. But in the palace, the great pharaoh's image has been erased from his own battle monument.",
  },
  {
    id: 4,
    name: "Pharaoh's Procession",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_4.png`,
    hook: "The great pharaoh's image has been struck from stone. He is being forgotten.",
    lore: "Ramses the Great rides to battle at Kadesh — but his image has been struck from the stone by jealous enemies. A pharaoh forgotten is a pharaoh unmade.",
    win: "Ramses rides again, eternal and victorious. His name is restored. But deeper in the tomb, the sacred spells that guide the dead have been scrambled.",
  },
  {
    id: 5,
    name: "The Book of the Dead",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_5.png`,
    hook: "The sacred spells are scrambled. The dead wander the underworld lost.",
    lore: "The sacred papyrus of Hunefer — filled with spells to navigate the underworld — has been torn apart. Without it, the pharaoh wanders the darkness forever.",
    win: "The spells are whole again. The path through the underworld is clear. Yet Osiris himself has been torn apart once more, just as he was by Set.",
  },
  {
    id: 6,
    name: "Osiris Reborn",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_6.png`,
    hook: "Set has torn Osiris apart once more. Isis weeps at the pieces.",
    lore: "Set has scattered the pieces of Osiris across Egypt once more. Isis weeps. The god of resurrection cannot rise until every fragment is found and restored.",
    win: "Osiris rises again. Death and rebirth return to balance. Now only one thing remains — the sacred scarab that pushes the sun across the sky has gone still.",
  },
  {
    id: 7,
    name: "The Sacred Scarab",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_7.png`,
    hook: "The scarab has stopped. The sun hangs motionless. Dawn will not come.",
    lore: "Khepri, the sacred scarab, rolls the sun across the sky each dawn. But the amulet has shattered and the sun hangs motionless. Dawn cannot come.",
    win: "Khepri takes flight, pushing the golden disc from horizon to horizon. One final task awaits — the Valley of the Kings must be sealed, or the pharaohs' power will never rest.",
  },
  {
    id: 8,
    name: "Valley of the Kings",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/puzzle_8.png`,
    hook: "The final tomb is unsealed. The pharaohs' power bleeds into darkness.",
    lore: "The ceiling of Ramses IV's tomb blazes with stars and sacred texts — but the pattern has been broken. Until it is restored, the king cannot ascend to the heavens.",
    win: "The last tomb is sealed. Egypt breathes again. But as you place the final shard, a cold wind blows from the north. Someone has been watching you — and they have begun scattering the shards of another civilization. The work is not done.",
  },
];
