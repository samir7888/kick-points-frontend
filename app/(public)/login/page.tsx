"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";
import { KickAuthButton } from "@/components/kick-auth-button";

function LoginContent() {
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const failed = params.get("error");
  return <main className="grid min-h-[70vh] place-items-center px-5"><Card className="w-full max-w-md p-7 text-center"><p className="text-sm text-primary">Welcome back</p><h1 className="mt-2 font-display text-3xl font-semibold">Sign in to Tally</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Continue with Kick to manage your channels and see your prediction activity.</p>{failed && <p className="mt-4 rounded-lg bg-loss/10 p-3 text-sm" role="alert">Kick sign-in didn’t finish. Start again to reconnect your account.</p>}<KickAuthButton nextPath={next} size="lg" className="mt-6 w-full" /><p className="mt-4 text-xs text-muted-foreground">Tally is independent and not affiliated with Kick.</p></Card></main>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-[70vh] place-items-center"><p className="text-sm text-muted-foreground">Loading…</p></main>}>
      <LoginContent />
    </Suspense>
  );
}
