import { useState } from "react";

/**
 * Shows the unique R2 filename and presigned download URL after a successful upload.
 *
 * @param {string} url            - Presigned S3 download URL
 * @param {string} r2Key          - R2 object key, e.g. "files/<uuid>-example.txt"
 * @param {string} uniqueFilename - The unique name sent to R2, e.g. "<uuid>-example.txt"
 */
export default function DownloadUrlDisplay({ url, r2Key, uniqueFilename }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log("clipboard write failed");
    }
  }

  return (
    <div className="fu-url-box">

      {/* ── R2 filename ─────────────────────────────────────────────── */}
      {uniqueFilename && (
        <div className="fu-url-r2key">
          <span className="fu-url-label">FILENAME ON R2</span>
          <span className="fu-url-key-value">{uniqueFilename}</span>
        </div>
      )}

      {/* ── Full R2 object key ───────────────────────────────────────── */}
      {r2Key && (
        <div className="fu-url-r2key" style={{ marginTop: 6 }}>
          <span className="fu-url-label">R2 KEY</span>
          <span className="fu-url-key-value" style={{ color: "#666" }}>{r2Key}</span>
        </div>
      )}

      {/* ── Presigned download URL ───────────────────────────────────── */}
      <div className="fu-url-label" style={{ marginTop: 10 }}>DOWNLOAD URL</div>
      <div className="fu-url-row">
        <span className="fu-url-text">{url}</span>
        <button className="fu-copy-btn" onClick={handleCopy}>
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>

    </div>
  );
}
