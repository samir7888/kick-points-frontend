// Live SSE events mapped to the React Query keys they should invalidate.
// Every key is a prefix, so `["channels"]` also refreshes channel detail pages
// and the dashboard stats summary.
const channels = ["channels"] as const;
const active = ["predictions", "active"] as const;
const votes = ["votes"] as const;
const stats = ["stats"] as const;
const points = ["points"] as const;
const me = ["me"] as const;
const billing = ["billing"] as const;

export const eventMap: Record<string, readonly (readonly unknown[])[]> = {
  prediction_updated: [channels, active, stats],
  vote_placed: [channels, active, votes, stats, points],
  vote_failed: [channels, votes, stats, points],
  token_needs_reauth: [me],
  voting_paused: [me, channels],
  billing_updated: [billing, me]
};

export const defaultInvalidations: readonly (readonly unknown[])[] = [me, channels, active, points];
