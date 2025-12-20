import { useState, useEffect, useRef } from 'react';
import { Plus, X, Clock, ChefHat, Pause, Play, Volume2, Mic, MicOff, Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

function parseTimeFromText(text) {
  let totalSeconds = 0;
  const minMatch = text.match(/(\d+)\s*(?:minute|min|mn|m)\b/i);
  if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
  const hourMatch = text.match(/(\d+)\s*(?:heure|hour|h)\b/i);
  if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
  const secMatch = text.match(/(\d+)\s*(?:seconde|sec|s)\b/i);
  if (secMatch) totalSeconds += parseInt(secMatch[1]);
  return totalSeconds > 0 ? totalSeconds : null;
}

function formatTime(seconds) {
  if (seconds >= 3600) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MultiCookingMode({ recipes, onClose, onRemoveRecipe }) {
  const [activeRecipes, setActiveRecipes] = useState(() => 
    recipes.map(recipe => ({
      ...recipe,
      currentStep: 0,
      completedSteps: new Set(),
      timers: {}
    }))
  );
  const [globalTimers, setGlobalTimers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'fr-FR';
      
      recognitionRef.current.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        handleVoiceCommand(command);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRecipes(prev => prev.map(recipe => {
        const updatedTimers = { ...recipe.timers };
        let hasChange = false;
        
        Object.keys(updatedTimers).forEach(key => {
          if (updatedTimers[key].running && updatedTimers[key].remaining > 0) {
            updatedTimers[key] = { ...updatedTimers[key], remaining: updatedTimers[key].remaining - 1 };
            hasChange = true;
            
            if (updatedTimers[key].remaining === 0) {
              playNotification();
              speak(`Timer terminé pour ${recipe.title}, étape ${parseInt(key) + 1}`);
              addAlert(`${recipe.title} - Étape ${parseInt(key) + 1} terminée !`);
            }
          }
        });
        
        return hasChange ? { ...recipe, timers: updatedTimers } : recipe;
      }));

      setGlobalTimers(prev => prev.map(timer => {
        if (timer.running && timer.remaining > 0) {
          const newRemaining = timer.remaining - 1;
          if (newRemaining === 0) {
            playNotification();
            speak(`Timer ${timer.name} terminé`);
            addAlert(`${timer.name} terminé !`);
          }
          return { ...timer, remaining: newRemaining };
        }
        return timer;
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const addAlert = (message) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const playNotification = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {}
  };

  const speak = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      synthRef.current.speak(utterance);
    }
  };

  const handleVoiceCommand = (command) => {
    if (command.includes('timer') || command.includes('temps')) {
      const remaining = getAllActiveTimers();
      if (remaining.length === 0) {
        speak('Aucun timer en cours');
      } else {
        const summary = remaining.map(t => `${t.name}: ${Math.floor(t.remaining / 60)} minutes`).join(', ');
        speak(`Timers en cours: ${summary}`);
      }
    } else if (command.includes('stop') || command.includes('pause')) {
      pauseAllTimers();
      speak('Tous les timers en pause');
    } else if (command.includes('reprendre') || command.includes('continue')) {
      resumeAllTimers();
      speak('Timers repris');
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      speak('Mode vocal activé');
    }
  };

  const startTimerForStep = (recipeIndex, stepIndex) => {
    const recipe = activeRecipes[recipeIndex];
    const step = recipe.steps[stepIndex];
    const time = parseTimeFromText(step?.instruction || '') || parseTimeFromText(step?.duration || '');
    
    if (time) {
      setActiveRecipes(prev => prev.map((r, i) => {
        if (i === recipeIndex) {
          return {
            ...r,
            timers: {
              ...r.timers,
              [stepIndex]: { total: time, remaining: time, running: true }
            }
          };
        }
        return r;
      }));
    }
  };

  const toggleStepTimer = (recipeIndex, stepIndex) => {
    setActiveRecipes(prev => prev.map((r, i) => {
      if (i === recipeIndex && r.timers[stepIndex]) {
        return {
          ...r,
          timers: {
            ...r.timers,
            [stepIndex]: { ...r.timers[stepIndex], running: !r.timers[stepIndex].running }
          }
        };
      }
      return r;
    }));
  };

  const markStepComplete = (recipeIndex, stepIndex) => {
    setActiveRecipes(prev => prev.map((r, i) => {
      if (i === recipeIndex) {
        const newCompleted = new Set(r.completedSteps);
        newCompleted.add(stepIndex);
        return {
          ...r,
          completedSteps: newCompleted,
          currentStep: stepIndex < r.steps.length - 1 ? stepIndex + 1 : r.currentStep
        };
      }
      return r;
    }));
  };

  const getAllActiveTimers = () => {
    const timers = [];
    activeRecipes.forEach((recipe, rIdx) => {
      Object.entries(recipe.timers).forEach(([stepIdx, timer]) => {
        if (timer.remaining > 0) {
          timers.push({
            name: `${recipe.title} - Étape ${parseInt(stepIdx) + 1}`,
            remaining: timer.remaining,
            running: timer.running,
            recipeIndex: rIdx,
            stepIndex: parseInt(stepIdx)
          });
        }
      });
    });
    return [...timers, ...globalTimers.filter(t => t.remaining > 0)].sort((a, b) => a.remaining - b.remaining);
  };

  const pauseAllTimers = () => {
    setActiveRecipes(prev => prev.map(r => ({
      ...r,
      timers: Object.fromEntries(
        Object.entries(r.timers).map(([k, v]) => [k, { ...v, running: false }])
      )
    })));
    setGlobalTimers(prev => prev.map(t => ({ ...t, running: false })));
  };

  const resumeAllTimers = () => {
    setActiveRecipes(prev => prev.map(r => ({
      ...r,
      timers: Object.fromEntries(
        Object.entries(r.timers).map(([k, v]) => [k, { ...v, running: v.remaining > 0 }])
      )
    })));
    setGlobalTimers(prev => prev.map(t => ({ ...t, running: t.remaining > 0 })));
  };

  const allTimers = getAllActiveTimers();
  const isComplete = (recipeIndex) => {
    const r = activeRecipes[recipeIndex];
    return r.completedSteps.size === r.steps?.length;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-foreground text-primary-foreground">
        <div className="flex items-center gap-3">
          <ChefHat size={28} />
          <div>
            <h2 className="text-xl font-bold">Mode Multi-Cuisson</h2>
            <p className="text-primary-foreground/80 text-sm">{activeRecipes.length} recettes en cours</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {voiceSupported && (
            <button
              onClick={toggleListening}
              className={cn(
                "rounded-full p-3 transition-colors",
                isListening ? "bg-red-500 animate-pulse" : "bg-primary-foreground/20 hover:bg-primary-foreground/30"
              )}
            >
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
          )}
          <button
            onClick={pauseAllTimers}
            className="rounded-full bg-primary-foreground/20 p-3 hover:bg-primary-foreground/30"
          >
            <Pause size={20} />
          </button>
          <button
            onClick={resumeAllTimers}
            className="rounded-full bg-primary-foreground/20 p-3 hover:bg-primary-foreground/30"
          >
            <Play size={20} />
          </button>
          <button onClick={onClose} className="rounded-full bg-primary-foreground/20 p-3 hover:bg-primary-foreground/30">
            <X size={20} />
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2">
              <AlertCircle size={20} />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {allTimers.length > 0 && (
        <div className="p-4 bg-card border-b border-border">
          <h3 className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
            <Clock size={16} />
            Timers actifs ({allTimers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTimers.map((timer, idx) => (
              <div 
                key={idx}
                className={cn(
                  "rounded-xl px-4 py-2 text-primary-foreground flex items-center gap-2",
                  timer.running ? "bg-primary" : "bg-foreground",
                  timer.remaining < 60 && timer.running && "bg-red-500 animate-pulse"
                )}
              >
                <span className="text-sm opacity-80">{timer.name}</span>
                <span className="font-mono font-bold">{formatTime(timer.remaining)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeRecipes.map((recipe, rIdx) => (
            <div 
              key={recipe.id || rIdx}
              className={cn(
                "rounded-2xl bg-card border overflow-hidden flex flex-col",
                isComplete(rIdx) ? "border-green-500" : "border-border"
              )}
            >
              <div className="p-4 bg-gradient-to-r from-accent to-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{recipe.emoji || '🍽️'}</span>
                    <h3 className="text-card-foreground font-bold text-lg">{recipe.title}</h3>
                  </div>
                  {isComplete(rIdx) && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      Terminé ✓
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <span>{recipe.completedSteps.size} / {recipe.steps?.length || 0} étapes</span>
                </div>
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(recipe.completedSteps.size / (recipe.steps?.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-2 max-h-60">
                {(recipe.steps || []).map((step, sIdx) => {
                  const timer = recipe.timers[sIdx];
                  const isCompleted = recipe.completedSteps.has(sIdx);
                  const isCurrent = sIdx === recipe.currentStep;
                  const hasTime = parseTimeFromText(step.instruction || '') || step.duration;
                  
                  return (
                    <div 
                      key={sIdx}
                      className={cn(
                        "rounded-xl p-3 transition-all",
                        isCompleted ? "bg-green-500/20 border border-green-500/30" :
                        isCurrent ? "bg-primary/20 border border-primary/30" :
                        "bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => markStepComplete(rIdx, sIdx)}
                          className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            isCompleted ? "bg-green-500 text-white" : "bg-muted text-card-foreground"
                          )}
                        >
                          {isCompleted ? <Check size={14} /> : sIdx + 1}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-card-foreground text-sm line-clamp-2">{step.instruction}</p>
                          
                          {hasTime && (
                            <div className="mt-2 flex items-center gap-2">
                              {timer ? (
                                <>
                                  <span className={cn(
                                    "font-mono text-sm font-bold",
                                    timer.remaining < 60 ? "text-red-400" : "text-primary"
                                  )}>
                                    {formatTime(timer.remaining)}
                                  </span>
                                  <button
                                    onClick={() => toggleStepTimer(rIdx, sIdx)}
                                    className="p-1 rounded bg-muted"
                                  >
                                    {timer.running ? <Pause size={12} className="text-card-foreground" /> : <Play size={12} className="text-card-foreground" />}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startTimerForStep(rIdx, sIdx)}
                                  className="flex items-center gap-1 px-2 py-1 bg-primary rounded text-primary-foreground text-xs"
                                >
                                  <Clock size={12} />
                                  Timer
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isListening && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2">
          <Mic size={20} />
          À l'écoute... Dites "timer", "pause" ou "reprendre"
        </div>
      )}
    </div>
  );
}
