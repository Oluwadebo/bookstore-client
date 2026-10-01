/**
 * Team (/admin/team): SITE OWNER ONLY. The owner reviews applications to become an admin,
 * sees who is on the team, and can remove admins. Every decision asks for confirmation in a pop-up.
 * Changes take effect immediately: an approved applicant gets access on their next click,
 * a removed admin loses it on theirs.
 */
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useConfirm } from "../../components/ConfirmProvider.jsx";
import { Skeleton, SkeletonShelves } from "../../components/Loading.jsx";
import { api } from "../../lib/api.js";
import { useApi } from "../../lib/useApi.js";
import { usePageTitle } from "../../lib/usePageTitle.js";

const when = (date) => new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function AdminTeam() {
  usePageTitle("Admin: team");
  const confirm = useConfirm();
  const { refreshStats } = useOutletContext() ?? {}; // updates the badge on the Team tab
  const { data, error: loadError, reload } = useApi("/api/admin/team");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  /** Ask, then call the API, then refresh the lists. */
  async function decide({ id, path, dialog }) {
    if (!(await confirm(dialog))) return;
    setError("");
    setBusyId(id);
    try {
      await api(path, { method: "POST" });
      await reload();
      refreshStats?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  const approve = (request) =>
    decide({
      id: request._id,
      path: `/api/admin/team/requests/${request._id}/approve`,
      dialog: {
        title: "Give admin access?",
        message: <><strong>{request.user.name}</strong> ({request.user.email}) will be able to add and edit books, upload files and covers, manage shelves and view orders. They will not be able to delete anything or manage the team.</>,
        confirmLabel: "Give admin access",
      },
    });

  const decline = (request) =>
    decide({
      id: request._id,
      path: `/api/admin/team/requests/${request._id}/reject`,
      dialog: {
        title: "Decline this application?",
        message: <><strong>{request.user.name}</strong> stays a regular customer and can apply again after 7 days.</>,
        confirmLabel: "Decline",
        danger: true,
      },
    });

  const removeAdmin = (admin) =>
    decide({
      id: admin._id,
      path: `/api/admin/team/admins/${admin._id}/remove`,
      dialog: {
        title: "Remove admin access?",
        message: <><strong>{admin.name}</strong> ({admin.email}) becomes a regular customer and is locked out of the admin area straight away.</>,
        confirmLabel: "Remove access",
        danger: true,
      },
    });

  if (loadError) return <p role="alert">Could not load the team: {loadError}</p>;
  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <SkeletonShelves count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <p className="rounded-2xl bg-white p-5 text-sm leading-relaxed shadow-sm">
        <strong>How roles work.</strong> As the site owner you can do everything and you have the final say.
        Admins you approve can add and edit books, upload files and covers, publish or unpublish, manage shelves and view orders.
        Only you can delete books and shelves, and approve or remove admins.
      </p>

      {error && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}

      <section>
        <h2 className="font-display text-2xl font-bold">Applications waiting ({data.pending.length})</h2>
        {data.pending.length === 0 && <p className="mt-3 rounded-2xl bg-white p-6 text-center">No applications right now.</p>}
        <ul className="mt-4 space-y-3">
          {data.pending.map((request) => (
            <li key={request._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold">{request.user.name} <span className="font-normal opacity-70">({request.user.email})</span></p>
              <p className="text-sm opacity-70">Applied {when(request.createdAt)}</p>
              {request.message && <p className="mt-2 whitespace-pre-line rounded-xl bg-cream px-4 py-3 text-sm">{request.message}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => approve(request)} disabled={busyId === request._id} className="rounded-full bg-teal px-5 py-2 text-sm font-semibold text-navy hover:bg-teal/90 disabled:opacity-60">Approve</button>
                <button onClick={() => decline(request)} disabled={busyId === request._id} className="rounded-full border-2 border-navy px-5 py-2 text-sm font-semibold hover:bg-navy/5 disabled:opacity-60">Decline</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold">The team</h2>
        <ul className="mt-4 space-y-3">
          {data.admins.map((person) => (
            <li key={person._id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{person.name}</p>
                <p className="break-all text-sm opacity-70">{person.email}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${person.role === "owner" ? "bg-grape/20" : "bg-teal/30"}`}>{person.role === "owner" ? "Site owner" : "Admin"}</span>
              {person.role === "admin" && (
                <button onClick={() => removeAdmin(person)} disabled={busyId === person._id} className="text-sm font-semibold text-red-700 underline disabled:opacity-60">Remove access</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {data.recent.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold">Recent decisions</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.recent.map((item) => (
              <li key={item._id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                <strong>{item.user?.name ?? "Deleted user"}</strong>{" "}
                {item.status === "approved" ? "was approved" : "was declined"} by {item.decidedBy?.name ?? "the owner"} on {when(item.decidedAt)}.
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
