import { useGameState } from "./hooks/useGameState";
import { useAudio } from "./hooks/useAudio";
import { StartScreen } from "./components/StartScreen";
import { WorldMapScreen } from "./components/WorldMapScreen";
import { GameBoard } from "./components/GameBoard";
import { WinScreen } from "./components/WinScreen";
import { GameMenu } from "./components/GameMenu";
import { MissionCard } from "./components/MissionCard";
import { ScoreBreakdown } from "./components/ScoreBreakdown";
import {
  DEV_MODE, CHAPTER_LABEL, DIFFICULTY_INFO,
  RA_LIGHT_MAX, THOTH_HAND_MAX, VISION_MAX,
} from "./constants";
import { formatTime } from "./utils/solver";

export function App() {
  const game = useGameState();
  const audio = useAudio({ screen: game.screen, winPhase: game.winPhase, elapsed: game.elapsed, n: game.n });

  const totalScore = Object.values(game.puzzleProgress).reduce(
    (sum, p) => sum + (p.points ?? 0), 0,
  );

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"
      style={{ paddingTop: 16, paddingBottom: 24 }}
      onPointerUp={() => game.setPressedIdx(null)}
    >
      {/* Top bar — only during active gameplay */}
      {game.screen === "game" && (
        <div className="top-bar">
          <button
            onClick={() => game.setMenuOpen(true)}
            className="hamburger-btn"
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>

          <p className="top-bar-name">
            {game.puzzle.name}
            <span className="diff-badge">{DIFFICULTY_INFO[game.n].starsSymbol}</span>
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div className="top-bar-stats">
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "9px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "#c8a96e",
                opacity: 0.6,
              }}>Moves</span>
              <div style={{ position: "relative" }}>
                <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>{game.moves}</span>
                {game.penaltyKey > 0 && (
                  <span key={game.penaltyKey} className="penalty-pop">+{game.lastPenalty}</span>
                )}
              </div>
              <span style={{ opacity: 0.3 }}>·</span>
              <span>{formatTime(game.elapsed)}</span>
              {totalScore > 0 && (
                <>
                  <span style={{ opacity: 0.3 }}>·</span>
                  <span>✦ {totalScore.toLocaleString()}</span>
                </>
              )}
            </div>

            <button
              className="narration-btn"
              onClick={audio.toggleMute}
              title={audio.isMuted ? "Unmute music" : "Mute music"}
              aria-label={audio.isMuted ? "Unmute music" : "Mute music"}
            >
              {audio.isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      )}

      {/* Mission bar — only during active gameplay */}
      {game.screen === "game" && game.missionPhase === "bar" && !game.frozen && (
        <MissionCard
          phase="bar"
          puzzle={game.puzzle}
          playerName={game.playerName}
          onDismiss={game.handleDismissMission}
          onExpand={game.handleExpandMission}
        />
      )}

      {/* Board + Favor panel — only during active gameplay */}
      {game.screen === "game" && (
        <div className="board-column">
          <GameBoard
            n={game.n}
            tiles={game.tiles}
            puzzle={game.puzzle}
            imageLoaded={game.imageLoaded}
            winPhase={game.winPhase}
            frozen={game.frozen}
            moveLocked={game.moveLocked}
            movable={game.movable}
            raLightIdx={game.raLightIdx}
            hintGlow={game.hintGlow}
            visionActive={game.visionActive}
            pressedIdx={game.pressedIdx}
            onPointerDown={game.handlePointerDown}
            onPointerUp={game.handlePointerUp}
          />

          {!game.frozen && (
            <div className="favor-panel">
              <span className="favor-panel-label">Favor of the Gods</span>
              <div className="favor-btn-row">
                <button
                  className={`favor-btn${game.raLightUsed >= RA_LIGHT_MAX ? " favor-btn-spent" : ""}`}
                  onClick={game.handleRaLight}
                  disabled={game.raLightUsed >= RA_LIGHT_MAX}
                  title={game.raLightUsed >= RA_LIGHT_MAX ? "The gods are silent" : "+2 moves"}
                >
                  ✦ Ra's Light ({RA_LIGHT_MAX - game.raLightUsed})
                </button>
                <button
                  className={`favor-btn${game.thothUsed >= THOTH_HAND_MAX ? " favor-btn-spent" : ""}`}
                  onClick={game.handleThothHand}
                  disabled={game.thothUsed >= THOTH_HAND_MAX}
                  title={game.thothUsed >= THOTH_HAND_MAX ? "The gods are silent" : "+5 moves"}
                >
                  𓂀 Thoth's Hand ({THOTH_HAND_MAX - game.thothUsed})
                </button>
                <button
                  className={`favor-btn${game.visionUsed >= VISION_MAX ? " favor-btn-spent" : ""}`}
                  onClick={game.handleVisionOfOsiris}
                  disabled={game.visionUsed >= VISION_MAX}
                  title={game.visionUsed >= VISION_MAX ? "The gods are silent" : "Free — no move cost"}
                >
                  ◈ Vision ({VISION_MAX - game.visionUsed})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dev shortcut */}
      {DEV_MODE && (
        <button
          onClick={game.handleDevSolve}
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            fontFamily: "'Cinzel', serif",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#c8a96e",
            background: "rgba(200, 169, 110, 0.08)",
            border: "1px solid rgba(200, 169, 110, 0.25)",
            borderRadius: 4,
            padding: "6px 12px",
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          Dev: Solve
        </button>
      )}

      {/* Start screen */}
      {game.screen === "start" && (
        <StartScreen
          startDifficulty={game.startDifficulty}
          setStartDifficulty={game.setStartDifficulty}
          handleBeginJourney={game.handleBeginJourney}
          handleNewGame={game.handleResetRequest}
          playerName={game.playerName}
          onPlayerNameChange={game.handleSetPlayerName}
        />
      )}

      {/* Cinematic screen */}
      {game.screen === "cinematic" && (
        <div className="cinematic-overlay" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={game.handleBackToStart}
            style={{
              position: "absolute",
              top: 16,
              left: 20,
              fontFamily: "'Cinzel', serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(200,169,110,0.35)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 4px",
            }}
          >
            ← Back
          </button>
          <p className="cinematic-label">{CHAPTER_LABEL}</p>
          <div className="gold-sep" style={{ width: 120, marginBottom: 40 }} />

          <div className="cinematic-body">
            <p className="cinematic-p1">
              You are <em>{game.playerName}</em>, scribe of the Temple of Karnak.
              On the night of the spring flood, a tomb robber broke through
              the walls you were sworn to protect.
            </p>
            <p className="cinematic-p2">
              Ra has gone blind. The Nile has stopped. The dead wander lost.
            </p>
            <p className="cinematic-p3">
              Anubis has spoken your judgment: restore every shattered shard before the
              next eclipse — or your soul will be weighed against a stone, not a feather.
            </p>
            <p className="cinematic-p4">
              Begin, <em>{game.playerName}</em>.
            </p>
          </div>

          {game.cinematicReady && (
            <button
              className="win-btn win-btn-primary cinematic-continue"
              onClick={game.handleCinematicContinue}
              style={{ animation: "fadeIn 0.5s ease" }}
            >
              Enter the Chapter →
            </button>
          )}
        </div>
      )}

      {/* World map */}
      {game.screen === "map" && (
        <WorldMapScreen
          key={game.mapKey}
          puzzleProgress={game.puzzleProgress}
          builtChapters={[1]}
          onSelectChapter={(chapterId) => game.handleMapSelect(chapterId)}
          onResetRequest={game.handleResetRequest}
        />
      )}

      {/* Mission overlay */}
      {game.screen === "game" && (game.missionPhase === "full" || game.missionPhase === "exiting") && !game.frozen && (
        <MissionCard
          phase={game.missionPhase as "full" | "exiting"}
          puzzle={game.puzzle}
          playerName={game.playerName}
          onDismiss={game.handleDismissMission}
          onExpand={game.handleExpandMission}
        />
      )}

      {/* Win screen */}
      {game.winPhase === "lore" && (
        <WinScreen
          puzzle={game.puzzle}
          puzzleIdx={game.puzzleIdx}
          moves={game.moves}
          elapsed={game.elapsed}
          stars={game.stars}
          playerName={game.playerName}
          raLightUsed={game.raLightUsed}
          thothUsed={game.thothUsed}
          visionUsed={game.visionUsed}
          puzzlePoints={game.lastPuzzlePoints.total}
          handlePlayAgain={game.handlePlayAgain}
          handleNextShard={game.handleNextShard}
          handleViewMap={game.handleViewMap}
        />
      )}

      {/* Score breakdown */}
      {game.winPhase === "reveal" && (
        <ScoreBreakdown
          stars={game.stars}
          moves={game.moves}
          elapsed={game.elapsed}
          raLightUsed={game.raLightUsed}
          thothUsed={game.thothUsed}
        />
      )}

      <GameMenu
        menuOpen={game.menuOpen}
        setMenuOpen={game.setMenuOpen}
        showResetConfirm={game.showResetConfirm}
        setShowResetConfirm={game.setShowResetConfirm}
        hintGlow={game.hintGlow}
        currentDifficulty={game.n}
        musicMuted={audio.isMuted}
        handleShowMap={game.handleShowMap}
        handleRestartPuzzle={() => { game.startPuzzle(game.puzzleIdx); game.setMenuOpen(false); }}
        handleResetRequest={game.handleResetRequest}
        handleResetConfirm={game.handleResetConfirm}
        handleToggleHintGlow={game.handleToggleHintGlow}
        onChangeDifficulty={(newN) => { game.handleDifficultyChange(newN); game.setMenuOpen(false); }}
        onToggleMusic={audio.toggleMute}
      />
    </main>
  );
}
