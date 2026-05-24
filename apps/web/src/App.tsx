import { useGameState } from "./hooks/useGameState";
import { useAudio } from "./hooks/useAudio";
import { StartScreen } from "./components/StartScreen";
import { NameScreen } from "./components/NameScreen";
import { AuthScreen } from "./components/AuthScreen";
import { LeaderboardScreen } from "./components/LeaderboardScreen";
import { CinematicScreen } from "./components/CinematicScreen";
import { WorldMapScreen } from "./components/WorldMapScreen";
import { GameBoard } from "./components/GameBoard";
import { WinScreen } from "./components/WinScreen";
import { GameMenu } from "./components/GameMenu";
import { MissionCard } from "./components/MissionCard";
import { ScoreBreakdown } from "./components/ScoreBreakdown";
import {
  DEV_MODE, DIFFICULTY_INFO,
  RA_LIGHT_MAX, THOTH_HAND_MAX, VISION_MAX,
} from "./constants";
import { getTheme } from "./theme";
import { formatTime } from "./utils/solver";

export function App() {
  const game = useGameState();
  const audio = useAudio({ screen: game.screen, winPhase: game.winPhase, elapsed: game.elapsed, n: game.n });
  const theme = getTheme(game.puzzleIdx);
  console.log("puzzleIdx:", game.puzzleIdx, "primary:", theme.primary);

  const totalScore = Object.values(game.puzzleProgress).reduce(
    (sum, p) => sum + (p.points ?? 0), 0,
  );

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"
      style={{ paddingTop: 16, paddingBottom: 24 }}
      data-chapter={String(Math.ceil((game.puzzleIdx + 1) / 8))}
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
                color: theme.primary,
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
          theme={theme}
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
              {(() => {
                const chapter = game.puzzleIdx < 8 ? 1 : 2;
                const silent = chapter === 2 ? "The gods are silent" : "The gods are silent";
                const raLabel = chapter === 2 ? "⚡ Apollo's Light" : "✦ Ra's Light";
                const thothLabel = chapter === 2 ? "🦉 Athena's Hand" : "𓂀 Thoth's Hand";
                return (
                  <div className="favor-btn-row">
                    <button
                      className={`favor-btn${game.raLightUsed >= RA_LIGHT_MAX ? " favor-btn-spent" : ""}`}
                      onClick={game.handleRaLight}
                      disabled={game.raLightUsed >= RA_LIGHT_MAX}
                      title={game.raLightUsed >= RA_LIGHT_MAX ? silent : "+2 moves"}
                    >
                      {raLabel} ({RA_LIGHT_MAX - game.raLightUsed})
                    </button>
                    <button
                      className={`favor-btn${game.thothUsed >= THOTH_HAND_MAX ? " favor-btn-spent" : ""}`}
                      onClick={game.handleThothHand}
                      disabled={game.thothUsed >= THOTH_HAND_MAX}
                      title={game.thothUsed >= THOTH_HAND_MAX ? silent : "+5 moves"}
                    >
                      {thothLabel} ({THOTH_HAND_MAX - game.thothUsed})
                    </button>
                    <button
                      className={`favor-btn${game.visionUsed >= VISION_MAX ? " favor-btn-spent" : ""}`}
                      onClick={game.handleVisionOfOsiris}
                      disabled={game.visionUsed >= VISION_MAX}
                      title={game.visionUsed >= VISION_MAX ? silent : "Free — no move cost"}
                    >
                      ◈ Vision ({VISION_MAX - game.visionUsed})
                    </button>
                  </div>
                );
              })()}
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
            color: theme.primary,
            background: theme.primaryBg,
            border: `1px solid ${theme.primaryBorder}`,
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
          handleContinue={game.handleContinue}
          handleShowAuth={game.handleShowAuth}
          handleShowLeaderboard={game.handleShowLeaderboard}
          isMuted={audio.isMuted}
          onToggleMute={audio.toggleMute}
        />
      )}

      {/* Name screen */}
      {game.screen === "name" && (
        <NameScreen
          onPlayerNameChange={game.handleSetPlayerName}
          onConfirm={game.handleNameConfirm}
          onBack={game.handleBackToStart}
        />
      )}

      {/* Auth screen */}
      {game.screen === "auth" && (
        <AuthScreen
          onSkip={game.handleSkipAuth}
          onBack={game.handleBackToStart}
        />
      )}

      {/* Leaderboard screen */}
      {game.screen === "leaderboard" && (
        <LeaderboardScreen
          puzzleProgress={game.puzzleProgress}
          playerName={game.playerName}
          onBack={game.handleBackFromLeaderboard}
        />
      )}

      {/* Cinematic screen */}
      {game.screen === "cinematic" && (
        <CinematicScreen
          currentChapterId={game.currentChapterId}
          theme={theme}
          onBack={game.handleBackToStart}
          onContinue={game.handleCinematicContinue}
        />
      )}

      {/* World map */}
      {game.screen === "map" && (
        <WorldMapScreen
          key={game.mapKey}
          puzzleProgress={game.puzzleProgress}
          builtChapters={[1, 2]}
          onSelectChapter={(chapterId) => game.handleMapSelect(chapterId)}
          onResetRequest={game.handleResetRequest}
          onShowLeaderboard={game.handleShowLeaderboard}
          onBack={() => game.setScreen("start")}
        />
      )}

      {/* Mission overlay */}
      {game.screen === "game" && (game.missionPhase === "full" || game.missionPhase === "exiting") && !game.frozen && (
        <MissionCard
          phase={game.missionPhase as "full" | "exiting"}
          puzzle={game.puzzle}
          playerName={game.playerName}
          theme={theme}
          onDismiss={game.handleDismissMission}
          onExpand={game.handleExpandMission}
        />
      )}

      {/* Win screen */}
      {game.winPhase === "lore" && game.screen === "game" && (
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
          theme={theme}
          handlePlayAgain={game.handlePlayAgain}
          handleNextShard={game.handleNextShard}
          handleViewMap={game.handleViewMap}
        />
      )}

      {/* Score breakdown */}
      {game.winPhase === "reveal" && game.screen === "game" && (
        <ScoreBreakdown
          stars={game.stars}
          moves={game.moves}
          elapsed={game.elapsed}
          raLightUsed={game.raLightUsed}
          thothUsed={game.thothUsed}
          theme={theme}
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
        theme={theme}
        handleShowMap={game.handleShowMap}
        handleShowLeaderboard={game.handleShowLeaderboard}
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
