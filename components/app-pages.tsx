"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownToLine,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { messageForError, ApiError } from "@/lib/api/errors";
import {
  useActivePredictions,
  useBilling,
  useChannel,
  useChannels,
  useHistory,
  useMe,
  useQrPayments,
  useRefreshAll,
  useSettings,
  useStats,
  useStatsOverview,
  useVotes,
} from "@/lib/api/hooks";
import { amountSchema, slugSchema } from "@/lib/validation";
import { env } from "@/lib/env";
import type { BillingStatus, Channel, Page, Settings, Vote } from "@/lib/api/types";
import { SplitBar } from "@/components/split-bar";
import { Pagination } from "@/components/pagination";
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Loading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/components/ui";
import {
  BillingSkeleton,
  CardGridSkeleton,
  ChannelDetailSkeleton,
  DashboardSkeleton,
  SettingsSkeleton,
  StatCardsSkeleton,
  VotesSkeleton,
} from "@/components/skeletons";
import { KickAuthButton } from "@/components/kick-auth-button";

/** Rows per page for the paginated lists (`/votes` and channel history). */
const PAGE_SIZE = 10;

/** Sentinel value for "no filter" in Select menus (Radix rejects empty strings). */
const ALL_FILTER = "all";

function ErrorBox({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div
      className="rounded-xl border border-loss/30 bg-loss/10 p-4 text-sm"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <CircleAlert size={18} />
        <div className="flex-1">
          <p>{messageForError(error)}</p>
          <Button variant="ghost" className="mt-2 px-0" onClick={retry}>
            <RefreshCw size={14} />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
function useRefresh() {
  return useRefreshAll();
}

function Dashboard() {
  const { data: me } = useMe();
  const channels = useChannels();
  const active = useActivePredictions();
  const overview = useStatsOverview((channels.data?.length ?? 0) > 0);
  const refresh = useRefresh();
  if (channels.isLoading || active.isLoading) return <DashboardSkeleton />;
  if (channels.isError)
    return (
      <ErrorBox error={channels.error} retry={() => void channels.refetch()} />
    );
  const channelList = channels.data ?? [];
  return (
    <>
      <Heading
        title="Your dashboard"
        description="A quick view of your channels and recent prediction activity."
        action={
          <Link href="/channels">
            <Button>
              <Plus size={16} />
              Add channel
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {me?.plan === "premium" ? "Premium" : "Free"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {me?.channels_used} of {me?.channel_limit} channels used
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Channels watching</p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {channelList.filter((c) => c.enabled).length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enabled channels in your list
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Voting status</p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {me?.voting_paused ? "Paused" : "Ready"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {me?.token_health === "healthy"
              ? "Kick account connected"
              : "Reconnect Kick to continue"}
          </p>
        </Card>
      </div>
      {!channelList.length ? (
        <div className="mt-6">
          <Empty
            title="Add your first channel"
            detail="Choose a channel to start tracking its predictions and your votes."
            action={
              <Link href="/channels">
                <Button>Add a channel</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="mt-9">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold">
                Open now
              </h2>
            </div>
            {active.isError ? (
              <ErrorBox
                error={active.error}
                retry={() => void active.refetch()}
              />
            ) : active.data?.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {active.data.map((prediction) => (
                  <Card key={prediction.id} className="p-5">
                    <p className="text-xs text-muted-foreground">
                      <a
                        href={`https://kick.com/${prediction.channel_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground underline"
                      >
                        {prediction.channel_slug}
                      </a>{" "}
                      · Open prediction
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold">
                      {prediction.title}
                    </h3>
                    <div className="mt-4">
                      <SplitBar
                        outcomes={prediction.outcomes}
                        selected={prediction.my_vote?.outcome_id}
                      />
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {prediction.closes_at
                        ? `Closes ${formatDistanceToNow(new Date(prediction.closes_at), { addSuffix: true })}`
                        : "Close time not available"}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty
                title="No open predictions right now"
                detail="Open predictions will show here when they’re detected for your enabled channels."
              />
            )}
          </section>
          <section className="mt-9">
            <h2 className="mb-4 font-display text-2xl font-semibold">
              Your channels
            </h2>
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              {channelList.slice(0, 6).map((ch) => (
                <Link
                  href={`/channels/${ch.id}`}
                  key={ch.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <span>
                    <span className="font-semibold">{ch.slug}</span>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {ch.active_prediction?.title ?? "No active prediction"}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {ch.effective_amount} points
                  </span>
                </Link>
              ))}
            </div>
          </section>
          <section className="mt-9">
            <h2 className="mb-4 font-display text-2xl font-semibold">
              Recent results
            </h2>
            {overview.isError ? (
              <ErrorBox
                error={overview.error}
                retry={() => void overview.refetch()}
              />
            ) : !overview.data ? (
              <StatCardsSkeleton count={3} />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Votes placed", overview.data.totals.votes_placed],
                  ["Won", overview.data.totals.votes_won],
                  ["Net points", overview.data.totals.net_points],
                ].map(([label, value]) => (
                  <Card key={String(label)} className="p-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                      {value}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <button className="sr-only" onClick={() => refresh()}>
        Refresh activity
      </button>
    </>
  );
}

function ChannelsPage() {
  const channels = useChannels();
  const me = useMe();
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [amount, setAmount] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [bulk, setBulk] = useState(false);
  const refresh = useRefresh();
  async function addChannel(event: React.FormEvent) {
    event.preventDefault();
    const valid = slugSchema.safeParse(slug);
    if (!valid.success)
      return toast.error(
        valid.error.issues[0]?.message ?? "Enter a valid channel name.",
      );
    const parsedAmount = amount ? amountSchema.safeParse(amount) : undefined;
    if (parsedAmount && !parsedAmount.success)
      return toast.error(
        parsedAmount.error.issues[0]?.message ?? "Enter a valid point amount.",
      );
    try {
      await api.post("/channels", {
        slug: valid.data,
        ...(parsedAmount?.success ? { vote_amount: parsedAmount.data } : {}),
      });
      toast.success("Channel added");
      setSlug("");
      setAmount("");
      setShowAdd(false);
      await refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 402)
        toast.error(
          "You’ve reached the channel limit. Upgrade to Premium for up to 6 channels.",
          {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/billing"),
            },
          },
        );
      else toast.error(messageForError(error));
    }
  }
  async function update(
    ch: Channel,
    payload: { vote_amount?: number | null; enabled?: boolean },
  ) {
    try {
      await api.patch(`/channels/${ch.id}`, payload);
      toast.success(
        payload.vote_amount === null
          ? "Channel now uses your default amount"
          : payload.enabled === undefined
            ? "Amount saved"
            : payload.enabled
              ? "Voting resumed"
              : "Voting paused",
      );
      await refresh();
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  async function remove(ch: Channel) {
    if (
      !window.confirm(
        `Remove ${ch.slug}? Its prediction history will stay in your account.`,
      )
    )
      return;
    try {
      await api.delete(`/channels/${ch.id}`);
      toast.success("Channel removed");
      await refresh();
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  async function saveBulk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items =
      channels.data?.map((ch) => {
        const input = event.currentTarget.elements.namedItem(
          `amount-${ch.id}`,
        ) as HTMLInputElement;
        const value = input.value.trim();
        return { id: ch.id, vote_amount: value ? Number(value) : null };
      }) ?? [];
    if (
      items.some(
        (i) =>
          i.vote_amount !== null &&
          !amountSchema.safeParse(i.vote_amount).success,
      )
    )
      return toast.error(
        `Each amount must be at least ${env.minVoteAmount} points.`,
      );
    try {
      await api.put("/channels/amounts", { items });
      toast.success("Amounts saved");
      setBulk(false);
      await refresh();
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  if (channels.isLoading) return <CardGridSkeleton />;
  if (channels.isError)
    return (
      <ErrorBox error={channels.error} retry={() => void channels.refetch()} />
    );
  const list = channels.data ?? [];
  return (
    <>
      <Heading
        title="Channels"
        description={`${me.data?.plan === "premium" ? "Premium" : "Free"} plan · ${list.length} of ${me.data?.channel_limit ?? 1} channels used`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setBulk(!bulk)}>
              Edit all amounts
            </Button>
            <Button onClick={() => setShowAdd(!showAdd)}>
              <Plus size={16} />
              Add channel
            </Button>
          </div>
        }
      />
      {showAdd && (
        <Card className="mb-5 p-5">
          <form
            onSubmit={addChannel}
            className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
          >
            <label className="sr-only" htmlFor="slug">
              Channel name
            </label>
            <Input
              id="slug"
              placeholder="Channel name"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={50}
            />
            <label className="sr-only" htmlFor="add-amount">
              Vote amount (optional)
            </label>
            <Input
              id="add-amount"
              type="number"
              min={env.minVoteAmount}
              placeholder="Default amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button type="submit">Add channel</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Use the channel name only. Leave the amount blank to use your
            default.
          </p>
        </Card>
      )}
      {bulk && (
        <Card className="mb-5 p-5">
          <form onSubmit={saveBulk}>
            <h2 className="mb-4 font-semibold">Edit all channel amounts</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((ch) => (
                <label
                  key={ch.id}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  {ch.slug}
                  <Input
                    name={`amount-${ch.id}`}
                    type="number"
                    min={env.minVoteAmount}
                    defaultValue={ch.vote_amount ?? ""}
                    placeholder="Use default"
                    className="max-w-40"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBulk(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save all amounts</Button>
            </div>
          </form>
        </Card>
      )}
      {!list.length ? (
        <Empty
          title="No channels yet"
          detail="Add a channel to start tracking its predictions and automatic votes."
          action={
            <Button onClick={() => setShowAdd(true)}>Add a channel</Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((ch) => (
            <Card key={ch.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${ch.live ? "bg-win" : "bg-muted-foreground/40"}`}
                    />
                    <Link
                      href={`/channels/${ch.id}`}
                      className={`font-display text-xl font-semibold hover:text-primary ${ch.live ? "text-win" : ""}`}
                    >
                      {ch.slug}
                    </Link>
                  </div>
                </div>
                <Switch
                  checked={ch.enabled}
                  onChange={(enabled) => void update(ch, { enabled })}
                  label={`${ch.enabled ? "Pause" : "Resume"} voting for ${ch.slug}`}
                />
              </div>
              <div className="my-4 rounded-lg bg-muted/70 p-3">
                <p className="text-xs text-muted-foreground">
                  Active prediction
                </p>
                <p className="mt-1 text-sm">
                  {ch.active_prediction?.title ?? "No open prediction"}
                </p>
                {ch.points_balance != null && (
                  <p className="mt-2 text-xs">
                    <span className="text-muted-foreground">Points:</span>{" "}
                    <span className="font-semibold tabular-nums">
                      {ch.points_balance.toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
              {ch.paused_reason && (
                <p className="mb-3 text-xs text-amber">
                  Paused: {ch.paused_reason.replaceAll("_", " ")}
                </p>
              )}
              <div className="flex items-end gap-2">
                <label className="flex-1 text-xs text-muted-foreground">
                  Vote amount
                  <Input
                    aria-label={`${ch.slug} vote amount`}
                    type="number"
                    min={env.minVoteAmount}
                    defaultValue={ch.vote_amount ?? ""}
                    placeholder={`${ch.effective_amount} default`}
                    onBlur={(e) => {
                      const text = e.target.value;
                      const value = text ? Number(text) : null;
                      if (
                        value !== ch.vote_amount &&
                        (value === null ||
                          amountSchema.safeParse(value).success)
                      )
                        void update(ch, { vote_amount: value });
                    }}
                  />
                </label>
                <Button
                  variant="secondary"
                  onClick={() => void update(ch, { vote_amount: null })}
                >
                  Use default
                </Button>
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-3">
                <a
                  href={`https://kick.com/${ch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground underline"
                >
                  Open Kick <ExternalLink size={12} />
                </a>
                <Button
                  variant="ghost"
                  className="text-loss"
                  onClick={() => void remove(ch)}
                >
                  <Trash2 size={14} />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

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
    import("@/lib/api/types").Prediction | null
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
        await api.get<import("@/lib/api/types").Prediction>(
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
                  Your vote: {p.my_vote.outcome_id} ·{" "}
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

function SettingsPage() {
  const query = useSettings();
  const refresh = useRefresh();
  const [form, setForm] = useState<Settings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  useEffect(() => {
    if (query.data && !dirty) setForm(query.data);
  }, [query.data, dirty]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(() => {
    const guardNavigation = (event: MouseEvent) => {
      if (!dirty) return;
      const link = (event.target as HTMLElement).closest("a[href]");
      if (!link || link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm("Discard your unsaved settings?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", guardNavigation, true);
    return () => document.removeEventListener("click", guardNavigation, true);
  }, [dirty]);
  if (query.isLoading || !form) return <SettingsSkeleton />;
  async function save() {
    if (!form) return;
    const values = {
      ...form,
      kick_session_token: sessionToken.trim() || undefined,
    };
    const valid = amountSchema.safeParse(values.default_vote_amount);
    if (!valid.success)
      return toast.error(
        valid.error.issues[0]?.message ?? "Enter a valid amount.",
      );
    try {
      const result = await api.put<Settings>("/settings", values);
      setSessionToken("");
      setDirty(false);
      const pasted = Boolean(values.kick_session_token);
      if (pasted && result.kick_session_token_valid === true)
        toast.success("Kick token verified — automatic voting is ready.");
      else if (pasted && result.kick_session_token_valid === false)
        toast.error(
          result.kick_session_token_message ??
            "That Kick token was rejected. Copy a fresh Authorization header from kick.com and try again.",
        );
      else if (pasted)
        toast.warning(
          "Couldn’t verify the Kick token right now. It was saved — we’ll test it when voting starts.",
        );
      else toast.success("Settings saved");
      await refresh();
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  async function removeVotingToken() {
    try {
      await api.put("/settings", { kick_session_token: "" });
      setSessionToken("");
      setDirty(false);
      toast.success("Voting token removed");
      await refresh();
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setDirty(true);
  }
  return (
    <>
      <Heading
        title="Settings"
        description="Choose how automatic votes should work."
      />
      {query.isError ? (
        <ErrorBox error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Card className="max-w-2xl divide-y divide-border p-5">
          <label className="block pb-5 text-sm font-medium">
            Default vote amount{" "}
            <span className="mt-2 block text-xs font-normal text-muted-foreground">
              Used by channels set to “Use my default”. Minimum{" "}
              {env.minVoteAmount} points.
            </span>
            <Input
              type="number"
              min={env.minVoteAmount}
              value={form.default_vote_amount}
              onChange={(e) =>
                set("default_vote_amount", Number(e.target.value))
              }
              className="mt-3 max-w-48"
            />
          </label>
          <div className="flex items-center justify-between py-5">
            <div>
              <p className="text-sm font-medium">
                Use the minimum when I don’t have enough points
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Place a smaller vote rather than skipping when your balance is
                low.
              </p>
            </div>
            <Switch
              checked={form.fallback_to_min}
              onChange={(value) => set("fallback_to_min", value)}
              label="Use minimum points when balance is low"
            />
          </div>
          <div className="flex items-center justify-between py-5">
            <div>
              <p className="text-sm font-medium">Pause all voting</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your channels stay connected; automatic votes stop until you
                resume.
              </p>
            </div>
            <Switch
              checked={form.paused}
              onChange={(value) => set("paused", value)}
              label="Pause all voting"
            />
          </div>
          <div className="py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Kick voting token</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.kick_session_token_set
                    ? "Connected — votes are placed with your Kick account."
                    : "Not set — automatic votes will fail until you add it."}
                </p>
              </div>
              {form.kick_session_token_set && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void removeVotingToken()}
                >
                  Remove
                </Button>
              )}
            </div>
            <Input
              type="password"
              autoComplete="off"
              placeholder="Paste the Authorization header from kick.com (starts with “Bearer”)"
              value={sessionToken}
              onChange={(e) => {
                setSessionToken(e.target.value);
                setDirty(true);
              }}
              className="mt-3"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Kick requires a browser session token to place votes. Open
              kick.com while signed in, press F12 → Network, click any kick.com
              API request, and copy its{" "}
              <code className="rounded bg-muted/70 px-1">Authorization</code>{" "}
              header value. We check it with Kick the moment you save.
            </p>
          </div>
        </Card>
      )}
      {dirty && (
        <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-border bg-surface p-3 md:bottom-0 md:left-[228px]">
          <div className="mx-auto flex max-w-7xl justify-end gap-2 px-3">
            <Button
              variant="secondary"
              onClick={() => {
                setForm(query.data ?? form);
                setSessionToken("");
                setDirty(false);
              }}
            >
              Discard changes
            </Button>
            <Button onClick={() => void save()}>Save settings</Button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Manual QR / bank-transfer payment method for people who can't pay by card.
 * The user scans the dashboard QR, transfers, uploads a screenshot of the
 * transfer, and we hold it as "pending" until an admin confirms it on
 * `/payments` (which grants one month of Premium).
 */
function BillingQrPanel() {
  const query = useQrPayments();
  const billing = useBilling();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const premiumNoticed = useRef(false);

  const isPremium = billing.data?.plan === "premium";
  const items = query.data?.items ?? [];
  const hasPending = items.some((item) => item.status === "pending");
  // Only trust the server: once a submission is decided (confirmed/rejected) it
  // must stop counting as "awaiting review". Previously an optimistic session
  // flag kept the banner showing forever after a rejection.
  const awaitingReview = hasPending;

  // Tell an already-Premium account they don't need to pay again, once.
  useEffect(() => {
    if (billing.isLoading) return;
    if (isPremium && !premiumNoticed.current) {
      premiumNoticed.current = true;
      toast.warning("You already have a Premium account.");
    } else if (!isPremium) {
      premiumNoticed.current = false;
    }
  }, [isPremium, billing.isLoading]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isPremium) {
      toast.warning("You already have a Premium account.");
      return;
    }
    if (!file) {
      toast.error("Choose the screenshot of your transfer first.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proof", file);
      const response = await fetch("/api/v1/billing/qr-payments", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const root =
          typeof body === "object" && body !== null
            ? (body as { error?: { code?: string; message?: string } })
            : {};
        throw new ApiError(
          response.status,
          root.error?.code ?? "REQUEST_FAILED",
          root.error?.message ?? `Upload failed (${response.status}).`,
        );
      }
      toast.success("Payment proof submitted");
      setFile(null);
      await query.refetch();
    } catch (error) {
      toast.error(messageForError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (isPremium) {
    return (
      <Card className="mt-5 max-w-2xl p-6" id="pay-with-qr">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-win" aria-hidden />
          <h2 className="font-display text-xl font-semibold">
            You’re on Premium
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account already has Premium, so there’s no need to send another
          payment. Manage your plan from the billing card above.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-5 max-w-2xl p-6" id="pay-with-qr">
      <div className="flex items-center gap-2">
        <QrCode size={18} className="text-primary" aria-hidden />
        <h2 className="font-display text-xl font-semibold">
          Pay with QR (Nepal)
        </h2>
        {awaitingReview && <Badge>Awaiting confirmation</Badge>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Don’t have an international card? Scan the QR with your bank app,
        transfer the equivalent of{" "}
        <span className="font-semibold text-foreground">
          NPR {env.premiumPrice} / month
        </span>
        , then upload the transfer screenshot below. We’ll verify it and switch
        you to Premium for one month.
      </p>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto shrink-0 sm:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/qr.png"
            alt="Bank account QR code made by the billing page"
            className="h-44 w-44 rounded-xl border border-border bg-white p-2"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Scan to pay
          </p>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-3">
          <label className="block text-sm">
            <span className="font-medium">Payment proof</span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              A screenshot of the completed transfer (PNG, JPG, WebP or GIF,
              under 8 MB).
            </span>
            <span
              className="mt-2 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 text-sm font-medium hover:bg-muted"
            >
              <UploadCloud size={16} aria-hidden />
              {file ? file.name : "Choose a screenshot"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                aria-label="Choose a screenshot of your transfer"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </span>
          </label>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Uploading proof…" : "I’ve paid — Submit proof"}
          </Button>
        </form>
      </div>

      {awaitingReview && (
        <div
          className="mt-5 flex items-start gap-3 rounded-xl bg-amber/10 p-4 text-sm"
          role="status"
          aria-live="polite"
        >
          <RefreshCw size={18} className="mt-0.5 animate-spin text-amber" aria-hidden />
          <div>
            <p className="font-semibold">Checking your payment…</p>
            <p className="mt-1 text-muted-foreground">
              We received your proof. It’s being checked and your account is
              switched to Premium as soon as it’s confirmed — usually within a
              few hours. Nothing else is needed from you.
            </p>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium text-muted-foreground">
            Recent submissions
          </p>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="min-w-0 text-muted-foreground">
                  {item.created_at
                    ? formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })
                    : "Submitted"}
                  {item.reference ? ` · ${item.reference}` : ""}
                </span>
                <span>
                  {item.status === "pending" && (
                    <Badge className="bg-amber/15 text-amber">Checking…</Badge>
                  )}
                  {item.status === "confirmed" && (
                    <Badge className="bg-win/15 text-win">
                      <CheckCircle2 size={12} aria-hidden />
                      Confirmed
                    </Badge>
                  )}
                  {item.status === "rejected" && (
                    <Badge className="bg-loss/15 text-loss">Rejected</Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {query.isError && (
        <p className="mt-4 text-xs text-loss" role="alert">
          Couldn’t load your previous submissions —{" "}
          <button
            className="font-semibold underline"
            onClick={() => void query.refetch()}
          >
            try again
          </button>
          .
        </p>
      )}
    </Card>
  );
}

function BillingPage() {
  const billing = useBilling();
  async function checkout() {
    try {
      const result = await api.post<{ checkout_url: string }>(
        "/billing/checkout",
      );
      window.location.assign(result.checkout_url);
    } catch (error) {
      toast.error(
        `${messageForError(error)} Contact support if the problem continues.`,
      );
    }
  }
  async function portal() {
    try {
      const result = await api.post<{ portal_url: string | null }>(
        "/billing/portal",
      );
      if (result.portal_url) window.location.assign(result.portal_url);
      else toast.message("No active subscription to manage.");
    } catch (error) {
      toast.error(
        `${messageForError(error)} Contact support if the problem continues.`,
      );
    }
  }
  if (billing.isLoading) return <BillingSkeleton />;
  return (
    <>
      <Heading title="Billing" description="Your plan and payment details." />
      {billing.isError ? (
        <ErrorBox error={billing.error} retry={() => void billing.refetch()} />
      ) : (
        <Card className="max-w-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <Badge>
                {billing.data?.plan === "premium" ? "Premium" : "Free plan"}
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold">
                {billing.data?.plan === "premium"
                  ? "Up to 6 channels"
                  : "1 channel"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {billing.data?.status.replaceAll("_", " ")}
                {billing.data?.premium_until
                  ? ` · Premium until ${format(new Date(billing.data.premium_until), "PPP")}`
                  : ""}
              </p>
              {billing.data?.status === "past_due" && (
                <p className="mt-2 max-w-lg text-sm">
                  Your renewal needs attention. Premium access may be temporary
                  while payment is resolved; update your payment details to keep
                  your channels.
                </p>
              )}
              {billing.data?.cancel_at_period_end && (
                <p className="mt-2 text-sm">
                  Your plan cancels at the end of this billing period.
                </p>
              )}
            </div>
            <p className="font-display text-2xl font-semibold">
              ${(billing.data?.price_display ?? env.premiumPrice).toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / month
              </span>
            </p>
          </div>
          <div className="mt-7 flex gap-3">
            {billing.data?.plan === "premium" ? (
              <Button variant="secondary" onClick={() => void portal()}>
                Manage billing
              </Button>
            ) : (
              <Button onClick={() => void checkout()}>
                Upgrade to Premium
              </Button>
            )}
            <Link href="/pricing">
              <Button variant="ghost">Compare plans</Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Checkout is hosted by Dodo Payments. Your plan changes only after
            payment confirmation.
          </p>
        </Card>
      )}
      <BillingQrPanel />
    </>
  );
}

/**
 * Landing page for Dodo's checkout `return_url`. Dodo sends every outcome
 * (success and failure) here, so a failed `status` is forwarded to `/failed`.
 * Premium is never granted from this redirect: we only poll the server, which
 * reflects the signature-verified webhook.
 */
function BillingSuccess() {
  const search = useSearchParams();
  const router = useRouter();
  const refresh = useRefresh();
  const status = (search.get("status") ?? "").toLowerCase();
  const failedStatus = ["failed", "expired", "cancelled", "canceled"].includes(
    status,
  );
  const [phase, setPhase] = useState<"confirming" | "active" | "pending">(
    "confirming",
  );

  useEffect(() => {
    if (failedStatus) {
      router.replace(status ? `/failed?status=${status}` : "/failed");
    }
  }, [failedStatus, router, status]);

  useEffect(() => {
    if (failedStatus) return;
    let cancelled = false;
    const deadline = Date.now() + 60_000;
    async function check(): Promise<boolean> {
      try {
        const result = await api.get<BillingStatus>("/billing/status");
        if (cancelled) return true;
        if (result.plan === "premium") {
          setPhase("active");
          toast.success("Premium is active");
          await refresh();
          return true;
        }
        if (Date.now() > deadline) {
          setPhase("pending");
          return true;
        }
      } catch {
        if (!cancelled) setPhase("pending");
        return true;
      }
      return false;
    }
    void check();
    const timer = setInterval(() => {
      void check().then((done) => {
        if (done) clearInterval(timer);
      });
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [failedStatus, refresh]);

  if (failedStatus) return <Loading label="Checking your payment result" />;

  return (
    <>
      <Heading
        title={
          phase === "active" ? "Premium is active" : "Confirming your payment"
        }
        description="Premium unlocks up to 6 channels."
      />
      <Card className="max-w-xl p-6">
        {phase === "confirming" && (
          <div
            className="flex items-start gap-3"
            role="status"
            aria-live="polite"
          >
            <RefreshCw size={18} className="mt-0.5 animate-spin" aria-hidden />
            <div>
              <p className="font-semibold">Confirming your payment…</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This usually takes a few seconds. You can stay on this page.
              </p>
            </div>
          </div>
        )}
        {phase === "active" && (
          <div
            className="flex items-start gap-3"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 size={20} className="mt-0.5 text-win" aria-hidden />
            <div>
              <p className="font-semibold">Thanks for upgrading.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can now add up to 6 channels. Your plan renews monthly until
                you cancel.
              </p>
            </div>
          </div>
        )}
        {phase === "pending" && (
          <div
            className="flex items-start gap-3"
            role="status"
            aria-live="polite"
          >
            <CircleAlert size={20} className="mt-0.5 text-amber" aria-hidden />
            <div>
              <p className="font-semibold">Your payment is still processing.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your plan updates as soon as it is confirmed. Nothing else is
                needed from you.
              </p>
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/channels">
            <Button>Go to channels</Button>
          </Link>
          <Link href="/billing">
            <Button variant="secondary">View billing</Button>
          </Link>
        </div>
      </Card>
    </>
  );
}

/** Result page for a declined, expired, or cancelled checkout. */
function BillingFailed() {
  const search = useSearchParams();
  const refresh = useRefresh();
  const status = (search.get("status") ?? "").toLowerCase();
  const expired = status === "expired";
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function tryAgain() {
    setRetrying(true);
    try {
      const result = await api.post<{ checkout_url: string }>(
        "/billing/checkout",
      );
      window.location.assign(result.checkout_url);
    } catch (error) {
      setRetrying(false);
      toast.error(
        `${messageForError(error)} Contact support if the problem continues.`,
      );
    }
  }

  return (
    <>
      <Heading title="Payment not completed" description="Nothing was charged." />
      <Card className="max-w-xl p-6">
        <div className="flex items-start gap-3" role="alert">
          <CircleAlert size={20} className="mt-0.5 text-loss" aria-hidden />
          <div>
            <p className="font-semibold">
              {expired
                ? "That checkout session expired."
                : "The payment did not go through."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {expired
                ? "Start a new checkout to upgrade. Your account and channels are unchanged."
                : "Your card was declined or the checkout was closed. Start again, or use a different payment method."}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => void tryAgain()} disabled={retrying}>
            {retrying ? "Starting checkout…" : "Try again"}
          </Button>
          <Link href="/billing">
            <Button variant="secondary">Back to billing</Button>
          </Link>
        </div>
      </Card>
    </>
  );
}

function AccountPage() {
  const { data: me } = useMe();
  const router = useRouter();
  const refresh = useRefresh();
  async function disconnect() {
    if (
      !window.confirm(
        "Disconnect Kick? Your channels will pause until you reconnect.",
      )
    )
      return;
    try {
      await api.delete("/me/kick-connection");
      toast.success("Kick disconnected. Your channels are paused.");
      await refresh();
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  async function removeAccount() {
    const value = window.prompt(
      "Type DELETE to permanently delete your account and cancel your subscription.",
    );
    if (value !== "DELETE") return;
    try {
      await api.delete("/me");
      toast.success("Account deleted");
      router.push("/");
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  return (
    <>
      <Heading
        title="Account"
        description="Your connected account and account controls."
      />
      <Card className="max-w-2xl p-5">
        <p className="text-xs text-muted-foreground">Connected Kick account</p>
        <p className="mt-2 font-display text-2xl font-semibold">
          {me?.username ?? "Not connected"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Account ID {me?.kick_user_id ?? "—"} ·{" "}
          {me?.token_health?.replaceAll("_", " ")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <KickAuthButton
            nextPath="/account"
            variant="secondary"
            label="Reconnect Kick"
          />
          <Button variant="secondary" onClick={() => void disconnect()}>
            Disconnect Kick
          </Button>
        </div>
      </Card>
      <Card className="mt-5 max-w-2xl border-loss/40 p-5">
        <h2 className="font-semibold text-loss">Delete account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This disables your channels, revokes the connection, and cancels any
          active subscription. This can’t be undone.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => void removeAccount()}
        >
          Delete account
        </Button>
      </Card>
    </>
  );
}

function AdminPage() {
  const [overview, setOverview] = useState<Record<
    string,
    string | number | boolean
  > | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const me = useMe();
  const router = useRouter();
  const refresh = useRefresh();
  useEffect(() => {
    if (!me.data) return;
    if (!me.data.is_admin) {
      router.replace("/dashboard");
      return;
    }
    Promise.all([
      api.get<Record<string, string | number | boolean>>("/admin/overview"),
      api.get<Record<string, unknown>>("/readyz"),
    ])
      .then(([stats, ready]) => {
        setOverview(stats);
        setHealth(ready);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 403)
          router.replace("/dashboard");
        else toast.error(messageForError(error));
      });
  }, [router, me.data]);
  if (!me.data?.is_admin)
    return <Loading label="Checking administrator access" />;
  async function toggle() {
    if (
      !window.confirm(
        `Type ${overview?.kill_switch ? "RESUME" : "PAUSE"} to ${overview?.kill_switch ? "resume" : "pause"} voting globally.`,
      )
    )
      return;
    const typed = window.prompt(
      `Type ${overview?.kill_switch ? "RESUME" : "PAUSE"} to confirm`,
    );
    if (typed !== (overview?.kill_switch ? "RESUME" : "PAUSE")) return;
    try {
      await api.post("/admin/kill-switch", { enabled: !overview?.kill_switch });
      toast.success(
        overview?.kill_switch
          ? "Voting resumed globally"
          : "Voting paused globally",
      );
      await refresh();
      const data =
        await api.get<Record<string, string | number | boolean>>(
          "/admin/overview",
        );
      setOverview(data);
    } catch (error) {
      toast.error(messageForError(error));
    }
  }
  if (!overview) return <Loading label="Loading system overview" />;
  return (
    <>
      <Heading
        title="Admin"
        description="System operations and account totals."
        action={
          <Link href="/payments">
            <Button variant="secondary" className="gap-2">
              <QrCode size={15} aria-hidden />
              Payment reviews
            </Button>
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries({
          Users: overview.users,
          "Premium users": overview.premium_users,
          "Active listeners": overview.active_listeners,
          "Queue depth": overview.queue_depth,
          "Queue lag (seconds)": overview.queue_lag_seconds,
          "Canary failures": overview.canary_failures,
          "Pending webhooks": overview.unprocessed_webhooks,
          "Circuit breaker": overview.circuit_breaker,
        }).map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-xl font-semibold">
              {String(value)}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold">Global voting</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current state: {overview.kill_switch ? "Paused" : "Running"}
          </p>
        </div>
        <Button
          variant={overview.kill_switch ? "primary" : "danger"}
          onClick={() => void toggle()}
        >
          {overview.kill_switch ? "Resume voting" : "Pause all voting"}
        </Button>
      </Card>
      <Card className="mt-5 p-5">
        <h2 className="font-semibold">System readiness</h2>
        <pre className="mt-3 overflow-auto text-xs text-muted-foreground">
          {JSON.stringify(health, null, 2)}
        </pre>
      </Card>
    </>
  );
}

function AppContent() {
  const pathname = usePathname();
  const pieces = pathname.split("/").filter(Boolean);
  if (pieces[0] === "channels" && pieces[1])
    return <ChannelDetail key={pieces[1]} id={pieces[1]} />;
  switch (pieces[0]) {
    case "channels":
      return <ChannelsPage key="channels" />;
    case "votes":
      return <VotesPage />;
    case "settings":
      return <SettingsPage />;
    case "billing":
      return <BillingPage />;
    case "success":
      return <BillingSuccess />;
    case "failed":
      return <BillingFailed />;
    case "account":
      return <AccountPage />;
    case "admin":
      return <AdminPage />;
    default:
      return <Dashboard />;
  }
}
export function AppPages() {
  return (
    <Suspense fallback={<Loading />}>
      <AppContent />
    </Suspense>
  );
}
