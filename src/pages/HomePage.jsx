/**
 * Temporary home page for step 1. It proves three things work:
 *   1. React + Tailwind and the brand colours render.
 *   2. The layout is responsive (resize the window or open it on a phone).
 *   3. The client can reach the API (calls /api/health).
 * The real storefront (shelves, search, featured books) replaces this in step 3.
 */
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const SWATCHES = [
  { name: "Coral", className: "bg-coral" },
  { name: "Sunshine", className: "bg-sunshine" },
  { name: "Teal", className: "bg-teal" },
  { name: "Grape", className: "bg-grape" },
  { name: "Navy", className: "bg-navy" },
];

export default function HomePage() {
  // "loading" | "ok" | "error"
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api("/api/health")
      .then((data) => setStatus(data.database === "connected" ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  const statusText = {
    loading: "Checking the server...",
    ok: "Server and database connected",
    error: "Cannot reach the server. Is it running on port 5000?",
  }[status];

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <h1 className="font-display text-4xl font-bold sm:text-6xl">
        Your next favourite <span className="text-coral">read</span> is waiting.
      </h1>
      <p className="mt-4 max-w-xl text-lg">Setup complete. The storefront is built out in the next steps.</p>

      {/* Palette preview: 2 columns on phones, 5 on larger screens */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SWATCHES.map((s) => (
          <div key={s.name} className={`${s.className} rounded-2xl px-4 py-8 text-center font-semibold text-white`}>
            {s.name}
          </div>
        ))}
      </div>

      <p
        className={`mt-8 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
          status === "ok" ? "bg-teal text-white" : status === "error" ? "bg-coral text-white" : "bg-sunshine"
        }`}
      >
        {statusText}
      </p>
    </main>
  );
}
