import { useRef } from "react";
import { CHUNK_SIZE } from "../constants/upload";
import { fmtBytes } from "../utils/format";

const FileIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const UploadCloudIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f59e0b"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity: 0.5 }}
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

/**
 * Clickable file selection zone. Shows file metadata when a file is selected,
 * or an upload hint when empty.
 *
 * @param {File|null} file       - Currently selected file (or null)
 * @param {boolean}   uploading  - Disables interaction during upload
 * @param {Function}  onChange   - File-input change handler
 */
export default function DropZone({ file, uploading, onChange }) {
  const inputRef = useRef();

  return (
    <div
      className={`fu-dropzone${file ? " fu-dropzone--has-file" : ""}`}
      onClick={() => !uploading && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={onChange}
        disabled={uploading}
      />

      {file ? (
        <div className="fu-file-info">
          <div className="fu-file-icon">
            <FileIcon />
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
          <UploadCloudIcon />
          <span>CLICK TO SELECT FILE</span>
        </div>
      )}
    </div>
  );
}
