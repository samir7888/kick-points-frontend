export type Plan = "free" | "premium";
export type TokenHealth = "healthy" | "needs_reauth" | "disconnected";
export type Me = {
  id: number; kick_user_id: number; username: string; plan: Plan; premium_until: string | null;
  channel_limit: number; channels_used: number; token_health: TokenHealth; voting_paused: boolean; is_admin: boolean;
};
export type Channel = {
  id: number; slug: string; kick_channel_id: number | null; enabled: boolean; paused_reason: string | null;
  vote_amount: number | null; effective_amount: number; created_at: string; live?: boolean;
  points_balance?: number | null;
  active_prediction?: { id: number; title: string; state: string; closes_at: string | null } | null;
};
export type Vote = {
  id: number; outcome_id: string; amount_requested: number; amount_placed: number | null; status: string;
  reason: string | null; points_delta: number | null; created_at: string; settled_at: string | null;
  channel_id?: number; channel_slug?: string; prediction_id?: number;
  prediction_title?: string | null; prediction_state?: string | null;
  outcome_title?: string | null; winning_outcome_id?: string | null; winning_outcome_title?: string | null;
};
export type Prediction = {
  id: number; channel_slug: string; kick_prediction_id?: string; title: string; outcomes?: Array<{ id: string; title: string; total?: number }>;
  state: string; winning_outcome_id?: string | null; opened_at: string; closes_at: string | null; resolved_at?: string | null;
  my_vote?: Vote | null;
};
export type Page<T> = { items: T[]; page: number; limit: number; total: number; pages: number };
export type Settings = { default_vote_amount: number; fallback_to_min: boolean; paused: boolean; kick_session_token_set: boolean; kick_session_token_valid?: boolean | null; kick_session_token_message?: string | null };
export type BillingStatus = { plan: Plan; premium_until: string | null; status: string; price_display: number };
export type ChannelStats = {
  votes_placed: number; votes_won: number; votes_lost: number;
  win_rate: number; net_points: number; last_vote_at: string | null;
};
export type ChannelStatsSummary = {
  totals: ChannelStats;
  channels: Array<ChannelStats & { channel_id: number; slug: string }>;
};
export type PointsRange = "1h" | "24h" | "7d" | "30d";
export type PointsSeriesPoint = { at: string; total: number };
export type PointsChannelGrowth = {
  channel_id: number; slug: string; current: number; start: number; growth: number;
  series: Array<{ at: string; balance: number }>;
};
export type PointsHistory = {
  range: PointsRange;
  bucket: string;
  totals: { current: number; start: number; growth: number; growth_pct: number | null; snapshots: number };
  series: PointsSeriesPoint[];
  channels: PointsChannelGrowth[];
};
export type QrPaymentStatus = "pending" | "confirmed" | "rejected";
export type QrPayment = {
  id: number;
  user_id: number;
  username: string;
  email: string | null;
  reference: string | null;
  amount: number | null;
  status: QrPaymentStatus;
  proof_url: string | null;
  created_at: string | null;
  decided_at: string | null;
};
