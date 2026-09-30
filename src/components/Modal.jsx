/**
 * A pop-up dialog. Use this (or useConfirm for yes/no questions) instead of the browser's
 * window.alert / confirm / prompt boxes, which can't be styled and look out of place.
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="Apply to be an admin">...</Modal>
 *
 * Built for accessibility: it is announced as a dialog, Escape closes it, Tab stays inside it,
 * the page behind can't scroll, and focus returns to the button that opened it.
 * Put data-autofocus on the element that should receive focus first.
 * Clicking the dark backdrop closes it. On phones it slides up from the bottom.
 */
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, children, role = "dialog" }) {
  const titleId = useId();
  const panelRef = useRef(null);
  // Always call the latest onClose without restarting the effect below.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    (panel.querySelector("[data-autofocus]") || panel.querySelector(FOCUSABLE) || panel).focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep keyboard focus inside the dialog.
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return event.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 p-4 sm:items-center"
      // mousedown (not click) so dragging a text selection out of the panel doesn't close it.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // `starting:` gives a short fade/slide-in in modern browsers; older ones just show it instantly.
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cream p-6 shadow-2xl outline-none transition duration-200 starting:translate-y-3 starting:opacity-0"
      >
        <h2 id={titleId} className="font-display text-2xl font-bold">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body
  );
}
