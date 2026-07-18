// SSO authentication for the admin panel.
//
// Replicated from the internal Salescode apps (eidos_salescode / kpi-dashboard):
//   1. Google SSO via the Salescode internal auth service (dev-auth.salescode.ai)
//   2. The resulting SSO token is exchanged for an app JWT by the marketplace
//      backend, which enforces the "@salescode.ai" email domain AND a PortalUser
//      allowlist -- so not just anybody can log in.
//
// Everything is stored client-side in localStorage; the backend is stateless JWT.

const AUTH_BASE_URL = "https://dev-auth.salescode.ai";
const TENANT = "salescode_internal";
const APP = "salescode_internal_app";
const GOOGLE_SSO_URL = `${AUTH_BASE_URL}/v1/authenticate/sso/salescode_internal_google`;
const TOKEN_URL = `${GOOGLE_SSO_URL}/token`;

// NOTE: this is the cli-server marketplace backend that hosts /auth/exchange-sso.
// It is deliberately separate from VITE_BACKEND_URL (which locally points at the
// Strapi CMS on :1337 and does NOT have the exchange-sso endpoint).
const MARKETPLACE_URL =
  import.meta.env.VITE_MARKETPLACE_URL ?? "https://salescode-marketplace.salescode.ai";

// Bump this suffix on any deploy where you want to force everyone to log in
// again (invalidates all existing localStorage sessions). Raised after the
// 2026-07-18 unauthorized-access incident + credential rotation.
const AUTH_COOKIE_KEY = "auth_cookie_v2";
const SSO_TOKEN_KEY = "sso_token";
const REDIRECT_KEY = "redirect_after_login";

export interface AuthState {
  isAuthenticated: boolean;
  token: string;
  userId: string;
  email: string;
  role: string;
  timestamp: string;
  expires: string; // ISO string
  expiresIn?: string;
  tokenType: "bearer";
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getMachineId(): string {
  let machineId = localStorage.getItem("machineId");
  if (!machineId) {
    machineId = crypto.randomUUID();
    localStorage.setItem("machineId", machineId);
  }
  return machineId;
}

function getDeviceName(): string {
  const userAgent = navigator.userAgent || "unknown";
  const platform = navigator.platform || "unknown platform";
  return `${platform} - ${userAgent}`;
}

/**
 * Step 1: ask the auth service for the Google authorization URL, then the caller
 * redirects the browser there. Returns "" on failure.
 */
export async function initiateGoogleSSO(): Promise<string> {
  const params = {
    tenant: TENANT,
    targetUrl: window.location.origin + "/login",
    app: APP,
  };

  const url = new URL(GOOGLE_SSO_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), { method: "POST" });
    if (!res.ok) return "";
    const data = await res.json();
    return data?.content?.[0] ?? "";
  } catch (e) {
    console.error("Failed to initiate Google SSO", e);
    return "";
  }
}

/**
 * Step 2: after Google redirects back with a query string, exchange it for the
 * SSO access token. Returns null on failure.
 */
export async function fetchSsoToken(queryString: string): Promise<string | null> {
  const deviceInfo = {
    deviceId: getMachineId(),
    platformType: "web",
    platformVersion: navigator.userAgent,
    appName: APP,
    appVersion: "1.0.0",
    deviceName: getDeviceName(),
    active: true,
  };

  try {
    const res = await fetch(`${TOKEN_URL}${queryString}`, {
      method: "POST",
      headers: {
        tenant: TENANT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deviceInfo),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const accessToken: string | undefined = data?.tokenInformation?.accessToken;
    if (accessToken) localStorage.setItem(SSO_TOKEN_KEY, accessToken);
    return accessToken ?? null;
  } catch (e) {
    console.error("Failed to fetch SSO token", e);
    return null;
  }
}

/**
 * Step 3: exchange the SSO token for an app JWT. The backend rejects anyone
 * whose email is not @salescode.ai or who is not in the PortalUser allowlist.
 * Throws on rejection so the caller can surface it.
 */
export async function exchangeSso(ssoToken: string): Promise<AuthState> {
  const res = await fetch(`${MARKETPLACE_URL}/auth/exchange-sso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ssoToken}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    let message = "Login failed";
    try {
      const body = await res.json();
      message = body?.error ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const { token, userId, email, role, expiresIn } = await res.json();

  const now = new Date();
  let expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (typeof expiresIn === "string" && expiresIn.endsWith("d")) {
    const days = parseInt(expiresIn.replace("d", ""), 10);
    if (!Number.isNaN(days)) {
      expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
  }

  const auth: AuthState = {
    isAuthenticated: true,
    token,
    userId,
    email,
    role,
    timestamp: now.toISOString(),
    expires: expires.toISOString(),
    expiresIn,
    tokenType: "bearer",
  };

  localStorage.setItem(AUTH_COOKIE_KEY, JSON.stringify(auth));
  // Editor name for "last updated by" / edit-lock comes from the authenticated
  // SSO identity (derived from the email), so attribution can't be spoofed.
  const displayName = email
    ? email.split("@")[0].split(/[._-]/).filter(Boolean)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";
  localStorage.setItem("pb_editor_name", displayName || userId || email);
  return auth;
}

// --- Username / password login for selected users (frontend-only) --------
// Google SSO is currently blocked (origin not yet allowlisted on
// dev-auth.salescode.ai) and there's no backend deploy access, so credentials
// are verified in the browser. To avoid shipping plaintext passwords, each
// allowed user is stored as a PBKDF2-SHA256 hash + random salt. ONLY the users
// listed in LOCAL_USERS can sign in.
//
// Add a user:  node scripts/gen-login-user.mjs <username> <password> [name]
//              then paste the printed object into LOCAL_USERS below.
//
// SECURITY NOTE: client-side auth only gates the UI — it can be bypassed via
// localStorage and does not protect the builder API. Replace with the backend
// /auth/login + API @Authenticate flow once backend deploys are possible.

interface LocalUser { username: string; name?: string; role?: string; salt: string; hash: string }

// The selected users allowed to log in. Add/remove entries to grant/revoke access.
// Regenerate a salt/hash with: node scripts/gen-login-user.mjs <username> <password> [name]
const LOCAL_USERS: LocalUser[] = [
  { username: "aryan",     name: "Aryan",     role: "admin", salt: "a5e9771553082db47ed690dd1bc34c40", hash: "4d30ed6fdd4a8da0730ffc5713924d814699ff6df15d79b0023560b18b9623c7" },
  { username: "hritik",    name: "Hritik",    role: "admin", salt: "ec47dbd6f3ab765429c7296808bf3e43", hash: "01436a28c5c36abb606f6253cecb4622b7fdcc2d1dd019a09a4a980f0e882a16" },
  { username: "shubhangi", name: "Shubhangi", role: "admin", salt: "139571fb636a0aeb060a55de35772084", hash: "36fef859421d42cb549707fcc8d0bdbf3396533d05a2653ab3fda3863e93862e" },
  { username: "pramit",    name: "Pramit",    role: "admin", salt: "c08cab2b7b64579d18c7220bc8c2430c", hash: "8a9578a63f652efdcae7cea11422813ff08c8de7b1d2f2284c534c236bd9a580" },
  { username: "vinayak",   name: "Vinayak",   role: "admin", salt: "dc558574c1faa51dbeaf6ad2df68c266", hash: "1d6be27b6aa47cd7cc6297ede0db4bb2fd6722ebff7094c01e581f17c38cd8b3" },
];

const PBKDF2_ITERATIONS = 150000;

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function pbkdf2Hex(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password) as BufferSource, "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex) as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256,
  );
  return bytesToHex(new Uint8Array(bits));
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies credentials against the PBKDF2-hashed LOCAL_USERS allowlist (in the
 * browser) and stores a session on success. Returns true on success, false on
 * unknown user or wrong password.
 */
export async function loginWithCredentials(username: string, password: string): Promise<boolean> {
  try {
    const user = LOCAL_USERS.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    // Derive even for an unknown user so timing doesn't reveal whether it exists.
    const computed = await pbkdf2Hex(password, user?.salt ?? "00000000000000000000000000000000");
    if (!user || !safeEqual(computed, user.hash)) return false;

    const now = new Date();
    const expires = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const auth: AuthState = {
      isAuthenticated: true,
      token: "local-session",
      userId: user.username,
      email: `${user.username}@salescode.ai`,
      role: user.role ?? "admin",
      timestamp: now.toISOString(),
      expires: expires.toISOString(),
      expiresIn: "12h",
      tokenType: "bearer",
    };
    localStorage.setItem(AUTH_COOKIE_KEY, JSON.stringify(auth));
    // Editor name for "last updated by" / edit-lock comes from the authenticated
    // account — NOT a free-text field — so attribution can't be spoofed.
    localStorage.setItem("pb_editor_name", user.name ?? user.username);
    return true;
  } catch (e) {
    console.error("Login failed", e);
    return false;
  }
}
// -------------------------------------------------------------------------

export function getAuth(): AuthState | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(AUTH_COOKIE_KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw) as AuthState;
    if (!auth.isAuthenticated) return null;
    if (auth.expires && new Date() > new Date(auth.expires)) {
      logout();
      return null;
    }
    return auth;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAuth() !== null;
}

/** The app JWT to send as `Authorization: Bearer <token>` on API calls. */
export function getAppToken(): string | null {
  return getAuth()?.token ?? null;
}

export function logout(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_COOKIE_KEY);
  localStorage.removeItem(SSO_TOKEN_KEY);
}

export function setRedirectPath(path: string): void {
  if (isBrowser()) localStorage.setItem(REDIRECT_KEY, path);
}

/** Read and clear the saved post-login redirect path. */
export function popRedirectPath(): string | null {
  if (!isBrowser()) return null;
  const path = localStorage.getItem(REDIRECT_KEY);
  if (path) localStorage.removeItem(REDIRECT_KEY);
  return path;
}
