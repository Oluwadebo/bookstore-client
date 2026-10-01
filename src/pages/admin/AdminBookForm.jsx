/**
 * Add or edit a book (/admin/books/new and /admin/books/:id).
 *
 * Adding starts from the FILE: choose the PDF/EPUB and the server reads its title, author,
 * description and cover, then creates a draft. This keeps listings honest: the book is tied to its
 * file, and the same file can't be uploaded twice under different titles.
 * (If there is no file yet, "enter the details by hand" still works.)
 *
 * Replacing a file offers a pop-up of the details found in it. A book can only be published once its
 * file is uploaded. Prices are typed in normal units (4.99) and saved in the smallest unit (499).
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import BookCover from "../../components/BookCover.jsx";
import FileDetailsModal, { diffRows } from "../../components/admin/FileDetailsModal.jsx";
import FileUpload from "../../components/admin/FileUpload.jsx";
import { useConfirm } from "../../components/ConfirmProvider.jsx";
import FormField from "../../components/FormField.jsx";
import { BusyLabel, FormSkeleton } from "../../components/Loading.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../lib/api.js";
import { formatBytes } from "../../lib/format.js";
import { isOwner } from "../../lib/roles.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

const EMPTY = { title: "", authors: "", description: "", price: "", currency: "", categories: [], tags: "", language: "en", publishedYear: "", featured: false, isPublished: false };
const splitList = (text) => text.split(",").map((item) => item.trim()).filter(Boolean);
const norm = (value) => String(value || "").trim().toLowerCase();
const DETAIL_LABELS = { title: "title", authors: "author", description: "description", cover: "cover" };

/** One friendly sentence about what was read from a new file. */
function foundNotice(found) {
  const keys = Object.keys(DETAIL_LABELS);
  const got = keys.filter((key) => found[key]).map((key) => DETAIL_LABELS[key]);
  const missing = keys.filter((key) => !found[key]).map((key) => DETAIL_LABELS[key]);
  return `We read the file and filled in: ${got.length ? got.join(", ") : "nothing we could use"}.${missing.length ? ` Not found in the file: ${missing.join(", ")}.` : ""} Please check everything, set the price, then publish.`;
}

export default function AdminBookForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const { user } = useAuth();
  const owner = isOwner(user); // only the site owner may delete books
  usePageTitle(isNew ? "Admin: add book" : "Admin: edit book");

  const loaded = useApi(isNew ? null : `/api/admin/books/${id}`);
  const shelves = useApi("/api/categories"); // every shelf in the store: shelves are shared for filing books
  const book = loaded.data?.book;

  const [form, setForm] = useState(EMPTY);
  const [manual, setManual] = useState(false); // adding by hand instead of from a file
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false); // fetching what the file says
  const [fileDetails, setFileDetails] = useState({ open: false, found: null, applying: false, error: "" });

  // Messages passed along when we arrive here after creating a book. The "add" and "edit" URLs
  // share this component, so React keeps it alive between them; that is why this listens for the
  // navigation instead of reading the flag only on first render.
  useEffect(() => {
    if (location.state?.fromFile) setNotice(foundNotice(location.state.fromFile));
    else if (location.state?.created) setNotice("Book created as a draft. Now upload the cover and the book file below, then publish.");
  }, [location.state]);

  // Fill the form once, when the book first loads. (Later reloads, such as after an
  // upload, must not overwrite what is being typed.)
  useEffect(() => {
    if (!book) return;
    setForm({
      title: book.title, authors: book.authors.join(", "), description: book.description || "",
      price: (book.priceCents / 100).toFixed(2), currency: book.currency, categories: book.categories.map(String),
      tags: (book.tags || []).join(", "), language: book.language || "en", publishedYear: book.publishedYear ?? "",
      featured: book.featured, isPublished: book.isPublished,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?._id]);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const toggleShelf = (shelfId) =>
    setForm({ ...form, categories: form.categories.includes(shelfId) ? form.categories.filter((c) => c !== shelfId) : [...form.categories, shelfId] });

  /** Turn the form into what the API expects, or throw a friendly error. */
  function buildPayload() {
    const price = Number.parseFloat(form.price);
    if (!form.title.trim()) throw new Error("Enter a title");
    if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price (0 or more)");

    const payload = {
      title: form.title,
      authors: splitList(form.authors),
      description: form.description,
      priceCents: Math.round(price * 100),
      categories: form.categories,
      tags: splitList(form.tags),
      publishedYear: form.publishedYear === "" ? null : Number(form.publishedYear),
      featured: form.featured,
    };
    if (form.currency.trim()) payload.currency = form.currency.trim().toUpperCase();
    if (form.language.trim()) payload.language = form.language.trim();
    if (!isNew) payload.isPublished = form.isPublished;
    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    let payload;
    try {
      payload = buildPayload();
    } catch (err) {
      return setError(err.message);
    }

    // A forgotten price would quietly make the book free, so ask before publishing at 0.
    if (!isNew && payload.isPublished && payload.priceCents === 0 && (!book.isPublished || book.priceCents !== 0)) {
      const ok = await confirm({
        title: "Publish this book for free?",
        message: <>The price is 0, so customers will get <strong>{form.title}</strong> without paying. Is that what you want?</>,
        confirmLabel: "Yes, publish for free",
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const data = await api("/api/admin/books", { method: "POST", body: payload });
        navigate(`/admin/books/${data.book._id}`, { state: { created: true }, replace: true });
      } else {
        await api(`/api/admin/books/${id}`, { method: "PATCH", body: payload });
        await loaded.reload();
        setNotice("Saved.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this book?",
      message: <><strong>{book.title}</strong> will be removed permanently, together with its cover and file. This cannot be undone.</>,
      confirmLabel: "Delete book",
      danger: true,
    });
    if (!ok) return;
    setError("");
    try {
      await api(`/api/admin/books/${id}`, { method: "DELETE" });
      navigate("/admin/books");
    } catch (err) {
      setError(err.message); // e.g. "Customers have bought this book... Unpublish it instead."
    }
  }

  // ---- details found inside the file ----

  const currentValues = () => ({ title: form.title, authors: form.authors, description: form.description, coverUrl: book?.coverUrl || "" });

  /** Ask the server what the file says. With onlyIfDifferent the pop-up opens only if there is something new. */
  async function openFileDetails({ onlyIfDifferent = false } = {}) {
    setReading(true);
    setError("");
    try {
      const data = await api(`/api/admin/books/${id}/file-details`);
      if (onlyIfDifferent && !diffRows(data.file, currentValues()).some((row) => row.available && row.differs)) return;
      setFileDetails({ open: true, found: data.file, applying: false, error: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setReading(false);
    }
  }

  async function applyFileDetails(fields) {
    setFileDetails((state) => ({ ...state, applying: true, error: "" }));
    try {
      const data = await api(`/api/admin/books/${id}/apply-file-details`, { method: "POST", body: { fields } });
      // Update only the fields that were applied, so anything else being typed is kept.
      setForm((current) => ({
        ...current,
        ...(data.applied.includes("title") && { title: data.book.title }),
        ...(data.applied.includes("authors") && { authors: data.book.authors.join(", ") }),
        ...(data.applied.includes("description") && { description: data.book.description || "" }),
      }));
      await loaded.reload();
      setFileDetails({ open: false, found: null, applying: false, error: "" });
      setNotice(data.applied.length ? `Updated from the file: ${data.applied.map((key) => DETAIL_LABELS[key]).join(", ")}.` : "Nothing in the file to apply.");
    } catch (err) {
      setFileDetails((state) => ({ ...state, applying: false, error: err.message }));
    }
  }

  if (!isNew && loaded.error) return <p role="alert">Could not load this book: {loaded.error}</p>;
  if (!isNew && !book) return <FormSkeleton />;

  // ---- adding a new book: start from the file ----
  if (isNew && !manual) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Add a book</h2>
          <Link to="/admin/books" className="text-sm font-semibold underline">Back to books</Link>
        </div>
        <p className="mt-3">
          Start with the book file. We read its title, author, description and cover for you, so you only need to add the price and shelves.
          A file that is already in the store can't be added again.
        </p>
        <div className="mt-6">
          <FileUpload
            label="Choose the book file (PDF or EPUB)"
            hint="EPUB files give the most details, including the cover. PDFs usually only carry a title and author, if that."
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            field="file"
            endpoint="/api/admin/books/from-file"
            onDone={(data) => navigate(`/admin/books/${data.book._id}`, { replace: true, state: { fromFile: data.found } })}
          />
        </div>
        <button type="button" onClick={() => setManual(true)} className="mt-8 text-sm font-semibold underline">
          I don't have the file yet. Enter the details by hand
        </button>
      </div>
    );
  }

  const canPublish = book?.hasFile;
  const titleMismatch = book?.fileTitle && norm(book.fileTitle) !== norm(form.title);
  const field = "w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">{isNew ? "Add a book by hand" : "Edit book"}</h2>
          <Link to="/admin/books" className="text-sm font-semibold underline">Back to books</Link>
        </div>

        <div>
          <FormField label="Title" id="title" value={form.title} onChange={update} required maxLength={200} />
          {titleMismatch && (
            <p role="status" className="mt-2 rounded-xl bg-sunshine/40 px-4 py-3 text-sm">
              The file itself is titled <strong>"{book.fileTitle}"</strong>. A book sold under a different title than its file can confuse customers.{" "}
              <button type="button" onClick={() => setForm({ ...form, title: book.fileTitle })} className="font-semibold underline">Use the file's title</button>
            </p>
          )}
        </div>

        <div>
          <FormField label="Author(s), separated by commas" id="authors" value={form.authors} onChange={update} required />
          {norm(form.authors) === "unknown author" && <p className="mt-1 text-sm font-semibold">The file didn't say who wrote it. Please type the author's name.</p>}
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold">Description</label>
          <textarea id="description" name="description" rows={6} value={form.description} onChange={update} maxLength={4000} className={field} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Price (for example 4.99)" id="price" type="number" step="0.01" min="0" inputMode="decimal" value={form.price} onChange={update} required />
          <FormField label="Currency (blank = store default)" id="currency" value={form.currency} onChange={update} maxLength={3} placeholder="NGN" />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Shelves (you can use any shelf in the store)</legend>
          <div className="flex flex-wrap gap-2">
            {shelves.data?.categories.map((shelf) => (
              <label key={shelf._id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${form.categories.includes(shelf._id) ? "border-navy bg-navy text-cream" : "border-navy/20 bg-white"}`}>
                <input type="checkbox" className="sr-only" checked={form.categories.includes(shelf._id)} onChange={() => toggleShelf(shelf._id)} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: shelf.color }} />
                {shelf.name}
              </label>
            ))}
          </div>
        </fieldset>

        <FormField label="Tags, separated by commas (help search)" id="tags" value={form.tags} onChange={update} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Language code (en, fr...)" id="language" value={form.language} onChange={update} maxLength={10} />
          <FormField label="Year published" id="publishedYear" type="number" min="1" value={form.publishedYear} onChange={update} />
        </div>

        <label className="flex items-center gap-3 font-semibold">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-5 w-5" />
          Feature on the home page
        </label>

        {!isNew && (
          <div>
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" checked={form.isPublished} disabled={!canPublish && !form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="h-5 w-5" />
              Published (visible in the store)
            </label>
            {!canPublish && <p className="mt-1 text-sm opacity-80">Upload the book file first. Then you can publish.</p>}
          </div>
        )}

        {notice && <p role="status" className="rounded-xl bg-teal/25 px-4 py-3 text-sm font-semibold">{notice}</p>}
        {error && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button disabled={saving} className="rounded-full bg-coral px-8 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60">
            <BusyLabel busy={saving} busyText="Saving...">{isNew ? "Create book" : "Save changes"}</BusyLabel>
          </button>
          {!isNew && book.isPublished && (
            <Link to={`/books/${book.slug}`} className="rounded-full border-2 border-navy px-6 py-3 font-semibold hover:bg-navy hover:text-cream">View in store</Link>
          )}
        </div>
      </form>

      {/* Uploads need an existing book, so they appear after the first save. */}
      <aside className="space-y-6">
        {isNew ? (
          <p className="rounded-2xl bg-white p-5 text-sm shadow-sm">After you create the book you can upload its cover image and book file here.</p>
        ) : (
          <>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-display text-lg font-bold">Cover</h3>
              <div className="mx-auto mt-3 w-40"><BookCover book={book} /></div>
              <div className="mt-4">
                <FileUpload label="Upload a cover image" hint="JPEG, PNG or WebP, up to 2 MB. Portrait 2:3 looks best." accept="image/jpeg,image/png,image/webp" field="cover" endpoint={`/api/admin/books/${id}/cover`} onDone={loaded.reload} />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-display text-lg font-bold">Book file</h3>
              <p className={`mt-2 rounded-xl px-3 py-2 text-sm font-semibold ${book.hasFile ? "bg-teal/25" : "bg-sunshine/50"}`}>
                {book.hasFile ? `Uploaded: ${book.format.toUpperCase()}, ${formatBytes(book.fileSizeBytes)}` : "No file yet. Customers cannot buy this book until you upload one."}
              </p>
              <div className="mt-4">
                <FileUpload
                  label={book.hasFile ? "Replace the file" : "Upload the book file"}
                  hint="PDF or EPUB. Customers who already own the book will get the new file. A file already in the store is refused."
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  field="file"
                  endpoint={`/api/admin/books/${id}/file`}
                  onDone={async () => {
                    await loaded.reload();
                    await openFileDetails({ onlyIfDifferent: true }); // offer the file's own title, description and cover
                  }}
                />
              </div>
              {book.hasFile && (
                <button type="button" onClick={() => openFileDetails()} disabled={reading} className="mt-4 w-full rounded-full border-2 border-navy px-4 py-2 text-sm font-semibold hover:bg-navy/5 disabled:opacity-60">
                  <BusyLabel busy={reading} busyText="Reading the file...">Use details from the file</BusyLabel>
                </button>
              )}
            </div>

            {owner ? (
              <button type="button" onClick={handleDelete} className="w-full rounded-full border-2 border-red-700 px-6 py-3 font-semibold text-red-700 hover:bg-red-700 hover:text-white">
                Delete this book
              </button>
            ) : (
              <p className="rounded-2xl bg-white p-4 text-sm shadow-sm">Only the site owner can delete books. To hide this book from the store, untick <strong>Published</strong>.</p>
            )}
          </>
        )}
      </aside>

      <FileDetailsModal
        open={fileDetails.open}
        onClose={() => setFileDetails((state) => ({ ...state, open: false }))}
        found={fileDetails.found}
        current={currentValues()}
        onApply={applyFileDetails}
        busy={fileDetails.applying}
        error={fileDetails.error}
      />
    </div>
  );
}
