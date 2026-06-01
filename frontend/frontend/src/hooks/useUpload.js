import { useState, useCallback } from "react";
import { CHUNK_SIZE, BASE_URL } from "../constants/upload";
import { fmtBytes } from "../utils/format";

/**
 * Manages all state and logic for the multipart S3 file upload flow.
 * After a successful upload the backend returns a short code (e.g. "A3X9KZ")
 * which the user can share. The code → R2 key mapping is stored in MongoDB.
 */
export function useUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [chunkStatus, setChunkStatus] = useState([]);
  const [logs, setLogs] = useState([]);
  const [code, setCode] = useState("");          // short download code
  const [uniqueFilename, setUniqueFilename] = useState("");
  const [phase, setPhase] = useState("idle");

  const addLog = useCallback((msg) => {
    setLogs((prev) => [
      ...prev,
      { ts: new Date().toISOString().slice(11, 23), msg },
    ]);
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const f = e.target.files[0];
      if (!f) return;

      setFile(f);
      setProgress(0);
      setUploadedChunks(0);
      setTotalChunks(0);
      setChunkStatus([]);
      setLogs([]);
      setCode("");
      setUniqueFilename("");
      setPhase("idle");
      addLog(`FILE SELECTED — ${f.name} (${fmtBytes(f.size)})`);
    },
    [addLog]
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;

    if (file.size === 0) {
      addLog("✗ ERROR — file is empty (0 bytes), cannot upload");
      setPhase("error");
      return;
    }

    setUploading(true);
    setCode("");
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
      // ── 1. Start upload ─────────────────────────────────────────────
      addLog("POST /start-upload ...");
      const startRes = await fetch(`${BASE_URL}/start-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, fileSize: file.size }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || "start-upload failed");

      const { uploadId, key, filename: uniqueName, presignedUrls } = startData;
      setUniqueFilename(uniqueName);
      addLog(`UPLOAD ID — ${uploadId.slice(0, 16)}…`);
      addLog(`R2 NAME   — ${uniqueName}`);

      // ── 2. Upload parts directly to R2 via presigned URLs ───────────
      const parts = [];

      for (let i = 0; i < chunks; i++) {
        const partNumber = i + 1;

        setChunkStatus((prev) => {
          const next = [...prev];
          next[i] = "active";
          return next;
        });
        addLog(`PART ${String(partNumber).padStart(3, "0")} — uploading`);

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const partRes = await fetch(presignedUrls[i].url, {
          method: "PUT",
          body: chunk,
        });

        if (!partRes.ok)
          throw new Error(`Part ${partNumber} upload failed (${partRes.status})`);

        const etag = (partRes.headers.get("ETag") || "").replace(/"/g, "");
        parts.push({ PartNumber: partNumber, ETag: etag });

        setChunkStatus((prev) => {
          const next = [...prev];
          next[i] = "done";
          return next;
        });
        setUploadedChunks(i + 1);
        setProgress(Math.round(((i + 1) / chunks) * 100));
        addLog(
          `PART ${String(partNumber).padStart(3, "0")} — OK  etag:${etag.slice(0, 8)}…`
        );
      }

      // ── 3. Complete upload — backend generates code + saves to MongoDB
      addLog("POST /complete-upload ...");
      const completeRes = await fetch(`${BASE_URL}/complete-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, key, parts }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok)
        throw new Error(completeData.error || "complete-upload failed");

      const { code: downloadCode } = completeData;
      setCode(downloadCode);
      setPhase("done");
      addLog(`✓ UPLOAD COMPLETE — code: ${downloadCode}`);

    } catch (err) {
      addLog(`✗ ERROR — ${err.message}`);
      setPhase("error");
    } finally {
      setUploading(false);
    }
  }, [file, addLog]);

  return {
    file,
    uploading,
    progress,
    uploadedChunks,
    totalChunks,
    chunkStatus,
    logs,
    code,
    uniqueFilename,
    phase,
    handleFileChange,
    handleUpload,
  };
}
