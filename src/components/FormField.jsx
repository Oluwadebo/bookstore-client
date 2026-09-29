/**
 * A labelled text input used by the login and signup forms.
 * Any extra props (type, value, onChange, autoComplete, required...) go to the <input>.
 *
 * `text-base` (16px) is deliberate: iOS Safari zooms the page when a field
 * smaller than 16px is focused, which feels broken on phones.
 */
export default function FormField({ label, id, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={id}
        {...inputProps}
        className="w-full rounded-xl border border-navy/20 bg-white px-4 py-3 text-base outline-none focus:border-coral focus:ring-2 focus:ring-coral/40"
      />
    </div>
  );
}
