/**
 * Account page (/account) - protected. Shows the signed-in user's details.
 * "My Library" (purchased books and downloads) is added in step 4.
 */
import { useAuth } from "../context/AuthContext.jsx";

export default function AccountPage() {
  const { user } = useAuth();

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
    </main>
  );
}
