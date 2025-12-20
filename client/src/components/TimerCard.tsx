import { useEffect, useState } from "react";
import { Play, Pause, RefreshCw, Trash2, BellRing } from "lucide-react";
import { formatTime, playNotificationSound } from "@/utils";
import { cn } from "@/lib/utils";

export interface Timer {
  id: number;
  ingredientId: string;
  name: string;
  totalTime: number; // seconds
  remainingTime: number; // seconds
  isRunning: boolean;
  category: string;
}

interface TimerCardProps {
  timer: Timer;
  onToggle: (id: number) => void;
  onReset: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TimerCard({ timer, onToggle, onReset, onDelete }: TimerCardProps) {
  const progress = ((timer.totalTime - timer.remainingTime) / timer.totalTime) * 100;
  
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'viandes': return 'text-cooking-meat bg-cooking-meat/10 border-cooking-meat/20';
      case 'poissons': return 'text-cooking-fish bg-cooking-fish/10 border-cooking-fish/20';
      case 'légumes': return 'text-cooking-vegetable bg-cooking-vegetable/10 border-cooking-vegetable/20';
      case 'féculents': return 'text-cooking-pasta bg-cooking-pasta/10 border-cooking-pasta/20';
      case 'oeufs': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const getProgressColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'viandes': return 'bg-cooking-meat';
      case 'poissons': return 'bg-cooking-fish';
      case 'légumes': return 'bg-cooking-vegetable';
      case 'féculents': return 'bg-cooking-pasta';
      case 'oeufs': return 'bg-yellow-500';
      default: return 'bg-primary';
    }
  };

  const isFinished = timer.remainingTime <= 0;

  return (
    <div className={cn(
      "timer-card group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-timer-hover",
      isFinished ? "ring-4 ring-red-500/50 shadow-error" : "shadow-timer"
    )}>
      {/* Background Progress */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 top-0 -z-10 bg-opacity-5 transition-all duration-1000 ease-linear",
          getProgressColor(timer.category).replace('bg-', 'bg-')
        )}
        style={{ width: `${progress}%`, opacity: 0.1 }}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
            getCategoryColor(timer.category)
          )}>
            {timer.category}
          </span>
          <h3 className="font-heading text-xl font-bold text-foreground">{timer.name}</h3>
        </div>
        
        <button 
          onClick={() => onDelete(timer.id)}
          aria-label={`Supprimer le timer ${timer.name}`}
          className="rounded-full p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="my-8 flex justify-center">
        <div 
          role="timer"
          aria-live="polite"
          aria-label={`Temps restant pour ${timer.name}`}
          className={cn(
            "font-timer text-timer tabular-nums tracking-tighter transition-colors",
            isFinished ? "text-destructive animate-pulse" : "text-foreground",
            timer.isRunning && !isFinished ? "animate-timer-tick" : ""
          )}
        >
          {formatTime(Math.max(0, timer.remainingTime))}
        </div>
      </div>

      {isFinished && (
        <div role="alert" aria-live="assertive" className="sr-only">
          Timer {timer.name} terminé !
        </div>
      )}

      {isFinished && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 animate-bounce-slow">
            <BellRing className="h-12 w-12 text-destructive" />
            <span className="text-2xl font-bold text-destructive">C'est prêt !</span>
            <button 
              onClick={() => onDelete(timer.id)}
              className="rounded-full bg-destructive px-6 py-2 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Arrêter
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(timer.id)}
            disabled={isFinished}
            aria-label={timer.isRunning ? `Mettre en pause ${timer.name}` : `Démarrer ${timer.name}`}
            aria-pressed={timer.isRunning}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95",
              timer.isRunning 
                ? "bg-amber-500 text-white hover:bg-amber-600" 
                : "bg-primary text-white hover:bg-primary/90",
              isFinished && "opacity-0 pointer-events-none"
            )}
          >
            {timer.isRunning ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          </button>
          
          <button
            onClick={() => onReset(timer.id)}
            disabled={isFinished}
            aria-label={`Réinitialiser ${timer.name}`}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm transition-all hover:bg-secondary/80 hover:scale-110 active:scale-95",
              isFinished && "opacity-0 pointer-events-none"
            )}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div 
            className={cn("h-full transition-all duration-1000 ease-linear", getProgressColor(timer.category))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
