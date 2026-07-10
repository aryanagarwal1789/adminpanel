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

const AUTH_COOKIE_KEY = "auth_cookie";
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
  return auth;
}

// --- Temporary hardcoded credential login -------------------------------
// Used while the Google SSO origin allowlist on dev-auth.salescode.ai is being
// sorted out. Replace with the SSO flow (initiateGoogleSSO/exchangeSso) once the
// admin panel's origin is whitelisted.
const HARDCODED_USERNAME = "admin";
const HARDCODED_PASSWORD = "PageCraft@2026";

/**
 * Validates credentials against the hardcoded pair and, on success, stores an
 * auth session (same shape/localStorage key the route guard already reads).
 * Returns true on success, false on invalid credentials.
 */
export function loginWithCredentials(username: string, password: string): boolean {
  if (username !== HARDCODED_USERNAME || password !== HARDCODED_PASSWORD) {
    return false;
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const auth: AuthState = {
    isAuthenticated: true,
    token: "local-dev",
    userId: username,
    email: `${username}@salescode.ai`,
    role: "admin",
    timestamp: now.toISOString(),
    expires: expires.toISOString(),
    expiresIn: "1d",
    tokenType: "bearer",
  };
  localStorage.setItem(AUTH_COOKIE_KEY, JSON.stringify(auth));
  return true;
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
