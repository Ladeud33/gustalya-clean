import { useState, useMemo, useEffect } from "react";
import { Search, ChevronRight, Clock, Flame, Users, Scale, Play } from "lucide-react";
import { INGREDIENTS, CATEGORIES, CUISSON_MODES, Ingredient } from "@/data";
import { calculateCookingTime, formatTime } from "@/utils";
import { cn } from "@/lib/utils";

function IngredientCard({ ingredient, onClick }: { ingredient: Ingredient; onClick: () => void }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = ingredient.image_url;
  const showImage = imageUrl && !imageError;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-br from-white to-muted/50 dark:from-zinc-800 dark:to-zinc-900 shadow-sm transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
    >
      <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative">
        {showImage ? (
          <img 
            src={imageUrl} 
            alt={`${ingredient.name} - ${ingredient.category}`}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-3xl sm:text-4xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-6">
            {ingredient.emoji}
          </span>
        )}
      </div>
      <div className="p-1.5 sm:p-2 text-center bg-white/50 dark:bg-black/20">
        <span className="text-[11px] sm:text-xs font-semibold text-foreground line-clamp-1 leading-tight">{ingredient.name}</span>
      </div>
    </button>
  );
}

function SelectedIngredientBadge({ ingredient }: { ingredient: Ingredient }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = ingredient.image_url;
  const showImage = imageUrl && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [ingredient.id]);

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 px-3 py-1.5 shadow-sm border border-primary/10">
      {showImage ? (
        <img 
          src={imageUrl} 
          alt={`${ingredient.name} - ${ingredient.category}`}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-2xl sm:text-3xl animate-bounce">{ingredient.emoji}</span>
      )}
      <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[80px] sm:max-w-none">{ingredient.name}</span>
    </div>
  );
}

interface CookingAssistantProps {
  onAddTimer: (name: string, duration: number, category: string) => void;
}

export function CookingAssistant({ onAddTimer }: CookingAssistantProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [weight, setWeight] = useState<number>(0);
  const [people, setPeople] = useState<number>(2);
  const [cookingMode, setCookingMode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIngredients = useMemo(() => {
    return INGREDIENTS.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? ing.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleStartCooking = () => {
    if (!selectedIngredient) return;

    let finalWeight = weight;
    if (finalWeight === 0) {
       // If user didn't input weight, use default or calculate from people
       // For things like rice/pasta, we often calculate per person
       if (["Féculents", "Riz", "Pâtes"].includes(selectedIngredient.category) || ["Riz", "Pâtes"].includes(selectedIngredient.subcategory)) {
         finalWeight = selectedIngredient.defaultWeight * people; // e.g. 60g * 2 people
       } else {
         finalWeight = selectedIngredient.defaultWeight;
       }
    }

    const duration = calculateCookingTime(
      selectedIngredient.baseTime,
      selectedIngredient.defaultWeight,
      finalWeight,
      selectedIngredient.timePer100g,
      cookingMode ? CUISSON_MODES[cookingMode as keyof typeof CUISSON_MODES].multiplier : 1
    );

    const modeLabel = cookingMode ? ` - ${CUISSON_MODES[cookingMode as keyof typeof CUISSON_MODES].label}` : "";
    
    onAddTimer(
      `${selectedIngredient.name}${modeLabel}`,
      duration,
      selectedIngredient.category
    );

    // Reset
    setStep(1);
    setSelectedIngredient(null);
    setCookingMode(null);
    setWeight(0);
  };

  return (
    <div className="w-full mx-auto overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-xl dark:from-zinc-900 dark:to-primary/10">
      <div className="flex h-full flex-col">
        {/* Top Steps Bar - Mobile friendly */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent p-3 sm:p-4 border-b border-primary/10">
          <div className="flex items-center gap-3 sm:gap-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn("flex items-center gap-1.5 sm:gap-2 transition-all duration-300", step >= s ? "text-primary scale-105" : "text-muted-foreground opacity-60")}>
                <div className={cn(
                  "flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm",
                  step === s ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/30 shadow-lg scale-110" :
                  step > s ? "bg-primary/20 text-primary border-2 border-primary" : 
                  "bg-muted text-muted-foreground"
                )}>
                  {step > s ? "✓" : s}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {s === 1 ? "Ingrédient" : s === 2 ? "Quantité" : "Cuisson"}
                </span>
              </div>
            ))}
          </div>
          
          {selectedIngredient && (
            <SelectedIngredientBadge ingredient={selectedIngredient} />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-3 sm:space-y-6">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-lg sm:text-2xl font-bold text-foreground">Que cuisinez-vous ?</h3>
                <p className="text-xs sm:text-base text-muted-foreground">Sélectionnez un ingrédient</p>
              </div>

              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={cn("whitespace-nowrap rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors", !selectedCategory ? "bg-primary text-white shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
                >
                  Tout
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn("whitespace-nowrap rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors", selectedCategory === cat ? "bg-primary text-white shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="w-full rounded-lg sm:rounded-xl border border-input bg-background py-2 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid max-h-[300px] sm:max-h-[400px] grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3 overflow-y-auto pr-1 pb-2">
                {filteredIngredients.map(ing => (
                  <IngredientCard 
                    key={ing.id}
                    ingredient={ing}
                    onClick={() => {
                      setSelectedIngredient(ing);
                      setWeight(ing.defaultWeight);
                      setStep(2);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedIngredient && (
             <div className="space-y-4 sm:space-y-8 animate-in slide-in-from-right-10 fade-in duration-300">
               <div className="space-y-1 sm:space-y-2">
                <h3 className="text-lg sm:text-2xl font-bold text-foreground">Quelle quantité ?</h3>
                <p className="text-xs sm:text-base text-muted-foreground">Adaptez le temps selon le poids</p>
              </div>

              <div className="grid gap-3 sm:gap-6 grid-cols-2">
                 <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-sm">
                    <div className="mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-primary">
                       <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                       <span className="text-xs sm:text-base font-bold">Poids (g)</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <button onClick={() => setWeight(Math.max(0, weight - 50))} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-secondary text-lg sm:text-xl font-bold text-secondary-foreground hover:bg-secondary/80">-</button>
                       <div className="text-center">
                          <span className="text-xl sm:text-3xl font-bold text-foreground">{weight}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">g</span>
                       </div>
                       <button onClick={() => setWeight(weight + 50)} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary text-lg sm:text-xl font-bold text-white hover:bg-primary/90">+</button>
                    </div>
                 </div>

                 <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-sm">
                    <div className="mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-primary">
                       <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                       <span className="text-xs sm:text-base font-bold">Personnes</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <button onClick={() => setPeople(Math.max(1, people - 1))} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-secondary text-lg sm:text-xl font-bold text-secondary-foreground hover:bg-secondary/80">-</button>
                       <div className="text-center">
                          <span className="text-xl sm:text-3xl font-bold text-foreground">{people}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">pers.</span>
                       </div>
                       <button onClick={() => setPeople(people + 1)} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary text-lg sm:text-xl font-bold text-white hover:bg-primary/90">+</button>
                    </div>
                 </div>
              </div>

              <div className="flex justify-between pt-2 sm:pt-4">
                 <button onClick={() => setStep(1)} className="rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Retour</button>
                 <button onClick={() => setStep(3)} className="rounded-lg sm:rounded-xl bg-primary px-5 sm:px-8 py-2 text-sm sm:text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95">Continuer</button>
              </div>
             </div>
          )}

          {step === 3 && selectedIngredient && (
            <div className="space-y-4 sm:space-y-8 animate-in slide-in-from-right-10 fade-in duration-300">
               <div className="space-y-1 sm:space-y-2">
                <h3 className="text-lg sm:text-2xl font-bold text-foreground">Cuisson & Lancement</h3>
                <p className="text-xs sm:text-base text-muted-foreground">Derniers ajustements</p>
              </div>

              {/* Modes de cuisson (si applicable) */}
              {(selectedIngredient.category === "Viandes" || selectedIngredient.name.includes("Saumon") || selectedIngredient.name.includes("Pâtes")) && (
                <div className="space-y-2 sm:space-y-3">
                   <label className="text-xs sm:text-sm font-medium text-muted-foreground">Préférence de cuisson</label>
                   <div className="flex flex-wrap gap-1.5 sm:gap-3">
                      {Object.entries(CUISSON_MODES).map(([key, mode]) => (
                         <button
                            key={key}
                            onClick={() => setCookingMode(key)}
                            className={cn(
                               "rounded-lg sm:rounded-xl border px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all",
                               cookingMode === key 
                                 ? "border-primary bg-primary/10 text-primary shadow-sm" 
                                 : "border-border bg-background text-muted-foreground hover:border-primary/50"
                            )}
                         >
                            {mode.label}
                         </button>
                      ))}
                   </div>
                </div>
              )}

              <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6 border border-primary/10">
                 <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <span className="text-sm sm:text-lg font-medium">Temps estimé</span>
                 </div>
                 <div className="mt-1 sm:mt-2 text-3xl sm:text-5xl font-bold text-primary tracking-tight">
                    {formatTime(calculateCookingTime(
                       selectedIngredient.baseTime, 
                       selectedIngredient.defaultWeight, 
                       weight || selectedIngredient.defaultWeight, 
                       selectedIngredient.timePer100g,
                       cookingMode ? CUISSON_MODES[cookingMode as keyof typeof CUISSON_MODES].multiplier : 1
                    ))}
                 </div>
                 <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                    {weight}g • {selectedIngredient.method} {selectedIngredient.temp ? `@ ${selectedIngredient.temp}°C` : ''}
                 </p>
              </div>

               {selectedIngredient.tips.length > 0 && (
                 <div className="rounded-lg sm:rounded-xl bg-amber-50 p-3 sm:p-4 text-xs sm:text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    <div className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 font-bold">
                       <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                       Conseils du chef
                    </div>
                    <ul className="list-inside list-disc space-y-0.5 sm:space-y-1 opacity-90">
                       {selectedIngredient.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                       ))}
                    </ul>
                 </div>
               )}

              <div className="flex justify-between pt-2 sm:pt-4">
                 <button onClick={() => setStep(2)} className="rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Retour</button>
                 <button 
                    onClick={handleStartCooking}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:from-green-600 hover:to-green-700 active:scale-95"
                 >
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                    Lancer
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
