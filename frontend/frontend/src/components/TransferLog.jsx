import { useEffect, useRef } from "react";
import Blink from "./Blink";

/** Maps a log message prefix to its CSS class. */
function getLogClass(msg) {
  if (msg.startsWith("✓")) return "fu-log-ok";
  if (msg.startsWith("✗")) return "fu-log-err";
  return "fu-log-msg";
}

/**
 * Terminal-style scrolling log panel.
 *
 * @param {Array<{ts: string, msg: string}>} logs - Log entries to display
 */
export default function TransferLog({ logs }) {
  const logEndRef = useRef();

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="fu-log">
      {/* macOS-style window chrome */}
      <div className="fu-log-header">
        <span className="fu-log-dot" style={{ background: "#f87171" }} />
        <span className="fu-log-dot" style={{ background: "#fbbf24" }} />
        <span className="fu-log-dot" style={{ background: "#4ade80" }} />
        <span className="fu-log-title">transfer.log</span>
      </div>

      <div className="fu-log-body">
        {logs.length === 0 && (
          <div className="fu-log-line fu-log-dim">
            Awaiting input…
            <Blink />
          </div>
        )}

        {logs.map((entry, i) => (
          <div key={i} className="fu-log-line">
            <span className="fu-log-ts">{entry.ts}</span>
            <span className={getLogClass(entry.msg)}>{entry.msg}</span>
          </div>
        ))}

        <div ref={logEndRef} />
      </div>
    </div>
  );
}
