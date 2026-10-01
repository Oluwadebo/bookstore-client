/**
 * Login page (/login).
 * On success the auth context stores the user, this component re-renders, and
 * <Navigate> sends them back to the page they were trying to reach (or home).
 */
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FormField from "../components/FormField.jsx";
import { BusyLabel } from "../components/Loading.jsx";
import PasswordField from "../components/PasswordField.jsx";

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (or just signed in): leave this page.
  if (user) return <Navigate to={redirectTo} replace />;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="mt-2">Log in to see your library and check out.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <FormField label="Email" id="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        <PasswordField label="Password" id="password" autoComplete="current-password" required value={form.password} onChange={update} />

        {error && (
          <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="w-full rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60">
          <BusyLabel busy={submitting} busyText="Logging in...">Log in</BusyLabel>
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        New here?{" "}
        <Link to="/signup" className="font-semibold underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
