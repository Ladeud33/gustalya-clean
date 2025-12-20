import { Timer } from "./TimerCard";

interface StatusDisplayProps {
  timers: Timer[];
}

export function StatusDisplay({ timers }: StatusDisplayProps) {
  const activeTimers = timers.filter(t => t.isRunning).length;
  const finishedTimers = timers.filter(t => t.remainingTime <= 0).length;
  const nextFinishing = timers
    .filter(t => t.isRunning && t.remainingTime > 0)
    .sort((a, b) => a.remainingTime - b.remainingTime)[0];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="text-sm font-medium text-muted-foreground">Timers Actifs</div>
        <div className="text-3xl font-bold text-primary">{activeTimers}</div>
      </div>
      
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="text-sm font-medium text-muted-foreground">Terminés</div>
        <div className="text-3xl font-bold text-green-500">{finishedTimers}</div>
      </div>

      <div className="col-span-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 p-4 shadow-sm md:col-span-2">
        <div className="text-sm font-medium text-muted-foreground">Prochaine fin de cuisson</div>
        {nextFinishing ? (
          <div className="flex items-baseline gap-2">
             <div className="text-3xl font-bold text-foreground">
                {Math.ceil(nextFinishing.remainingTime / 60)} <span className="text-sm font-normal text-muted-foreground">min</span>
             </div>
             <div className="truncate text-sm font-medium text-primary">
                {nextFinishing.name}
             </div>
          </div>
        ) : (
          <div className="text-xl font-medium text-muted-foreground">--:--</div>
        )}
      </div>
    </div>
  );
}
