/** Orders (/admin/orders): who bought what, and whether the payment went through. */
import { useState } from "react";
import Pagination from "../../components/Pagination.jsx";
import { formatPrice } from "../../lib/format.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

const STATUS_STYLE = { paid: "bg-teal/30", pending: "bg-sunshine/50", failed: "bg-coral/25", refunded: "bg-grape/20" };

export default function AdminOrders() {
  usePageTitle("Admin: orders");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({ page, limit: 20 });
  if (status) query.set("status", status);
  const { data, error, loading } = useApi(`/api/admin/orders?${query}`);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Orders</h2>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status" className="rounded-full border border-navy/20 bg-white px-3 py-2 text-base">
          <option value="">All orders</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error && <p role="alert" className="mt-6">Could not load orders: {error}</p>}
      {loading && !data && <p className="mt-6">Loading...</p>}
      {data && data.orders.length === 0 && <p className="mt-6 rounded-2xl bg-white p-6 text-center">No orders yet.</p>}

      <ul className={`mt-6 space-y-3 ${loading && data ? "opacity-60" : ""}`}>
        {data?.orders.map((order) => (
          <li key={order._id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold opacity-70">{new Date(order.paidAt || order.createdAt).toLocaleString()}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[order.status]}`}>{order.status}</span>
            </div>
            <p className="mt-1 font-semibold">{order.user ? `${order.user.name} (${order.user.email})` : "Deleted customer"}</p>
            <p className="text-sm">{order.items.map((item) => item.title).join(", ")}</p>
            <p className="mt-1 font-bold">{formatPrice(order.totalCents, order.currency)}</p>
          </li>
        ))}
      </ul>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}
