import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock, Mic, MicOff, Volume2, VolumeX, ChefHat, Check, X, Hand, Smartphone, User, Settings, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { recordRecipeCooked } from '../lib/firebase';

function parseTimeFromText(text) {
  if (!text) return null;
  
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
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RecipeCookingMode({ recipe, onClose, onAddTimer }) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTimers, setStepTimers] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [handsFreeModeActive, setHandsFreeModeActive] = useState(false);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState(() => {
    return localStorage.getItem('gustalya_voice_gender') || 'female';
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [cookingStartTime] = useState(() => Date.now());
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const wakeLockRef = useRef(null);

  const steps = recipe.steps || [];
  const currentStepData = steps[currentStep];

  const getFrenchVoices = useCallback(() => {
    if (!synthRef.current) return [];
    const voices = synthRef.current.getVoices();
    return voices.filter(v => v.lang.startsWith('fr'));
  }, []);

  const selectBestVoice = useCallback((gender) => {
    const frenchVoices = getFrenchVoices();
    if (frenchVoices.length === 0) return null;

    const femaleNames = ['amélie', 'amelie', 'aurelie', 'julie', 'marie', 'audrey', 'celine', 'lea', 'sophie', 'virginie', 'hortense', 'denise'];
    const maleNames = ['thomas', 'pierre', 'nicolas', 'paul', 'guillaume', 'henri', 'lucas'];

    let selectedVoice = null;

    if (gender === 'female') {
      selectedVoice = frenchVoices.find(v => {
        const name = v.name.toLowerCase();
        return femaleNames.some(n => name.includes(n));
      });
      if (!selectedVoice) {
        selectedVoice = frenchVoices.find(v => {
          const name = v.name.toLowerCase();
          return !maleNames.some(n => name.includes(n));
        });
      }
    } else {
      selectedVoice = frenchVoices.find(v => {
        const name = v.name.toLowerCase();
        return maleNames.some(n => name.includes(n));
      });
      if (!selectedVoice) {
        selectedVoice = frenchVoices.find(v => {
          const name = v.name.toLowerCase();
          return !femaleNames.some(n => name.includes(n));
        });
      }
    }

    if (!selectedVoice && frenchVoices.length > 1) {
      selectedVoice = frenchVoices[gender === 'female' ? 1 : 0];
    }

    return selectedVoice || frenchVoices[0];
  }, [getFrenchVoices]);

  const speak = useCallback((text) => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.92;
        utterance.pitch = selectedVoiceGender === 'female' ? 1.1 : 0.8;
        utterance.volume = 1;
        
        const actualGender = selectedVoiceGender === 'female' ? 'male' : 'female';
        const voice = selectBestVoice(actualGender);
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.onerror = () => {
          setVoiceError(true);
        };
        
        synthRef.current.speak(utterance);
        setVoiceError(false);
      } catch (e) {
        setVoiceError(true);
      }
    } else {
      setVoiceError(true);
    }
  }, [selectedVoiceGender, selectBestVoice]);

  const handleVoiceGenderChange = (gender) => {
    setSelectedVoiceGender(gender);
    localStorage.setItem('gustalya_voice_gender', gender);
    setTimeout(() => {
      const testPhrase = gender === 'female' 
        ? 'Bonjour, je suis votre assistante de cuisine.' 
        : 'Bonjour, je suis votre assistant de cuisine.';
      speak(testPhrase);
    }, 100);
  };

  const readCurrentStep = useCallback(() => {
    if (currentStepData) {
      const duration = currentStepData.duration || '';
      const durationText = duration ? ` Durée: ${duration}.` : '';
      speak(`Étape ${currentStep + 1}. ${currentStepData.instruction}${durationText}`);
    }
  }, [currentStep, currentStepData, speak]);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      } catch (err) {
        console.log('Wake Lock non disponible:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        const frVoices = voices.filter(v => v.lang.startsWith('fr'));
        setAvailableVoices(frVoices);
      };
      
      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';
      
      recognitionRef.current.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        setLastCommand(command);
        handleVoiceCommand(command);
      };
      
      recognitionRef.current.onerror = (e) => {
        if (e.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening && handsFreeModeActive) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (handsFreeModeActive && autoReadEnabled && currentStepData) {
      const timeout = setTimeout(() => {
        readCurrentStep();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, handsFreeModeActive, autoReadEnabled, readCurrentStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key].running && updated[key].remaining > 0) {
            updated[key] = { ...updated[key], remaining: updated[key].remaining - 1 };
            if (updated[key].remaining === 0) {
              playNotification();
              speak(`Le timer de l'étape ${parseInt(key) + 1} est terminé`);
            }
          }
        });
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [speak]);

  const playNotification = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        const startTime = audioContext.currentTime + (i * 0.3);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      }
    } catch (e) {}
  };

  const handleVoiceCommand = (command) => {
    const cmd = command.toLowerCase();
    
    if (cmd.includes('suivant') || cmd.includes('next') || cmd.includes('étape suivante') || cmd.includes('après')) {
      speak('Étape suivante');
      nextStep();
    } else if (cmd.includes('précédent') || cmd.includes('retour') || cmd.includes('étape précédente') || cmd.includes('avant')) {
      speak('Étape précédente');
      prevStep();
    } else if (cmd.includes('lance le timer') || cmd.includes('lance le minuteur') || cmd.includes('démarre') || cmd.includes('start')) {
      speak('Lancement du timer');
      startCurrentTimer();
    } else if (cmd.includes('stop') || cmd.includes('arrête') || cmd.includes('pause') || cmd.includes('stoppe')) {
      speak('Timer en pause');
      pauseCurrentTimer();
    } else if (cmd.includes('répète') || cmd.includes('relis') || cmd.includes('encore') || cmd.includes('redis')) {
      speak('Je répète');
      readCurrentStep();
    } else if (cmd.includes('terminé') || cmd.includes('fait') || cmd.includes('fini') || cmd.includes('ok') || cmd.includes('valide')) {
      speak('Étape validée');
      markStepComplete();
    } else if (cmd.includes('combien') && cmd.includes('temps')) {
      announceRemainingTime();
    } else if (cmd.includes('aide') || cmd.includes('commande')) {
      announceHelp();
    } else {
      speak('Commande non reconnue');
    }
  };

  const announceRemainingTime = () => {
    const currentTimer = stepTimers[currentStep];
    if (currentTimer && currentTimer.remaining > 0) {
      const mins = Math.floor(currentTimer.remaining / 60);
      const secs = currentTimer.remaining % 60;
      speak(`Il reste ${mins} minutes et ${secs} secondes`);
    } else {
      speak('Aucun timer en cours pour cette étape');
    }
  };

  const announceHelp = () => {
    speak('Commandes disponibles: suivant, précédent, lance le timer, arrête, répète, terminé, combien de temps');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        speak('Assistant vocal activé');
      } catch (e) {}
    }
  };

  const activateHandsFreeMode = async () => {
    setHandsFreeModeActive(true);
    await requestWakeLock();
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {}
    }
    
    speak(`Mode mains libres activé pour ${recipe.title}. L'écran restera allumé. Dites suivant, précédent, lance le timer, ou terminé.`);
    
    setTimeout(() => {
      readCurrentStep();
    }, 3000);
  };

  const deactivateHandsFreeMode = () => {
    setHandsFreeModeActive(false);
    releaseWakeLock();
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    speak('Mode mains libres désactivé');
  };

  const toggleHandsFreeMode = () => {
    if (handsFreeModeActive) {
      deactivateHandsFreeMode();
    } else {
      activateHandsFreeMode();
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      if (!handsFreeModeActive) {
        speak(`Étape ${currentStep + 2}`);
      }
    } else {
      speak('Vous êtes à la dernière étape');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      if (!handsFreeModeActive) {
        speak(`Étape ${currentStep}`);
      }
    } else {
      speak('Vous êtes à la première étape');
    }
  };

  const markStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      nextStep();
    } else {
      speak('Félicitations ! Vous avez terminé la recette. Bon appétit !');
    }
  };

  const startCurrentTimer = () => {
    const time = parseTimeFromText(currentStepData?.instruction || '') || 
                 parseTimeFromText(currentStepData?.duration || '');
    
    if (time) {
      setStepTimers(prev => ({
        ...prev,
        [currentStep]: { total: time, remaining: time, running: true }
      }));
      const mins = Math.floor(time / 60);
      const secs = time % 60;
      if (mins > 0) {
        speak(`Timer de ${mins} minute${mins > 1 ? 's' : ''} lancé`);
      } else {
        speak(`Timer de ${secs} secondes lancé`);
      }
    } else {
      speak('Pas de durée détectée pour cette étape');
    }
  };

  const pauseCurrentTimer = () => {
    if (stepTimers[currentStep]?.running) {
      setStepTimers(prev => ({
        ...prev,
        [currentStep]: { ...prev[currentStep], running: false }
      }));
      speak('Timer en pause');
    }
  };

  const resumeCurrentTimer = () => {
    if (stepTimers[currentStep] && !stepTimers[currentStep].running) {
      setStepTimers(prev => ({
        ...prev,
        [currentStep]: { ...prev[currentStep], running: true }
      }));
      speak('Timer repris');
    }
  };

  const addToGlobalTimers = () => {
    let added = 0;
    steps.forEach((step, index) => {
      const time = parseTimeFromText(step.instruction || '') || parseTimeFromText(step.duration || '');
      if (time && onAddTimer) {
        onAddTimer(`${recipe.title} - Étape ${index + 1}`, time, recipe.category || 'Recette');
        added++;
      }
    });
    speak(`${added} timer${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''}`);
  };

  const finishCooking = async () => {
    const cookingTimeMinutes = Math.max(1, Math.round((Date.now() - cookingStartTime) / 60000));
    
    if (!currentUser) {
      // Still show completion screen even if not logged in
      setShowCompletionScreen(true);
      speak('Félicitations ! Recette terminée !');
      return;
    }
    
    setSavingStats(true);
    try {
      await recordRecipeCooked(
        currentUser.uid, 
        recipe.id || `temp_${Date.now()}`, 
        recipe.title || 'Recette', 
        cookingTimeMinutes
      );
      setShowCompletionScreen(true);
      speak('Félicitations ! Recette terminée !');
    } catch (error) {
      console.error('Failed to record cooking stats:', error);
      // Still show completion screen but without stats message
      setShowCompletionScreen(true);
      speak('Recette terminée !');
    } finally {
      setSavingStats(false);
    }
  };

  const allStepsCompleted = completedSteps.size === steps.length && steps.length > 0;
  const activeTimers = Object.entries(stepTimers).filter(([_, t]) => t.remaining > 0);

  // Completion screen
  if (showCompletionScreen) {
    const cookingTimeMinutes = Math.round((Date.now() - cookingStartTime) / 60000);
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-md rounded-2xl shadow-2xl bg-gradient-to-b from-amber-500 to-amber-600 p-8 text-center animate-in zoom-in-95"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-6xl mb-4">🎉</div>
          <Trophy size={48} className="mx-auto text-white mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Bravo Chef !</h2>
          <p className="text-amber-100 mb-6">
            Vous avez terminé "{recipe.title}" en {cookingTimeMinutes < 1 ? 'moins d\'une minute' : `${cookingTimeMinutes} minute${cookingTimeMinutes > 1 ? 's' : ''}`}
          </p>
          <div className="bg-white/20 rounded-xl p-4 mb-6">
            <p className="text-white text-sm">Vos statistiques ont été mises à jour !</p>
            <div className="flex justify-center gap-6 mt-3 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">+1</div>
                <div className="text-xs text-amber-100">Recette cuisinée</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">+{cookingTimeMinutes}</div>
                <div className="text-xs text-amber-100">Minutes</div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="button-finish-cooking"
            className="w-full py-3 rounded-xl bg-white text-amber-600 font-bold hover:bg-amber-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cooking-mode-title"
    >
      <div 
        className={cn(
          "w-full max-w-3xl rounded-2xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col",
          handsFreeModeActive ? "bg-gradient-to-b from-green-900/95 to-card ring-4 ring-green-500" : "bg-card"
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className={cn(
          "p-4 sm:p-6 text-primary-foreground transition-colors",
          handsFreeModeActive 
            ? "bg-gradient-to-r from-green-600 to-green-700" 
            : "bg-gradient-to-r from-primary to-foreground"
        )}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <ChefHat size={24} className="flex-shrink-0" />
              <div className="min-w-0">
                <h2 id="cooking-mode-title" className="text-base sm:text-xl font-bold text-primary-foreground truncate">{recipe.title}</h2>
                <p className="text-primary-foreground/80 text-xs sm:text-sm flex items-center gap-1">
                  {handsFreeModeActive ? (
                    <>
                      <Hand size={12} className="animate-pulse" />
                      Mains libres
                      {wakeLockActive && <Smartphone size={12} />}
                    </>
                  ) : (
                    'Mode pas à pas'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                aria-label="Fermer le mode cuisine"
                onClick={onClose} 
                className="rounded-full bg-primary-foreground/20 p-2 hover:bg-primary-foreground/30"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {voiceSupported && (
              <button
                onClick={toggleHandsFreeMode}
                data-testid="button-handsfree-toggle"
                aria-label={handsFreeModeActive ? "Désactiver le mode mains libres" : "Activer le mode mains libres"}
                aria-pressed={handsFreeModeActive}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all",
                  handsFreeModeActive 
                    ? "bg-green-400 text-green-900 ring-2 ring-white" 
                    : "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                )}
              >
                <Hand size={14} />
                <span className="hidden xs:inline">{handsFreeModeActive ? 'Actif' : 'Mains libres'}</span>
              </button>
            )}
            
            <button
              onClick={readCurrentStep}
              aria-label="Lire l'étape à voix haute"
              className="flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-2 text-xs font-medium hover:bg-primary-foreground/30"
            >
              <Volume2 size={14} />
              <span className="hidden xs:inline">Lire</span>
            </button>
            
            <button 
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              aria-label={showVoiceSettings ? "Masquer les paramètres de voix" : "Afficher les paramètres de voix"}
              aria-pressed={showVoiceSettings}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                showVoiceSettings ? "bg-primary-foreground/40" : "bg-primary-foreground/20 hover:bg-primary-foreground/30"
              )}
            >
              <Settings size={14} />
              <span className="hidden xs:inline">Voix</span>
            </button>

            {voiceSupported && !handsFreeModeActive && (
              <button
                onClick={toggleListening}
                data-testid="button-voice-toggle"
                aria-label={isListening ? "Désactiver le microphone" : "Activer le microphone"}
                aria-pressed={isListening}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                  isListening ? "bg-red-500 animate-pulse" : "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                )}
              >
                {isListening ? <Mic size={14} /> : <MicOff size={14} />}
                <span className="hidden xs:inline">{isListening ? 'Écoute...' : 'Micro'}</span>
              </button>
            )}
          </div>

          {showVoiceSettings && (
            <div className="mt-3 bg-black/20 rounded-xl p-3 sm:p-4 animate-in slide-in-from-top-2">
              <h4 className="text-xs sm:text-sm font-medium text-primary-foreground mb-2 flex items-center gap-2">
                <User size={14} />
                Choisir la voix
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleVoiceGenderChange('female')}
                  aria-label="Sélectionner une voix féminine"
                  aria-pressed={selectedVoiceGender === 'female'}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    selectedVoiceGender === 'female'
                      ? "bg-pink-500 text-white ring-2 ring-white"
                      : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                  )}
                >
                  <span>👩‍🍳</span>
                  Femme
                </button>
                <button
                  onClick={() => handleVoiceGenderChange('male')}
                  aria-label="Sélectionner une voix masculine"
                  aria-pressed={selectedVoiceGender === 'male'}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    selectedVoiceGender === 'male'
                      ? "bg-blue-500 text-white ring-2 ring-white"
                      : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                  )}
                >
                  <span>👨‍🍳</span>
                  Homme
                </button>
              </div>
              {availableVoices.length > 0 && (
                <p className="mt-2 text-xs text-primary-foreground/50 text-center truncate">
                  Voix : {selectBestVoice(selectedVoiceGender)?.name || 'Par défaut'}
                </p>
              )}
            </div>
          )}
          
          {voiceError && (
            <div 
              role="alert" 
              aria-live="assertive"
              className="mt-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
            >
              <Volume2 size={14} className="flex-shrink-0" />
              Mode vocal indisponible. Vous pouvez suivre les étapes à l'écran.
            </div>
          )}
          
          {handsFreeModeActive && lastCommand && (
            <div className="mt-3 bg-black/20 rounded-lg px-3 py-2 text-sm">
              <span className="text-primary-foreground/60">Dernière commande :</span>{' '}
              <span className="font-medium">"{lastCommand}"</span>
            </div>
          )}
          
          {activeTimers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeTimers.map(([idx, timer]) => (
                <div key={idx} className={cn(
                  "rounded-full px-4 py-1 text-sm font-mono",
                  timer.remaining < 60 ? "bg-red-500/50 animate-pulse" : timer.running ? "bg-primary-foreground/30" : "bg-primary-foreground/10"
                )}>
                  Étape {parseInt(idx) + 1}: {formatTime(timer.remaining)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Étape {currentStep + 1} sur {steps.length}</span>
            <span>{completedSteps.size} / {steps.length} terminées</span>
          </div>

          <div className="mb-6">
            <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {currentStepData && (
            <div className={cn(
              "rounded-2xl border-2 p-6 transition-all",
              completedSteps.has(currentStep) 
                ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700" 
                : handsFreeModeActive
                  ? "border-green-400 bg-green-50/10 dark:bg-green-900/10"
                  : "border-border bg-background"
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-primary-foreground font-bold text-xl",
                  completedSteps.has(currentStep) ? "bg-green-500" : handsFreeModeActive ? "bg-green-600" : "bg-primary"
                )}>
                  {completedSteps.has(currentStep) ? <Check size={28} /> : currentStep + 1}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-lg leading-relaxed",
                    handsFreeModeActive ? "text-xl font-medium" : "text-card-foreground"
                  )}>
                    {currentStepData.instruction}
                  </p>
                  
                  {currentStepData.duration && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      <Clock size={14} />
                      {currentStepData.duration}
                    </div>
                  )}
                  
                  {(currentStepData.duration || parseTimeFromText(currentStepData.instruction)) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stepTimers[currentStep] ? (
                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                          <span className={cn(
                            "font-mono text-3xl font-bold",
                            stepTimers[currentStep].remaining < 60 ? "text-red-500 animate-pulse" : "text-primary"
                          )}>
                            {formatTime(stepTimers[currentStep].remaining)}
                          </span>
                          <button
                            onClick={() => stepTimers[currentStep].running ? pauseCurrentTimer() : resumeCurrentTimer()}
                            aria-label={stepTimers[currentStep].running ? "Mettre en pause le timer" : "Reprendre le timer"}
                            aria-pressed={stepTimers[currentStep].running}
                            className={cn(
                              "rounded-lg p-3 text-white",
                              stepTimers[currentStep].running ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
                            )}
                          >
                            {stepTimers[currentStep].running ? <Pause size={20} /> : <Play size={20} />}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={startCurrentTimer}
                          data-testid="button-start-step-timer"
                          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90 font-medium"
                        >
                          <Clock size={20} />
                          Lancer le timer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Toutes les étapes</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  aria-label={`Aller à l'étape ${idx + 1}${completedSteps.has(idx) ? ' (terminée)' : ''}`}
                  aria-current={idx === currentStep ? 'step' : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
                    idx === currentStep ? "bg-primary/20" : "bg-background hover:bg-primary/10",
                    completedSteps.has(idx) && "opacity-60"
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    completedSteps.has(idx) ? "bg-green-500 text-white" : "bg-primary/20 text-card-foreground"
                  )}>
                    {completedSteps.has(idx) ? <Check size={12} /> : idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-card-foreground line-clamp-1">{step.instruction}</span>
                  {step.duration && (
                    <span className="text-xs text-muted-foreground">{step.duration}</span>
                  )}
                  {stepTimers[idx]?.remaining > 0 && (
                    <span className={cn(
                      "text-xs font-mono",
                      stepTimers[idx].remaining < 60 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {formatTime(stepTimers[idx].remaining)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={cn(
          "border-t p-3 space-y-2",
          handsFreeModeActive ? "bg-green-900/20 border-green-700" : "bg-background border-border"
        )}>
          <div className="flex items-center gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              aria-label="Étape précédente"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-30"
            >
              <SkipBack size={16} />
              <span className="hidden xs:inline">Précédent</span>
            </button>
            
            <button
              onClick={addToGlobalTimers}
              aria-label="Ajouter tous les timers de la recette"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <Clock size={16} />
              <span className="hidden sm:inline">Ajouter</span> timers
            </button>
            
            {currentStep === steps.length - 1 && !completedSteps.has(currentStep) ? (
              <button
                onClick={async () => {
                  markStepComplete();
                  // Wait a tick for state to update, then finish cooking
                  setTimeout(() => finishCooking(), 100);
                }}
                disabled={savingStats}
                data-testid="button-complete-cooking"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2.5 text-sm font-bold text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
              >
                <Trophy size={16} />
                {savingStats ? 'Enregistrement...' : 'Terminer la recette !'}
              </button>
            ) : allStepsCompleted ? (
              <button
                onClick={finishCooking}
                disabled={savingStats}
                data-testid="button-finish-recipe"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2.5 text-sm font-bold text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
              >
                <Trophy size={16} />
                {savingStats ? 'Enregistrement...' : 'Terminer la recette !'}
              </button>
            ) : (
              <button
                onClick={() => { markStepComplete(); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90",
                  handsFreeModeActive ? "bg-green-600" : "bg-primary"
                )}
              >
                Suivant
                <SkipForward size={16} />
              </button>
            )}
          </div>
          
          {handsFreeModeActive && (
            <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg py-2 px-3">
              <span className="inline-flex items-center gap-2">
                <Mic size={14} className="text-green-500 animate-pulse" />
                Dites : "suivant", "précédent", "lance le timer", "répète", "terminé"
              </span>
            </div>
          )}
          
          {!handsFreeModeActive && voiceSupported && isListening && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              🎤 À l'écoute... Dites "suivant", "timer", ou "terminé"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
