export interface ChapterTheme {
  primary: string;
  primaryDim: string;
  primaryFaint: string;
  primaryBg: string;
  primaryBorder: string;
  primaryBorderBright: string;
  gradient: string;
  gradientDim: string;
}

export const CHAPTER_THEMES: Record<number, ChapterTheme> = {
  1: {
    primary:             "#c8a96e",
    primaryDim:          "rgba(200,169,110,0.5)",
    primaryFaint:        "rgba(200,169,110,0.1)",
    primaryBg:           "rgba(200,169,110,0.08)",
    primaryBorder:       "rgba(200,169,110,0.25)",
    primaryBorderBright: "rgba(200,169,110,0.45)",
    gradient:            "linear-gradient(135deg, #c8a96e 0%, #a07c3c 100%)",
    gradientDim:         "#a07c3c",
  },
  2: {
    primary:             "#7eb8e8",
    primaryDim:          "rgba(126,184,232,0.5)",
    primaryFaint:        "rgba(126,184,232,0.1)",
    primaryBg:           "rgba(126,184,232,0.08)",
    primaryBorder:       "rgba(126,184,232,0.25)",
    primaryBorderBright: "rgba(126,184,232,0.45)",
    gradient:            "linear-gradient(135deg, #7eb8e8 0%, #4a8bbf 100%)",
    gradientDim:         "#4a8bbf",
  },
  3: {
    primary:             "#5dcaa5",
    primaryDim:          "rgba(93,202,165,0.5)",
    primaryFaint:        "rgba(93,202,165,0.1)",
    primaryBg:           "rgba(93,202,165,0.08)",
    primaryBorder:       "rgba(93,202,165,0.25)",
    primaryBorderBright: "rgba(93,202,165,0.45)",
    gradient:            "linear-gradient(135deg, #5dcaa5 0%, #2e9973 100%)",
    gradientDim:         "#2e9973",
  },
  4: {
    primary:             "#ef9f27",
    primaryDim:          "rgba(239,159,39,0.5)",
    primaryFaint:        "rgba(239,159,39,0.1)",
    primaryBg:           "rgba(239,159,39,0.08)",
    primaryBorder:       "rgba(239,159,39,0.25)",
    primaryBorderBright: "rgba(239,159,39,0.45)",
    gradient:            "linear-gradient(135deg, #ef9f27 0%, #b87010 100%)",
    gradientDim:         "#b87010",
  },
  5: {
    primary:             "#afa9ec",
    primaryDim:          "rgba(175,169,236,0.5)",
    primaryFaint:        "rgba(175,169,236,0.1)",
    primaryBg:           "rgba(175,169,236,0.08)",
    primaryBorder:       "rgba(175,169,236,0.25)",
    primaryBorderBright: "rgba(175,169,236,0.45)",
    gradient:            "linear-gradient(135deg, #afa9ec 0%, #7a72cc 100%)",
    gradientDim:         "#7a72cc",
  },
};

export function getTheme(puzzleIdx: number): ChapterTheme {
  const chapterId = Math.ceil((puzzleIdx + 1) / 8);
  return CHAPTER_THEMES[chapterId] ?? CHAPTER_THEMES[1]!;
}
