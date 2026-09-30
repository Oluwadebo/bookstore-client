/**
 * Frame for every admin screen: a title, a tab bar, and the current screen below it.
 * The Team tab exists for the site owner only, with a badge counting applications waiting.
 * The tabs scroll sideways on narrow phones instead of wrapping.
 */
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { isOwner } from "../../lib/roles.js";
import { useApi } from "../../lib/useApi.js";

export default function AdminLayout() {
  const { user } = useAuth();
  const owner = isOwner(user);
  // Only the owner needs the waiting-applications count, so only the owner asks for it.
  const stats = useApi(owner ? "/api/admin/stats" : null);
  const waiting = stats.data?.pendingAdminRequests ?? 0;

  const tabs = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/books", label: "Books" },
    { to: "/admin/categories", label: "Shelves" },
    { to: "/admin/orders", label: "Orders" },
    ...(owner ? [{ to: "/admin/team", label: "Team", badge: waiting }] : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold">Store admin</h1>

      <nav aria-label="Admin sections" className="mt-4 flex gap-2 overflow-x-auto border-b border-navy/10 pb-3">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${isActive ? "bg-navy text-cream" : "hover:bg-navy/5"}`
            }
          >
            {tab.label}
            {tab.badge > 0 && <span className="ml-2 rounded-full bg-coral px-2 py-0.5 text-xs text-navy">{tab.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6">
        <Outlet context={{ refreshStats: stats.reload }} />
      </div>
    </div>
  );
}
