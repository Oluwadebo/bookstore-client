/**
 * Display helpers.
 * Prices come from the API in the smallest unit (299 = $2.99, 149500 kobo = N1,495).
 * Intl.NumberFormat handles the currency symbol and separators for us.
 */

// Naira shows as "NGN 1,495.00" in the US format, so it uses the Nigerian format ("N1,495").
const LOCALES = { NGN: "en-NG" };

export function formatPrice(priceCents, currency = "USD") {
  return priceCents === 0 ? "Free" : formatMoney(priceCents, currency);
}

/** Like formatPrice, but zero shows as an amount ("N0"), for balances, totals and fees. */
export function formatMoney(priceCents, currency = "USD") {
  const amount = priceCents / 100;
  const options = { style: "currency", currency };
  // Whole-naira prices read better without ".00".
  if (currency === "NGN" && Number.isInteger(amount)) {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }
  return new Intl.NumberFormat(LOCALES[currency] || "en-US", options).format(amount);
}

/** 2400000 -> "2.3 MB". Used for uploaded file sizes. */
export function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Shortens text to about `max` characters at a word boundary, for meta descriptions
 * (search engines show roughly the first 150-160 characters).
 */
export function summarise(text, max = 155) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length).replace(/[.,;:!-]+$/, "")}…`;
}
