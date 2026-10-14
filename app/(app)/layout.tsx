import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { serverEnv } from "@/lib/env.server";
import type { Me } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const requestedPath = requestHeaders.get("x-tally-path") ?? "/dashboard";
  const nextPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/dashboard";
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${serverEnv.apiInternalUrl}/api/v1/me`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store"
  });
  if (response.status === 401) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!response.ok) throw new Error(`Could not verify your account (${response.status}).`);
  const me = await response.json() as Me;
  return <AppShell initialMe={me}>{children}</AppShell>;
}
