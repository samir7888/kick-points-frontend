"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import {
  useActivePredictions,
  useChannels,
  useMe,
  usePointsHistory,
  useStatsOverview,
} from "@/lib/api/hooks";
import { PointsTrendChart } from "@/components/points-chart";
import { SplitBar } from "@/components/split-bar";
import { Button, Card, cn, Empty } from "@/components/ui";
import { DashboardSkeleton, StatCardsSkeleton } from "@/components/skeletons";
import { ErrorBox, GrowthBadge, Heading, useRefresh } from "@/components/pages/shared";

function Dashboard() {
  const { data: me } = useMe();
  const channels = useChannels();
  const active = useActivePredictions();
  const overview = useStatsOverview((channels.data?.length ?? 0) > 0);
  const points = usePointsHistory("24h", "", (channels.data?.length ?? 0) > 0);
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
          <section className="mt-9">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">
                Points growth
              </h2>
              <Link
                href="/points"
                className="text-sm font-semibold text-primary underline"
              >
                View points
              </Link>
            </div>
            <Card className="p-5">
              {points.isError ? (
                <ErrorBox
                  error={points.error}
                  retry={() => void points.refetch()}
                />
              ) : !points.data ? (
                <p className="text-sm text-muted-foreground">
                  Loading your points…
                </p>
              ) : points.data.totals.snapshots === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {channelList.some((c) => c.points_balance != null) ? (
                    <>
                      Recording starts within 15 minutes — your growth chart
                      fills in as readings accumulate.
                    </>
                  ) : (
                    <>
                      We can only read your balance with a Kick voting token.
                      Add it in{" "}
                      <Link
                        href="/settings"
                        className="font-semibold text-primary underline"
                      >
                        Settings
                      </Link>{" "}
                      and recording begins within 15 minutes.
                    </>
                  )}
                </p>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr] lg:items-center">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                        {points.data.totals.current.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        24-hour change
                      </p>
                      <p className="mt-1">
                        <GrowthBadge value={points.data.totals.growth} />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        24-hour growth
                      </p>
                      <p
                        className={cn(
                          "mt-1 font-display text-xl font-semibold tabular-nums",
                          (points.data.totals.growth_pct ?? 0) > 0
                            ? "text-win"
                            : (points.data.totals.growth_pct ?? 0) < 0
                              ? "text-loss"
                              : undefined,
                        )}
                      >
                        {points.data.totals.growth_pct == null
                          ? "—"
                          : `${points.data.totals.growth_pct > 0 ? "+" : ""}${points.data.totals.growth_pct}%`}
                      </p>
                    </div>
                  </div>
                  <PointsTrendChart
                    points={points.data.series}
                    range="24h"
                    height={200}
                  />
                </div>
              )}
            </Card>
          </section>
        </>
      )}
      <button className="sr-only" onClick={() => refresh()}>
        Refresh activity
      </button>
    </>
  );
}
export { Dashboard };
