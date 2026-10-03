/** My sales (/admin/sales): an admin's own earnings. The owner has Earnings instead. */
import { Navigate } from "react-router-dom";
import SalesView from "../../components/admin/SalesView.jsx";
import { Skeleton } from "../../components/Loading.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { isOwner } from "../../lib/roles.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function AdminSales() {
  usePageTitle("Admin: my sales");
  const { user } = useAuth();
  const summary = useApi(isOwner(user) ? null : "/api/admin/earnings/summary");

  if (isOwner(user)) return <Navigate to="/admin/earnings" replace />;
  const me = summary.data?.sellers[0];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 text-sm leading-relaxed shadow-sm print:hidden">
        {me ? (
          <>
            <strong>How you earn.</strong> Your commission rate is <strong>{me.commissionPercent}%</strong>: the store keeps {me.commissionPercent}% of each book's
            list price and the rest is yours. Customers pay the payment processing fee on top of the price, so it never reduces your earnings.
            The owner pays out what you're owed and records each payment here.
          </>
        ) : (
          <Skeleton className="h-10 w-full" />
        )}
      </div>
      <SalesView />
    </div>
  );
}
