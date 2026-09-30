/**
 * A password input with an eye button to show or hide what is typed.
 * Use it for EVERY password field. Takes the same props as FormField
 * (label, id, autoComplete, required, value, onChange...).
 *
 * The button is a real <button type="button"> with an accessible name that changes
 * ("Show password" / "Hide password"), so keyboard and screen-reader users can use it.
 */
import { useState } from "react";

const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

function EyeIcon() {
  return (
    <svg {...icon}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...icon}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function PasswordField({ label, id, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          {...inputProps}
          // pr-12 leaves room for the eye button; text-base (16px) stops iOS zooming on focus.
          className="w-full rounded-xl border border-navy/20 bg-white py-3 pl-4 pr-12 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // Keeps the cursor in the input when clicking with a mouse.
          onMouseDown={(event) => event.preventDefault()}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-coral"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
