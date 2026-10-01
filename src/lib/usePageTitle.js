/**
 * Sets the browser tab title AND the page's meta description (the grey text search engines
 * show under the title).
 *
 *   usePageTitle("Dracula", "Dracula by Bram Stoker. A gothic classic...")
 *
 * Pages without their own text fall back to whatever index.html says, so the defaults are
 * edited in one place. The tab title becomes "<title> | Bookstore" (replace "Bookstore" with the
 * store's name when it's chosen).
 */
import { useEffect } from "react";

// What index.html originally contained, remembered so any page can restore it.
const DEFAULT_TITLE = document.title;

export function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Bookstore` : DEFAULT_TITLE;
  }, [title]);

  useEffect(() => {
    const tag = document.querySelector('meta[name="description"]');
    if (!tag) return;
    const fallback = tag.getAttribute("data-default") ?? tag.content;
    tag.setAttribute("data-default", fallback);
    tag.content = description || fallback;
    return () => {
      tag.content = fallback; // leaving the page puts the default back
    };
  }, [description]);
}
