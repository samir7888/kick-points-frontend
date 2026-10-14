"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { ApiError, messageForError } from "@/lib/api/errors";
import { useMe } from "@/lib/api/hooks";
import { Button, Card, Loading } from "@/components/ui";
import { Heading, useRefresh } from "@/components/pages/shared";

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
export { AdminPage };
