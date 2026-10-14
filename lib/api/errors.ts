export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export function messageForError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session ended. Sign in again to continue.";
    if (error.status === 402 && error.code === "PLAN_LIMIT") return "Your plan has reached its channel limit. Upgrade to Premium to add more.";
    if (error.status === 409) return "That channel is already in your list.";
    if (error.status === 422) return error.message || "Check the highlighted details and try again.";
    if (error.status === 429) return "Too many requests. Try again in a moment.";
    if (error.status === 503) return "Voting is paused while we fix a Kick connection problem. Your settings are safe.";
    if (error.status === 502 && error.code === "BILLING_ERROR") {
      const details = error.details as { provider_message?: string; provider_status?: number } | undefined;
      const provider = details?.provider_message;
      const fallback =
        "Billing is temporarily unavailable. Check your payment provider settings and try again.";
      if (provider) {
        const firstLine = provider.split(".").find((part) => part.trim().length)?.trim() ?? provider;
        return `${error.message} — ${firstLine}.`;
      }
      return error.message || fallback;
    }
    return error.message || "The request could not be completed.";
  }
  return "We couldn’t reach the service. Check your connection and retry.";
}
