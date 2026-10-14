"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const choices = ["light", "dark", "system"] as const;
  const next = choices[(choices.indexOf((theme ?? "system") as typeof choices[number]) + 1) % choices.length];
  const Icon = next === "dark" ? Moon : next === "light" ? Sun : Monitor;
  return <Button variant="ghost" aria-label={`Switch to ${next} theme`} onClick={() => setTheme(next)}><Icon size={17} /><span className="sr-only">Switch to {next} theme</span></Button>;
}
