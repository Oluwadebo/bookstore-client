/**
 * Fetch data from the API when a component appears, and again whenever `path` changes.
 *
 *   const { data, error, loading } = useApi("/api/books?featured=true");
 *
 * - Pass `null` as the path to skip fetching.
 * - While a new request is loading, the previous `data` is kept, so lists
 *   don't flash empty when the visitor changes a filter or page.
 * - Results from outdated requests are ignored (no flicker if the visitor clicks fast).
 */
import { useEffect, useState } from "react";
import { api } from "./api.js";

export function useApi(path) {
  const [state, setState] = useState({ data: null, error: "", loading: Boolean(path) });

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setState((previous) => ({ ...previous, error: "", loading: true }));

    api(path)
      .then((data) => !cancelled && setState({ data, error: "", loading: false }))
      .catch((err) => !cancelled && setState({ data: null, error: err.message, loading: false }));

    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
