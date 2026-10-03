/** One seller's statement and payouts (/admin/earnings/:sellerId). OWNER ONLY. */
import { Link, useParams } from "react-router-dom";
import SalesView from "../../components/admin/SalesView.jsx";
import { Skeleton } from "../../components/Loading.jsx";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

export default function AdminSellerDetail() {
  const { sellerId } = useParams();
  usePageTitle("Admin: seller earnings");
  const summary = useApi("/api/admin/earnings/summary");
  const seller = summary.data?.sellers.find((s) => s._id === sellerId);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link to="/admin/earnings" className="text-sm font-semibold underline">Back to earnings</Link>
        {seller ? (
          <h2 className="mt-2 font-display text-2xl font-bold">{seller.name} <span className="text-base font-normal opacity-70">({seller.email}), {seller.commissionPercent}% commission</span></h2>
        ) : (
          <Skeleton className="mt-3 h-8 w-72" />
        )}
      </div>
      {summary.data && !seller ? <p role="alert">Seller not found.</p> : <SalesView sellerId={sellerId} canPay />}
    </div>
  );
}
