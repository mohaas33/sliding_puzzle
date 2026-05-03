import { useNarration } from "./hooks/useNarration";
import { useGameState } from "./hooks/useGameState";
import { StartScreen } from "./components/StartScreen";
import { ChapterMap } from "./components/ChapterMap";
import { GameBoard } from "./components/GameBoard";
import { WinScreen } from "./components/WinScreen";
import { GameMenu } from "./components/GameMenu";
import { MissionCard } from "./components/MissionCard";
import { Waveform } from "./components/Waveform";
import { DEV_MODE, CHAPTER_LABEL, DIFFICULTIES, STEP_PENALTY } from "./constants";
import { formatTime } from "./utils/solver";

export function App() {
  const narration = useNarration();
  const game = useGameState(narration);
  const { narrationOn, narratingCtx, voiceOption } = narration;

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"
      style={{ paddingTop: 16, paddingBottom: 148 }}
      onPointerUp={() => game.setPressedIdx(null)}
    >
      {/* Top bar */}
      <div className="top-bar">
        <button
          onClick={() => game.setMenuOpen(true)}
          className="hamburger-btn"
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>

        <p className="top-bar-name">{game.puzzle.name}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div className="top-bar-stats">
            <div style={{ position: "relative" }}>
              <span>{game.moves}</span>
              {game.penaltyKey > 0 && (
                <span key={game.penaltyKey} className="penalty-pop">+{STEP_PENALTY}</span>
              )}
            </div>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>{formatTime(game.elapsed)}</span>
          </div>

          <button
            className={`narration-btn${narratingCtx !== null && narrationOn ? " narration-btn-active" : ""}`}
            onClick={narration.handleToggleNarration}
            title={narrationOn ? "Mute narration" : "Enable narration"}
            aria-label={narrationOn ? "Mute narration" : "Enable narration"}
          >
            {narrationOn && narratingCtx !== null ? <Waveform /> : narrationOn ? "🔊" : "🔇"}
          </button>
        </div>
      </div>

      {/* Mission bar (collapsed, in-flow) */}
      {game.missionPhase === "bar" && !game.frozen && (
        <MissionCard
          phase="bar"
          puzzle={game.puzzle}
          onDismiss={game.handleDismissMission}
          onExpand={game.handleExpandMission}
        />
      )}

      {/* Board */}
      <GameBoard
        n={game.n}
        tiles={game.tiles}
        puzzle={game.puzzle}
        imageLoaded={game.imageLoaded}
        winPhase={game.winPhase}
        frozen={game.frozen}
        moveLocked={game.moveLocked}
        movable={game.movable}
        hintIdx={game.hintIdx}
        hintGlow={game.hintGlow}
        pressedIdx={game.pressedIdx}
        onPointerDown={game.handlePointerDown}
        onPointerUp={game.handlePointerUp}
      />

      {/* Bottom bar */}
      {game.screen === "game" && (
        <div className="bottom-bar">
          <div className="bottom-bar-section">
            <span className="bottom-bar-label">Difficulty</span>
            <div className="diff-selector">
              {DIFFICULTIES.map(({ n: dn, label }) => (
                <button
                  key={dn}
                  className={`diff-btn${dn === game.n ? " diff-btn-active" : ""}`}
                  onClick={() => game.handleDifficultyChange(dn)}
                  disabled={game.frozen}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bottom-bar-section">
            <span className="bottom-bar-label">Assistance</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="hint-btn" onClick={game.handleHint} disabled={game.frozen}>
                💡 Hint
              </button>
              <button
                className={`hint-btn${game.stepsLeft === 0 ? " hint-btn-exhausted" : ""}`}
                onClick={game.handleStep}
                disabled={game.frozen || game.stepsLeft === 0}
              >
                👣 Step ({game.stepsLeft} left)
              </button>
              <button className="hint-btn" onClick={game.handleNewGame} disabled={game.frozen}>
                🔄 New Game
              </button>
            </div>
          </div>
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
          voiceOption={voiceOption}
          startDifficulty={game.startDifficulty}
          setStartDifficulty={game.setStartDifficulty}
          handleStartVoiceSelect={narration.handleStartVoiceSelect}
          playSample={narration.playSample}
          handleBeginJourney={game.handleBeginJourney}
          handleNewGame={game.handleResetRequest}
        />
      )}

      {/* Cinematic screen */}
      {game.screen === "cinematic" && (
        <div className="cinematic-overlay" onClick={(e) => e.stopPropagation()}>
          <p className="cinematic-label">{CHAPTER_LABEL}</p>
          <div className="gold-sep" style={{ width: 120, marginBottom: 32 }} />

          <p className="cinematic-text">
            3,350 years ago, a tomb robber broke into the sacred chamber of a forgotten pharaoh.
            In his greed, he shattered the enchanted tiles that held Egypt's greatest secrets.
            The gods fell silent. The Nile stopped flooding. Time itself cracked.
          </p>
          <p className="cinematic-text cinematic-text-light" style={{ marginTop: 20 }}>
            You are the <em>Restorer</em> — chosen to piece history back together,
            one shard at a time.
            {narratingCtx === "intro" && narrationOn && <Waveform />}
          </p>

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

      {/* Chapter map */}
      {game.screen === "map" && (
        <ChapterMap
          key={game.mapKey}
          chapterProgress={game.chapterProgress}
          narrationOn={narrationOn}
          narrationOnRef={narration.narrationOnRef}
          narratingCtx={narratingCtx}
          narratingMapId={narration.narratingMapId}
          setNarratingCtx={narration.setNarratingCtx}
          setNarratingMapId={narration.setNarratingMapId}
          handleMapSelect={game.handleMapSelect}
          handleResetRequest={game.handleResetRequest}
          stopNarration={narration.stopNarration}
        />
      )}

      {/* Mission overlay (full / exiting) */}
      {(game.missionPhase === "full" || game.missionPhase === "exiting") && game.screen === "game" && !game.frozen && (
        <MissionCard
          phase={game.missionPhase as "full" | "exiting"}
          puzzle={game.puzzle}
          onDismiss={game.handleDismissMission}
          onExpand={game.handleExpandMission}
        />
      )}

      {/* Win overlay — stays open until player taps a button, no auto-dismiss */}
      {game.winPhase === "lore" && (
        <WinScreen
          puzzle={game.puzzle}
          puzzleIdx={game.puzzleIdx}
          moves={game.moves}
          elapsed={game.elapsed}
          stars={game.stars}
          narrationOn={narrationOn}
          narratingCtx={narratingCtx}
          handlePlayAgain={game.handlePlayAgain}
          handleNextShard={game.handleNextShard}
          handleViewMap={game.handleViewMap}
        />
      )}

      <GameMenu
        menuOpen={game.menuOpen}
        setMenuOpen={game.setMenuOpen}
        showResetConfirm={game.showResetConfirm}
        setShowResetConfirm={game.setShowResetConfirm}
        hintGlow={game.hintGlow}
        handleShowMap={game.handleShowMap}
        handleRestartPuzzle={() => { game.startPuzzle(game.puzzleIdx); game.setMenuOpen(false); }}
        handleResetRequest={game.handleResetRequest}
        handleResetConfirm={game.handleResetConfirm}
        handleToggleHintGlow={game.handleToggleHintGlow}
      />
    </main>
  );
}
