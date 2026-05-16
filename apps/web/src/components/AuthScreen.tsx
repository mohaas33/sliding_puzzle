import { AUTH_PROVIDER_KEY } from "../constants";

interface AuthScreenProps {
  onSkip: () => void;
  onBack: () => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function ProviderIcon({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "rgba(200,169,110,0.12)",
      border: "1px solid rgba(200,169,110,0.3)",
      fontFamily: "'Cinzel', serif",
      fontSize: "0.6rem",
      color: "var(--gold)",
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

export function AuthScreen({ onSkip, onBack }: AuthScreenProps) {
  function handleProvider(provider: "google" | "facebook" | "email") {
    console.log(`Auth: ${provider} clicked`);
    localStorage.setItem(AUTH_PROVIDER_KEY, provider);
    onSkip();
  }

  function handleSkipNow() {
    localStorage.setItem(AUTH_PROVIDER_KEY, "guest");
    onSkip();
  }

  return (
    <div className="cinematic-overlay" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontFamily: "'Cinzel', serif",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(200,169,110,0.6)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "6px 4px",
        }}
      >
        ← Back
      </button>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        maxWidth: 400,
        width: "100%",
      }}>
        <p className="cinematic-label">Account</p>
        <div className="gold-sep" style={{ width: 120, marginBottom: 32 }} />

        <h2 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(18px, 4vw, 24px)",
          letterSpacing: "0.08em",
          color: "#f0e4c4",
          textAlign: "center",
          margin: "0 0 10px",
        }}>
          Sign In to Shards of Time
        </h2>
        <p style={{
          fontFamily: "'Crimson Text', serif",
          fontStyle: "italic",
          fontSize: "0.95rem",
          color: "rgba(200,169,110,0.6)",
          textAlign: "center",
          margin: "0 0 36px",
          lineHeight: 1.5,
        }}>
          Save progress across devices · Compete on leaderboards
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          <button className="auth-provider-btn" onClick={() => handleProvider("google")}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <button className="auth-provider-btn" onClick={() => handleProvider("facebook")}>
            <ProviderIcon label="f" />
            <span>Continue with Facebook</span>
          </button>

          <button className="auth-provider-btn" onClick={() => handleProvider("email")}>
            <ProviderIcon label="✉" />
            <span>Continue with Email</span>
          </button>
        </div>

        <button
          className="start-new-game-link"
          onClick={handleSkipNow}
          style={{ marginTop: 24 }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
