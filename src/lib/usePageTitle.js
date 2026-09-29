/** Sets the browser tab title, e.g. usePageTitle("Dracula") -> "Dracula | Bookstore". */
import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Bookstore` : "Bookstore";
  }, [title]);
}
