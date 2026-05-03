/**
 * Renders one small rectangle per chunk, coloured by its transfer status.
 *
 * @param {Array<"idle"|"active"|"done">} chunkStatus
 */
export default function ChunkGrid({ chunkStatus }) {
  return (
    <div className="fu-chunk-grid">
      {chunkStatus.map((status, i) => (
        <div
          key={i}
          className={`fu-chunk${
            status === "done"
              ? " fu-chunk--done"
              : status === "active"
              ? " fu-chunk--active"
              : ""
          }`}
          title={`Part ${i + 1}: ${status}`}
        />
      ))}
    </div>
  );
}
