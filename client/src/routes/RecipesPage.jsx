import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Edit2, Trash2, X, Clock, ChefHat, Share2, Check, Users, Play, Globe, Lock } from 'lucide-react';
import { 
  createRecipe, 
  getUserRecipes, 
  updateRecipe, 
  deleteRecipe,
  shareRecipeToFamily,
  getUserFamily,
  recordRecipeCreated,
  toggleRecipePublic
} from '@/lib/firebase';
import { RecipeCookingMode } from '@/components/RecipeCookingMode';
import { RecipeSuggestions } from '@/components/RecipeSuggestions';
import { MultiCookingMode } from '@/components/MultiCookingMode';
import { RecipeDetailModal } from '@/components/RecipeDetailModal';
import { RecipeWizard } from '@/components/RecipeWizard';

const CATEGORIES = [
  { value: 'entree', label: 'Entrée', emoji: '🥗' },
  { value: 'plat', label: 'Plat principal', emoji: '🍝' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰' },
  { value: 'soupe', label: 'Soupe', emoji: '🍲' },
  { value: 'salade', label: 'Salade', emoji: '🥗' },
  { value: 'aperitif', label: 'Apéritif', emoji: '🧀' },
  { value: 'boisson', label: 'Boisson', emoji: '🍹' },
  { value: 'autre', label: 'Autre', emoji: '🍴' },
];

const DIFFICULTIES = [
  { value: 'facile', label: 'Facile', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  { value: 'moyen', label: 'Moyen', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { value: 'difficile', label: 'Difficile', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
];


export function RecipesPage() {
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showRecipeDetail, setShowRecipeDetail] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [familyData, setFamilyData] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(null);
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [multiCookingRecipes, setMultiCookingRecipes] = useState([]);
  const [showMultiCooking, setShowMultiCooking] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedForCooking, setSelectedForCooking] = useState(new Set());
  const [shareConfirmRecipe, setShareConfirmRecipe] = useState(null);

  const fetchRecipes = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      const [userRecipes, family] = await Promise.all([
        getUserRecipes(currentUser.uid),
        getUserFamily(currentUser.uid)
      ]);
      setRecipes(userRecipes);
      setFamilyData(family);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [currentUser]);

  const handleWizardSubmit = async (formData) => {
    if (!currentUser || !formData.title.trim()) return;
    
    const cleanedIngredients = formData.ingredients.filter(i => i.trim());
    const cleanedSteps = formData.steps
      .filter(s => s.instruction.trim())
      .map((s, i) => ({ ...s, order: i + 1 }));
    
    setSaving(true);
    try {
      const recipeData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        servings: formData.servings,
        difficulty: formData.difficulty,
        emoji: formData.emoji,
        imageUrl: formData.imageUrl,
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
        isPublic: formData.isPublic,
      };
      
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, recipeData);
      } else {
        const newRecipe = await createRecipe({
          authorUserId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.email || 'Utilisateur',
          ...recipeData,
        });
        // Update user stats
        await recordRecipeCreated(currentUser.uid, newRecipe.id, newRecipe.title);
      }
      
      setShowWizard(false);
      setEditingRecipe(null);
      fetchRecipes();
    } catch (err) {
      console.error('Failed to save recipe:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setShowWizard(true);
  };

  const handleDelete = async (recipeId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) return;
    
    try {
      await deleteRecipe(recipeId);
      fetchRecipes();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  const confirmShare = async () => {
    if (!familyData || !currentUser || !shareConfirmRecipe) return;
    
    try {
      await shareRecipeToFamily(familyData.family.id, shareConfirmRecipe.id, currentUser);
      setShareSuccess(shareConfirmRecipe.id);
      setShareConfirmRecipe(null);
      setTimeout(() => setShareSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to share recipe:', err);
    }
  };

  const handleShare = (recipe) => {
    if (!familyData || !currentUser) return;
    setShareConfirmRecipe(recipe);
  };

  const handleTogglePublic = async (recipe) => {
    try {
      await toggleRecipePublic(recipe.id, !recipe.isPublic);
      fetchRecipes();
    } catch (err) {
      console.error('Failed to toggle public status:', err);
    }
  };

  const toggleRecipeSelection = (recipeId) => {
    setSelectedForCooking(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const startMultiCooking = () => {
    const recipesToCook = recipes.filter(r => selectedForCooking.has(r.id));
    if (recipesToCook.length > 0) {
      setMultiCookingRecipes(recipesToCook);
      setShowMultiCooking(true);
      setSelectionMode(false);
      setSelectedForCooking(new Set());
    }
  };

  const closeWizard = () => {
    setShowWizard(false);
    setEditingRecipe(null);
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="mb-6 text-7xl animate-bounce-soft">🔐</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Connexion requise</h2>
        <p className="text-muted-foreground">Connectez-vous avec Google pour gérer vos recettes</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Recettes</h1>
          <p className="text-muted-foreground">{recipes.length} recette{recipes.length !== 1 ? 's' : ''} enregistrée{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {recipes.length > 1 && (
            <>
              {selectionMode ? (
                <>
                  <button
                    onClick={() => { setSelectionMode(false); setSelectedForCooking(new Set()); }}
                    className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <X size={18} />
                    Annuler
                  </button>
                  <button
                    onClick={startMultiCooking}
                    disabled={selectedForCooking.size === 0}
                    data-testid="button-start-multi-cooking"
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground disabled:opacity-50 shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  >
                    <ChefHat size={18} />
                    Cuisiner {selectedForCooking.size} recette{selectedForCooking.size !== 1 ? 's' : ''}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectionMode(true)}
                  data-testid="button-multi-cooking-mode"
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <ChefHat size={18} />
                  Multi-cuisson
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowWizard(true)}
            data-testid="button-add-recipe"
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl"
          >
            <Plus size={20} />
            Ajouter une recette
          </button>
        </div>
      </div>

      {recipes.length > 0 && !selectionMode && (
        <RecipeSuggestions 
          recipes={recipes}
          onSelectRecipe={(recipe) => setShowRecipeDetail(recipe)}
          onStartCooking={(recipe) => setCookingRecipe(recipe)}
        />
      )}

      {selectionMode && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
          <ChefHat className="text-primary" size={24} />
          <p className="text-foreground">
            <strong>Mode multi-cuisson :</strong> Sélectionnez les recettes que vous souhaitez cuisiner ensemble, puis cliquez sur "Cuisiner"
          </p>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-16 animate-in fade-in duration-500">
          <div className="mb-6 text-7xl">📖</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Aucune recette encore</h2>
          <p className="text-muted-foreground mb-6">Commencez par ajouter votre première recette !</p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Créer ma première recette
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 stagger">
          {recipes.map((recipe) => {
            const category = CATEGORIES.find(c => c.value === recipe.category);
            const difficulty = DIFFICULTIES.find(d => d.value === recipe.difficulty);
            const isSelected = selectedForCooking.has(recipe.id);
            
            return (
              <div
                key={recipe.id}
                data-testid={`recipe-card-${recipe.id}`}
                role="button"
                tabIndex={0}
                aria-label={`${selectionMode ? (isSelected ? 'Désélectionner' : 'Sélectionner') : 'Voir'} la recette ${recipe.title}`}
                onClick={() => selectionMode ? toggleRecipeSelection(recipe.id) : setShowRecipeDetail(recipe)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectionMode ? toggleRecipeSelection(recipe.id) : setShowRecipeDetail(recipe);
                  }
                }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  selectionMode && isSelected 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-border hover:border-primary/30"
                )}
              >
                {selectionMode && (
                  <div className={cn(
                    "absolute top-3 left-3 z-20 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-card/80 backdrop-blur-sm border-border"
                  )}>
                    {isSelected && <Check size={16} />}
                  </div>
                )}
                {recipe.imageUrl && (
                  <div className="relative h-52 w-full overflow-hidden">
                    <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                
                <div className="p-5">
                  <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {familyData && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShare(recipe); }}
                        data-testid={`button-share-${recipe.id}`}
                        aria-label="Partager cette recette avec la famille"
                        className={cn(
                          "rounded-xl p-2.5 transition-all backdrop-blur-md",
                          shareSuccess === recipe.id
                            ? "bg-green-500/20 text-green-600"
                            : "bg-card/80 text-primary hover:bg-primary/20"
                        )}
                      >
                        {shareSuccess === recipe.id ? <Check size={16} /> : <Share2 size={16} />}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(recipe); }}
                      data-testid={`button-edit-${recipe.id}`}
                      aria-label="Modifier cette recette"
                      className="rounded-xl bg-card/80 backdrop-blur-md p-2.5 text-primary hover:bg-primary/20 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                      data-testid={`button-delete-${recipe.id}`}
                      aria-label="Supprimer cette recette"
                      className="rounded-xl bg-card/80 backdrop-blur-md p-2.5 text-destructive hover:bg-destructive/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {!recipe.imageUrl && (
                    <div className="mb-4 text-4xl transition-transform group-hover:scale-110 group-hover:rotate-12">{recipe.emoji || category?.emoji || '🍴'}</div>
                  )}
                  
                  <h3 className="text-lg font-bold text-card-foreground mb-2 group-hover:text-primary transition-colors" data-testid={`text-recipe-title-${recipe.id}`}>
                    {recipe.title}
                  </h3>
                  
                  {recipe.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{recipe.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                      {category?.label || 'Autre'}
                    </span>
                    {difficulty && (
                      <span className={cn("rounded-full px-3 py-1.5 text-xs font-medium", difficulty.color)}>
                        {difficulty.label}
                      </span>
                    )}
                    {recipe.prepTime && (
                      <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-foreground">
                        <Clock size={12} />
                        {recipe.prepTime}
                      </span>
                    )}
                    {recipe.steps?.length > 0 && (
                      <span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {recipe.steps.length} étape{recipe.steps.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePublic(recipe); }}
                      data-testid={`button-toggle-public-${recipe.id}`}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1",
                        recipe.isPublic 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:ring-green-500/50"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:ring-amber-500/50"
                      )}
                    >
                      {recipe.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                      {recipe.isPublic ? 'Public' : 'Privé'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showRecipeDetail && (
        <RecipeDetailModal
          recipe={showRecipeDetail}
          onClose={() => setShowRecipeDetail(null)}
          onStartCooking={() => {
            setCookingRecipe(showRecipeDetail);
            setShowRecipeDetail(null);
          }}
          onEdit={() => {
            handleEdit(showRecipeDetail);
            setShowRecipeDetail(null);
          }}
          onShare={familyData ? () => handleShare(showRecipeDetail) : undefined}
          showEditButton={true}
          showShareToFamily={!!familyData}
          showCookingButton={true}
        />
      )}

      <RecipeWizard
        isOpen={showWizard}
        onClose={closeWizard}
        onSubmit={handleWizardSubmit}
        editingRecipe={editingRecipe}
        saving={saving}
      />

      {cookingRecipe && (
        <RecipeCookingMode 
          recipe={cookingRecipe} 
          onClose={() => setCookingRecipe(null)}
        />
      )}

      {showMultiCooking && multiCookingRecipes.length > 0 && (
        <MultiCookingMode 
          recipes={multiCookingRecipes}
          onClose={() => { setShowMultiCooking(false); setMultiCookingRecipes([]); }}
          onRemoveRecipe={(id) => setMultiCookingRecipes(prev => prev.filter(r => r.id !== id))}
        />
      )}

      {shareConfirmRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h2 className="text-xl font-bold text-card-foreground mb-2">Partager avec la famille ?</h2>
              <p className="text-muted-foreground">
                Voulez-vous partager "<span className="font-medium text-foreground">{shareConfirmRecipe.title}</span>" avec {familyData?.family?.name || 'votre famille'} ?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShareConfirmRecipe(null)}
                className="flex-1 rounded-xl border border-border px-4 py-3 font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmShare}
                data-testid="button-confirm-share"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Share2 size={18} />
                Partager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
