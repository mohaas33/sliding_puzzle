interface ScoreBreakdownProps {
  stars: number;
  moves: number;
  elapsed: number;
  raLightUsed: number;
  thothUsed: number;
}

export function ScoreBreakdown({ stars, moves, elapsed, raLightUsed, thothUsed }: ScoreBreakdownProps) {
  const moveCost = moves * 10;
  const base = Math.max(100, 1000 - moveCost);
  const speedBonus = elapsed < 30 ? 200 : elapsed < 60 ? 100 : 0;
  const noFavorsBonus = raLightUsed === 0 && thothUsed === 0 ? 100 : 0;
  const starsBonus = stars * 50;
  const total = base + speedBonus + noFavorsBonus + starsBonus;

  const rows: { label: string; value: number; delay: number }[] = [
    { label: "BASE",      value: base,          delay: 0   },
    ...(speedBonus    > 0 ? [{ label: "SPEED",     value: speedBonus,    delay: 0.5 }] : []),
    ...(noFavorsBonus > 0 ? [{ label: "NO FAVORS", value: noFavorsBonus, delay: 1.0 }] : []),
    ...(starsBonus    > 0 ? [{ label: "STARS",     value: starsBonus,    delay: 1.5 }] : []),
  ];

  return (
    <div className="score-breakdown-overlay">
      <div className="score-breakdown-card">
        {rows.map((row) => (
          <div
            key={row.label}
            className="score-breakdown-row"
            style={{ animationDelay: `${row.delay}s` }}
          >
            <span className="score-breakdown-label">{row.label}</span>
            <span className="score-breakdown-value">+{row.value}</span>
          </div>
        ))}

        <div className="score-breakdown-divider" style={{ animationDelay: "1.75s" }} />

        <div className="score-breakdown-total" style={{ animationDelay: "2s" }}>
          ✦ {total} POINTS
        </div>
      </div>
    </div>
  );
}
