import { TimerCard, Timer } from "./TimerCard";
import { AnimatePresence, motion } from "framer-motion";

interface TimerGridProps {
  timers: Timer[];
  onToggle: (id: number) => void;
  onReset: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TimerGrid({ timers, onToggle, onReset, onDelete }: TimerGridProps) {
  if (timers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
        <div className="mb-4 rounded-full bg-muted p-6">
          <span className="text-4xl">🍳</span>
        </div>
        <h3 className="text-xl font-medium text-foreground">Aucun timer actif</h3>
        <p className="text-muted-foreground">Utilisez l'assistant pour commencer une cuisson</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {timers.map((timer) => (
          <motion.div
            key={timer.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TimerCard
              timer={timer}
              onToggle={onToggle}
              onReset={onReset}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
