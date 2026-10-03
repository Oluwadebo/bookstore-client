/**
 * Shelf requests. Only the owner creates shelves, so:
 *  - an ADMIN asks for a new shelf here (and can see the status of their requests)
 *  - the OWNER sees the queue and approves (which creates the shelf) or declines
 */
import { useState } from "react";
import { useConfirm } from "../ConfirmProvider.jsx";
import FormField from "../FormField.jsx";
import { BusyLabel, Skeleton } from "../Loading.jsx";
import Modal from "../Modal.jsx";
import { api } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";

const TYPE_LABELS = { fiction: "Fiction", "non-fiction": "Non-fiction", educational: "Educational" };
const STATUS_STYLE = { pending: "bg-sunshine/50", approved: "bg-teal/30", rejected: "bg-coral/25" };
const STATUS_LABEL = { pending: "Waiting", approved: "Approved", rejected: "Declined" };
const when = (date) => new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const nameKey = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");

// ---------------------------------------------------------------- admin: ask for a shelf

export function MyShelfRequests({ shelves }) {
  const confirm = useConfirm();
  const { data, reload } = useApi("/api/admin/shelf-requests");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "fiction", description: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const requests = data?.requests ?? [];
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  // Tell them at once if the name already exists or is already requested.
  const key = nameKey(form.name);
  const existing = key ? shelves.find((shelf) => nameKey(shelf.name) === key) : null;
  const alreadyAsked = key && !existing ? requests.find((r) => r.status === "pending" && nameKey(r.name) === key) : null;

  async function submit(event) {
    event.preventDefault();
    if (existing || alreadyAsked) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/shelf-requests", { method: "POST", body: form });
      setOpen(false);
      setForm({ name: "", type: "fiction", description: "", reason: "" });
      setNotice("Request sent. The owner will review it.");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(request) {
    const ok = await confirm({ title: "Withdraw this request?", message: <>The request for <strong>{request.name}</strong> will be removed.</>, confirmLabel: "Withdraw", danger: true });
    if (!ok) return;
    try {
      await api(`/api/admin/shelf-requests/${request._id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const field = "w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40";

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl font-bold">Need a shelf that isn't here?</h2>
      <p className="mt-2 text-sm">Only the store owner creates shelves. Check the list first, then send a request if yours is missing.</p>
      <button onClick={() => { setError(""); setOpen(true); }} className="mt-4 rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90">Request a shelf</button>
      {notice && <p role="status" className="mt-4 rounded-xl bg-teal/25 px-4 py-3 text-sm font-semibold">{notice}</p>}

      {!data && <div className="mt-4"><Skeleton className="h-12 w-full rounded-xl" /></div>}
      {requests.length > 0 && (
        <ul className="mt-5 space-y-2">
          {requests.map((r) => (
            <li key={r._id} className="flex flex-wrap items-center gap-3 rounded-xl bg-cream px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.name} <span className="font-normal opacity-70">({TYPE_LABELS[r.type]}), {when(r.createdAt)}</span></p>
                {r.status === "rejected" && r.decisionNote && <p className="text-sm">Owner's note: {r.decisionNote}</p>}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              {r.status === "pending" && <button onClick={() => withdraw(r)} className="text-sm font-semibold underline">Withdraw</button>}
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Request a shelf">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FormField label="Shelf name" id="req-name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} data-autofocus />
            {existing && <p role="status" className="mt-2 rounded-xl bg-sunshine/40 px-4 py-3 text-sm font-semibold">A shelf called "{existing.name}" already exists. Put your book on that shelf instead.</p>}
            {alreadyAsked && <p role="status" className="mt-2 rounded-xl bg-sunshine/40 px-4 py-3 text-sm font-semibold">You've already asked for this shelf. It's waiting for the owner.</p>}
          </div>
          <div>
            <label htmlFor="req-type" className="mb-1 block text-sm font-semibold">Type</label>
            <select id="req-type" name="type" value={form.type} onChange={update} className={field}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="req-description" className="mb-1 block text-sm font-semibold">What kind of books go on it?</label>
            <textarea id="req-description" name="description" rows={2} value={form.description} onChange={update} maxLength={500} className={field} />
          </div>
          <div>
            <label htmlFor="req-reason" className="mb-1 block text-sm font-semibold">Why is it needed? (optional)</label>
            <textarea id="req-reason" name="reason" rows={2} value={form.reason} onChange={update} maxLength={500} className={field} />
          </div>
          {error && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5">Cancel</button>
            <button disabled={busy || Boolean(existing) || Boolean(alreadyAsked)} className="rounded-full bg-navy px-6 py-2.5 font-semibold text-cream hover:bg-navy/90 disabled:opacity-50">
              <BusyLabel busy={busy} busyText="Sending...">Send request</BusyLabel>
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------- owner: the queue

export function OwnerShelfRequests({ onChanged }) {
  const { data, error: loadError, reload } = useApi("/api/admin/shelf-requests");
  const [approving, setApproving] = useState(null);
  const [color, setColor] = useState("#ff6b5a");
  const [declining, setDeclining] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const done = async () => {
    setApproving(null);
    setDeclining(null);
    setNote("");
    await reload();
    onChanged?.();
  };

  async function approve(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/shelf-requests/${approving._id}/approve`, { method: "POST", body: { color } });
      await done();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function decline(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/shelf-requests/${declining._id}/reject`, { method: "POST", body: { note } });
      await done();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <p role="alert">Could not load shelf requests: {loadError}</p>;
  if (!data) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (data.pending.length === 0 && data.recent.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl font-bold">Shelf requests ({data.pending.length})</h2>
      {data.pending.length === 0 && <p className="mt-3 rounded-2xl bg-white p-5 text-center text-sm">No requests waiting.</p>}
      <ul className="mt-4 space-y-3">
        {data.pending.map((r) => (
          <li key={r._id} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-semibold">{r.name} <span className="font-normal opacity-70">({TYPE_LABELS[r.type]})</span></p>
            <p className="text-sm opacity-70">Asked by {r.requestedBy?.name ?? "a removed user"} on {when(r.createdAt)}</p>
            {r.description && <p className="mt-2 text-sm"><strong>For:</strong> {r.description}</p>}
            {r.reason && <p className="mt-1 text-sm"><strong>Why:</strong> {r.reason}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => { setError(""); setColor("#ff6b5a"); setApproving(r); }} className="rounded-full bg-teal px-5 py-2 text-sm font-semibold text-navy hover:bg-teal/90">Approve and create</button>
              <button onClick={() => { setError(""); setDeclining(r); }} className="rounded-full border-2 border-navy px-5 py-2 text-sm font-semibold hover:bg-navy/5">Decline</button>
            </div>
          </li>
        ))}
      </ul>

      {data.recent.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm opacity-80">
          {data.recent.slice(0, 5).map((r) => <li key={r._id}>{r.name}: {STATUS_LABEL[r.status].toLowerCase()} ({r.requestedBy?.name ?? "removed user"}), {when(r.decidedAt)}</li>)}
        </ul>
      )}

      <Modal open={Boolean(approving)} onClose={() => setApproving(null)} title="Create this shelf?">
        <form onSubmit={approve} className="space-y-4">
          {approving && <p className="mt-2">The shelf <strong>{approving.name}</strong> ({TYPE_LABELS[approving.type]}) will be created and appear across the store. You can edit it afterwards.</p>}
          <div>
            <label htmlFor="appr-color" className="mb-1 block text-sm font-semibold">Shelf colour</label>
            <input id="appr-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-24 cursor-pointer rounded-xl border border-navy/20 bg-white p-1" />
          </div>
          {error && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setApproving(null)} className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5">Cancel</button>
            <button data-autofocus disabled={busy} className="rounded-full bg-navy px-6 py-2.5 font-semibold text-cream hover:bg-navy/90 disabled:opacity-60"><BusyLabel busy={busy} busyText="Creating...">Create shelf</BusyLabel></button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(declining)} onClose={() => setDeclining(null)} title="Decline this request?">
        <form onSubmit={decline} className="space-y-4">
          {declining && <p className="mt-2">The request for <strong>{declining.name}</strong> is declined. You can leave a note so they know why.</p>}
          <div>
            <label htmlFor="decl-note" className="mb-1 block text-sm font-semibold">Note (optional)</label>
            <textarea id="decl-note" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} data-autofocus className="w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40" />
          </div>
          {error && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeclining(null)} className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5">Cancel</button>
            <button disabled={busy} className="rounded-full bg-coral px-6 py-2.5 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60"><BusyLabel busy={busy} busyText="Declining...">Decline</BusyLabel></button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
