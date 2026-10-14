"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, cn } from "./ui";

function pageWindow(page: number, pages: number): (number | "ellipsis")[] {
  const wanted = new Set<number>([1, pages]);
  for (let candidate = page - 1; candidate <= page + 1; candidate += 1) {
    wanted.add(candidate);
  }
  if (page <= 3) [2, 3, 4].forEach((candidate) => wanted.add(candidate));
  if (page >= pages - 2) {
    [pages - 1, pages - 2, pages - 3].forEach((candidate) => wanted.add(candidate));
  }
  const sorted = [...wanted]
    .filter((candidate) => candidate >= 1 && candidate <= pages)
    .sort((a, b) => a - b);
  const entries: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const candidate of sorted) {
    if (candidate - previous > 1) entries.push("ellipsis");
    entries.push(candidate);
    previous = candidate;
  }
  return entries;
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPage,
  className,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (total === 0) return null;
  const current = Math.max(1, Math.min(page, pages));
  const first = (current - 1) * limit + 1;
  const last = Math.min(current * limit, total);
  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Showing {first}–{last} of {total}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => onPage(current - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          {pageWindow(current, pages).map((entry, index) =>
            entry === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                aria-hidden
                className="px-1 text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={entry}
                variant={entry === current ? "primary" : "secondary"}
                size="sm"
                aria-label={`Page ${entry}`}
                aria-current={entry === current ? "page" : undefined}
                className="min-w-8 px-2"
                onClick={() => onPage(entry)}
              >
                {entry}
              </Button>
            ),
          )}
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next page"
            disabled={current >= pages}
            onClick={() => onPage(current + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </nav>
  );
}