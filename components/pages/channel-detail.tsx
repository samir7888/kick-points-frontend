"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { messageForError } from "@/lib/api/errors";
import { useChannel, useHistory, useStats } from "@/lib/api/hooks";
import type { Prediction } from "@/lib/api/types";
import { Pagination } from "@/components/pagination";
import { SplitBar } from "@/components/split-bar";
import { Badge, Button, Card, Empty, Switch } from "@/components/ui";
import { ChannelDetailSkeleton } from "@/components/skeletons";
import { ErrorBox, Heading, PAGE_SIZE } from "@/components/pages/shared";

function ChannelDetail({ id }: { id: string }) {
  const channelQuery = useChannel(id);
  const channel = channelQuery.data;
  const stats = useStats(id);
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState(search.get("status") ?? "");
  const [voted, setVoted] = useState(search.get("voted") === "true");
  const [page, setPage] = useState(() =>
    Math.max(1, Number(search.get("page")) || 1),
  );
  const [selected, setSelected] = useState<
    Prediction | null
  >(null);
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(PAGE_SIZE));
    if (status) p.set("status", status);
    if (voted) p.set("voted", "true");
    return `?${p}`;
  }, [status, voted, page]);
  const history = useHistory(id, query);
  useEffect(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (voted) p.set("voted", "true");
    if (page > 1) p.set("page", String(page));
    router.replace(`/channels/${id}${p.size ? `?${p}` : ""}`, {
      scroll: false,
    });
  }, [id, status, voted, page, router]);
  if (
    channelQuery.isLoading ||
    stats.isLoading ||
    (history.isLoading && !history.data)
  )
    return <ChannelDetailSkeleton />;
  if (!channel)
    return (
      <>
        <Heading title="Channel not found" />
        <Link href="/channels">Back to channels</Link>
      </>
    );
  const items = history.data?.items ?? [];
  function resetHistory(statusValue: string, votedValue: boolean) {
    setStatus(statusValue);
    setVoted(votedValue);
    setPage(1);
  }
  function goToPage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0 });
  }
  async function showDetails(predictionId: number) {
    try {
      setSelected(
        await api.get<Prediction>(
          `/channels/${id}/predictions/${predictionId}`,
        ),
      );
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  return (
    <>
      <Heading
        title={channel.slug}
        description="Prediction activity starts when this channel is enabled."
        action={
          <a
            href={`https://kick.com/${channel.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary">
              Open on Kick <ExternalLink size={15} />
            </Button>
          </a>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Votes placed", "votes_placed"],
          ["Won", "votes_won"],
          ["Win rate", "win_rate"],
          ["Net points", "net_points"],
        ].map(([label, key]) => (
          <Card key={key} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {stats.data?.[key] ?? 0}
              {key === "win_rate" ? "%" : ""}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-5">
        <h2 className="font-semibold">Resolved votes</h2>
        <div
          className="mt-4 flex h-4 overflow-hidden rounded-full bg-muted"
          aria-label={`${stats.data?.votes_won ?? 0} wins and ${stats.data?.votes_lost ?? 0} losses`}
        >
          {Number(stats.data?.votes_won ?? 0) +
            Number(stats.data?.votes_lost ?? 0) >
            0 && (
            <>
              <span
                className="bg-win"
                style={{
                  width: `${(Number(stats.data?.votes_won ?? 0) / (Number(stats.data?.votes_won ?? 0) + Number(stats.data?.votes_lost ?? 0))) * 100}%`,
                }}
              />
              <span className="bg-loss" style={{ flex: 1 }} />
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {stats.data?.votes_won ?? 0} won · {stats.data?.votes_lost ?? 0} lost
        </p>
      </Card>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Status{" "}
          <select
            value={status}
            onChange={(e) => resetHistory(e.target.value, voted)}
            className="ml-2 h-9 rounded-lg border border-border bg-surface px-2"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={voted}
            onChange={(value) => resetHistory(status, value)}
            label="Only predictions I voted in"
          />
          Only predictions I voted in
        </label>
      </div>
      <section className="mt-4 space-y-3">
        {history.isError && !history.data ? (
          <ErrorBox
            error={history.error}
            retry={() => void history.refetch()}
          />
        ) : items.length ? (
          items.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <button
                    className="text-left font-semibold hover:text-primary"
                    onClick={() => void showDetails(p.id)}
                  >
                    {p.title}
                  </button>
                  <p
                    className="mt-1 text-xs text-muted-foreground"
                    title={format(new Date(p.opened_at), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(p.opened_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Badge>{p.state}</Badge>
              </div>
              <div className="mt-4">
                <SplitBar
                  outcomes={p.outcomes}
                  selected={p.my_vote?.outcome_id}
                  winner={p.winning_outcome_id}
                />
              </div>
              {p.my_vote && (
                <p className="mt-4 inline-flex rounded-lg bg-muted px-3 py-2 text-xs">
                  Your vote: {p.my_vote.outcome_title ?? p.my_vote.outcome_id} ·{" "}
                  {p.my_vote.amount_placed ?? p.my_vote.amount_requested} points
                  {p.my_vote.points_delta !== null
                    ? ` · ${p.my_vote.points_delta > 0 ? "+" : ""}${p.my_vote.points_delta} points`
                    : ""}
                </p>
              )}
            </Card>
          ))
        ) : (
          <Empty
            title="No prediction history yet"
            detail="Predictions will show up here after your channel runs one. History starts when you add a channel."
          />
        )}
        <Pagination
          page={history.data?.page ?? page}
          pages={history.data?.pages ?? 0}
          total={history.data?.total ?? 0}
          limit={history.data?.limit ?? PAGE_SIZE}
          onPage={goToPage}
        />
      </section>
      <Dialog.Root
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-border bg-surface p-6 shadow-float focus:outline-none">
            <Dialog.Title className="font-display text-2xl font-semibold">
              {selected?.title ?? "Prediction details"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Details collected for this channel.
            </Dialog.Description>
            <div className="mt-5">
              <SplitBar
                outcomes={selected?.outcomes}
                selected={selected?.my_vote?.outcome_id}
                winner={selected?.winning_outcome_id}
              />
            </div>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
export { ChannelDetail };
