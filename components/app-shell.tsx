"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, CreditCard, LayoutDashboard, LogOut, Shield, SlidersHorizontal, TrendingUp, UserRound, Tv2 } from "lucide-react";
import { useMe } from "@/lib/api/hooks";
import { api } from "@/lib/api/client";
import { messageForError } from "@/lib/api/errors";
import { ThemeToggle } from "./theme-toggle";
import { LiveStream } from "./live-stream";
import { Button } from "./ui";
import { KickAuthButton } from "./kick-auth-button";

const nav = [
  ["/dashboard", "Dashboard", LayoutDashboard], ["/channels", "Channels", Tv2], ["/points", "Points", TrendingUp], ["/votes", "Votes", BarChart3], ["/settings", "Settings", SlidersHorizontal], ["/billing", "Billing", CreditCard], ["/account", "Account", UserRound]
] as const;
export function AppShell({ children, initialMe }: { children: React.ReactNode; initialMe?: import("@/lib/api/types").Me }) {
  const { data: me, isLoading, isError, refetch } = useMe(initialMe);
  const pathname = usePathname();
  const router = useRouter();
  if (isLoading && !me) return <main className="min-h-screen p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-12 w-48 rounded bg-muted" /><div className="h-56 rounded-2xl bg-muted" /><div className="h-64 rounded-2xl bg-muted" /></div></main>;
  if (!me) {
    return <main className="mx-auto mt-16 max-w-lg rounded-xl border border-loss/30 bg-loss/10 p-5 text-sm" role="alert"><p>We couldn’t verify your account right now. Your session has not been cleared.</p><Button variant="secondary" className="mt-3" onClick={() => void refetch()}>Try again</Button></main>;
  }
  const links = me.is_admin ? [...nav, ["/admin", "Admin", Shield] as const] : nav;
  async function signOut() {
    try { await api.post("/auth/logout"); router.push("/"); }
    catch (error) { toast.error(messageForError(error)); }
  }
  return <div className="min-h-screen lg:grid lg:grid-cols-[228px_1fr]">
    <aside className="hidden border-r border-border bg-surface p-5 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-10 font-display text-2xl font-bold">tally<span className="text-primary">.</span></Link>
      <nav className="space-y-1" aria-label="Main navigation">{links.map(([href, label, Icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${pathname.startsWith(href) ? "bg-muted font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon size={17} />{label}</Link>)}</nav>
      <div className="mt-auto rounded-xl border border-border p-3 text-xs text-muted-foreground">{me.plan === "premium" ? "Premium plan" : "Free plan"}<p className="mt-1 font-semibold text-foreground">{me.channels_used} of {me.channel_limit} channels used</p></div>
    </aside>
    <div className="min-w-0">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
        <Link href="/dashboard" className="font-display text-xl font-bold lg:hidden">tally<span className="text-primary">.</span></Link>
        <div className="hidden text-sm text-muted-foreground sm:block">Your prediction activity, clearly tracked</div>
        <div className="ml-auto flex items-center gap-2"><span className="hidden rounded-md bg-muted px-2 py-1 text-xs font-medium sm:inline">{me.plan === "premium" ? "Premium" : "Free"} · {me.channels_used}/{me.channel_limit}</span><ThemeToggle /><Button variant="ghost" onClick={signOut} aria-label="Sign out"><LogOut size={16} /><span className="hidden md:inline">Sign out</span></Button></div>
      </header>
      <LiveStream />
      {isError && <div className="border-b border-amber/50 bg-amber/10 px-4 py-3 text-sm md:px-8" role="status">Could not refresh your account details. You’re still signed in. <button className="font-semibold underline" onClick={() => void refetch()}>Try again</button></div>}
      {(me.token_health === "needs_reauth" || me.token_health === "disconnected") && <div className="border-b border-amber/50 bg-amber/10 px-4 py-3 text-sm md:px-8" role="status">Reconnect Kick to keep automatic voting active. <KickAuthButton nextPath={pathname} label="Reconnect Kick" variant="ghost" className="ml-1 h-auto min-h-0 px-1 py-0 font-semibold underline" /></div>}
      {me.voting_paused && <div className="border-b border-loss/30 bg-loss/10 px-4 py-3 text-sm md:px-8" role="status">Voting is paused while we fix a Kick connection problem. Your settings are safe.</div>}
      <main className="mx-auto max-w-7xl px-4 py-7 pb-24 md:px-8 lg:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-border bg-surface/95 px-2 py-2 backdrop-blur lg:hidden" aria-label="Mobile navigation">{links.map(([href, label, Icon]) => <Link key={href} href={href} className={`flex min-w-[64px] flex-1 flex-col items-center gap-1 px-1 py-1 text-[10px] ${pathname.startsWith(href) ? "font-semibold text-primary" : "text-muted-foreground"}`}><Icon size={18} /><span>{label}</span></Link>)}</nav>
    </div>
  </div>;
}
