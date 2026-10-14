export const keys = {
  me: ["me"] as const, channels: ["channels"] as const, active: ["predictions", "active"] as const,
  channel: (id: string) => ["channels", "detail", id] as const,
  statsOverview: ["channels", "stats"] as const,
  settings: ["settings"] as const, billing: ["billing", "status"] as const,
  qrPayments: ["billing", "qr-payments"] as const,
  votes: (query: string) => ["votes", query] as const,
  history: (channelId: string, query: string) => ["history", channelId, query] as const,
  stats: (id: string) => ["stats", id] as const
};
