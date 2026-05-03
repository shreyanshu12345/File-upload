/**
 * Renders the amber progress bar and the animated glow dot.
 *
 * @param {number} progress - 0–100 integer percentage
 */
export default function ProgressBar({ progress }) {
  return (
    <div className="fu-progress-wrap">
      <div className="fu-progress-track">
        <div className="fu-progress-fill" style={{ width: `${progress}%` }} />
        {progress > 0 && progress < 100 && (
          <div className="fu-progress-glow" style={{ left: `${progress}%` }} />
        )}
      </div>
    </div>
  );
}
