/**
 * Signup page (/signup). Same flow as login: on success the user is signed
 * in immediately and redirected. Server-side validation is the source of
 * truth; the HTML attributes here (required, minLength) just give instant feedback.
 */
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FormField from "../components/FormField.jsx";

export default function SignupPage() {
  const { user, signup } = useAuth();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={redirectTo} replace />;

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(form);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <h1 className="font-display text-3xl font-bold">Create your account</h1>
      <p className="mt-2">Buy once, read anywhere. Your books stay in your library.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <FormField label="Name" id="name" type="text" autoComplete="name" required minLength={2} value={form.name} onChange={update} />
        <FormField label="Email" id="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        <FormField label="Password (at least 8 characters)" id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update} />

        {error && (
          <p role="alert" className="rounded-xl bg-coral/15 px-4 py-3 text-sm font-semibold">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="w-full rounded-full bg-coral px-6 py-3 font-semibold text-navy hover:bg-coral/90 disabled:opacity-60">
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
