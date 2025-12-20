import { useState, useEffect } from "react";
import { CookingAssistant } from "@/components/CookingAssistant";
import { TimerGrid } from "@/components/TimerGrid";
import { StatusDisplay } from "@/components/StatusDisplay";
import { Timer } from "@/components/TimerCard";
import { playNotificationSound } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CookingPage() {
  const [timers, setTimers] = useState<Timer[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (!timer.isRunning || timer.remainingTime <= 0) return timer;
        
        const newTime = timer.remainingTime - 1;
        if (newTime === 0) {
          playNotificationSound();
        }
        return { ...timer, remainingTime: newTime };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTimer = (name: string, duration: number, category: string) => {
    const newTimer: Timer = {
      id: Date.now(),
      ingredientId: "custom",
      name,
      totalTime: duration,
      remainingTime: duration,
      isRunning: false,
      category
    };
    setTimers(prev => [...prev, newTimer]);
  };

  const toggleTimer = (id: number) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, isRunning: !t.isRunning } : t
    ));
  };

  const resetTimer = (id: number) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, remainingTime: t.totalTime, isRunning: false } : t
    ));
  };

  const deleteTimer = (id: number) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:gap-4 text-center">
        <div>
           <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Assistant de Cuisine</h1>
           <p className="text-sm sm:text-base text-muted-foreground">Gérez vos cuissons avec précision</p>
        </div>
        
        <div className="flex justify-center">
          <StatusDisplay timers={timers} />
        </div>
      </div>

      <div className="space-y-4 sm:space-y-8">
        <div className="rounded-2xl sm:rounded-3xl bg-white p-1 shadow-sm dark:bg-zinc-900">
          <Tabs defaultValue="assistant" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl sm:rounded-2xl bg-muted p-1">
               <TabsTrigger value="assistant" className="rounded-lg sm:rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Assistant</TabsTrigger>
               <TabsTrigger value="manual" className="rounded-lg sm:rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Timer Manuel</TabsTrigger>
            </TabsList>
            <TabsContent value="assistant" className="mt-2 sm:mt-4 px-3 sm:px-4 pb-2">
               <CookingAssistant onAddTimer={addTimer} />
            </TabsContent>
            <TabsContent value="manual" className="mt-2 sm:mt-4 h-[200px] sm:h-[400px] flex items-center justify-center rounded-xl sm:rounded-2xl border-2 border-dashed px-3 sm:px-4 pb-2 text-sm text-muted-foreground">
               Timer manuel bientôt disponible
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-lg sm:text-xl font-bold">Timers Actifs</h2>
             {timers.length > 0 && (
                <button onClick={() => setTimers([])} className="text-xs sm:text-sm font-medium text-destructive hover:underline">
                   Tout effacer
                </button>
             )}
          </div>
          <TimerGrid 
             timers={timers} 
             onToggle={toggleTimer} 
             onReset={resetTimer} 
             onDelete={deleteTimer} 
          />
        </div>
      </div>
    </div>
  );
}
