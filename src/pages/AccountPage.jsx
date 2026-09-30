/**
 * Account page (/account) - protected. Shows the signed-in user's details
 * and their past orders, with a shortcut to the library.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPrice } from "../lib/format.js";
import { useApi } from "../lib/useApi.js";

export default function AccountPage() {
  const { user } = useAuth();
  const orders = useApi("/api/orders");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Your account</h1>
      <dl className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <dt className="text-sm font-semibold opacity-70">Name</dt>
          <dd className="text-lg">{user.name}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold opacity-70">Email</dt>
          <dd className="text-lg break-all">{user.email}</dd>
        </div>
        {user.role === "admin" && (
          <div>
            <dt className="text-sm font-semibold opacity-70">Role</dt>
            <dd className="text-lg">Administrator</dd>
          </div>
        )}
      </dl>

      <Link to="/library" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90">
        Go to my library
      </Link>

      <h2 className="mt-12 font-display text-2xl font-bold">Order history</h2>
      {orders.data && orders.data.orders.length === 0 && <p className="mt-3">No orders yet.</p>}
      <ul className="mt-4 space-y-3">
        {orders.data?.orders.map((order) => (
          <li key={order._id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold opacity-70">
                {new Date(order.paidAt || order.createdAt).toLocaleDateString()}
              </span>
              <span className="font-bold">{formatPrice(order.totalCents, order.currency)}</span>
            </div>
            <p className="mt-1">{order.items.map((item) => item.title).join(", ")}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
