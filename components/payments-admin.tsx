"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleAlert,
  Lock,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { ApiError, messageForError } from "@/lib/api/errors";
import type { QrPayment } from "@/lib/api/types";
import { Badge, Button, Card, Empty, Input, Loading } from "@/components/ui";

/** Calls one of the password-gated /qr-payments endpoints. */
async function passwordsApi<T>(
  path: string,
  password: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: { ...init?.headers, "X-Payments-Password": password },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const root =
      typeof body === "object" && body !== null
        ? (body as { error?: { code?: string; message?: string } })
        : {};
    throw new ApiError(
      response.status,
      root.error?.code ?? "REQUEST_FAILED",
      root.error?.message ?? `Request failed (${response.status}).`,
    );
  }
  return body as T;
}

function ProofImage({
  paymentId,
  password,
}: {
  paymentId: number;
  password: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(
          `/api/v1/qr-payments/${paymentId}/proof`,
          { headers: { "X-Payments-Password": password }, credentials: "include" },
        );
        if (!response.ok) throw new Error(`status ${response.status}`);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          if (!cancelled) setUrl(String(reader.result));
        };
        reader.onerror = () => {
          if (!cancelled) setError("Could not read the image.");
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!cancelled) setError("Could not load the proof.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [paymentId, password]);

  if (url)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Payment proof ${paymentId}`}
        className="max-h-64 w-full rounded-lg border border-border object-contain"
      />
    );
  if (error)
    return (
      <p className="rounded-lg bg-loss/10 p-3 text-xs text-loss" role="alert">
        {error}
      </p>
    );
  return <Loading label="Loading proof" />;
}

export function PaymentsAdmin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authing, setAuthing] = useState(false);
  const [items, setItems] = useState<QrPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    async (pass: string) => {
      setError(null);
      try {
        const data = await passwordsApi<{ items: QrPayment[] }>(
          "/qr-payments",
          pass,
        );
        setItems(data.items);
        setAuthed(true);
      } catch (err) {
        setError(
          err instanceof ApiError && err.status === 401
            ? "That password isn’t right. Try again."
            : messageForError(err),
        );
      }
    },
    [],
  );

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    if (!password.trim()) return;
    setAuthing(true);
    try {
      await load(password.trim());
    } finally {
      setAuthing(false);
    }
  }

  async function decide(id: number, action: "confirm" | "reject") {
    setBusyId(id);
    try {
      await passwordsApi(`/qr-payments/${id}/${action}`, password, {
        method: "POST",
      });
      toast.success(
        action === "confirm"
          ? "Payment confirmed — Premium granted"
          : "Payment rejected",
      );
      await load(password);
    } catch (err) {
      toast.error(messageForError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (!authed) {
    return (
      <Card className="mx-auto mt-10 max-w-md p-6">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-primary" aria-hidden />
          <h1 className="font-display text-2xl font-semibold">Payments</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is for the owner only. Enter the payments password to review
          QR payment proofs.
        </p>
        <form onSubmit={unlock} className="mt-5 space-y-3">
          <label className="sr-only" htmlFor="payments-password">
            Payments password
          </label>
          <Input
            id="payments-password"
            type="password"
            autoComplete="off"
            placeholder="Payments password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p className="text-sm text-loss" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={authing} className="w-full">
            {authing ? "Checking password…" : "Unlock payments"}
          </Button>
        </form>
      </Card>
    );
  }

  const pending = items?.filter((item) => item.status === "pending") ?? [];
  const reviewed = items?.filter((item) => item.status !== "pending") ?? [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            Payments
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            QR payment proofs waiting for your review. Confirming grants one
            month of Premium.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void load(password)}
          className="gap-2"
        >
          <RefreshCw size={15} aria-hidden />
          Refresh
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Badge className="bg-amber/15 text-amber">
          {pending.length} awaiting review
        </Badge>
        <Badge className="bg-win/15 text-win">
          {reviewed.length} decided
        </Badge>
      </div>

      {items === null ? (
        <div className="mt-6">
          <Loading label="Loading payments" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <Empty
            title="No QR payments yet"
            detail="When a user scans the billing QR, pays and uploads their proof, it will show up here."
          />
        </div>
      ) : (
        <section className="mt-6 space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-semibold">
                    {item.email ?? "No email"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    @{item.username}
                    {item.reference ? ` · ${item.reference}` : ""}
                    {item.amount != null
                      ? ` · ${Number(item.amount).toFixed(2)} sent`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted{" "}
                    {item.created_at
                      ? formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                        })
                      : "recently"}
                    {item.decided_at
                      ? ` · decided ${formatDistanceToNow(
                          new Date(item.decided_at),
                          { addSuffix: true },
                        )}`
                      : ""}
                  </p>
                </div>
                <span>
                  {item.status === "pending" && (
                    <Badge className="bg-amber/15 text-amber">
                      <RefreshCw size={12} aria-hidden /> Checking…
                    </Badge>
                  )}
                  {item.status === "confirmed" && (
                    <Badge className="bg-win/15 text-win">
                      <CheckCircle2 size={12} aria-hidden /> Confirmed
                    </Badge>
                  )}
                  {item.status === "rejected" && (
                    <Badge className="bg-loss/15 text-loss">
                      <XCircle size={12} aria-hidden /> Rejected
                    </Badge>
                  )}
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Payment proof
                  </p>
                  <ProofImage paymentId={item.id} password={password} />
                </div>
                <div className="flex flex-col justify-end gap-2 lg:items-end">
                  {item.status === "pending" && (
                    <>
                      <Button
                        className="w-full lg:w-auto"
                        disabled={busyId === item.id}
                        onClick={() => void decide(item.id, "confirm")}
                      >
                        <ShieldCheck size={15} aria-hidden />
                        {busyId === item.id
                          ? "Confirming…"
                          : "Confirm & grant Premium"}
                      </Button>
                      <Button
                        variant="danger"
                        className="w-full lg:w-auto"
                        disabled={busyId === item.id}
                        onClick={() => void decide(item.id, "reject")}
                      >
                        <XCircle size={15} aria-hidden />
                        Reject
                      </Button>
                    </>
                  )}
                  {item.status !== "pending" && (
                    <p className="text-xs text-muted-foreground">
                      {item.status === "confirmed"
                        ? "Premium was granted for this proof."
                        : "This proof was rejected."}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}

      {error && (
        <div
          className="mt-6 flex items-start gap-3 rounded-xl border border-loss/30 bg-loss/10 p-4 text-sm"
          role="alert"
        >
          <CircleAlert size={18} className="mt-0.5" aria-hidden />
          <div>
            <p>{error}</p>
            <Button
              variant="ghost"
              className="mt-2 px-0"
              onClick={() => void load(password)}
            >
              Try again
            </Button>
          </div>
        </div>
      )}
    </>
  );
}