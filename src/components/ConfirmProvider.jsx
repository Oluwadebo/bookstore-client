/**
 * Yes/no questions as a designed pop-up, replacing window.confirm everywhere.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete this book?", message: "This cannot be undone.",
 *                         confirmLabel: "Delete", danger: true }))) return;
 *
 * It works just like window.confirm: `await` it and you get true (confirmed) or false
 * (cancelled, Escape, or clicked outside). For dangerous actions set `danger: true`:
 * the button turns red and keyboard focus starts on Cancel, so a stray Enter can't delete anything.
 */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import Modal from "./Modal.jsx";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current?.(false); // a new question cancels any still-open one
        resolver.current = resolve;
        setDialog(options);
      }),
    []
  );

  function finish(answer) {
    resolver.current?.(answer);
    resolver.current = null;
    setDialog(null);
  }

  const danger = Boolean(dialog?.danger);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={Boolean(dialog)} onClose={() => finish(false)} title={dialog?.title ?? ""} role="alertdialog">
        {dialog && (
          <>
            <div className="mt-3 leading-relaxed">{dialog.message}</div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                data-autofocus={danger ? "" : undefined}
                onClick={() => finish(false)}
                className="rounded-full border-2 border-navy px-6 py-2.5 font-semibold hover:bg-navy/5"
              >
                {dialog.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                data-autofocus={danger ? undefined : ""}
                onClick={() => finish(true)}
                className={`rounded-full px-6 py-2.5 font-semibold ${danger ? "bg-coral text-navy hover:bg-coral/90" : "bg-navy text-cream hover:bg-navy/90"}`}
              >
                {dialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Returns the confirm() function. Must be used inside <ConfirmProvider>. */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
