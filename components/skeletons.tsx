"use client";

import { Card, cn } from "@/components/ui";

/** A single pulsing placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

/** Announces that a region is loading for assistive tech, and hides the bars. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return <div role="status" aria-busy="true" className="space-y-6"><span className="sr-only">{label}</span><div aria-hidden="true" className="space-y-6">{children}</div></div>;
}

function HeadingSkeleton() {
  return <div className="mb-7 space-y-2"><Skeleton className="h-9 w-56" /><Skeleton className="h-4 w-80 max-w-full" /></div>;
}

export function StatCardsSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return <div className={cn("grid gap-4", count === 4 ? "grid-cols-2 md:grid-cols-4" : "md:grid-cols-3", className)}>{Array.from({ length: count }).map((_, index) => <Card key={index} className="space-y-3 p-5"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-16" /><Skeleton className="h-3 w-32" /></Card>)}</div>;
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: count }).map((_, index) => <Card key={index} className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><Skeleton className="h-6 w-32" /><Skeleton className="h-6 w-11 rounded-full" /></div><Skeleton className="h-16 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-4 w-24" /></Card>)}</div>;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">{Array.from({ length: rows }).map((_, index) => <div key={index} className="flex items-center justify-between gap-4 p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-40" /></div>)}</div>;
}

export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return <div className="overflow-hidden rounded-xl border border-border bg-surface"><div className="border-b border-border p-4"><Skeleton className="h-4 w-64 max-w-full" /></div><div className="divide-y divide-border">{Array.from({ length: rows }).map((_, row) => <div key={row} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }).map((__, column) => <Skeleton key={column} className="h-4 w-full" />)}</div>)}</div></div>;
}

export function DashboardSkeleton() {
  return <LoadingRegion label="Loading your activity"><HeadingSkeleton /><StatCardsSkeleton count={3} /><div className="space-y-4"><Skeleton className="h-7 w-32" /><CardGridSkeleton count={2} /></div><div className="space-y-4"><Skeleton className="h-7 w-40" /><ListSkeleton rows={3} /></div></LoadingRegion>;
}

export function ChannelDetailSkeleton() {
  return <LoadingRegion label="Loading channel history"><HeadingSkeleton /><StatCardsSkeleton count={4} /><Card className="space-y-3 p-5"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-40" /></Card><div className="space-y-3"><Skeleton className="h-4 w-40" /><ListSkeleton rows={5} /></div></LoadingRegion>;
}

export function VotesSkeleton() {
  return <LoadingRegion label="Loading votes"><HeadingSkeleton /><TableSkeleton rows={7} columns={6} /></LoadingRegion>;
}

export function SettingsSkeleton() {
  return <LoadingRegion label="Loading settings"><HeadingSkeleton /><Card className="max-w-2xl space-y-5 p-5"><Skeleton className="h-5 w-40" /><Skeleton className="h-10 w-48" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></Card></LoadingRegion>;
}

export function BillingSkeleton() {
  return <LoadingRegion label="Loading billing details"><HeadingSkeleton /><Card className="max-w-2xl space-y-5 p-6"><Skeleton className="h-6 w-24 rounded-md" /><Skeleton className="h-9 w-56" /><Skeleton className="h-4 w-72 max-w-full" /><Skeleton className="h-10 w-48" /></Card></LoadingRegion>;
}

export function PointsSkeleton() {
  return <LoadingRegion label="Loading your points growth"><HeadingSkeleton /><StatCardsSkeleton count={4} /><Card className="space-y-4 p-5"><Skeleton className="h-4 w-40" /><Skeleton className="h-44 w-full" /></Card></LoadingRegion>;
}
