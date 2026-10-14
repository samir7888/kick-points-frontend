import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { ApiError } from "./errors";
import type { Me } from "./types";

export const openapi = createClient<paths>({ baseUrl: "", credentials: "include" });

export async function getMe(): Promise<Me> {
  const result = await openapi.GET("/api/v1/me");
  if (!result.response.ok) {
    const status = result.response.status;
    if (status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    }
    throw new ApiError(status, status === 401 ? "INVALID_CREDENTIALS" : "REQUEST_FAILED", `Could not load your account (${status}).`);
  }
  if (!result.data) throw new ApiError(500, "INVALID_RESPONSE", "The account response was empty.");
  return result.data as Me;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init, credentials: "include",
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers }
  });
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const root = typeof body === "object" && body !== null ? body as { error?: { code?: string; message?: string; details?: unknown } } : {};
    if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?next=${encodeURIComponent(next)}`);
    }
    throw new ApiError(response.status, root.error?.code ?? "REQUEST_FAILED", root.error?.message ?? `Request failed (${response.status})`, root.error?.details);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, { ...init, method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body: unknown, init?: RequestInit) => request<T>(path, { ...init, method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, init?: RequestInit) => request<T>(path, { ...init, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" })
};
