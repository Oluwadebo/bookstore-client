/**
 * Add or edit a book (/admin/books/new and /admin/books/:id).
 *
 * Adding is two steps: save the details (the book starts as a DRAFT), then upload the
 * cover and the book file on the same page. A book can only be published once its
 * file is uploaded, so customers can never pay for something they cannot receive.
 * Prices are typed in normal units (4.99) and saved in the smallest unit (499).
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import BookCover from "../../components/BookCover.jsx";
import FileUpload from "../../components/admin/FileUpload.jsx";
import FormField from "../../components/FormField.jsx";
import { api } from "../../lib/api.js";
import { formatBytes } from "../../lib/format.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

const EMPTY = { title: "", authors: "", description: "", price: "", currency: "", categories: [], tags: "", language: "en", publishedYear: "", featured: false, isPublished: false };
const splitList = (text) => text.split(",").map((item) => item.trim()).filter(Boolean);

export default function AdminBookForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle(isNew ? "Admin: add book" : "Admin: edit book");

  const loaded = useApi(isNew ? null : `/api/admin/books/${id}`);
  const shelves = useApi("/api/categories");
  const book = loaded.data?.book;

  const [form, setForm] = useState(EMPTY);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // After "Create book" we land here with { created: true }. The "add" and "edit" URLs share this
  // component, so React keeps it alive between them; that is why this listens for the navigation
  // instead of reading the flag only on first render.
  useEffect(() => {
    if (location.state?.created) setNotice("Book created as a draft. Now upload the cover and the book file below, then publish.");
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
    setSaving(true);
    try {
      const payload = buildPayload();
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
    if (!window.confirm(`Delete "${book.title}" permanently? This cannot be undone.`)) return;
    setError("");
    try {
      await api(`/api/admin/books/${id}`, { method: "DELETE" });
      navigate("/admin/books");
    } catch (err) {
      setError(err.message); // e.g. "Customers have bought this book... Unpublish it instead."
    }
  }

  if (!isNew && loaded.error) return <p role="alert">Could not load this book: {loaded.error}</p>;
  if (!isNew && !book) return <p>Loading...</p>;

  const canPublish = book?.hasFile;
  const field = "w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">{isNew ? "Add a book" : "Edit book"}</h2>
          <Link to="/admin/books" className="text-sm font-semibold underline">Back to books</Link>
        </div>

        <FormField label="Title" id="title" value={form.title} onChange={update} required maxLength={200} />
        <FormField label="Author(s), separated by commas" id="authors" value={form.authors} onChange={update} required />

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold">Description</label>
          <textarea id="description" name="description" rows={6} value={form.description} onChange={update} maxLength={4000} className={field} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Price (for example 4.99)" id="price" type="number" step="0.01" min="0" inputMode="decimal" value={form.price} onChange={update} required />
          <FormField label="Currency (blank = store default)" id="currency" value={form.currency} onChange={update} maxLength={3} placeholder="NGN" />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Shelves</legend>
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
            {saving ? "Saving..." : isNew ? "Create book" : "Save changes"}
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
                <FileUpload label={book.hasFile ? "Replace the file" : "Upload the book file"} hint="PDF or EPUB. Customers who already own the book will get the new file." accept=".pdf,.epub,application/pdf,application/epub+zip" field="file" endpoint={`/api/admin/books/${id}/file`} onDone={loaded.reload} />
              </div>
            </div>

            <button type="button" onClick={handleDelete} className="w-full rounded-full border-2 border-coral px-6 py-3 font-semibold text-coral hover:bg-coral hover:text-navy">
              Delete this book
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
