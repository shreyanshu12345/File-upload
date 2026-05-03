import { useState } from "react";

/**
 * Displays the short download code prominently after a successful upload.
 *
 * @param {string} code          - 6-char alphanumeric code, e.g. "A3X9KZ"
 * @param {string} uniqueFilename - The unique name stored on R2
 */
export default function CodeDisplay({ code, uniqueFilename }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log("clipboard write failed");
    }
  }

  return (
    <div className="fu-code-box">
      <div className="fu-code-label">YOUR DOWNLOAD CODE</div>

      <div className="fu-code-display">
        <span className="fu-code-value">{code}</span>
        <button className="fu-copy-btn" onClick={handleCopy}>
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>

      <div className="fu-code-hint">
        Share this code — anyone with it can download your file
      </div>

      {uniqueFilename && (
        <div className="fu-code-filename">
          <span className="fu-url-label">STORED AS</span>
          <span className="fu-code-fname">{uniqueFilename}</span>
        </div>
      )}
    </div>
  );
}
