"use client";

import { useCallback } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getMe } from "./client";
import { keys } from "./keys";
import type { BillingStatus, Channel, ChannelStatsSummary, Me, Page, Prediction, QrPayment, Settings, Vote } from "./types";

export function useMe(initialData?: Me) { return useQuery({ queryKey: keys.me, queryFn: getMe, retry: false, initialData }); }
export function useChannels() { return useQuery({ queryKey: keys.channels, queryFn: () => api.get<Channel[]>("/channels") }); }
/** Loads only the channel a detail page shows, instead of the whole list. */
export function useChannel(id: string) {
  return useQuery({ queryKey: keys.channel(id), queryFn: () => api.get<Channel>(`/channels/${id}`), enabled: Boolean(id) });
}
/** One request for every channel's stats, used by the dashboard summary. */
export function useStatsOverview(enabled = true) {
  return useQuery({ queryKey: keys.statsOverview, queryFn: () => api.get<ChannelStatsSummary>("/channels/stats"), enabled });
}
export function useActivePredictions() { return useQuery({ queryKey: keys.active, queryFn: () => api.get<Prediction[]>("/predictions/active") }); }
export function useSettings() { return useQuery({ queryKey: keys.settings, queryFn: () => api.get<Settings>("/settings") }); }
export function useBilling() { return useQuery({ queryKey: keys.billing, queryFn: () => api.get<BillingStatus>("/billing/status") }); }
export function useQrPayments() { return useQuery({ queryKey: keys.qrPayments, queryFn: () => api.get<{ items: QrPayment[] }>("/billing/qr-payments") }); }
/** `placeholderData` keeps the previous page visible while the next one loads. */
export function useVotes(query: string) {
  return useQuery({ queryKey: keys.votes(query), queryFn: () => api.get<Page<Vote>>(`/votes${query}`), placeholderData: keepPreviousData });
}
export function useHistory(id: string, query: string) {
  return useQuery({ queryKey: keys.history(id, query), queryFn: () => api.get<Page<Prediction>>(`/channels/${id}/predictions${query}`), enabled: Boolean(id), placeholderData: keepPreviousData });
}
export function useStats(id: string) {
  return useQuery({ queryKey: keys.stats(id), queryFn: () => api.get<Record<string, number | string | null>>(`/channels/${id}/stats`), enabled: Boolean(id) });
}
export function useRefreshAll() {
  const cache = useQueryClient();
  return useCallback(() => cache.invalidateQueries(), [cache]);
}
