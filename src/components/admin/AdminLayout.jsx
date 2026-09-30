/**
 * Frame for every admin screen: a title, a tab bar, and the current screen below it.
 * The tabs scroll sideways on narrow phones instead of wrapping.
 */
import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/books", label: "Books" },
  { to: "/admin/categories", label: "Shelves" },
  { to: "/admin/orders", label: "Orders" },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold">Store admin</h1>

      <nav aria-label="Admin sections" className="mt-4 flex gap-2 overflow-x-auto border-b border-navy/10 pb-3">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${isActive ? "bg-navy text-cream" : "hover:bg-navy/5"}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
