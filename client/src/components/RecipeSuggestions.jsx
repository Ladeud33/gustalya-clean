import { useState, useEffect } from 'react';
import { Lightbulb, Clock, ChefHat, Sparkles, X, Play } from 'lucide-react';
import { cn } from '../lib/utils';

const MEAL_SUGGESTIONS = {
  morning: {
    label: 'Petit-déjeuner',
    emoji: '🌅',
    categories: ['dessert', 'boisson'],
    keywords: ['pancake', 'crêpe', 'œuf', 'pain', 'toast', 'café', 'thé', 'smoothie', 'jus', 'yaourt', 'muesli']
  },
  noon: {
    label: 'Déjeuner',
    emoji: '☀️',
    categories: ['plat', 'entree', 'salade'],
    keywords: ['salade', 'sandwich', 'pâtes', 'riz', 'poulet', 'poisson', 'soupe']
  },
  evening: {
    label: 'Dîner',
    emoji: '🌙',
    categories: ['plat', 'soupe'],
    keywords: ['gratin', 'rôti', 'mijote', 'ragoût', 'curry', 'risotto']
  },
  snack: {
    label: 'Goûter/Apéritif',
    emoji: '🍪',
    categories: ['dessert', 'aperitif'],
    keywords: ['gâteau', 'biscuit', 'tarte', 'cookie', 'chips', 'dips']
  }
};

function getMealPeriod() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'snack';
  return 'evening';
}

function scoreSuggestion(recipe, period, availableIngredients = []) {
  let score = 0;
  const periodConfig = MEAL_SUGGESTIONS[period];
  
  if (periodConfig.categories.includes(recipe.category)) {
    score += 20;
  }
  
  const recipeLower = (recipe.title + ' ' + recipe.description + ' ' + (recipe.ingredients || []).join(' ')).toLowerCase();
  periodConfig.keywords.forEach(keyword => {
    if (recipeLower.includes(keyword.toLowerCase())) {
      score += 5;
    }
  });
  
  if (recipe.prepTime && recipe.cookTime) {
    const totalTime = parseInt(recipe.prepTime) + parseInt(recipe.cookTime);
    if (totalTime <= 30) score += 10;
    else if (totalTime <= 60) score += 5;
  }
  
  if (availableIngredients.length > 0 && recipe.ingredients) {
    const matchedIngredients = recipe.ingredients.filter(ing => 
      availableIngredients.some(avail => 
        ing.toLowerCase().includes(avail.toLowerCase()) || 
        avail.toLowerCase().includes(ing.toLowerCase())
      )
    );
    score += matchedIngredients.length * 10;
  }
  
  if (recipe.difficulty === 'facile') score += 5;
  
  return score;
}

export function RecipeSuggestions({ recipes, availableIngredients = [], onSelectRecipe, onStartCooking }) {
  const [period, setPeriod] = useState(getMealPeriod());
  const [suggestions, setSuggestions] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [userIngredients, setUserIngredients] = useState(availableIngredients);
  const [showIngredientInput, setShowIngredientInput] = useState(false);

  useEffect(() => {
    if (!recipes || recipes.length === 0) {
      setSuggestions([]);
      return;
    }

    const scored = recipes.map(recipe => ({
      ...recipe,
      score: scoreSuggestion(recipe, period, userIngredients)
    }));

    scored.sort((a, b) => b.score - a.score);
    setSuggestions(scored.slice(0, 6));
  }, [recipes, period, userIngredients]);

  const addIngredient = (ingredient) => {
    if (ingredient.trim() && !userIngredients.includes(ingredient.trim())) {
      setUserIngredients(prev => [...prev, ingredient.trim()]);
    }
    setIngredientInput('');
  };

  const removeIngredient = (ingredient) => {
    setUserIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const periodConfig = MEAL_SUGGESTIONS[period];

  if (!recipes || recipes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-accent to-accent/50 border border-primary/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" size={24} />
          <h3 className="text-lg font-bold text-foreground">Suggestions du moment</h3>
        </div>
        <div className="flex gap-1">
          {Object.entries(MEAL_SUGGESTIONS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                "px-3 py-1 rounded-full text-sm transition-all",
                period === key 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card/50 text-foreground hover:bg-card"
              )}
            >
              {config.emoji}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {periodConfig.emoji} {periodConfig.label} - Recettes recommandées pour vous
      </p>

      <div className="mb-4">
        <button
          onClick={() => setShowIngredientInput(!showIngredientInput)}
          className="text-sm text-foreground flex items-center gap-1 hover:text-primary"
        >
          <Lightbulb size={16} />
          {showIngredientInput ? 'Masquer' : 'Affiner par ingrédients disponibles'}
        </button>
        
        {showIngredientInput && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIngredient(ingredientInput)}
                placeholder="Ex: poulet, tomates..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <button
                onClick={() => addIngredient(ingredientInput)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
              >
                Ajouter
              </button>
            </div>
            
            {userIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userIngredients.map((ing, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                    {ing}
                    <button 
                      onClick={() => removeIngredient(ing)} 
                      aria-label={`Retirer ${ing}`}
                      className="hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground/60">
          <ChefHat size={40} className="mx-auto mb-2 opacity-50" />
          <p>Ajoutez des recettes pour voir des suggestions personnalisées</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((recipe, idx) => (
            <div
              key={recipe.id || idx}
              role="button"
              tabIndex={0}
              aria-label={`Voir la recette ${recipe.title}`}
              className="group rounded-xl bg-card border border-border p-4 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => onSelectRecipe?.(recipe)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRecipe?.(recipe);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{recipe.emoji || '🍽️'}</span>
                  <div>
                    <h4 className="font-bold text-card-foreground line-clamp-1">{recipe.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(recipe.prepTime || recipe.cookTime) && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {parseInt(recipe.prepTime || 0) + parseInt(recipe.cookTime || 0)} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {idx < 3 && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                    Top {idx + 1}
                  </span>
                )}
              </div>
              
              {recipe.steps?.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onStartCooking?.(recipe); }}
                  className="mt-3 w-full flex items-center justify-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Play size={14} />
                  Cuisiner
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
