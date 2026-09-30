/** Admin home (/admin): headline numbers and shortcuts. */
import { Link } from "react-router-dom";
import { formatPrice } from "../../lib/format.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

function Stat({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold opacity-70">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-sm opacity-70">{note}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  usePageTitle("Admin");
  const { data, error } = useApi("/api/admin/stats");

  if (error) return <p role="alert">Could not load the dashboard: {error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Books" value={data.books} note={`${data.published} published, ${data.drafts} drafts`} />
        <Stat label="Shelves" value={data.categories} />
        <Stat label="Customers" value={data.customers} />
        {/* Amounts in different currencies cannot be added together, so each gets its own line. */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold opacity-70">Revenue</p>
          {data.revenue.length === 0 && <p className="mt-1 font-display text-3xl font-bold">None yet</p>}
          {data.revenue.map((row) => (
            <p key={row.currency} className="mt-1 font-display text-2xl font-bold">
              {formatPrice(row.revenueCents, row.currency)}
              <span className="ml-2 text-sm font-normal opacity-70">{row.orders} {row.orders === 1 ? "order" : "orders"}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/admin/books/new" className="rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90">
          Add a book
        </Link>
        <Link to="/admin/categories" className="rounded-full border-2 border-navy px-6 py-3 font-semibold hover:bg-navy hover:text-cream">
          Manage shelves
        </Link>
      </div>
    </>
  );
}
