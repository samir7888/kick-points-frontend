import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="font-display text-2xl font-bold">tally<span className="text-primary">.</span></Link><nav className="flex items-center gap-4 text-sm"><Link href="/pricing">Pricing</Link><Link href="/login"><Button variant="secondary">Sign in</Button></Link><ThemeToggle /></nav></header>{children}<footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 border-t border-border px-5 py-8 text-sm text-muted-foreground"><span>Independent product. Not affiliated with Kick.</span><div className="flex gap-4"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/status">Status</Link></div></footer></>;
}
