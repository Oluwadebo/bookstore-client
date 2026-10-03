/**
 * "Forgot password" (/forgot-password). The customer enters their email and, if an account exists,
 * receives a reset link. The answer is the same either way, so nobody can use this page to find out
 * who has an account.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { BusyLabel } from "../components/Loading.jsx";
import { api } from "../lib/api.js";
import { usePageTitle } from "../lib/usePageTitle.js";

export default function ForgotPasswordPage() {
  usePageTitle("Forgot password");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/auth/forgot-password", { method: "POST", body: { email } });
      setSent(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Forgot your password?</h1>

      {sent ? (
        <div className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <p role="status" className="font-semibold">{sent}</p>
          <p className="text-sm">Can't find it? Check your spam folder, or wait a minute and try again.</p>
          <Link to="/login" className="inline-block font-semibold underline">Back to log in</Link>
        </div>
      ) : (
        <>
          <p className="mt-2">Enter your email and we'll send you a link to choose a new one.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
            <FormField label="Email" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">{error}</p>}
            <button disabled={busy} className="w-full rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60">
              <BusyLabel busy={busy} busyText="Sending...">Send reset link</BusyLabel>
            </button>
          </form>
          <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold underline">Back to log in</Link></p>
        </>
      )}
    </main>
  );
}
