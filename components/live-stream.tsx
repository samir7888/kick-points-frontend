"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { defaultInvalidations, eventMap } from "@/lib/live/event-map";

export function LiveStream() {
  const cache = useQueryClient();
  const [reconnecting, setReconnecting] = useState(false);
  useEffect(() => {
    let source: EventSource | undefined;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    let disposed = false;
    const connect = () => {
      if (disposed) return;
      source = new EventSource("/api/v1/stream", { withCredentials: true });
      source.onopen = () => { attempts = 0; setReconnecting(false); };
      source.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as { type?: string; channel_slug?: string; reason?: string };
          const queries = eventMap[event.type ?? ""] ?? defaultInvalidations;
          queries.forEach((queryKey) => void cache.invalidateQueries({ queryKey }));
          if (event.type === "vote_placed") toast.success(`Vote placed${event.channel_slug ? ` in ${event.channel_slug}` : ""}.`);
          if (event.type === "token_needs_reauth") toast.warning("Reconnect Kick to keep voting.");
        } catch (error) { console.error("Could not read live update", error); }
      };
      source.onerror = () => {
        source?.close();
        setReconnecting(true);
        attempts += 1;
        if (attempts >= 4) void cache.invalidateQueries();
        timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(attempts, 5)));
      };
    };
    connect();
    return () => { disposed = true; source?.close(); clearTimeout(timer); };
  }, [cache]);
  return reconnecting ? <p className="px-4 py-2 text-xs text-muted-foreground" role="status">Live updates reconnecting. We’ll refresh your activity in the meantime.</p> : null;
}
