"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { ApiError, messageForError } from "@/lib/api/errors";
import { useChannels, useMe } from "@/lib/api/hooks";
import { amountSchema, slugSchema } from "@/lib/validation";
import { env } from "@/lib/env";
import type { Channel } from "@/lib/api/types";
import { Button, Card, Empty, Input, Switch } from "@/components/ui";
import { CardGridSkeleton } from "@/components/skeletons";
import { ErrorBox, Heading, useRefresh } from "@/components/pages/shared";

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
export { ChannelsPage };
