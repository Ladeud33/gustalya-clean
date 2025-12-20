import { useState } from 'react';
import { X, Image, Calendar, Users, Lock, Unlock, BookOpen, Sparkles, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { createMemoryCapsule } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

const RITUAL_FREQUENCIES = [
  { value: 'weekly', label: 'Chaque semaine', icon: '📅' },
  { value: 'monthly', label: 'Chaque mois', icon: '🗓️' },
  { value: 'yearly', label: 'Chaque année', icon: '🎂' },
  { value: 'special', label: 'Occasion spéciale', icon: '✨' },
];

export function MemoryCapsuleModal({ 
  onClose, 
  familyId, 
  currentUser,
  familyMembers = [],
  familyRecipes = [],
  onSuccess 
}) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [eventDate, setEventDate] = useState('');
  const [images, setImages] = useState([]);
  
  const [isTimeLocked, setIsTimeLocked] = useState(false);
  const [unlockDate, setUnlockDate] = useState('');
  
  const [hasRitual, setHasRitual] = useState(false);
  const [ritualFrequency, setRitualFrequency] = useState('yearly');
  const [ritualDescription, setRitualDescription] = useState('');

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleParticipant = (memberName) => {
    setParticipants(prev => 
      prev.includes(memberName) 
        ? prev.filter(p => p !== memberName)
        : [...prev, memberName]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !story.trim()) {
      setError('Veuillez remplir le titre et l\'histoire');
      return;
    }
    
    if (isTimeLocked && !unlockDate) {
      setError('Veuillez définir une date d\'ouverture pour la capsule temporelle');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const capsuleData = {
        familyId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonyme',
        title: title.trim(),
        story: story.trim(),
        images,
        participants,
        isLocked: isTimeLocked,
        ...(selectedRecipe && { 
          recipeId: selectedRecipe.id, 
          recipeTitle: selectedRecipe.title 
        }),
        ...(eventDate && { 
          eventDate: Timestamp.fromDate(new Date(eventDate)) 
        }),
        ...(isTimeLocked && unlockDate && { 
          unlockDate: Timestamp.fromDate(new Date(unlockDate)) 
        }),
        ...(hasRitual && { 
          ritual: {
            frequency: ritualFrequency,
            description: ritualDescription.trim() || `Tradition ${RITUAL_FREQUENCIES.find(f => f.value === ritualFrequency)?.label.toLowerCase()}`,
          }
        }),
      };

      await createMemoryCapsule(capsuleData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to create capsule:', err);
      setError('Erreur lors de la création de la capsule');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return title.trim().length > 0 && story.trim().length > 0;
    return true;
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50",
      isMobile 
        ? "bg-background flex flex-col" 
        : "flex items-center justify-center bg-black/50 p-4"
    )}>
      <div className={cn(
        isMobile 
          ? "flex-1 flex flex-col" 
          : "w-full max-w-lg max-h-[90vh] rounded-2xl bg-card shadow-2xl flex flex-col overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Nouvelle Capsule Mémoire</h2>
              <p className="text-xs text-muted-foreground">Étape {step}/3</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-accent transition-colors"
            data-testid="button-close-capsule-modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-accent">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Titre de la capsule *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: La tarte aux pommes de Mamie"
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-capsule-title"
                />
              </div>

              {/* Story */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Votre histoire *
                </label>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Racontez l'histoire de ce moment, ce souvenir culinaire..."
                  rows={5}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  data-testid="input-capsule-story"
                />
              </div>

              {/* Link to recipe */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Lier à une recette (optionnel)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {familyRecipes.slice(0, 10).map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(selectedRecipe?.id === recipe.id ? null : recipe)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-left transition-colors text-sm",
                        selectedRecipe?.id === recipe.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent/50"
                      )}
                      data-testid={`button-select-recipe-${recipe.id}`}
                    >
                      <span>{recipe.emoji || '🍽️'}</span>
                      <span className="truncate">{recipe.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Image size={16} className="inline mr-2" />
                  Photos (optionnel)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      <Plus size={24} className="text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        data-testid="input-capsule-images"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Users size={16} className="inline mr-2" />
                  Qui était présent ?
                </label>
                <div className="flex flex-wrap gap-2">
                  {familyMembers.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => toggleParticipant(member.username)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        participants.includes(member.username)
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-foreground hover:bg-accent/80"
                      )}
                      data-testid={`button-participant-${member.userId}`}
                    >
                      {member.username}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Date du souvenir (optionnel)
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-capsule-event-date"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Time Lock */}
              <div className="p-4 rounded-xl border border-border bg-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isTimeLocked ? <Lock size={18} className="text-primary" /> : <Unlock size={18} className="text-muted-foreground" />}
                    <span className="font-medium text-foreground">Capsule temporelle</span>
                  </div>
                  <button
                    onClick={() => setIsTimeLocked(!isTimeLocked)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      isTimeLocked ? "bg-primary" : "bg-muted"
                    )}
                    data-testid="toggle-time-lock"
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      isTimeLocked ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Verrouillez cette capsule pour qu'elle s'ouvre à une date future spéciale
                </p>
                {isTimeLocked && (
                  <input
                    type="date"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-unlock-date"
                  />
                )}
              </div>

              {/* Ritual */}
              <div className="p-4 rounded-xl border border-border bg-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className={hasRitual ? "text-primary" : "text-muted-foreground"} />
                    <span className="font-medium text-foreground">Tradition familiale</span>
                  </div>
                  <button
                    onClick={() => setHasRitual(!hasRitual)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      hasRitual ? "bg-primary" : "bg-muted"
                    )}
                    data-testid="toggle-ritual"
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      hasRitual ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Marquez ce souvenir comme une tradition qui se répète
                </p>
                {hasRitual && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {RITUAL_FREQUENCIES.map((freq) => (
                        <button
                          key={freq.value}
                          onClick={() => setRitualFrequency(freq.value)}
                          className={cn(
                            "p-2 rounded-lg border text-sm transition-colors",
                            ritualFrequency === freq.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent/50"
                          )}
                          data-testid={`button-ritual-${freq.value}`}
                        >
                          <span className="mr-1">{freq.icon}</span>
                          {freq.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={ritualDescription}
                      onChange={(e) => setRitualDescription(e.target.value)}
                      placeholder="Décrivez cette tradition..."
                      className="w-full p-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      data-testid="input-ritual-description"
                    />
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/20">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  Aperçu de votre capsule
                </h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Titre:</strong> {title || '-'}</p>
                  <p><strong>Recette liée:</strong> {selectedRecipe?.title || 'Aucune'}</p>
                  <p><strong>Participants:</strong> {participants.length > 0 ? participants.join(', ') : 'Non spécifiés'}</p>
                  <p><strong>Photos:</strong> {images.length}</p>
                  {isTimeLocked && <p><strong>Ouverture:</strong> {unlockDate || 'Date non définie'}</p>}
                  {hasRitual && <p><strong>Tradition:</strong> {RITUAL_FREQUENCIES.find(f => f.value === ritualFrequency)?.label}</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors"
              data-testid="button-capsule-prev"
            >
              Retour
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-colors",
                canProceed()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              data-testid="button-capsule-next"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
                loading 
                  ? "bg-muted text-muted-foreground cursor-wait"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              data-testid="button-capsule-submit"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  Création...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Créer la capsule
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
