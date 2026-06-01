import { useState, useRef, useEffect } from "react";
import CodeDisplay from "./components/CodeDisplay";

const CHUNK_SIZE = 5 * 1024 * 1024;
const BASE = "http://localhost:5000";

function fmtBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

function Blink() {
  return <span style={blinkStyle}>█</span>;
}

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [chunkStatus, setChunkStatus] = useState([]);
  const [logs, setLogs] = useState([]);
  const [statusType, setStatusType] = useState("");
  const [downloadCode, setDownloadCode] = useState("");
  const [phase, setPhase] = useState("idle");
  const [retentionDays, setRetentionDays] = useState(1);
  const fileInputRef = useRef();
  const logEndRef = useRef();

  const addLog = (msg) =>
    setLogs((prev) => [...prev, { ts: new Date().toISOString().slice(11, 23), msg }]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 1024 * 1024 * 1024) {
      setFile(null);
      setPhase("error");
      setStatusType("error");
      setLogs([{ ts: new Date().toISOString().slice(11, 23), msg: `✗ ERROR — file exceeds 1 GB limit (${fmtBytes(f.size)})` }]);
      return;
    }
    setFile(f);
    setProgress(0);
    setUploadedChunks(0);
    setTotalChunks(0);
    setChunkStatus([]);
    setLogs([]);
    setStatusType("");
    setDownloadCode("");
    setPhase("idle");
    addLog(`FILE SELECTED — ${f.name} (${fmtBytes(f.size)})`);
  }

  async function handleUpload() {
    if (!file) return;

    if (file.size === 0) {
      addLog("✗ ERROR — file is empty (0 bytes), cannot upload");
      setPhase("error");
      setStatusType("error");
      return;
    }

    setUploading(true);
    setDownloadCode("");
    setPhase("uploading");
    setLogs([]);

    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    setTotalChunks(chunks);
    setUploadedChunks(0);
    setChunkStatus(Array(chunks).fill("idle"));
    setProgress(0);

    addLog(`INIT — ${file.name}`);
    addLog(`CHUNKS — ${chunks} × ${fmtBytes(CHUNK_SIZE)}`);

    try {
      addLog("POST /start-upload ...");
      const startRes = await fetch(`${BASE}/start-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, fileSize: file.size }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || "start-upload failed");

      const { uploadId, key, presignedUrls } = startData;
      addLog(`UPLOAD ID — ${uploadId.slice(0, 16)}…`);

      const parts = [];

      for (let i = 0; i < chunks; i++) {
        const partNumber = i + 1;
        setChunkStatus((prev) => { const n = [...prev]; n[i] = "active"; return n; });
        addLog(`PART ${String(partNumber).padStart(3, "0")} — uploading`);

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const partRes = await fetch(presignedUrls[i].url, {
          method: "PUT",
          body: chunk,
        });

        if (!partRes.ok) throw new Error(`Part ${partNumber} upload failed (${partRes.status})`);

        const etag = (partRes.headers.get("ETag") || "").replace(/"/g, "");
        parts.push({ PartNumber: partNumber, ETag: etag });

        setChunkStatus((prev) => { const n = [...prev]; n[i] = "done"; return n; });
        setUploadedChunks(i + 1);
        setProgress(Math.round(((i + 1) / chunks) * 100));
        addLog(`PART ${String(partNumber).padStart(3, "0")} — OK  etag:${etag.slice(0, 8)}…`);
      }

      addLog("POST /complete-upload ...");
      const completeRes = await fetch(`${BASE}/complete-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, key, parts, expiresInDays: retentionDays }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error || "complete-upload failed");

      setDownloadCode(completeData.code);
      setPhase("done");
      setStatusType("success");
      addLog(`✓ UPLOAD COMPLETE — code: ${completeData.code}`);

    } catch (err) {
      addLog(`✗ ERROR — ${err.message}`);
      setPhase("error");
      setStatusType("error");
    } finally {
      setUploading(false);
    }
  }

  const phaseColor =
    phase === "done" ? "#4ade80" : phase === "error" ? "#f87171" : "#f59e0b";
  const phaseLabel =
    phase === "idle" ? "READY"
      : phase === "uploading" ? "TRANSFERRING"
        : phase === "done" ? "COMPLETE"
          : "ERROR";

  return (
    <>
      <style>{css}</style>
      <div className="fu-root">
        <div className="fu-scanlines" />

        <div className="fu-card">
          <div className="fu-topline" />

          <div className="fu-header">
            <div className="fu-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="fu-header-text">
              <div className="fu-title">R2 UPLINK</div>
              <div className="fu-subtitle">Multipart transfer · 5 MB chunks · Sequential</div>
            </div>
            <div className="fu-badge" style={{ color: phaseColor, borderColor: phaseColor + "66" }}>
              <span className="fu-dot" style={{ background: phaseColor }} />
              {phaseLabel}
            </div>
          </div>

          <div className="fu-divider" />

          <div
            className={`fu-dropzone${file ? " fu-dropzone--has-file" : ""}`}
            onClick={() => !uploading && fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file ? (
              <div className="fu-file-info">
                <div className="fu-file-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="fu-file-name">{file.name}</div>
                  <div className="fu-file-meta">
                    {fmtBytes(file.size)} · {Math.ceil(file.size / CHUNK_SIZE)} chunks
                  </div>
                </div>
              </div>
            ) : (
              <div className="fu-drop-hint">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
                <span>CLICK TO SELECT FILE</span>
              </div>
            )}
          </div>

          {totalChunks > 0 && (
            <div className="fu-stats">
              <StatBox label="TOTAL" value={totalChunks} unit="chunks" />
              <StatBox label="DONE" value={uploadedChunks} unit="chunks" accent />
              <StatBox label="SIZE" value={file ? fmtBytes(file.size) : "—"} unit="" />
              <StatBox label="PROGRESS" value={progress + "%"} unit="" accent={progress === 100} />
            </div>
          )}

          {totalChunks > 0 && (
            <div className="fu-progress-wrap">
              <div className="fu-progress-track">
                <div className="fu-progress-fill" style={{ width: `${progress}%` }} />
                {progress > 0 && progress < 100 && (
                  <div className="fu-progress-glow" style={{ left: `${progress}%` }} />
                )}
              </div>
            </div>
          )}

          {chunkStatus.length > 0 && (
            <div className="fu-chunk-grid">
              {chunkStatus.map((s, i) => (
                <div
                  key={i}
                  className={`fu-chunk${s === "done" ? " fu-chunk--done" : s === "active" ? " fu-chunk--active" : ""}`}
                  title={`Part ${i + 1}: ${s}`}
                />
              ))}
            </div>
          )}

          <div className="fu-divider" />

          <div className="fu-log">
            <div className="fu-log-header">
              <span className="fu-log-dot" style={{ background: "#f87171" }} />
              <span className="fu-log-dot" style={{ background: "#fbbf24" }} />
              <span className="fu-log-dot" style={{ background: "#4ade80" }} />
              <span className="fu-log-title">transfer.log</span>
            </div>
            <div className="fu-log-body">
              {logs.length === 0 && (
                <div className="fu-log-line fu-log-dim">
                  Awaiting input…<Blink />
                </div>
              )}
              {logs.map((l, i) => (
                <div key={i} className="fu-log-line">
                  <span className="fu-log-ts">{l.ts}</span>
                  <span className={
                    l.msg.startsWith("✓") ? "fu-log-ok"
                      : l.msg.startsWith("✗") ? "fu-log-err"
                        : "fu-log-msg"
                  }>
                    {l.msg}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          <div className="fu-divider" />

          {downloadCode && <CodeDisplay code={downloadCode} />}

          <div className="fu-retention">
            <div className="fu-retention-label">EXPIRES AFTER</div>
            <div className="fu-retention-options">
              {[1, 3, 5].map((d) => (
                <button
                  key={d}
                  className={`fu-retention-btn${retentionDays === d ? " fu-retention-btn--active" : ""}`}
                  onClick={() => setRetentionDays(d)}
                  disabled={uploading}
                >
                  {d} {d === 1 ? "DAY" : "DAYS"}
                </button>
              ))}
            </div>
          </div>

          <div className="fu-actions">
            <button
              className="fu-btn"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <><span className="fu-spinner" />TRANSMITTING…</>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                  INITIATE UPLOAD
                </>
              )}
            </button>
          </div>
        </div>

        <div className="fu-footer">R2 UPLINK · MULTIPART · AES-256 · TLS 1.3</div>
      </div>
    </>
  );
}

function StatBox({ label, value, unit, accent }) {
  return (
    <div className="fu-stat">
      <div className="fu-stat-label">{label}</div>
      <div className="fu-stat-value" style={accent ? { color: "#f59e0b" } : {}}>
        {value}
        {unit && <span className="fu-stat-unit"> {unit}</span>}
      </div>
    </div>
  );
}

const blinkStyle = {
  display: "inline-block",
  animation: "fu-blink 1s step-end infinite",
  color: "#f59e0b",
  marginLeft: 2,
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400&display=swap');

@keyframes fu-blink    { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes fu-pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
@keyframes fu-spin     { to{transform:rotate(360deg)} }
@keyframes fu-fadein   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes fu-glowpulse{ 0%,100%{box-shadow:0 0 8px #f59e0b88} 50%{box-shadow:0 0 22px #f59e0bcc} }

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

.fu-root {
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

.fu-root::before {
  content: '';
  position: fixed; inset: 0;
  background:
    radial-gradient(ellipse 70% 50% at 50% 0%, #f59e0b0a 0%, transparent 65%),
    radial-gradient(ellipse 40% 30% at 90% 90%, #f59e0b06 0%, transparent 55%);
  pointer-events: none;
}

.fu-scanlines {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.09) 2px, rgba(0,0,0,0.09) 4px
  );
  pointer-events: none;
  z-index: 100;
}

.fu-card {
  width: 100%;
  max-width: 560px;
  background: #0f0f0f;
  border: 1px solid #222;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  animation: fu-fadein 0.45s ease;
  box-shadow:
    0 0 0 1px #f59e0b14,
    0 24px 60px rgba(0,0,0,0.7),
    0 4px 12px rgba(0,0,0,0.5);
}

.fu-topline {
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #f59e0b 40%, #fbbf24 60%, transparent 100%);
  opacity: 0.7;
}

.fu-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 1.1rem 1.4rem;
}

.fu-logo {
  width: 38px; height: 38px;
  border: 1px solid #222;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  background: #080808;
  flex-shrink: 0;
}

.fu-header-text { flex: 1; }

.fu-title {
  font-size: 14px;
  font-weight: 600;
  color: #e8e8e8;
  letter-spacing: 0.14em;
}

.fu-subtitle {
  font-size: 10px;
  color: #444;
  letter-spacing: 0.06em;
  margin-top: 3px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 300;
}

.fu-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  padding: 4px 10px;
  border: 1px solid;
  border-radius: 2px;
  transition: color 0.4s, border-color 0.4s;
}

.fu-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  animation: fu-pulse 2s ease-in-out infinite;
}

.fu-divider { height: 1px; background: #191919; }

.fu-dropzone {
  margin: 1.1rem 1.4rem;
  border: 1px dashed #252525;
  border-radius: 3px;
  padding: 1.4rem;
  cursor: pointer;
  background: #080808;
  transition: border-color 0.2s, background 0.2s;
}

.fu-dropzone:hover { border-color: #f59e0b44; background: #f59e0b05; }
.fu-dropzone--has-file { border-style: solid; border-color: #f59e0b33; }

.fu-drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #333;
  font-size: 10px;
  letter-spacing: 0.14em;
}

.fu-file-info { display: flex; align-items: center; gap: 12px; }

.fu-file-icon {
  width: 34px; height: 34px;
  background: #141414;
  border: 1px solid #222;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  color: #f59e0b;
  flex-shrink: 0;
}

.fu-file-name {
  font-size: 12px; font-weight: 500; color: #ddd;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.fu-file-meta { font-size: 10px; color: #444; margin-top: 4px; letter-spacing: 0.04em; }

.fu-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #191919;
  margin: 0 1.4rem 1.1rem;
  border: 1px solid #191919;
  border-radius: 3px;
  overflow: hidden;
}

.fu-stat { background: #0a0a0a; padding: 10px 12px; }
.fu-stat-label { font-size: 8px; letter-spacing: 0.14em; color: #383838; margin-bottom: 5px; }
.fu-stat-value { font-size: 14px; font-weight: 600; color: #ccc; transition: color 0.3s; }
.fu-stat-unit { font-size: 8px; font-weight: 400; color: #3a3a3a; }

.fu-progress-wrap { padding: 0 1.4rem 1.1rem; }

.fu-progress-track {
  height: 3px; background: #161616; border-radius: 2px;
  position: relative; overflow: visible;
}

.fu-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #92400e, #f59e0b);
  border-radius: 2px;
  transition: width 0.35s ease;
}

.fu-progress-glow {
  position: absolute; top: 50%;
  transform: translate(-50%, -50%);
  width: 8px; height: 8px;
  background: #fbbf24; border-radius: 50%;
  box-shadow: 0 0 10px #f59e0b, 0 0 22px #f59e0b99;
  animation: fu-glowpulse 1s ease-in-out infinite;
}

.fu-chunk-grid { display: flex; flex-wrap: wrap; gap: 3px; padding: 0 1.4rem 1.1rem; }

.fu-chunk {
  width: 12px; height: 4px; border-radius: 1px;
  background: #191919;
  transition: background 0.2s, box-shadow 0.2s;
}

.fu-chunk--active {
  background: #78350f;
  box-shadow: 0 0 6px #f59e0b55;
  animation: fu-pulse 0.75s ease-in-out infinite;
}

.fu-chunk--done { background: #d97706; }

.fu-log {
  margin: 0 1.4rem 1.1rem;
  border: 1px solid #191919;
  border-radius: 3px;
  overflow: hidden;
  background: #060606;
}

.fu-log-header {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: #0c0c0c;
  border-bottom: 1px solid #191919;
}

.fu-log-dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0.75; }
.fu-log-title { font-size: 9px; color: #2a2a2a; margin-left: 4px; letter-spacing: 0.08em; }

.fu-log-body {
  padding: 10px 12px;
  max-height: 150px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #222 transparent;
}

.fu-log-line {
  display: flex; gap: 10px;
  font-size: 10px; line-height: 1.9;
  animation: fu-fadein 0.15s ease;
}

.fu-log-ts  { color: #2d2d2d; flex-shrink: 0; }
.fu-log-msg { color: #555; }
.fu-log-ok  { color: #4ade80; }
.fu-log-err { color: #f87171; }
.fu-log-dim { color: #2a2a2a; font-style: italic; }

.fu-retention {
  padding: 0 1.4rem 1rem;
}

.fu-retention-label {
  font-size: 8px; letter-spacing: 0.14em; color: #383838; margin-bottom: 8px;
}

.fu-retention-options { display: flex; gap: 6px; }

.fu-retention-btn {
  flex: 1;
  padding: 7px 0;
  background: transparent;
  border: 1px solid #252525;
  border-radius: 2px;
  color: #444;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.fu-retention-btn:hover:not(:disabled) { border-color: #f59e0b44; color: #888; }

.fu-retention-btn--active {
  border-color: #f59e0b77;
  color: #f59e0b;
  background: #f59e0b0a;
}

.fu-retention-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.fu-actions { display: flex; gap: 10px; padding: 0 1.4rem 1.4rem; }

.fu-btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 16px;
  background: transparent;
  border: 1px solid #f59e0b77;
  border-radius: 3px;
  color: #f59e0b;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; font-weight: 600; letter-spacing: 0.13em;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.fu-btn:hover:not(:disabled) {
  background: #f59e0b0e;
  border-color: #f59e0b;
  box-shadow: 0 0 18px #f59e0b1a;
}

.fu-btn:active:not(:disabled) { transform: scale(0.99); }

.fu-btn:disabled {
  opacity: 0.25; cursor: not-allowed;
  border-color: #252525; color: #333;
}

.fu-spinner {
  width: 11px; height: 11px;
  border: 1.5px solid #f59e0b33;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: fu-spin 0.7s linear infinite;
  margin-right: 6px;
}

.fu-dl-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 16px;
  background: #f59e0b0e;
  border: 1px solid #f59e0b;
  border-radius: 3px;
  color: #f59e0b;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; font-weight: 600; letter-spacing: 0.13em;
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  animation: fu-fadein 0.3s ease;
  white-space: nowrap;
}

.fu-dl-btn:hover { background: #f59e0b1a; box-shadow: 0 0 22px #f59e0b22; }

.fu-footer {
  margin-top: 1.25rem;
  font-size: 9px; color: #222; letter-spacing: 0.16em;
}

.fu-code-box {
  margin: 0 1.4rem 1.1rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid #f59e0b33;
  border-radius: 3px;
  background: #f59e0b07;
  animation: fu-fadein 0.3s ease;
}

.fu-code-label {
  font-size: 8px; letter-spacing: 0.14em; color: #555; margin-bottom: 10px;
}

.fu-code-display {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}

.fu-code-value {
  font-size: 30px; font-weight: 600; color: #f59e0b; letter-spacing: 0.3em;
  flex: 1; text-align: center;
}

.fu-copy-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #f59e0b55;
  border-radius: 2px;
  color: #f59e0b;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.2s;
}
.fu-copy-btn:hover { background: #f59e0b11; }

.fu-code-hint {
  font-size: 9px; color: #444; letter-spacing: 0.05em; text-align: center;
}

`;