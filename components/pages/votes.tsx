"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { messageForError } from "@/lib/api/errors";
import { useChannels, useVotes } from "@/lib/api/hooks";
import type { Page, Vote } from "@/lib/api/types";
import { Pagination } from "@/components/pagination";
import {
  Badge,
  Button,
  Empty,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { VotesSkeleton } from "@/components/skeletons";
import {
  ALL_FILTER,
  ErrorBox,
  Heading,
  PAGE_SIZE,
} from "@/components/pages/shared";

function VotesPage() {
  const channels = useChannels();
  const [status, setStatus] = useState("");
  const [channelId, setChannelId] = useState("");
  const [page, setPage] = useState(1);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (status) params.set("status", status);
    if (channelId) params.set("channel_id", channelId);
    return `?${params}`;
  }, [status, channelId, page]);
  const votes = useVotes(query);
  if (votes.isLoading && !votes.data) return <VotesSkeleton />;
  const items = votes.data?.items ?? [];
  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }
  function goToPage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0 });
  }
  /** Pulls every page so the CSV contains the whole filtered history. */
  async function exportCsv() {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (channelId) params.set("channel_id", channelId);
      params.set("limit", "100");
      const all: Vote[] = [];
      let current = 1;
      let pages = 1;
      do {
        params.set("page", String(current));
        const data = await api.get<Page<Vote>>(`/votes?${params}`);
        all.push(...data.items);
        pages = data.pages;
        current += 1;
      } while (current <= pages);
      const rows = [
        [
          "Channel",
          "Prediction",
          "Outcome",
          "Winning outcome",
          "Points placed",
          "Status",
          "Points change",
          "Date",
        ],
        ...all.map((v) => [
          v.channel_slug ?? "",
          v.prediction_title ?? "",
          v.outcome_title ?? v.outcome_id,
          v.status === "won" || v.status === "lost"
            ? (v.winning_outcome_title ?? "")
            : "",
          String(v.amount_placed ?? v.amount_requested),
          v.status,
          String(v.points_delta ?? ""),
          v.created_at,
        ]),
      ];
      const blob = new Blob(
        [
          rows
            .map((row) =>
              row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
            )
            .join("\n"),
        ],
        { type: "text/csv" },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "tally-votes.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  return (
    <>
      <Heading
        title="Votes"
        description="Every vote placed for your account."
        action={
          <Button
            variant="secondary"
            onClick={() => void exportCsv()}
            disabled={!items.length}
          >
            <ArrowDownToLine size={16} />
            Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Status
          <Select
            value={status || ALL_FILTER}
            onValueChange={(value) =>
              changeFilter(setStatus, value === ALL_FILTER ? "" : value)
            }
          >
            <SelectTrigger aria-label="Filter votes by status" className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
              {[
                "placed",
                "won",
                "lost",
                "failed",
                "refunded",
                "unknown_outcome",
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Channel
          <Select
            value={channelId || ALL_FILTER}
            onValueChange={(value) =>
              changeFilter(setChannelId, value === ALL_FILTER ? "" : value)
            }
          >
            <SelectTrigger
              aria-label="Filter votes by channel"
              className="w-44"
            >
              <SelectValue placeholder="All channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All channels</SelectItem>
              {channels.data?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.slug}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {votes.isError && !votes.data ? (
        <ErrorBox error={votes.error} retry={() => void votes.refetch()} />
      ) : items.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                {[
                  "Channel",
                  "Prediction",
                  "Voted",
                  "Winning outcome",
                  "Points",
                  "Status",
                  "Change",
                  "When",
                ].map((x) => (
                  <th key={x} className="px-4 py-3 font-medium">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((v) => (
                <tr key={v.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    {v.channel_slug ?? "—"}
                  </td>
                  <td className="min-w-44 px-4 py-3">
                    {v.prediction_title ??
                      (v.prediction_id ? `#${v.prediction_id}` : "—")}
                  </td>
                  <td className="px-4 py-3">
                    {v.outcome_title ?? v.outcome_id}
                  </td>
                  <td className="px-4 py-3">
                    {v.status === "won" || v.status === "lost"
                      ? (v.winning_outcome_title ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {v.amount_placed ?? v.amount_requested}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        v.status === "won"
                          ? "bg-win/15 text-win"
                          : v.status === "lost"
                            ? "bg-loss/15 text-loss"
                            : ""
                      }
                    >
                      {v.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {v.points_delta == null ? (
                      "—"
                    ) : (
                      <span
                        className={
                          v.points_delta > 0
                            ? "text-win"
                            : v.points_delta < 0
                              ? "text-loss"
                              : undefined
                        }
                      >
                        {v.points_delta > 0
                          ? `+${v.points_delta}`
                          : v.points_delta}
                      </span>
                    )}
                  </td>
                  <td
                    className="whitespace-nowrap px-4 py-3 text-muted-foreground"
                    title={format(new Date(v.created_at), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(v.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="No votes yet"
          detail="Your votes will appear here as your channels run predictions."
        />
      )}
      <Pagination
        page={votes.data?.page ?? page}
        pages={votes.data?.pages ?? 0}
        total={votes.data?.total ?? 0}
        limit={votes.data?.limit ?? PAGE_SIZE}
        onPage={goToPage}
      />
    </>
  );
}
export { VotesPage };
