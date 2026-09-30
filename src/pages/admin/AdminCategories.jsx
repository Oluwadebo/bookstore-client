/**
 * Shelf manager (/admin/categories): add, edit and remove shelves.
 * To open the store to non-fiction or educational books, add a shelf with that type here.
 */
import { useState } from "react";
import { api } from "../../lib/api.js";
import FormField from "../../components/FormField.jsx";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";
import { useConfirm } from "../../components/ConfirmProvider.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { isOwner } from "../../lib/roles.js";

const BLANK = { name: "", type: "fiction", description: "", color: "#ff6b5a", parent: "", sortOrder: 0 };
const TYPE_LABELS = { fiction: "Fiction", "non-fiction": "Non-fiction", educational: "Educational" };

export default function AdminCategories() {
  usePageTitle("Admin: shelves");
  const confirm = useConfirm();
  const { user } = useAuth();
  const owner = isOwner(user); // only the site owner may delete shelves
  const { data, error: loadError, reload } = useApi("/api/categories");
  const [editing, setEditing] = useState(null); // the shelf being edited, or null when adding
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const shelves = data?.categories ?? [];
  const topLevel = shelves.filter((shelf) => !shelf.parent && shelf._id !== editing?._id);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  function startEdit(shelf) {
    setEditing(shelf);
    setError("");
    setForm({ name: shelf.name, type: shelf.type, description: shelf.description || "", color: shelf.color, parent: shelf.parent || "", sortOrder: shelf.sortOrder });
  }
  function reset() {
    setEditing(null);
    setForm(BLANK);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { name: form.name, type: form.type, description: form.description, color: form.color, parent: form.parent || null, sortOrder: Number(form.sortOrder) || 0 };
      if (editing) await api(`/api/admin/categories/${editing._id}`, { method: "PATCH", body: payload });
      else await api("/api/admin/categories", { method: "POST", body: payload });
      reset();
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(shelf) {
    const ok = await confirm({
      title: "Delete this shelf?",
      message: <>The shelf <strong>{shelf.name}</strong> will be removed. Books are not deleted, but the shelf must be empty first.</>,
      confirmLabel: "Delete shelf",
      danger: true,
    });
    if (!ok) return;
    setError("");
    try {
      await api(`/api/admin/categories/${shelf._id}`, { method: "DELETE" });
      if (editing?._id === shelf._id) reset();
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const field = "w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h2 className="font-display text-2xl font-bold">Shelves</h2>
        {loadError && <p role="alert" className="mt-4">Could not load shelves: {loadError}</p>}
        <ul className="mt-4 space-y-3">
          {shelves.map((shelf) => (
            <li key={shelf._id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: shelf.color }} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {shelf.parent && <span className="opacity-60">↳ </span>}
                  {shelf.name}
                </p>
                <p className="text-sm opacity-70">{TYPE_LABELS[shelf.type]} · {shelf.bookCount} {shelf.bookCount === 1 ? "book" : "books"}</p>
              </div>
              <button onClick={() => startEdit(shelf)} className="text-sm font-semibold underline">Edit</button>
              {owner && <button onClick={() => handleDelete(shelf)} className="text-sm font-semibold text-red-700 underline">Delete</button>}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-bold">{editing ? `Edit "${editing.name}"` : "Add a shelf"}</h2>
        <FormField label="Name" id="name" value={form.name} onChange={update} required maxLength={80} />

        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-semibold">Type</label>
          <select id="type" name="type" value={form.type} onChange={update} className={field}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold">Description</label>
          <textarea id="description" name="description" rows={2} value={form.description} onChange={update} maxLength={500} className={field} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="color" className="mb-1 block text-sm font-semibold">Colour</label>
            <input id="color" name="color" type="color" value={form.color} onChange={update} className="h-12 w-full cursor-pointer rounded-xl border border-navy/20 bg-white p-1" />
          </div>
          <FormField label="Menu order" id="sortOrder" type="number" min="0" value={form.sortOrder} onChange={update} />
        </div>

        <div>
          <label htmlFor="parent" className="mb-1 block text-sm font-semibold">Inside shelf (optional)</label>
          <select id="parent" name="parent" value={form.parent} onChange={update} className={field}>
            <option value="">None: a main shelf</option>
            {topLevel.map((shelf) => <option key={shelf._id} value={shelf._id}>{shelf.name}</option>)}
          </select>
        </div>

        {error && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}

        <div className="flex gap-3">
          <button disabled={saving} className="rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60">
            {saving ? "Saving..." : editing ? "Save shelf" : "Add shelf"}
          </button>
          {editing && <button type="button" onClick={reset} className="rounded-full border-2 border-navy px-6 py-3 font-semibold">Cancel</button>}
        </div>
      </form>
    </div>
  );
}
