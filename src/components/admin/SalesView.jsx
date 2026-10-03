/**
 * A seller's money, in one place: totals, a monthly statement (view, print, download as CSV),
 * and payout history. Used by an admin for their own sales, and by the owner for any seller.
 *
 * HOW THE MONEY WORKS (shown to sellers too): a book sells at its list price. The customer pays a
 * processing fee on top, so payment fees never reduce earnings. The store keeps its commission from
 * the list price and the rest is the seller's. A payout is a record that the owner transferred some
 * of what is owed. Balance = earned - paid out.
 *
 * `sellerId` is for the owner (whose seller to show). An admin leaves it out and sees themselves.
 * `canPay` shows the "Record a payout" button (owner only; the server enforces it too).
 */
import { useState } from "react";
import FormField from "../FormField.jsx";
import { BusyLabel, Skeleton, SkeletonRows, SkeletonStats } from "../Loading.jsx";
import Modal from "../Modal.jsx";
import { api, apiUrl } from "../../lib/api.js";
import { formatMoney } from "../../lib/format.js";
import { useApi } from "../../lib/useApi.js";

/** The last 12 months, newest first, as { value: "2026-10", label: "October 2026" }. */
function monthOptions() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
  });
}

const card = "rounded-2xl bg-white p-5 shadow-sm";

export default function SalesView({ sellerId = null, canPay = false }) {
  const months = monthOptions();
  const [month, setMonth] = useState(months[0].value);
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ currency: "", amount: "", reference: "", note: "" });
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [notice, setNotice] = useState("");

  const sellerQuery = sellerId ? `seller=${sellerId}&` : "";
  const totals = useApi(`/api/admin/earnings/sales?${sellerQuery}page=1&limit=1`); // all-time totals per currency
  const statement = useApi(`/api/admin/earnings/statement?${sellerQuery}month=${month}`);
  const payouts = useApi(`/api/admin/earnings/payouts${sellerId ? `?seller=${sellerId}` : ""}`);

  const rows = totals.data?.totals ?? [];
  const owed = rows.filter((row) => row.balanceCents > 0);
  const st = statement.data?.statement;

  function openPayout() {
    const first = owed[0];
    setPay({ currency: first.currency, amount: (first.balanceCents / 100).toFixed(2), reference: "", note: "" });
    setPayError("");
    setPayOpen(true);
  }

  async function submitPayout(event) {
    event.preventDefault();
    const amountCents = Math.round(Number.parseFloat(pay.amount) * 100);
    const balance = rows.find((row) => row.currency === pay.currency)?.balanceCents ?? 0;
    if (!Number.isFinite(amountCents) || amountCents <= 0) return setPayError("Enter an amount greater than zero");
    if (amountCents > balance) return setPayError(`That is more than the balance owed (${formatMoney(balance, pay.currency)})`);

    setPayBusy(true);
    setPayError("");
    try {
      await api("/api/admin/earnings/payouts", { method: "POST", body: { seller: sellerId, amountCents, currency: pay.currency, reference: pay.reference, note: pay.note } });
      setPayOpen(false);
      setNotice(`Payout of ${formatMoney(amountCents, pay.currency)} recorded.`);
      await Promise.all([totals.reload(), statement.reload(), payouts.reload()]);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPayBusy(false);
    }
  }

  const csvHref = apiUrl(`/api/admin/earnings/statement?${sellerQuery}month=${month}&format=csv`);

  return (
    <div className="space-y-8">
      {notice && <p role="status" className="rounded-xl bg-teal/25 px-4 py-3 text-sm font-semibold print:hidden">{notice}</p>}

      {/* ---- totals ---- */}
      {totals.loading && !totals.data ? (
        <SkeletonStats count={3} />
      ) : rows.length === 0 ? (
        <p className={`${card} text-center`}>No sales yet. Earnings appear here as soon as someone buys a book.</p>
      ) : (
        <div className="space-y-4 print:hidden">
          {rows.map((row) => (
            <div key={row.currency} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={card}>
                <p className="text-sm font-semibold opacity-70">Earned ({row.currency})</p>
                <p className="mt-1 font-display text-2xl font-bold">{formatMoney(row.earnedCents, row.currency)}</p>
                <p className="mt-1 text-xs opacity-70">{row.sales} {row.sales === 1 ? "sale" : "sales"} of {formatMoney(row.grossCents, row.currency)}; store commission {formatMoney(row.commissionCents, row.currency)}</p>
              </div>
              <div className={card}>
                <p className="text-sm font-semibold opacity-70">Paid out</p>
                <p className="mt-1 font-display text-2xl font-bold">{formatMoney(row.paidOutCents, row.currency)}</p>
              </div>
              <div className={`${card} ${row.balanceCents > 0 ? "ring-2 ring-sunshine" : ""}`}>
                <p className="text-sm font-semibold opacity-70">Balance owed</p>
                <p className="mt-1 font-display text-2xl font-bold">{formatMoney(row.balanceCents, row.currency)}</p>
              </div>
              {canPay && row.balanceCents > 0 && (
                <div className="flex items-center">
                  <button onClick={openPayout} className="rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90">Record a payout</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---- monthly statement ---- */}
      <section id="statement">
        <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
          <h2 className="font-display text-2xl font-bold">Statement</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="statement-month">Month</label>
            <select id="statement-month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-full border border-navy/20 bg-white px-3 py-2 text-base">
              {months.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <a href={csvHref} download className="rounded-full border-2 border-navy px-4 py-2 text-sm font-semibold hover:bg-navy hover:text-cream">Download CSV</a>
            <button type="button" onClick={() => window.print()} className="rounded-full border-2 border-navy px-4 py-2 text-sm font-semibold hover:bg-navy hover:text-cream">Print / Save as PDF</button>
          </div>
        </div>

        {statement.loading && !st && <div className="mt-4"><SkeletonRows label="Loading statement" /></div>}
        {statement.error && <p role="alert" className="mt-4">Could not load the statement: {statement.error}</p>}

        {st && (
          <div className={`mt-4 ${statement.loading ? "opacity-60" : ""}`}>
            <h3 className="hidden font-display text-xl font-bold print:block">Earnings statement: {st.seller.name}, {months.find((m) => m.value === month)?.label}</h3>

            {st.lines.length === 0 ? (
              <p className={`${card} text-center`}>No sales in this month.</p>
            ) : (
              <ul className="space-y-2">
                {st.lines.map((line, index) => (
                  <li key={`${line.orderRef}-${index}`} className="grid gap-1 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[110px_1fr_auto] sm:items-center sm:gap-4">
                    <span className="text-sm opacity-70">{line.date}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{line.title}</span>
                      <span className="block text-sm opacity-70">
                        List price {formatMoney(line.listCents, line.currency)}, store commission {(line.commissionBps / 100).toFixed(line.commissionBps % 100 ? 2 : 0)}% ({formatMoney(line.commissionCents, line.currency)})
                      </span>
                    </span>
                    <span className="font-bold">{formatMoney(line.shareCents, line.currency)}</span>
                  </li>
                ))}
              </ul>
            )}

            {st.payouts.length > 0 && (
              <>
                <h4 className="mt-6 font-semibold">Payouts this month</h4>
                <ul className="mt-2 space-y-2">
                  {st.payouts.map((p) => (
                    <li key={p._id} className="flex flex-wrap justify-between gap-2 rounded-2xl bg-white p-4 shadow-sm">
                      <span>{p.date}{p.reference ? `, ref ${p.reference}` : ""}{p.note ? `, ${p.note}` : ""}</span>
                      <span className="font-bold">{formatMoney(p.amountCents, p.currency)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {st.balances.map((b) => (
              <dl key={b.currency} className="mt-6 grid gap-2 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2">
                <div className="flex justify-between"><dt>Balance at start of month ({b.currency})</dt><dd className="font-semibold">{formatMoney(b.openingCents, b.currency)}</dd></div>
                <div className="flex justify-between"><dt>Earned this month</dt><dd className="font-semibold">{formatMoney(b.earnedCents, b.currency)}</dd></div>
                <div className="flex justify-between"><dt>Paid out this month</dt><dd className="font-semibold">{formatMoney(b.paidOutCents, b.currency)}</dd></div>
                <div className="flex justify-between border-t pt-2 font-bold sm:col-span-2"><dt>Balance at end of month</dt><dd>{formatMoney(b.closingCents, b.currency)}</dd></div>
              </dl>
            ))}
          </div>
        )}
      </section>

      {/* ---- payout history ---- */}
      <section className="print:hidden">
        <h2 className="font-display text-2xl font-bold">Payouts received</h2>
        {payouts.loading && !payouts.data && <div className="mt-4"><Skeleton className="h-16 w-full rounded-2xl" /></div>}
        {payouts.data && payouts.data.payouts.length === 0 && <p className={`${card} mt-4 text-center`}>No payouts recorded yet.</p>}
        <ul className="mt-4 space-y-2">
          {payouts.data?.payouts.map((p) => (
            <li key={p._id} className="flex flex-wrap justify-between gap-2 rounded-2xl bg-white p-4 shadow-sm">
              <span>{new Date(p.paidAt).toLocaleDateString()}{p.reference ? `, ref ${p.reference}` : ""}{p.note ? `, ${p.note}` : ""}</span>
              <span className="font-bold">{formatMoney(p.amountCents, p.currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- record a payout (owner) ---- */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record a payout">
        <form onSubmit={submitPayout} className="space-y-4">
          <p className="mt-2 text-sm">Do the bank transfer first, then record it here. This only updates the balance; it doesn't send money.</p>
          {owed.length > 1 && (
            <div>
              <label htmlFor="pay-currency" className="mb-1 block text-sm font-semibold">Currency</label>
              <select id="pay-currency" value={pay.currency} onChange={(e) => setPay({ ...pay, currency: e.target.value, amount: ((rows.find((r) => r.currency === e.target.value)?.balanceCents ?? 0) / 100).toFixed(2) })} className="w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base">
                {owed.map((row) => <option key={row.currency} value={row.currency}>{row.currency} (owed {formatMoney(row.balanceCents, row.currency)})</option>)}
              </select>
            </div>
          )}
          <p className="text-sm font-semibold">Balance owed: {formatMoney(rows.find((r) => r.currency === pay.currency)?.balanceCents ?? 0, pay.currency || "NGN")}</p>
          <div data-autofocus-wrapper>
            <FormField label="Amount paid" id="amount" type="number" step="0.01" min="0" inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} required data-autofocus />
          </div>
          <FormField label="Bank transfer reference (recommended)" id="reference" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} maxLength={100} />
          <FormField label="Note (optional)" id="note" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} maxLength={300} />
          {payError && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{payError}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setPayOpen(false)} className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5">Cancel</button>
            <button disabled={payBusy} className="rounded-full bg-navy px-6 py-2.5 font-semibold text-cream hover:bg-navy/90 disabled:opacity-60">
              <BusyLabel busy={payBusy} busyText="Recording...">Record payout</BusyLabel>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
