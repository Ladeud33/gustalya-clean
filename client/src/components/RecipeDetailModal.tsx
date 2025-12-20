import { X, Clock, Users, Heart, Play, Timer, Edit2, Share2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecipeStep {
  instruction: string;
  duration?: string;
  order?: number;
}

interface RecipeDetailModalProps {
  recipe: {
    id: string | number;
    title: string;
    description?: string;
    emoji?: string;
    imageUrl?: string;
    image?: string;
    time?: string;
    prepTime?: string;
    cookTime?: string;
    servings?: number | string;
    difficulty?: string;
    ingredients?: string[];
    steps?: RecipeStep[];
    author?: string;
    sharedBy?: string;
    isPublic?: boolean;
  };
  onClose: () => void;
  onStartCooking?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  showEditButton?: boolean;
  showShareToFamily?: boolean;
  showCookingButton?: boolean;
  showSocialShare?: boolean;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export function RecipeDetailModal({
  recipe,
  onClose,
  onStartCooking,
  onEdit,
  onShare,
  showEditButton = false,
  showShareToFamily = false,
  showCookingButton = true,
  showSocialShare = true,
  isLiked = false,
  onToggleLike,
}: RecipeDetailModalProps) {
  const isMobile = useIsMobile();
  const imageUrl = recipe.imageUrl || recipe.image;
  const time = recipe.prepTime || recipe.time || recipe.cookTime;
  const author = recipe.author || recipe.sharedBy;

  const shareText = encodeURIComponent(
    `🍽️ ${recipe.title}\n\n${recipe.description || ''}\n\n⏱️ ${time || 'N/A'} | 👨‍🍳 ${recipe.difficulty || 'N/A'}\n\n📝 Ingrédients:\n${recipe.ingredients?.join('\n') || ''}\n\nDécouvrez cette recette sur Gustalya !`
  );

  // Version mobile : plein écran natif
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header mobile */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card safe-area-top">
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{recipe.emoji || '🍽️'} {recipe.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{time}</span>}
              {recipe.servings && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{recipe.servings} pers.</span>}
            </div>
          </div>
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Image */}
          {imageUrl && (
            <div className="relative w-full h-64 overflow-hidden">
              <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
          )}

          <div className="p-4 space-y-5">
            {/* Badge difficulté */}
            {recipe.difficulty && (
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                {recipe.difficulty}
              </span>
            )}

            {/* Description */}
            {recipe.description && (
              <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
            )}
            
            {/* Author */}
            {author && (
              <p className="text-sm text-primary">Par {author}</p>
            )}

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  🧺 Ingrédients
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ing, idx) => (
                    <span key={idx} className="rounded-full bg-accent px-3 py-1.5 text-sm text-foreground">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Steps */}
            {recipe.steps && recipe.steps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  👨‍🍳 Préparation
                </h3>
                <ol className="space-y-3">
                  {recipe.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 rounded-xl bg-accent/50 p-4">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {step.order || idx + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-foreground leading-relaxed">{step.instruction}</span>
                        {step.duration && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            <Timer className="h-3 w-3" />
                            {step.duration}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions mobile - 2 lignes */}
        <div className="border-t border-border px-3 py-2 bg-card safe-area-bottom space-y-2">
          {/* Ligne 1: Boutons icônes */}
          <div className="flex justify-center gap-3">
            {onToggleLike && (
              <button
                onClick={onToggleLike}
                data-testid="button-toggle-like"
                className={cn(
                  "flex items-center justify-center rounded-full w-10 h-10 transition-all",
                  isLiked
                    ? "bg-red-500/10 text-red-500"
                    : "border border-border text-muted-foreground hover:bg-accent"
                )}
              >
                <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              </button>
            )}
            
            {showSocialShare && (
              <>
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="button-share-whatsapp"
                  className="flex items-center justify-center rounded-full w-10 h-10 bg-green-500 text-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
                
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="button-share-instagram"
                  className="flex items-center justify-center rounded-full w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </>
            )}

            {showEditButton && onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center justify-center rounded-full w-10 h-10 border border-border text-primary"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            )}

            {showShareToFamily && onShare && (
              <button
                onClick={onShare}
                className="flex items-center justify-center rounded-full w-10 h-10 border border-border text-primary"
              >
                <Share2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Ligne 2: Bouton Cuisiner pleine largeur */}
          {showCookingButton && onStartCooking && (
            <button
              onClick={onStartCooking}
              data-testid="button-start-cooking"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground"
            >
              <Play className="h-5 w-5" />
              <span>Cuisiner</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Version desktop : popup
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Image header */}
        {imageUrl ? (
          <div className="relative h-48 w-full overflow-hidden">
            <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 rounded-full bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{recipe.emoji || '🍽️'}</span>
                <h2 className="text-xl font-bold text-white truncate">{recipe.title}</h2>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/80 flex-wrap">
                {time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {time}
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {recipe.servings} pers.
                  </span>
                )}
                {recipe.difficulty && (
                  <span className="rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-xs text-white">
                    {recipe.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
            <div className="h-16 w-16 rounded-xl bg-accent flex items-center justify-center text-3xl flex-shrink-0">
              {recipe.emoji || '🍽️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{recipe.emoji || '🍽️'}</span>
                <h2 className="text-lg font-bold text-card-foreground truncate">{recipe.title}</h2>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                {time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {time}
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {recipe.servings} pers.
                  </span>
                )}
                {recipe.difficulty && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {recipe.difficulty}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Description */}
          {recipe.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{recipe.description}</p>
          )}
          
          {/* Author */}
          {author && (
            <p className="text-xs text-primary">Par {author}</p>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                🧺 Ingrédients
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.map((ing, idx) => (
                  <span key={idx} className="rounded-full bg-accent/50 px-2.5 py-1 text-xs text-card-foreground">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {recipe.steps && recipe.steps.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
                👨‍🍳 Préparation
              </h3>
              <ol className="space-y-2">
                {recipe.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 rounded-lg bg-accent/30 p-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {step.order || idx + 1}
                    </span>
                    <div className="flex-1 text-sm">
                      <span className="text-card-foreground leading-relaxed">{step.instruction}</span>
                      {step.duration && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Timer className="h-3 w-3" />
                          {step.duration}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border p-3 flex gap-2 bg-card">
          {onToggleLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike();
              }}
              data-testid="button-toggle-like"
              className={cn(
                "flex items-center justify-center rounded-xl px-3 py-2.5 transition-all",
                isLiked
                  ? "bg-red-500/10 text-red-500"
                  : "border border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
            </button>
          )}
          
          {showSocialShare && (
            <>
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-share-whatsapp"
                className="flex items-center justify-center rounded-xl px-3 py-2.5 bg-green-500 text-white hover:bg-green-600 transition-all"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-share-instagram"
                className="flex items-center justify-center rounded-xl px-3 py-2.5 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white hover:opacity-90 transition-all"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </>
          )}

          {showEditButton && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center justify-center rounded-xl px-3 py-2.5 border border-border text-primary hover:bg-primary/10 transition-all"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          )}

          {showShareToFamily && onShare && (
            <button
              onClick={onShare}
              className="flex items-center justify-center rounded-xl px-3 py-2.5 border border-border text-primary hover:bg-primary/10 transition-all"
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}

          {showCookingButton && onStartCooking && (
            <button
              onClick={onStartCooking}
              data-testid="button-start-cooking"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground transition-all hover:opacity-90"
            >
              <Play className="h-5 w-5" />
              Cuisiner
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
