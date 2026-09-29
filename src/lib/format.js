/**
 * Display helpers.
 * Prices come from the API in cents (299 = $2.99). Intl.NumberFormat handles
 * the currency symbol and decimals for us.
 */
export function formatPrice(priceCents, currency = "USD") {
  if (priceCents === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(priceCents / 100);
}
