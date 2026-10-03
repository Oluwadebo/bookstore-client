/**
 * Earnings (/admin/earnings): OWNER ONLY. The money side of the marketplace:
 * the commission rate, what the store has earned, what each seller is owed, and the check
 * that the payment fees collected from customers roughly match what Paystack took.
 */
import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useConfirm } from "../../components/ConfirmProvider.jsx";
import FormField from "../../components/FormField.jsx";
import { BusyLabel, Skeleton, SkeletonRows } from "../../components/Loading.jsx";
import Modal from "../../components/Modal.jsx";
import { api } from "../../lib/api.js";
import { formatMoney } from "../../lib/format.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

const card = "rounded-2xl bg-white p-5 shadow-sm";

export default function AdminEarnings() {
  usePageTitle("Admin: earnings");
  const confirm = useConfirm();
  useOutletContext(); // (kept for symmetry with the other owner screens)
  const { data, error, reload } = useApi("/api/admin/earnings/summary");

  const [rate, setRate] = useState(null); // text being edited; null = show the saved value
  const [savingRate, setSavingRate] = useState(false);
  const [notice, setNotice] = useState("");
  const [msg, setMsg] = useState("");
  const [custom, setCustom] = useState(null); // seller whose own rate is being edited
  const [customValue, setCustomValue] = useState("");
  const [useDefault, setUseDefault] = useState(false);
  const [customBusy, setCustomBusy] = useState(false);

  if (error) return <p role="alert">Could not load earnings: {error}</p>;
  if (!data) return <div className="space-y-6"><Skeleton className="h-28 w-full rounded-2xl" /><SkeletonRows count={3} label="Loading earnings" /></div>;

  const saved = data.settings.commissionPercent;
  const editing = rate ?? String(saved);

  async function saveRate(event) {
    event.preventDefault();
    const percent = Number.parseFloat(editing);
    if (!Number.isFinite(percent) || percent < 0 || percent > 90) return setMsg("Enter a percentage between 0 and 90");
    if (percent === saved) return;
    const ok = await confirm({
      title: "Change the store commission?",
      message: <>The default commission becomes <strong>{percent}%</strong>. It applies to <strong>future sales only</strong>; past sales keep the rate they were sold at. Sellers with their own rate are not affected.</>,
      confirmLabel: "Change commission",
    });
    if (!ok) return;
    setSavingRate(true);
    setMsg("");
    try {
      await api("/api/admin/earnings/settings", { method: "PUT", body: { commissionPercent: percent } });
      setRate(null);
      setNotice(`Commission is now ${percent}% for new sales.`);
      await reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSavingRate(false);
    }
  }

  function openCustom(seller) {
    setCustom(seller);
    setUseDefault(!seller.hasCustomRate);
    setCustomValue(String(seller.commissionPercent));
    setMsg("");
  }

  async function saveCustom(event) {
    event.preventDefault();
    const percent = Number.parseFloat(customValue);
    if (!useDefault && (!Number.isFinite(percent) || percent < 0 || percent > 90)) return setMsg("Enter a percentage between 0 and 90");
    setCustomBusy(true);
    try {
      await api(`/api/admin/earnings/sellers/${custom._id}`, { method: "PATCH", body: { commissionPercent: useDefault ? null : percent } });
      setCustom(null);
      setNotice(`${custom.name}'s rate updated for new sales.`);
      await reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setCustomBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      {notice && <p role="status" className="rounded-xl bg-teal/25 px-4 py-3 text-sm font-semibold">{notice}</p>}
      {msg && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{msg}</p>}

      <section className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={saveRate} className={card}>
          <h2 className="font-display text-lg font-bold">Store commission</h2>
          <p className="mt-1 text-sm opacity-80">The store's cut of each seller's list price. Applies to new sales.</p>
          <div className="mt-3 flex items-end gap-2">
            <div className="w-28"><FormField label="Percent" id="commission" type="number" step="0.1" min="0" max="90" value={editing} onChange={(e) => setRate(e.target.value)} /></div>
            <button disabled={savingRate || Number.parseFloat(editing) === saved} className="rounded-full bg-navy px-5 py-3 font-semibold text-cream hover:bg-navy/90 disabled:opacity-50">
              <BusyLabel busy={savingRate} busyText="Saving...">Save</BusyLabel>
            </button>
          </div>
        </form>

        <div className={card}>
          <h2 className="font-display text-lg font-bold">Store commission earned</h2>
          {data.commissionIncome.length === 0 && <p className="mt-2 text-sm opacity-80">None yet.</p>}
          {data.commissionIncome.map((c) => (
            <p key={c.currency} className="mt-2 font-display text-2xl font-bold">
              {formatMoney(c.commissionCents, c.currency)}
              <span className="ml-2 text-sm font-normal opacity-70">from {formatMoney(c.grossCents, c.currency)} of seller sales</span>
            </p>
          ))}
        </div>

        <div className={card}>
          <h2 className="font-display text-lg font-bold">Payment fees</h2>
          <p className="mt-1 text-xs opacity-70">Fees added to customers' totals, compared with what Paystack actually took.</p>
          {data.fees.length === 0 && <p className="mt-2 text-sm opacity-80">No fees collected yet.</p>}
          {data.fees.map((f) => (
            <dl key={f.currency} className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Charged to customers</dt><dd className="font-semibold">{formatMoney(f.chargedCents, f.currency)}</dd></div>
              <div className="flex justify-between"><dt>Paystack took ({f.knownOrders} orders)</dt><dd className="font-semibold">{formatMoney(f.paystackTookCents, f.currency)}</dd></div>
              <div className="flex justify-between border-t pt-1 font-bold"><dt>{f.differenceCents >= 0 ? "Store kept" : "Store absorbed"}</dt><dd>{formatMoney(Math.abs(f.differenceCents), f.currency)}</dd></div>
              {f.knownOrders < f.orders && <p className="text-xs opacity-70">{f.orders - f.knownOrders} older orders have no recorded Paystack fee.</p>}
            </dl>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold">Sellers</h2>
        {data.sellers.length === 0 && <p className={`${card} mt-4 text-center`}>No sellers yet. Approve admins on the Team screen.</p>}
        <ul className="mt-4 space-y-3">
          {data.sellers.map((seller) => (
            <li key={seller._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{seller.name} <span className="font-normal opacity-70">({seller.email})</span></p>
                  <p className="text-sm opacity-80">Commission {seller.commissionPercent}% {seller.hasCustomRate ? "(custom rate)" : "(store default)"}</p>
                </div>
                <button onClick={() => openCustom(seller)} className="text-sm font-semibold underline">Set rate</button>
                <Link to={`/admin/earnings/${seller._id}`} className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-cream hover:bg-navy/90">Statement and payouts</Link>
              </div>
              {seller.totals.length === 0 ? (
                <p className="mt-2 text-sm opacity-70">No sales yet.</p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {seller.totals.map((t) => (
                    <li key={t.currency} className="rounded-xl bg-cream px-4 py-2 text-sm">
                      <span className="font-semibold">{t.currency}</span>: earned {formatMoney(t.earnedCents, t.currency)}, paid {formatMoney(t.paidOutCents, t.currency)},{" "}
                      <strong className={t.balanceCents > 0 ? "" : "opacity-70"}>owed {formatMoney(t.balanceCents, t.currency)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Modal open={Boolean(custom)} onClose={() => setCustom(null)} title={custom ? `Rate for ${custom.name}` : ""}>
        <form onSubmit={saveCustom} className="space-y-4">
          <p className="mt-2 text-sm">A custom rate replaces the store default for this seller's <strong>future</strong> sales only.</p>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" className="h-5 w-5" checked={useDefault} onChange={(e) => setUseDefault(e.target.checked)} />
            Use the store default ({saved}%)
          </label>
          <FormField label="Commission percent" id="custom-rate" type="number" step="0.1" min="0" max="90" value={customValue} onChange={(e) => setCustomValue(e.target.value)} disabled={useDefault} data-autofocus />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setCustom(null)} className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5">Cancel</button>
            <button disabled={customBusy} className="rounded-full bg-navy px-6 py-2.5 font-semibold text-cream hover:bg-navy/90 disabled:opacity-60"><BusyLabel busy={customBusy} busyText="Saving...">Save rate</BusyLabel></button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
