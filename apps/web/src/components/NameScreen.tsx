import { useState, useEffect, useRef } from "react";
import { DEFAULT_PLAYER_NAME } from "../constants";

interface NameScreenProps {
  onPlayerNameChange: (name: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function NameScreen({ onPlayerNameChange, onConfirm, onBack }: NameScreenProps) {
  const [inputName, setInputName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  function handleConfirm() {
    const cleaned = inputName.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 20).trim();
    onPlayerNameChange(cleaned || DEFAULT_PLAYER_NAME);
    onConfirm();
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

      <p className="cinematic-label">Before You Begin</p>
      <div className="gold-sep" style={{ width: 120, marginBottom: 40 }} />

      <div className="cinematic-body" style={{ alignItems: "center" }}>
        <p className="cinematic-p1" style={{ marginBottom: 24 }}>
          What is your name, traveler?
        </p>
        <input
          ref={inputRef}
          type="text"
          className="name-input"
          value={inputName}
          maxLength={20}
          placeholder="Your name"
          onChange={(e) => setInputName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && inputName.trim().length > 0 && handleConfirm()}
          spellCheck={false}
          autoComplete="off"
          style={{ maxWidth: 300 }}
        />
      </div>

      <button
        className="win-btn win-btn-primary cinematic-continue"
        onClick={handleConfirm}
        style={{ animation: "fadeIn 0.5s ease" }}
      >
        Enter →
      </button>
    </div>
  );
}
