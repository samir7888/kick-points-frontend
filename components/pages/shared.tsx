"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { messageForError } from "@/lib/api/errors";
import { useRefreshAll } from "@/lib/api/hooks";

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

/** Formats an integer with a leading `+` for positive values. */
function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}`;
}

/** A small pill for a points change, coloured by direction (never colour alone). */
function GrowthBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  const tone =
    value > 0 ? "bg-win/15 text-win" : value < 0 ? "bg-loss/15 text-loss" : "";
  return (
    <Badge className={tone}>
      {signed(value)}
      {suffix}
    </Badge>
  );
}
export { ALL_FILTER, ErrorBox, GrowthBadge, Heading, PAGE_SIZE, useRefresh };
