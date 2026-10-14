"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Card, Badge } from "@/components/ui";
export default function StatusPage() {
  const [status, setStatus] = useState("Checking");
  useEffect(() => { api.get<{ status: string }>("/healthz").then(data => setStatus(data.status === "ok" ? "Operational" : "Issues detected")).catch(() => setStatus("Unable to reach service")); }, []);
  return <main className="mx-auto max-w-3xl px-5 py-16"><h1 className="font-display text-4xl font-semibold">Service status</h1><Card className="mt-7 flex items-center justify-between p-5"><span>API availability</span><Badge className={status === "Operational" ? "bg-win/15 text-win" : "bg-amber/15"}>{status}</Badge></Card><p className="mt-4 text-sm text-muted-foreground">Prediction history may be sparse while channels have only recently been enabled.</p></main>;
}
