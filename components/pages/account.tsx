"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { messageForError } from "@/lib/api/errors";
import { useMe } from "@/lib/api/hooks";
import { KickAuthButton } from "@/components/kick-auth-button";
import { Button, Card } from "@/components/ui";
import { Heading, useRefresh } from "@/components/pages/shared";

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
export { AccountPage };
