/**
 * Choose a new password (/reset-password?token=...), reached from the email link.
 * The link works once and expires after 30 minutes. Resetting also signs out every other device.
 */
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BusyLabel } from "../components/Loading.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { api } from "../lib/api.js";
import { usePageTitle } from "../lib/usePageTitle.js";

export default function ResetPasswordPage() {
  usePageTitle("Choose a new password");
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/reset-password", { method: "POST", body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
        <h1 className="font-display text-3xl font-bold">This link is incomplete</h1>
        <p className="mt-3">Open the link from your email again, or ask for a new one.</p>
        <Link to="/forgot-password" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy">Request a new link</Link>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
        <h1 className="font-display text-3xl font-bold">Password changed</h1>
        <p role="status" className="mt-3">Your password has been updated and your other devices were signed out. You can log in now.</p>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90">Log in</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <PasswordField label="New password (at least 8 characters)" id="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">
            {error} {/invalid|expired/i.test(error) && <Link to="/forgot-password" className="underline">Request a new link</Link>}
          </p>
        )}
        <button disabled={busy} className="w-full rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60">
          <BusyLabel busy={busy} busyText="Saving...">Save new password</BusyLabel>
        </button>
      </form>
    </main>
  );
}
