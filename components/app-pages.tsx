"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Loading } from "@/components/ui";
import { AccountPage } from "@/components/pages/account";
import { AdminPage } from "@/components/pages/admin";
import { BillingPage } from "@/components/pages/billing";
import { ChannelDetail } from "@/components/pages/channel-detail";
import { ChannelsPage } from "@/components/pages/channels";
import { Dashboard } from "@/components/pages/dashboard";
import { PointsPage } from "@/components/pages/points";
import { SettingsPage } from "@/components/pages/settings";
import { VotesPage } from "@/components/pages/votes";

function AppContent() {
  const pathname = usePathname();
  const pieces = pathname.split("/").filter(Boolean);
  if (pieces[0] === "channels" && pieces[1])
    return <ChannelDetail key={pieces[1]} id={pieces[1]} />;
  switch (pieces[0]) {
    case "channels":
      return <ChannelsPage key="channels" />;
    case "points":
      return <PointsPage />;
    case "votes":
      return <VotesPage />;
    case "settings":
      return <SettingsPage />;
    case "billing":
      return <BillingPage />;
    case "account":
      return <AccountPage />;
    case "admin":
      return <AdminPage />;
    default:
      return <Dashboard />;
  }
}
export function AppPages() {
  return (
    <Suspense fallback={<Loading />}>
      <AppContent />
    </Suspense>
  );
}
