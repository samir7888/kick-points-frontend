import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Tally — your prediction activity, in one place", template: "%s · Tally" },
  description: "Set up your channels once. See your votes and results clearly.",
  applicationName: "Tally"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${display.variable} ${sans.variable} font-sans antialiased`}><Providers>{children}</Providers></body></html>;
}
