/**
 * Displays a single labelled metric in the stats grid.
 *
 * @param {string}  label  - Uppercase label text (e.g. "TOTAL")
 * @param {*}       value  - The value to display
 * @param {string}  [unit] - Optional unit suffix (e.g. "chunks")
 * @param {boolean} [accent] - Highlights value in amber when true
 */
export default function StatBox({ label, value, unit, accent }) {
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
