/**
 * "Details found in the file": shows what the uploaded EPUB/PDF itself says (title, author,
 * description, cover) next to what the book has now, and lets the admin tick which to use.
 * This keeps a book's listing in line with its file, so one book isn't sold under a different title.
 *
 * Nothing changes until the admin clicks "Use selected details".
 */
import { useEffect, useMemo, useState } from "react";
import BookCover from "../BookCover.jsx";
import { BusyLabel } from "../Loading.jsx";
import Modal from "../Modal.jsx";

const norm = (value) => String(value || "").trim().toLowerCase();

/**
 * One row per detail: what the file says, what the book has now, whether the file has it at all,
 * and whether they differ. Exported so the form can decide whether the pop-up is worth showing.
 */
export function diffRows(found, current) {
  if (!found) return [];
  const authors = found.authors.join(", ");
  return [
    { key: "title", label: "Title", available: Boolean(found.title), differs: Boolean(found.title) && norm(found.title) !== norm(current.title), fileValue: found.title, nowValue: current.title },
    { key: "authors", label: "Author(s)", available: found.authors.length > 0, differs: found.authors.length > 0 && norm(authors) !== norm(current.authors), fileValue: authors, nowValue: current.authors },
    { key: "description", label: "Description", available: Boolean(found.description), differs: Boolean(found.description) && norm(found.description) !== norm(current.description), fileValue: found.description, nowValue: current.description },
    { key: "cover", label: "Cover image", available: found.hasCover, differs: found.hasCover, fileValue: null, nowValue: current.coverUrl },
  ];
}

export default function FileDetailsModal({ open, onClose, found, current, onApply, busy, error }) {
  const rows = useMemo(() => diffRows(found, current), [found, current]);
  const [chosen, setChosen] = useState({});

  // Each time the pop-up opens, tick what is new. An existing cover is left alone unless asked for.
  useEffect(() => {
    if (!open) return;
    setChosen(Object.fromEntries(rows.filter((row) => row.available && row.differs && (row.key !== "cover" || !current.coverUrl)).map((row) => [row.key, true])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const picked = Object.keys(chosen).filter((key) => chosen[key]);
  const usable = rows.some((row) => row.available);

  return (
    <Modal open={open} onClose={onClose} title="Details found in the file">
      <p className="mt-2 text-sm">
        We read the book file itself. Tick what you want to use. Nothing changes until you confirm.
      </p>

      {!usable ? (
        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm">This file doesn't contain a title, author, description or cover we can read. You can type them in by hand.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.key} className="rounded-2xl bg-white p-4 shadow-sm">
              <label className={`flex gap-3 ${row.available ? "cursor-pointer" : "opacity-60"}`}>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0"
                  disabled={!row.available}
                  checked={Boolean(chosen[row.key])}
                  onChange={(event) => setChosen({ ...chosen, [row.key]: event.target.checked })}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">Use the file's {row.label.toLowerCase()}</span>
                  {!row.available && <span className="mt-1 block text-sm">Not found in the file.</span>}

                  {row.available && row.key !== "cover" && (
                    <>
                      <span className="mt-1 line-clamp-3 block whitespace-pre-line text-sm">{row.fileValue}</span>
                      <span className="mt-1 block text-xs opacity-70">
                        {row.differs ? `Now: ${row.nowValue || "empty"}` : "Same as now"}
                      </span>
                    </>
                  )}

                  {row.available && row.key === "cover" && (
                    <span className="mt-2 flex items-end gap-4">
                      {found.coverPreview ? (
                        <img src={found.coverPreview} alt="Cover found in the file" className="h-28 w-auto rounded-lg shadow" />
                      ) : (
                        <span className="text-sm">A cover image was found (too large to preview).</span>
                      )}
                      {current.coverUrl && (
                        <span className="block w-16">
                          <BookCover book={{ title: current.title, authors: [], coverUrl: current.coverUrl }} />
                          <span className="mt-1 block text-xs opacity-70">Now</span>
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5">
          {usable ? "Keep what I have" : "Close"}
        </button>
        {usable && (
          <button type="button" data-autofocus disabled={busy || picked.length === 0} onClick={() => onApply(picked)} className="rounded-full bg-navy px-6 py-2.5 font-semibold text-cream hover:bg-navy/90 disabled:opacity-50">
            <BusyLabel busy={busy} busyText="Applying...">Use selected details</BusyLabel>
          </button>
        )}
      </div>
    </Modal>
  );
}
