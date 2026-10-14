"use client";

import { useState } from "react";
import Link from "next/link";
import { useChannels, usePointsHistory } from "@/lib/api/hooks";
import type { PointsRange } from "@/lib/api/types";
import { PointsShareChart, PointsTrendChart } from "@/components/points-chart";
import {
  Button,
  Card,
  cn,
  Empty,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { PointsSkeleton } from "@/components/skeletons";
import { ALL_FILTER, ErrorBox, GrowthBadge, Heading } from "@/components/pages/shared";

const RANGE_OPTIONS: Array<{ value: PointsRange; label: string }> = [
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

/** Short noun for the selected range, used in the stat-card labels. */
const RANGE_NOUN: Record<PointsRange, string> = {
  "1h": "the last hour",
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
};

function PointsPage() {
  const channels = useChannels();
  const [range, setRange] = useState<PointsRange>("24h");
  const [channelId, setChannelId] = useState("");
  const history = usePointsHistory(range, channelId);
  if (history.isLoading && !history.data) return <PointsSkeleton />;
  if (history.isError)
    return (
      <ErrorBox error={history.error} retry={() => void history.refetch()} />
    );
  const totals = history.data?.totals;
  const series = history.data?.series ?? [];
  const channelRows = history.data?.channels ?? [];
  const hasData = (totals?.snapshots ?? 0) > 0;
  const growthPct = totals?.growth_pct ?? null;
  const channelList = channels.data ?? [];
  // A readable balance means the Kick voting token is set and working, so an
  // empty board is just "no readings yet" rather than "add a token".
  const hasBalance = channelList.some((c) => c.points_balance != null);
  // A donut only earns its space when several channels divide the total.
  const showShare =
    !channelId && channelRows.filter((c) => c.current > 0).length > 1;
  return (
    <>
      <Heading
        title="Points"
        description="How your channel points have grown over time."
        action={
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Channel
              <Select
                value={channelId || ALL_FILTER}
                onValueChange={(value) =>
                  setChannelId(value === ALL_FILTER ? "" : value)
                }
              >
                <SelectTrigger
                  aria-label="Filter points by channel"
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
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Range
              <Select
                value={range}
                onValueChange={(value) => setRange(value as PointsRange)}
              >
                <SelectTrigger
                  aria-label="Choose the time range"
                  className="w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        }
      />
      {!hasData ? (
        <Empty
          title="No points history yet"
          detail={
            channelList.length === 0
              ? "Add a channel and we’ll start recording your points balance every 15 minutes."
              : !hasBalance
                ? "We can only read your balance with a Kick voting token. Add it and recording begins within 15 minutes."
                : "Your balance is readable, so recording starts within 15 minutes. The chart fills in as readings accumulate."
          }
          action={
            channelList.length === 0 ? (
              <Link href="/channels">
                <Button>Add a channel</Button>
              </Link>
            ) : !hasBalance ? (
              <Link href="/settings">
                <Button>Add your Kick token</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Current points</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                {(totals?.current ?? 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">
                Change over {RANGE_NOUN[range]}
              </p>
              <p className="mt-2">
                <GrowthBadge value={totals?.growth ?? 0} />
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Growth</p>
              <p
                className={cn(
                  "mt-2 font-display text-2xl font-semibold tabular-nums",
                  (growthPct ?? 0) > 0
                    ? "text-win"
                    : (growthPct ?? 0) < 0
                      ? "text-loss"
                      : undefined,
                )}
              >
                {growthPct == null
                  ? "—"
                  : `${growthPct > 0 ? "+" : ""}${growthPct}%`}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Channels tracked</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                {channelRows.length}
              </p>
            </Card>
          </div>
          <div
            className={cn(
              "mt-4 grid gap-4",
              showShare && "lg:grid-cols-[1.6fr_1fr]",
            )}
          >
            <Card className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">
                  {channelId ? "Points over time" : "Total points over time"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {series.length} reading{series.length === 1 ? "" : "s"}
                </p>
              </div>
              {series.length >= 2 ? (
                <PointsTrendChart
                  points={series}
                  range={range}
                  className="mt-4"
                />
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  A line appears once there are at least two readings in this
                  window. We snapshot your balance every 15 minutes, so it fills
                  in shortly.
                </p>
              )}
            </Card>
            {showShare && (
              <Card className="p-5">
                <h2 className="font-semibold">Share by channel</h2>
                <PointsShareChart
                  channels={channelRows}
                  height={220}
                  className="mt-2"
                />
              </Card>
            )}
          </div>
          {channelRows.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-4 font-display text-2xl font-semibold">
                By channel
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {channelRows.map((channel) => (
                  <Card key={channel.channel_id} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/channels/${channel.channel_id}`}
                        className="font-display text-lg font-semibold hover:text-primary"
                      >
                        {channel.slug}
                      </Link>
                      <GrowthBadge value={channel.growth} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Current{" "}
                      <span className="font-semibold tabular-nums text-foreground">
                        {channel.current.toLocaleString()}
                      </span>{" "}
                      points
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}
          <p className="mt-6 text-xs text-muted-foreground">
            Points are read from Kick and recorded every 15 minutes. We can only
            read your balance while your Kick voting token is set, so history
            starts after you add it in Settings.
          </p>
        </>
      )}
    </>
  );
}
export { PointsPage };
