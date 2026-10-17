"use client";

import { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  QrCode,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError, messageForError } from "@/lib/api/errors";
import { useBilling, useQrPayments } from "@/lib/api/hooks";
import { env } from "@/lib/env";
import { Badge, Button, Card } from "@/components/ui";
import { BillingSkeleton } from "@/components/skeletons";
import { ErrorBox, Heading } from "@/components/pages/shared";

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
          payment.
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
        Scan the QR with your bank app, transfer the equivalent of{" "}
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
            alt="Bank account QR code for payment"
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
  if (billing.isLoading) return <BillingSkeleton />;
  const isPremium = billing.data?.plan === "premium";
  return (
    <>
      <Heading title="Billing" description="Your plan and payment details." />
      {billing.isError ? (
        <ErrorBox error={billing.error} retry={() => void billing.refetch()} />
      ) : (
        <Card className="max-w-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <Badge>{isPremium ? "Premium" : "Free plan"}</Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold">
                {isPremium ? "Up to 6 channels" : "1 channel"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isPremium
                  ? billing.data?.premium_until
                    ? `Premium until ${format(new Date(billing.data.premium_until), "PPP")}`
                    : "Premium is active"
                  : "Upgrade with a QR payment below to monitor up to 6 channels."}
              </p>
            </div>
            <p className="font-display text-2xl font-semibold">
              ${(billing.data?.price_display ?? env.premiumPrice).toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / month
              </span>
            </p>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Premium is activated after we verify your QR payment below.
          </p>
        </Card>
      )}
      <BillingQrPanel />
    </>
  );
}

export { BillingPage };
