import { useState } from "react";

const BASE = "http://localhost:5000";

export default function DownloadPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE}/download-by-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="dl-root">
        <div className="dl-scanlines" />
        <div className="dl-card">
          <div className="dl-topline" />

          <div className="dl-header">
            <div className="dl-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="dl-header-text">
              <div className="dl-title">R2 DOWNLINK</div>
              <div className="dl-subtitle">Enter your 6-character code to retrieve file</div>
            </div>
          </div>

          <div className="dl-divider" />

          <form className="dl-form" onSubmit={handleDownload}>
            <label className="dl-label">DOWNLOAD CODE</label>
            <input
              className="dl-input"
              type="text"
              placeholder="A3X9KZ"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              disabled={loading}
              autoFocus
              spellCheck={false}
            />

            {error && <div className="dl-error">{error}</div>}

            <button className="dl-btn" type="submit" disabled={loading || code.trim().length === 0}>
              {loading ? (
                <><span className="dl-spinner" />FETCHING…</>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  DOWNLOAD FILE
                </>
              )}
            </button>
          </form>

        </div>

        <div className="dl-footer">R2 DOWNLINK · SECURE RETRIEVAL · TLS 1.3</div>
      </div>
    </>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400&display=swap');

@keyframes dl-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes dl-spin   { to{transform:rotate(360deg)} }

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

.dl-root {
  min-height: 100vh;
  background: #080808;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(44px + 2rem) 1rem 2rem;
  font-family: 'IBM Plex Mono', monospace;
  position: relative;
}

.dl-root::before {
  content: '';
  position: fixed; inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, #f59e0b0a 0%, transparent 65%),
    radial-gradient(ellipse 40% 30% at 90% 90%, #f59e0b06 0%, transparent 55%);
  pointer-events: none;
}

.dl-scanlines {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.09) 2px, rgba(0,0,0,0.09) 4px
  );
  pointer-events: none;
  z-index: 100;
}

.dl-card {
  width: 100%;
  max-width: 420px;
  background: #0f0f0f;
  border: 1px solid #222;
  border-radius: 3px;
  overflow: hidden;
  animation: dl-fadein 0.45s ease;
  box-shadow: 0 0 0 1px #f59e0b14, 0 24px 60px rgba(0,0,0,0.7);
}

.dl-topline {
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #f59e0b 40%, #fbbf24 60%, transparent 100%);
  opacity: 0.7;
}

.dl-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 1.1rem 1.4rem;
}

.dl-logo {
  width: 38px; height: 38px;
  border: 1px solid #222;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  background: #080808;
  flex-shrink: 0;
}

.dl-header-text { flex: 1; }

.dl-title {
  font-size: 14px;
  font-weight: 600;
  color: #e8e8e8;
  letter-spacing: 0.14em;
}

.dl-subtitle {
  font-size: 10px;
  color: #444;
  letter-spacing: 0.06em;
  margin-top: 3px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 300;
}

.dl-divider { height: 1px; background: #191919; }

.dl-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 1.4rem;
}

.dl-label {
  font-size: 8px;
  letter-spacing: 0.14em;
  color: #383838;
}

.dl-input {
  width: 100%;
  padding: 12px 14px;
  background: #080808;
  border: 1px solid #252525;
  border-radius: 3px;
  color: #f59e0b;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.dl-input:focus {
  border-color: #f59e0b44;
  box-shadow: 0 0 16px #f59e0b11;
}

.dl-input::placeholder { color: #282828; }
.dl-input:disabled { opacity: 0.4; }

.dl-error {
  font-size: 10px;
  color: #f87171;
  letter-spacing: 0.06em;
  padding: 8px 10px;
  border: 1px solid #f8717133;
  border-radius: 2px;
  background: #f8717108;
}

.dl-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid #f59e0b77;
  border-radius: 3px;
  color: #f59e0b;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; font-weight: 600; letter-spacing: 0.13em;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.dl-btn:hover:not(:disabled) {
  background: #f59e0b0e;
  border-color: #f59e0b;
  box-shadow: 0 0 18px #f59e0b1a;
}

.dl-btn:disabled { opacity: 0.25; cursor: not-allowed; border-color: #252525; color: #333; }

.dl-spinner {
  width: 11px; height: 11px;
  border: 1.5px solid #f59e0b33;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: dl-spin 0.7s linear infinite;
  margin-right: 6px;
}

.dl-footer {
  margin-top: 1.25rem;
  font-size: 9px; color: #222; letter-spacing: 0.16em;
}
`;
