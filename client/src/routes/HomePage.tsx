import { useState, useMemo, useEffect } from "react";
import { Heart, Clock, ChefHat, Share2, X, Users, Flame, Sparkles, TrendingUp, Star, ArrowRight, Play, Timer, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimers } from "@/App";
import { RecipeCookingMode } from "@/components/RecipeCookingMode";
import { RecipeDetailModal } from "@/components/RecipeDetailModal";
import { GUSTALYA_RECIPES, type GustalyaRecipe } from "@/data/gustalya-recipes";
import { getPublicRecipes, type Recipe as FirebaseRecipe } from "@/lib/firebase";

type Recipe = GustalyaRecipe;

const STATIC_RECIPES: Recipe[] = GUSTALYA_RECIPES;

const CATEGORIES = ['Tous', 'Boissons', 'Entrées', 'Plats', 'Desserts'];

const getCategoryIcon = (cat: string) => {
  switch(cat) {
    case 'Boissons': return '🍸';
    case 'Entrées': return '🥗';
    case 'Plats': return '🍽️';
    case 'Desserts': return '🍰';
    default: return '✨';
  }
};

function normalizeCategory(category: string): 'Entrée' | 'Plat' | 'Dessert' | 'Boisson' {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('entrée') || cat.includes('entree') || cat.includes('apéritif') || cat.includes('appetizer') || cat.includes('starter')) {
    return 'Entrée';
  }
  if (cat.includes('dessert') || cat.includes('sucré') || cat.includes('pâtisserie') || cat.includes('gâteau')) {
    return 'Dessert';
  }
  if (cat.includes('boisson') || cat.includes('cocktail') || cat.includes('drink') || cat.includes('jus') || cat.includes('smoothie')) {
    return 'Boisson';
  }
  return 'Plat';
}

function generateStableLikes(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 80) + 15;
}

function convertFirebaseToRecipe(fbRecipe: FirebaseRecipe, index: number): Recipe {
  return {
    id: 1000 + index,
    title: fbRecipe.title,
    description: fbRecipe.description || '',
    image: fbRecipe.imageUrl || '/placeholder-recipe.jpg',
    time: fbRecipe.prepTime || '30 min',
    servings: fbRecipe.servings || '4 personnes',
    difficulty: (fbRecipe.difficulty as 'Facile' | 'Moyen' | 'Difficile') || 'Moyen',
    category: normalizeCategory(fbRecipe.category || ''),
    likes: generateStableLikes(fbRecipe.id || String(index)),
    author: fbRecipe.authorName,
    emoji: fbRecipe.emoji || '🍽️',
    ingredients: fbRecipe.ingredients || [],
    steps: fbRecipe.steps?.map(s => typeof s === 'string' ? s : s.instruction) || [],
    featured: false,
    isUserRecipe: true,
    firebaseId: fbRecipe.id,
  };
}

export function Home() {
  const timerContext = useTimers();
  const addTimer = timerContext?.addTimer || (() => {});
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [likedRecipes, setLikedRecipes] = useState<Set<number>>(new Set());
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const loadPublicRecipes = async () => {
      try {
        const recipes = await getPublicRecipes(20);
        const converted = recipes.map((r, i) => convertFirebaseToRecipe(r, i));
        setPublicRecipes(converted);
      } catch (error) {
        console.error('Failed to load public recipes:', error);
      }
    };
    loadPublicRecipes();
  }, []);

  const allRecipes = useMemo(() => {
    return [...STATIC_RECIPES, ...publicRecipes];
  }, [publicRecipes]);

  const filteredRecipes = useMemo(() => {
    let recipes = allRecipes;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      recipes = recipes.filter(recipe => 
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.category.toLowerCase().includes(query) ||
        recipe.ingredients?.some(ing => ing.toLowerCase().includes(query))
      );
    }
    
    if (activeCategory !== 'Tous') {
      if (activeCategory === 'Boissons') recipes = recipes.filter(r => r.category === 'Boisson');
      else if (activeCategory === 'Entrées') recipes = recipes.filter(r => r.category === 'Entrée');
      else if (activeCategory === 'Plats') recipes = recipes.filter(r => r.category === 'Plat');
      else if (activeCategory === 'Desserts') recipes = recipes.filter(r => r.category === 'Dessert');
    }
    
    return recipes;
  }, [searchQuery, activeCategory, allRecipes]);

  const featuredRecipe = STATIC_RECIPES.find(r => r.featured) || STATIC_RECIPES[0];
  const trendingRecipes = [...allRecipes].sort((a, b) => b.likes - a.likes).slice(0, 5);

  const toggleLike = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <img 
            src={featuredRecipe.image} 
            alt={featuredRecipe.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>
        
        <div className="relative z-10 px-6 py-16 md:py-24">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>Recette du jour</span>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {featuredRecipe.title}
            </h1>
            
            <p className="text-lg text-white/90 leading-relaxed">
              {featuredRecipe.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="h-5 w-5" />
                <span>{featuredRecipe.time}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <ChefHat className="h-5 w-5" />
                <span>{featuredRecipe.difficulty}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Heart className="h-5 w-5" />
                <span>{featuredRecipe.likes} likes</span>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedRecipe(featuredRecipe)}
              className="group mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-bold text-gray-900 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-100"
            >
              <span>Voir la recette</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-10 right-20 h-40 w-40 rounded-full bg-primary/20 blur-2xl" />
      </section>

      {/* Search Bar */}
      <section className="space-y-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une recette, un ingrédient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-recipes"
            className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-clear-search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground px-1">
            {filteredRecipes.length} recette{filteredRecipes.length !== 1 ? 's' : ''} trouvée{filteredRecipes.length !== 1 ? 's' : ''} pour "{searchQuery}"
          </p>
        )}
      </section>

      {/* Trending Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Tendances</h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {trendingRecipes.map((recipe, index) => (
            <div 
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="group flex-shrink-0 w-72 cursor-pointer overflow-hidden rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={recipe.image} 
                  alt={recipe.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                  <TrendingUp className="h-3 w-3" />
                  #{index + 1}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-card-foreground line-clamp-1">{recipe.title}</h3>
                  <span className="text-xl">{recipe.emoji}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-red-500" />
                    {recipe.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {recipe.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Explorer
        </h2>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 font-medium transition-all duration-300",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-card text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recipe Grid */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 stagger">
          {filteredRecipes.map((recipe) => (
            <article 
              key={recipe.id} 
              onClick={() => setSelectedRecipe(recipe)}
              className="group cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden">
                <img 
                  src={recipe.image} 
                  alt={recipe.title} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                {/* Like button */}
                <button 
                  onClick={(e) => toggleLike(recipe.id, e)}
                  className={cn(
                    "absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full p-1.5 sm:p-2.5 backdrop-blur-md transition-all duration-300",
                    likedRecipes.has(recipe.id) 
                      ? "bg-red-500 text-white scale-110" 
                      : "bg-white/80 text-gray-600 hover:bg-white hover:scale-110 dark:bg-black/50 dark:text-white"
                  )}
                >
                  <Heart className={cn("h-3 w-3 sm:h-4 sm:w-4", likedRecipes.has(recipe.id) && "fill-current")} />
                </button>
                
                {/* Category badge */}
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 rounded-lg sm:rounded-xl bg-black/60 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white backdrop-blur-md">
                  {recipe.category}
                </div>
              </div>
              
              <div className="p-2.5 sm:p-5">
                <div className="flex items-start justify-between gap-1 sm:gap-2">
                  <div className="space-y-0.5 sm:space-y-1 min-w-0">
                    <h3 className="text-sm sm:text-lg font-bold text-card-foreground group-hover:text-primary transition-colors truncate">
                      {recipe.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Par {recipe.author}</p>
                  </div>
                  <span className="text-lg sm:text-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 flex-shrink-0">
                    {recipe.emoji}
                  </span>
                </div>
                
                <p className="hidden sm:block mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                  {recipe.description}
                </p>
                
                <div className="mt-2 sm:mt-4 flex items-center justify-between border-t border-border pt-2 sm:pt-4">
                  <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span>{recipe.time}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                      <ChefHat className="h-4 w-4 text-primary" />
                      <span>{recipe.difficulty}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="hidden sm:block rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={{
            ...selectedRecipe,
            imageUrl: selectedRecipe.image,
          }}
          onClose={() => setSelectedRecipe(null)}
          onStartCooking={() => {
            setCookingRecipe(selectedRecipe);
            setSelectedRecipe(null);
          }}
          isLiked={likedRecipes.has(selectedRecipe.id)}
          onToggleLike={() => toggleLike(selectedRecipe.id)}
          showCookingButton={true}
        />
      )}

      {/* Cooking Mode */}
      {cookingRecipe && (
        <RecipeCookingMode
          recipe={cookingRecipe}
          onClose={() => setCookingRecipe(null)}
          onAddTimer={addTimer}
        />
      )}
    </div>
  );
}
