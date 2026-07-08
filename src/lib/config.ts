// Single source of truth for the marketplace backend base URL.
// Override locally via VITE_MARKETPLACE_URL (e.g. http://localhost:3002 for a
// local marketplace); defaults to production so nothing changes without the env.
export const MARKETPLACE_URL =
  (import.meta.env.VITE_MARKETPLACE_URL as string | undefined) ??
  "https://salescode-marketplace.salescode.ai";

export const MARKETPLACE_UPLOAD_URL = `${MARKETPLACE_URL}/site/upload`;
