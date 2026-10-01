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

// How many requests are in flight right now. The top loading bar listens to this, so every
// page and every action gets a loading indicator without each one having to ask for it.
let pending = 0;
const listeners = new Set();
const setPending = (change) => {
  pending += change;
  listeners.forEach((listener) => listener());
};
export const pendingRequests = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => pending,
};

/** Full URL for an API path. Used for file downloads, which are normal browser navigations. */
export function apiUrl(path) {
  return `${BASE_URL}${path}`;
}

export async function api(path, { method = "GET", body } = {}) {
  setPending(1);
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } finally {
    setPending(-1);
  }

  // Some responses (e.g. 204 No Content) have no body.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}

/**
 * Upload a file (multipart form) with progress reporting.
 *   await upload("/api/admin/books/123/cover", formData, (percent) => ...)
 * fetch() cannot report upload progress, so this uses XMLHttpRequest. Big book files
 * on slow connections are the reason: the admin sees the percentage move.
 */
export function upload(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    setPending(1);
    const request = new XMLHttpRequest();
    request.open("POST", `${BASE_URL}${path}`);
    request.withCredentials = true; // send the login cookie

    if (onProgress) {
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }
    request.onloadend = () => setPending(-1); // runs after both success and failure
    request.onload = () => {
      let data = null;
      try {
        data = JSON.parse(request.responseText);
      } catch {
        /* non-JSON response */
      }
      if (request.status >= 200 && request.status < 300) resolve(data);
      else reject(new Error(data?.error || `Upload failed (${request.status})`));
    };
    request.onerror = () => reject(new Error("Network error. Check your connection and try again."));
    request.send(formData);
  });
}
