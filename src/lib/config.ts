// Configuration and constants
// NOTE: this is the cli-server marketplace backend that hosts /auth/exchange-sso.
// It is deliberately separate from VITE_BACKEND_URL (which locally points at the
// Strapi CMS on :1337 and does NOT have the exchange-sso endpoint).
export const MARKETPLACE_URL =
  import.meta.env.VITE_MARKETPLACE_URL ?? "https://salescode-marketplace.salescode.ai";
