"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { messageForError } from "@/lib/api/errors";
import { useSettings } from "@/lib/api/hooks";
import { amountSchema } from "@/lib/validation";
import { env } from "@/lib/env";
import type { Settings } from "@/lib/api/types";
import { Button, Card, Input, Switch } from "@/components/ui";
import { SettingsSkeleton } from "@/components/skeletons";
import { ErrorBox, Heading, useRefresh } from "@/components/pages/shared";

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
export { SettingsPage };
