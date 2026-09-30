/**
 * "Apply to help run the store", shown on a customer's Account page.
 * Applying gives no access by itself: the site owner reviews every application.
 * Shows the current state: can apply, waiting for review, or declined (with the date
 * they may apply again). The server enforces the same rules.
 */
import { useState } from "react";
import { useConfirm } from "./ConfirmProvider.jsx";
import Modal from "./Modal.jsx";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";

const COOLDOWN_DAYS = 7;

export default function AdminApplyCard() {
  const confirm = useConfirm();
  const { data, reload } = useApi("/api/admin-requests/mine");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = data?.request;
  const pending = request?.status === "pending";
  const declinedAt = request?.status === "rejected" ? new Date(request.decidedAt) : null;
  const canApplyAfter = declinedAt ? new Date(declinedAt.getTime() + COOLDOWN_DAYS * 86400000) : null;
  const waiting = canApplyAfter && canApplyAfter > new Date();

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin-requests", { method: "POST", body: { message } });
      setOpen(false);
      setMessage("");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    const ok = await confirm({
      title: "Withdraw your application?",
      message: "The site owner will no longer see it. You can apply again at any time.",
      confirmLabel: "Withdraw",
      danger: true,
    });
    if (!ok) return;
    setError("");
    try {
      await api("/api/admin-requests/mine", { method: "DELETE" });
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="font-display text-xl font-bold">Help run the store</h2>

      {pending ? (
        <>
          <p className="mt-2">Your application is waiting for the site owner's review. You'll get admin access here as soon as it's approved.</p>
          <button onClick={handleWithdraw} className="mt-4 rounded-full border-2 border-navy px-5 py-2 text-sm font-semibold hover:bg-navy/5">
            Withdraw application
          </button>
        </>
      ) : (
        <>
          <p className="mt-2">Want to help manage books and orders? Apply to become an admin. The site owner reviews every application.</p>
          {waiting && (
            <p className="mt-3 rounded-xl bg-sunshine/40 px-4 py-3 text-sm font-semibold">
              Your last application was declined. You can apply again after {canApplyAfter.toDateString()}.
            </p>
          )}
          <button
            onClick={() => { setError(""); setOpen(true); }}
            disabled={waiting}
            className="mt-4 rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-50"
          >
            Apply to be an admin
          </button>
        </>
      )}
      {!open && error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="Apply to be an admin">
        <form onSubmit={handleSubmit}>
          <p className="mt-3">Tell the site owner a little about why you'd like to help. This is optional.</p>
          <label htmlFor="apply-message" className="mt-4 block text-sm font-semibold">Your message</label>
          <textarea
            id="apply-message"
            rows={4}
            maxLength={500}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            data-autofocus
            className="mt-1 w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40"
          />
          <p className="mt-1 text-right text-xs opacity-70">{message.length}/500</p>
          {error && <p role="alert" className="mt-2 rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5">Cancel</button>
            <button disabled={busy} className="rounded-full bg-navy px-6 py-2.5 font-semibold text-cream hover:bg-navy/90 disabled:opacity-60">
              {busy ? "Sending..." : "Send application"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
