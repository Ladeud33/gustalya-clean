import { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Camera, Clock, Users, ChefHat, Sparkles, Globe, Lock, Plus, Trash2, ArrowUp, ArrowDown, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ImageUploader } from '@/components/ImageUploader';
import { RecipeScanner } from '@/components/RecipeScanner';

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
  { value: 'facile', label: 'Facile', emoji: '👶', description: 'Parfait pour débuter' },
  { value: 'moyen', label: 'Moyen', emoji: '👨‍🍳', description: 'Un peu d\'expérience requise' },
  { value: 'difficile', label: 'Difficile', emoji: '🏆', description: 'Pour les chefs confirmés' },
];

const STEPS = [
  { id: 'basics', label: 'L\'essentiel', icon: '📝', description: 'Nom et photo' },
  { id: 'details', label: 'Détails', icon: '⏱️', description: 'Temps et portions' },
  { id: 'ingredients', label: 'Ingrédients', icon: '🥘', description: 'Ce qu\'il vous faut' },
  { id: 'steps', label: 'Préparation', icon: '👨‍🍳', description: 'Les étapes' },
  { id: 'finish', label: 'Finaliser', icon: '✨', description: 'Visibilité et partage' },
];

const initialFormState = {
  title: '',
  description: '',
  category: 'plat',
  prepTime: '',
  cookTime: '',
  servings: '',
  difficulty: 'facile',
  emoji: '🍝',
  imageUrl: '',
  ingredients: [''],
  steps: [{ order: 1, instruction: '', duration: '' }],
  isPublic: false,
};

export function RecipeWizard({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingRecipe = null,
  saving = false 
}) {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [showScanner, setShowScanner] = useState(false);

  // Handle recipe data extracted from scanner
  const handleRecipeExtracted = useCallback((recipeData) => {
    setFormData(prev => ({
      ...prev,
      title: recipeData.title || prev.title,
      description: recipeData.description || prev.description,
      category: recipeData.category || prev.category,
      prepTime: recipeData.prepTime || prev.prepTime,
      cookTime: recipeData.cookTime || prev.cookTime,
      servings: recipeData.servings || prev.servings,
      difficulty: recipeData.difficulty || prev.difficulty,
      ingredients: recipeData.ingredients?.length > 0 
        ? recipeData.ingredients 
        : prev.ingredients,
      steps: recipeData.steps?.length > 0 
        ? recipeData.steps.map((s, i) => ({
            order: i + 1,
            instruction: typeof s === 'string' ? s : s.instruction || '',
            duration: typeof s === 'string' ? '' : s.duration || ''
          }))
        : prev.steps,
    }));
    setShowScanner(false);
  }, []);

  // Prevent body scroll when modal is open on desktop
  useEffect(() => {
    if (isOpen && !isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (editingRecipe) {
      setFormData({
        title: editingRecipe.title || '',
        description: editingRecipe.description || '',
        category: editingRecipe.category || 'plat',
        prepTime: editingRecipe.prepTime || '',
        cookTime: editingRecipe.cookTime || '',
        servings: editingRecipe.servings || '',
        difficulty: editingRecipe.difficulty || 'facile',
        emoji: editingRecipe.emoji || '🍝',
        imageUrl: editingRecipe.imageUrl || '',
        ingredients: editingRecipe.ingredients?.length ? editingRecipe.ingredients : [''],
        steps: editingRecipe.steps?.length ? editingRecipe.steps : [{ order: 1, instruction: '', duration: '' }],
        isPublic: editingRecipe.isPublic || false,
      });
    } else {
      setFormData(initialFormState);
    }
    setCurrentStep(0);
    setErrors({});
  }, [editingRecipe, isOpen]);

  const handleCategoryChange = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    setFormData(prev => ({ 
      ...prev, 
      category,
      emoji: cat?.emoji || '🍴'
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, ''] }));
  };

  const updateIngredient = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.ingredients];
      updated[index] = value;
      return { ...prev, ingredients: updated };
    });
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length === 1) return;
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { order: prev.steps.length + 1, instruction: '', duration: '' }]
    }));
  };

  const updateStep = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.steps];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, steps: updated };
    });
  };

  const removeStep = (index) => {
    if (formData.steps.length === 1) return;
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    }));
  };

  const moveStep = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.steps.length) return;
    
    setFormData(prev => {
      const newSteps = [...prev.steps];
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      return { ...prev, steps: newSteps.map((s, i) => ({ ...s, order: i + 1 })) };
    });
  };

  const validateStep = (stepIndex) => {
    const newErrors = {};
    
    if (stepIndex === 0) {
      if (!formData.title.trim()) {
        newErrors.title = 'Le titre est obligatoire';
      }
    }
    
    if (stepIndex === 2) {
      const hasIngredients = formData.ingredients.some(i => i.trim());
      if (!hasIngredients) {
        newErrors.ingredients = 'Ajoutez au moins un ingrédient';
      }
    }
    
    if (stepIndex === 3) {
      const hasSteps = formData.steps.some(s => s.instruction.trim());
      if (!hasSteps) {
        newErrors.steps = 'Ajoutez au moins une étape de préparation';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateAllSteps = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }
    
    const hasIngredients = formData.ingredients.some(i => i.trim());
    if (!hasIngredients) {
      newErrors.ingredients = 'Ajoutez au moins un ingrédient';
    }
    
    const hasSteps = formData.steps.some(s => s.instruction.trim());
    if (!hasSteps) {
      newErrors.steps = 'Ajoutez au moins une étape de préparation';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateAllSteps()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'basics':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* AI Scanner Card */}
            {!editingRecipe && (
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-primary/50 bg-gradient-to-r from-primary/5 to-amber-500/5 hover:border-primary hover:from-primary/10 hover:to-amber-500/10 transition-all group"
                data-testid="button-open-scanner"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 shadow-lg group-hover:scale-105 transition-transform">
                  <Scan className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-foreground flex items-center gap-2">
                    Scanner une recette
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      IA
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Photographiez une recette pour la remplir automatiquement
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{formData.emoji || '🍽️'}</div>
              <h3 className="text-xl font-bold text-foreground">Commençons par le nom</h3>
              <p className="text-muted-foreground text-sm">Donnez un nom appétissant à votre recette</p>
            </div>

            <div>
              <label htmlFor="recipe-title" className="sr-only">Nom de la recette</label>
              <input
                id="recipe-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Tarte aux pommes de Mamie"
                data-testid="input-recipe-title"
                aria-describedby={errors.title ? "title-error" : undefined}
                aria-invalid={errors.title ? "true" : "false"}
                className={cn(
                  "w-full rounded-2xl border-2 bg-background px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors",
                  errors.title ? "border-red-500" : "border-border focus:border-primary"
                )}
              />
              {errors.title && (
                <span id="title-error" role="alert" className="text-red-500 text-sm mt-2 block">{errors.title}</span>
              )}
            </div>

            <div>
              <label htmlFor="recipe-description" className="block text-sm font-medium text-foreground mb-2">Description (optionnel)</label>
              <textarea
                id="recipe-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Une recette de famille transmise depuis des générations..."
                data-testid="input-recipe-description"
                rows={3}
                className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">📷 Photo de votre création</label>
              <ImageUploader
                value={formData.imageUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Catégorie</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryChange(cat.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                      formData.category === cat.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-xs font-medium truncate w-full text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⏱️</div>
              <h3 className="text-xl font-bold text-foreground">Quelques détails pratiques</h3>
              <p className="text-muted-foreground text-sm">Temps de préparation, portions, difficulté</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Niveau de difficulté</label>
              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, difficulty: diff.value }))}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      formData.difficulty === diff.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-3xl">{diff.emoji}</span>
                    <span className="font-medium text-foreground">{diff.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{diff.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="recipe-preptime" className="block text-sm font-medium text-foreground mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Préparation
                </label>
                <input
                  id="recipe-preptime"
                  type="text"
                  value={formData.prepTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                  placeholder="Ex: 30 min"
                  data-testid="input-recipe-preptime"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="recipe-cooktime" className="block text-sm font-medium text-foreground mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Cuisson
                </label>
                <input
                  id="recipe-cooktime"
                  type="text"
                  value={formData.cookTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookTime: e.target.value }))}
                  placeholder="Ex: 45 min"
                  data-testid="input-recipe-cooktime"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Pour combien de personnes ?
              </label>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, servings: `${num} personnes` }))}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                      formData.servings === `${num} personnes`
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                placeholder="Ou tapez un nombre personnalisé"
                aria-label="Nombre de portions personnalisé"
                data-testid="input-recipe-servings"
                className="w-full mt-3 rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        );

      case 'ingredients':
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🥘</div>
              <h3 className="text-xl font-bold text-foreground">Les ingrédients</h3>
              <p className="text-muted-foreground text-sm">Listez tout ce dont vous avez besoin</p>
            </div>

            <div className="space-y-3">
              {formData.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center animate-in slide-in-from-left duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={ing}
                    onChange={(e) => updateIngredient(i, e.target.value)}
                    placeholder={`Ingrédient ${i + 1} (ex: 200g de farine)`}
                    aria-label={`Ingrédient ${i + 1}`}
                    className="flex-1 rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="rounded-full p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addIngredient}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 py-4 text-primary font-medium hover:bg-primary/5 transition-colors"
            >
              <Plus size={20} />
              Ajouter un ingrédient
            </button>

            {errors.ingredients && (
              <span id="ingredients-error" role="alert" className="text-red-500 text-sm text-center mt-2 block">{errors.ingredients}</span>
            )}
          </div>
        );

      case 'steps':
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👨‍🍳</div>
              <h3 className="text-xl font-bold text-foreground">Les étapes de préparation</h3>
              <p className="text-muted-foreground text-sm">Guidez pas à pas vers la réussite</p>
            </div>

            <div className="space-y-4">
              {formData.steps.map((step, i) => (
                <div key={i} className="rounded-2xl border-2 border-border bg-card p-4 animate-in slide-in-from-left duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="font-medium text-foreground flex-1">Étape {i + 1}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveStep(i, 'up')}
                        disabled={i === 0}
                        className="rounded p-1.5 text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(i, 'down')}
                        disabled={i === formData.steps.length - 1}
                        className="rounded p-1.5 text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown size={16} />
                      </button>
                      {formData.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(i)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={step.instruction}
                    onChange={(e) => updateStep(i, 'instruction', e.target.value)}
                    placeholder="Décrivez cette étape en détail..."
                    aria-label={`Instructions de l'étape ${i + 1}`}
                    rows={3}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none resize-none"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Clock size={16} className="text-muted-foreground" aria-hidden="true" />
                    <input
                      type="text"
                      value={step.duration || ''}
                      onChange={(e) => updateStep(i, 'duration', e.target.value)}
                      placeholder="Durée (ex: 5 min)"
                      aria-label={`Durée de l'étape ${i + 1}`}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addStep}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 py-4 text-primary font-medium hover:bg-primary/5 transition-colors"
            >
              <Plus size={20} />
              Ajouter une étape
            </button>

            {errors.steps && (
              <span id="steps-error" role="alert" className="text-red-500 text-sm text-center mt-2 block">{errors.steps}</span>
            )}
          </div>
        );

      case 'finish':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">✨</div>
              <h3 className="text-xl font-bold text-foreground">Presque terminé !</h3>
              <p className="text-muted-foreground text-sm">Choisissez qui peut voir votre recette</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                  !formData.isPublic
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Recette privée</p>
                  <p className="text-sm text-muted-foreground">Visible uniquement par vous</p>
                </div>
                {!formData.isPublic && (
                  <Check className="h-6 w-6 text-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                  formData.isPublic
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Recette publique</p>
                  <p className="text-sm text-muted-foreground">Partagez avec la communauté Gustalya</p>
                </div>
                {formData.isPublic && (
                  <Check className="h-6 w-6 text-primary" />
                )}
              </button>
            </div>

            {/* Validation errors summary */}
            {(errors.title || errors.ingredients || errors.steps) && (
              <div role="alert" aria-live="polite" className="rounded-xl border-2 border-red-300 bg-red-50 dark:bg-red-950/30 p-4">
                <p className="font-medium text-red-600 dark:text-red-400 mb-2">Vérifiez votre recette :</p>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {errors.title && (
                    <li className="flex items-center gap-2">
                      <span>•</span>
                      <button type="button" onClick={() => setCurrentStep(0)} className="underline hover:no-underline">
                        {errors.title}
                      </button>
                    </li>
                  )}
                  {errors.ingredients && (
                    <li className="flex items-center gap-2">
                      <span>•</span>
                      <button type="button" onClick={() => setCurrentStep(2)} className="underline hover:no-underline">
                        {errors.ingredients}
                      </button>
                    </li>
                  )}
                  {errors.steps && (
                    <li className="flex items-center gap-2">
                      <span>•</span>
                      <button type="button" onClick={() => setCurrentStep(3)} className="underline hover:no-underline">
                        {errors.steps}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview card */}
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Aperçu de votre recette</p>
              <div className="rounded-2xl border-2 border-border overflow-hidden bg-card">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt={formData.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-5xl">{formData.emoji}</span>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-bold text-foreground text-lg">{formData.title || 'Votre recette'}</h4>
                  <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                    {formData.prepTime && <span>⏱️ {formData.prepTime}</span>}
                    {formData.servings && <span>👥 {formData.servings}</span>}
                    {formData.difficulty && <span>📊 {DIFFICULTIES.find(d => d.value === formData.difficulty)?.label}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {formData.ingredients.filter(i => i.trim()).length} ingrédients
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {formData.steps.filter(s => s.instruction.trim()).length} étapes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100]",
        isMobile 
          ? "bg-background" 
          : "grid place-items-center bg-black/50 p-8"
      )}
    >
      <div 
        className={cn(
          "bg-card flex flex-col",
          isMobile 
            ? "h-full w-full animate-in slide-in-from-right duration-300" 
            : "w-full max-w-lg max-h-[calc(100vh-100px)] rounded-2xl shadow-2xl animate-in zoom-in-95 border border-border"
        )}
      >
        {/* Header with progress */}
        <div className="flex-shrink-0 border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <button 
              onClick={currentStep === 0 ? onClose : handlePrev}
              className="rounded-full p-2 text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h2 className="font-bold text-foreground">
                {editingRecipe ? 'Modifier la recette' : 'Nouvelle recette'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {STEPS[currentStep].icon} {STEPS[currentStep].label} - {STEPS[currentStep].description}
              </p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-border">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex px-4 py-3 gap-1">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  index < currentStep ? "bg-primary cursor-pointer" :
                  index === currentStep ? "bg-primary" :
                  "bg-border"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border p-4 bg-card safe-area-bottom">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 font-medium text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft size={18} />
                Retour
              </button>
            )}
            
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continuer
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !formData.title.trim()}
                data-testid="button-save-recipe"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    {editingRecipe ? 'Modifier' : 'Créer ma recette'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recipe Scanner Modal */}
      <RecipeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onRecipeExtracted={handleRecipeExtracted}
      />
    </div>
  );
}
