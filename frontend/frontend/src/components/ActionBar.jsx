const UploadIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

/**
 * Upload trigger button.
 *
 * @param {boolean}  uploading  - Shows spinner and disables button during transfer
 * @param {boolean}  fileReady  - Enables the button only when a file is selected
 * @param {Function} onUpload   - Called when the button is clicked
 */
export default function ActionBar({ uploading, fileReady, onUpload }) {
  return (
    <div className="fu-actions">
      <button
        className="fu-btn"
        onClick={onUpload}
        disabled={!fileReady || uploading}
      >
        {uploading ? (
          <>
            <span className="fu-spinner" />
            TRANSMITTING…
          </>
        ) : (
          <>
            <UploadIcon />
            INITIATE UPLOAD
          </>
        )}
      </button>
    </div>
  );
}
