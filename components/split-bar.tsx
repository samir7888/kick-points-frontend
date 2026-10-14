export function SplitBar({ outcomes, selected, winner }: { outcomes?: { id: string; title: string; total?: number }[]; selected?: string; winner?: string | null }) {
  if (!outcomes?.length) return <p className="text-sm text-muted-foreground">Outcome totals aren’t available yet.</p>;
  const hasTotals = outcomes.every(outcome => typeof outcome.total === "number" && Number.isFinite(outcome.total)) && outcomes.some(outcome => (outcome.total ?? 0) > 0);
  if (!hasTotals) return <div aria-label="Prediction outcomes" className="flex flex-wrap gap-2">{outcomes.map(outcome => <span key={outcome.id} className={`rounded-md border px-2.5 py-1 text-xs ${selected === outcome.id ? "border-primary bg-primary/10 font-semibold" : "border-border"}`}>{selected === outcome.id ? "Your pick: " : ""}{outcome.title}{winner === outcome.id ? " · Winner" : ""}</span>)}</div>;
  const total = outcomes.reduce((sum, outcome) => sum + (outcome.total ?? 0), 0);
  const selectedIndex = outcomes.findIndex(outcome => outcome.id === selected);
  const selectedShare = selectedIndex < 0 ? -1 : (outcomes.slice(0, selectedIndex).reduce((sum, outcome) => sum + (outcome.total ?? 0), 0) + (outcomes[selectedIndex].total ?? 0) / 2) / total * 100;
  return <div aria-label="Prediction outcome shares" className="space-y-2">
    <div className="relative flex h-3 overflow-hidden rounded-full bg-muted">
      {outcomes.map((outcome, index) => <span key={outcome.id} className={`h-full ${winner === outcome.id ? "bg-win" : index === 0 ? "bg-primary" : "bg-amber"}`} style={{ width: `${(outcome.total ?? 0) / total * 100}%` }} />)}
      {selectedIndex >= 0 && <span className="absolute -top-1.5 h-6 w-0.5 bg-foreground" style={{ left: `${selectedShare}%` }} />}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{outcomes.map(outcome => <span key={outcome.id} className={selected === outcome.id ? "font-semibold text-foreground" : ""}>{selected === outcome.id ? "Your pick: " : ""}{outcome.title}{total > 0 && ` · ${Math.round((outcome.total ?? 0) / total * 100)}%`}</span>)}</div>
  </div>;
}
