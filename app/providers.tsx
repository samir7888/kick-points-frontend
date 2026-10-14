"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api/errors";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data changes arrive over the live stream, so a generous stale window
        // avoids refetching every endpoint on each navigation.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        // Never retry client errors (auth, validation, plan limits); retry
        // transient failures once.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 1;
        }
      }
    }
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return <ThemeProvider attribute="class" defaultTheme="system" enableSystem><QueryClientProvider client={queryClient}>{children}<Toaster richColors position="top-right" /></QueryClientProvider></ThemeProvider>;
}
