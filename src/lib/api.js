/**
 * Tiny fetch wrapper used for every call to the API.
 *
 *   const books = await api("/api/books?search=holmes");
 *   await api("/api/auth/login", { method: "POST", body: { email, password } });
 *
 * - Sends/receives JSON.
 * - `credentials: "include"` lets the login cookie travel with each request.
 * - Throws an Error with the server's message when the response is not OK,
 *   so components can simply try/catch and show `error.message`.
 */
const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Some responses (e.g. 204 No Content) have no body.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}
