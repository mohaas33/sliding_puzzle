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
  2: {
    id: 2,
    label: "Chapter II · Ancient Greece",
    introNarration:
      "Two thousand years before your birth, a hero shattered the mirror of Athena " +
      "and scattered its fragments across the Aegean. The gods fell to quarreling. " +
      "Heroes lost their way. Troy burns for the wrong reasons. " +
      "You are the Restorer — called now to the land of marble and myth.",
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
  {
    id: 9,
    name: "The Parthenon",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_1.png`,
    hook: "Athena's temple is crumbling, {name}. The goddess watches with cold eyes.",
    lore: "The Parthenon crowns the Acropolis, built to honour Athena — goddess of wisdom and war. But its sacred frieze has been shattered, and without it the goddess withdraws her protection from Athens.",
    win: "Athena rests her hand on the stone. 'You see clearly, {name},' she says. 'A rare thing among mortals.'",
  },
  {
    id: 10,
    name: "Zeus and the Lightning",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_2.png`,
    hook: "Without his lightning, {name}, Zeus is just an old man on a cold mountain.",
    lore: "The king of Olympus has lost his thunderbolt — shattered into fragments that now rain down as ordinary storms. The natural order collapses without his sovereign power.",
    win: "Thunder rolls across a clear sky. Zeus laughs — the sound shakes the Aegean. He looks at you once, then away. That is enough.",
  },
  {
    id: 11,
    name: "The Sirens' Song",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_3.png`,
    hook: "Sailors are steering toward the rocks, {name}. The Sirens sing a broken song and it is still enough.",
    lore: "Odysseus lashed himself to the mast to hear the Sirens safely — but their image has been scrambled and their warning lost. Ships wreck without knowing why.",
    win: "The song resolves into something heartbreaking and whole. Three sailors weep. None of them can say why. You can.",
  },
  {
    id: 12,
    name: "The Oracle of Delphi",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_4.png`,
    hook: "The Oracle speaks only riddles now, {name}. Even more than usual.",
    lore: "At the Temple of Apollo, the Pythia breathes sacred fumes and speaks the god's will. But the vision has been shattered — her prophecies arrive as fragments, misunderstood, leading kings to ruin.",
    win: "The Oracle opens her eyes and looks directly at you — not through you, as she does with everyone else. 'The thief goes east,' she says. 'He always goes east.'",
  },
  {
    id: 13,
    name: "Achilles at Troy",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_5.png`,
    hook: "The greatest warrior in the world is fighting blind, {name}. His glory is scattered.",
    lore: "Achilles, son of Thetis, blazes across the battlefield at Troy — but his divine armour has been shattered and its image lost. Without it, the hero cannot fulfil his destiny.",
    win: "Achilles pauses mid-battle and looks at the sky. Something has changed. His armour gleams. He does not know why. You do.",
  },
  {
    id: 14,
    name: "Perseus and Medusa",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_6.png`,
    hook: "Perseus is looking directly at Medusa, {name}. The mirror is broken.",
    lore: "Perseus used Athena's polished shield as a mirror to face the Gorgon without meeting her petrifying gaze. But the reflection has been shattered — the hero is looking into chaos.",
    win: "The shield shows a clear reflection. Perseus exhales slowly. 'I thought I was already stone,' he whispers. He will never know how close he was.",
  },
  {
    id: 15,
    name: "The Olympic Games",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_7.png`,
    hook: "Without the Games, {name}, the city-states have no reason to stop fighting.",
    lore: "Every four years, the Olympic truce halts all wars across Greece. But the sacred image of the Games has been destroyed — the truce is unrecognised and battles rage through what should be a holy peace.",
    win: "The first runner crosses the finish. The crowd roars. For a moment, Greek against Greek means something other than war. You made this possible, {name}.",
  },
  {
    id: 16,
    name: "The Underworld",
    imageUrl: `${import.meta.env.BASE_URL}puzzles/greece/puzzle_8.png`,
    hook: "Even the dead are lost, {name}. Hades cannot find his own kingdom.",
    lore: "Hades and Persephone rule the realm of the dead — but the map of the Underworld has been shattered. Souls wander without destination. The rivers Styx and Lethe overflow their banks.",
    win: "Persephone places a single pomegranate seed on the stone before you. You did not ask for it. 'The thief passed through here,' she says quietly. 'He is afraid of something older than Greece.'",
  },
];
