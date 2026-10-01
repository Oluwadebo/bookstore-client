/**
 * A file picker that uploads as soon as a file is chosen and shows progress.
 * Props: label, hint, accept (allowed types), field (form field name the server expects),
 * endpoint (API path), onDone (called with the server's response after a successful upload).
 */
import { useState } from "react";
import { upload } from "../../lib/api.js";
import { Spinner } from "../Loading.jsx";

export default function FileUpload({ label, hint, accept, field, endpoint, onDone }) {
  const [progress, setProgress] = useState(null); // null = idle, 0-100 = uploading
  const [error, setError] = useState("");
  const uploading = progress !== null;

  async function handleChange(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setError("");
    setProgress(0);
    try {
      const form = new FormData();
      form.append(field, file);
      const data = await upload(endpoint, form, setProgress);
      await onDone(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
      input.value = ""; // lets the same file be chosen again after an error
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold">
        {label}
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={uploading}
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-cream"
        />
      </label>
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
      {uploading && (
        <div role="status" className="mt-2">
          <div className="h-2 overflow-hidden rounded-full bg-navy/10">
            <div className="h-full bg-teal transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs font-semibold">{progress < 100 ? (
              `Uploading... ${progress}%`
            ) : (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-3 w-3" /> Reading the file...
              </span>
            )}</p>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
