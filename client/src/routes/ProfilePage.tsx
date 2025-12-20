import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { 
  User, Camera, Edit3, Save, X, ChefHat, Clock, BookOpen, Heart,
  Award, Settings, Bell, Globe, LogOut, Plus, Trash2, Check,
  TrendingUp, Calendar, Star, Shield, Utensils
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  COOKING_LEVELS, 
  DIETARY_OPTIONS, 
  COMMON_ALLERGIES,
  type UserProfile 
} from '@/lib/firebase';

export function ProfilePage() {
  const { currentUser, logout, login } = useAuth();
  const { profile, loading, updateProfile, updatePreferences, updateSettings } = useProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'achievements' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    cookingLevel: 'debutant' as UserProfile['cookingLevel'],
  });

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="profile-login-required">
        <div className="text-center space-y-6 p-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Connexion requise</h2>
            <p className="text-muted-foreground">Connectez-vous pour accéder à votre profil</p>
          </div>
          <button
            onClick={login}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            data-testid="button-login"
          >
            <User className="w-5 h-5" />
            Se connecter avec Google
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="profile-loading">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const startEditing = () => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        cookingLevel: profile.cookingLevel || 'debutant',
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveProfile = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const formatCookingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'preferences', label: 'Préférences', icon: Utensils },
    { id: 'achievements', label: 'Badges', icon: Award },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ] as const;

  const earnedAchievements = profile?.achievements?.filter(a => a.earnedAt) || [];
  const inProgressAchievements = profile?.achievements?.filter(a => !a.earnedAt && a.progress > 0) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300" data-testid="profile-page">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-card shadow-xl">
              {profile?.photoUrl ? (
                <img 
                  src={profile.photoUrl} 
                  alt={profile.displayName} 
                  className="w-full h-full object-cover"
                  data-testid="img-profile-photo"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
            </div>
            <button 
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="button-change-photo"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full md:w-auto text-2xl font-bold bg-card border border-border rounded-xl px-4 py-2 text-foreground"
                  placeholder="Votre nom"
                  data-testid="input-display-name"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-4 py-2 text-foreground resize-none"
                  placeholder="Décrivez votre passion pour la cuisine..."
                  rows={2}
                  data-testid="input-bio"
                />
                <select
                  value={editForm.cookingLevel}
                  onChange={(e) => setEditForm({ ...editForm, cookingLevel: e.target.value as UserProfile['cookingLevel'] })}
                  className="bg-card border border-border rounded-xl px-4 py-2 text-foreground"
                  data-testid="select-cooking-level"
                >
                  {COOKING_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.icon} {level.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-display-name">
                  {profile?.displayName || 'Chef Anonyme'}
                </h1>
                {profile?.bio && (
                  <p className="text-muted-foreground mt-1" data-testid="text-bio">{profile.bio}</p>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  {profile?.cookingLevel && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium" data-testid="text-cooking-level">
                      {COOKING_LEVELS.find(l => l.value === profile.cookingLevel)?.icon}
                      {COOKING_LEVELS.find(l => l.value === profile.cookingLevel)?.label}
                    </span>
                  )}
                  {earnedAchievements.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">
                      <Award className="w-4 h-4" />
                      {earnedAchievements.length} badge{earnedAchievements.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={saveProfile}
                  className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  data-testid="button-save-profile"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={cancelEditing}
                  className="p-3 bg-card border border-border text-foreground rounded-xl hover:bg-accent transition-colors"
                  data-testid="button-cancel-edit"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={startEditing}
                className="p-3 bg-card border border-border text-foreground rounded-xl hover:bg-accent transition-colors"
                data-testid="button-edit-profile"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard 
            icon={BookOpen} 
            label="Recettes créées" 
            value={profile?.stats?.recipesCreated || 0} 
            color="text-blue-500"
          />
          <StatCard 
            icon={ChefHat} 
            label="Recettes cuisinées" 
            value={profile?.stats?.recipesCooked || 0}
            color="text-green-500"
          />
          <StatCard 
            icon={Clock} 
            label="Temps en cuisine" 
            value={formatCookingTime(profile?.stats?.totalCookingTime || 0)}
            color="text-amber-500"
          />
          <StatCard 
            icon={Heart} 
            label="Recettes sauvées" 
            value={profile?.savedRecipes?.length || 0}
            color="text-red-500"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 p-1 bg-card rounded-2xl border border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        {activeTab === 'profile' && <ProfileTab profile={profile} />}
        {activeTab === 'preferences' && (
          <PreferencesTab 
            profile={profile} 
            onUpdate={updatePreferences}
          />
        )}
        {activeTab === 'achievements' && <AchievementsTab profile={profile} />}
        {activeTab === 'settings' && (
          <SettingsTab 
            profile={profile} 
            onUpdate={updateSettings}
            onLogout={logout}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-card/50 backdrop-blur rounded-2xl p-4 text-center border border-border/50" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ProfileTab({ profile }: { profile: UserProfile | null }) {
  const recentActivity = profile?.recentActivity || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Activité récente
        </h3>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune activité récente</p>
            <p className="text-sm mt-1">Commencez à cuisiner pour voir votre historique ici !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-4 p-3 bg-accent/50 rounded-xl"
                data-testid={`activity-${activity.id}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'cooked' ? 'bg-green-500/20 text-green-500' :
                  activity.type === 'created' ? 'bg-blue-500/20 text-blue-500' :
                  activity.type === 'shared' ? 'bg-purple-500/20 text-purple-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {activity.type === 'cooked' && <ChefHat className="w-5 h-5" />}
                  {activity.type === 'created' && <Plus className="w-5 h-5" />}
                  {activity.type === 'shared' && <Heart className="w-5 h-5" />}
                  {activity.type === 'saved' && <Star className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{activity.recipeTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.type === 'cooked' && 'Recette cuisinée'}
                    {activity.type === 'created' && 'Recette créée'}
                    {activity.type === 'shared' && 'Recette partagée'}
                    {activity.type === 'saved' && 'Recette sauvegardée'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreferencesTab({ profile, onUpdate }: { 
  profile: UserProfile | null;
  onUpdate: (prefs: Partial<UserProfile>) => Promise<void>;
}) {
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(profile?.dietaryRestrictions || []);
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const [favoriteIngredient, setFavoriteIngredient] = useState('');
  const [avoidedIngredient, setAvoidedIngredient] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleDietary = async (option: string) => {
    const newList = dietaryRestrictions.includes(option)
      ? dietaryRestrictions.filter(d => d !== option)
      : [...dietaryRestrictions, option];
    setDietaryRestrictions(newList);
    try {
      await onUpdate({ dietaryRestrictions: newList });
    } catch (error) {
      console.error('Error updating dietary restrictions:', error);
    }
  };

  const toggleAllergy = async (allergy: string) => {
    const newList = allergies.includes(allergy)
      ? allergies.filter(a => a !== allergy)
      : [...allergies, allergy];
    setAllergies(newList);
    try {
      await onUpdate({ allergies: newList });
    } catch (error) {
      console.error('Error updating allergies:', error);
    }
  };

  const addFavoriteIngredient = async () => {
    if (!favoriteIngredient.trim()) return;
    const newList = [...(profile?.favoriteIngredients || []), favoriteIngredient.trim()];
    try {
      await onUpdate({ favoriteIngredients: newList });
      setFavoriteIngredient('');
    } catch (error) {
      console.error('Error adding favorite ingredient:', error);
    }
  };

  const removeFavoriteIngredient = async (ingredient: string) => {
    const newList = (profile?.favoriteIngredients || []).filter(i => i !== ingredient);
    try {
      await onUpdate({ favoriteIngredients: newList });
    } catch (error) {
      console.error('Error removing favorite ingredient:', error);
    }
  };

  const addAvoidedIngredient = async () => {
    if (!avoidedIngredient.trim()) return;
    const newList = [...(profile?.avoidedIngredients || []), avoidedIngredient.trim()];
    try {
      await onUpdate({ avoidedIngredients: newList });
      setAvoidedIngredient('');
    } catch (error) {
      console.error('Error adding avoided ingredient:', error);
    }
  };

  const removeAvoidedIngredient = async (ingredient: string) => {
    const newList = (profile?.avoidedIngredients || []).filter(i => i !== ingredient);
    try {
      await onUpdate({ avoidedIngredients: newList });
    } catch (error) {
      console.error('Error removing avoided ingredient:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary" />
          Régimes alimentaires
        </h3>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => toggleDietary(option)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dietaryRestrictions.includes(option)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-foreground hover:bg-accent/80'
              }`}
              data-testid={`dietary-${option.toLowerCase().replace(/\s/g, '-')}`}
            >
              {dietaryRestrictions.includes(option) && <Check className="w-4 h-4 inline mr-1" />}
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          Allergies
        </h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGIES.map(allergy => (
            <button
              key={allergy}
              onClick={() => toggleAllergy(allergy)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                allergies.includes(allergy)
                  ? 'bg-red-500 text-white'
                  : 'bg-accent text-foreground hover:bg-accent/80'
              }`}
              data-testid={`allergy-${allergy.toLowerCase().replace(/\s/g, '-')}`}
            >
              {allergies.includes(allergy) && <Check className="w-4 h-4 inline mr-1" />}
              {allergy}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-green-500" />
          Ingrédients favoris
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(profile?.favoriteIngredients || []).map(ingredient => (
            <span
              key={ingredient}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm"
            >
              {ingredient}
              <button 
                onClick={() => removeFavoriteIngredient(ingredient)}
                className="hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={favoriteIngredient}
            onChange={(e) => setFavoriteIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFavoriteIngredient()}
            placeholder="Ajouter un ingrédient..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground"
            data-testid="input-favorite-ingredient"
          />
          <button
            onClick={addFavoriteIngredient}
            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            data-testid="button-add-favorite"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <X className="w-5 h-5 text-red-500" />
          Ingrédients à éviter
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(profile?.avoidedIngredients || []).map(ingredient => (
            <span
              key={ingredient}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-sm"
            >
              {ingredient}
              <button 
                onClick={() => removeAvoidedIngredient(ingredient)}
                className="hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={avoidedIngredient}
            onChange={(e) => setAvoidedIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAvoidedIngredient()}
            placeholder="Ajouter un ingrédient..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground"
            data-testid="input-avoided-ingredient"
          />
          <button
            onClick={addAvoidedIngredient}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            data-testid="button-add-avoided"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AchievementsTab({ profile }: { profile: UserProfile | null }) {
  const achievements = profile?.achievements || [];
  const earnedCount = achievements.filter(a => a.earnedAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Vos accomplissements
        </h3>
        <span className="text-sm text-muted-foreground">
          {earnedCount}/{achievements.length} débloqués
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map(achievement => {
          const isEarned = !!achievement.earnedAt;
          const progress = Math.min((achievement.progress / achievement.target) * 100, 100);

          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-2xl border transition-all ${
                isEarned 
                  ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/30' 
                  : 'bg-accent/50 border-border opacity-70'
              }`}
              data-testid={`achievement-${achievement.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-3xl ${isEarned ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {achievement.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  
                  {!isEarned && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progression</span>
                        <span>{achievement.progress}/{achievement.target}</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {isEarned && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Check className="w-3 h-3" />
                      Débloqué
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsTab({ profile, onUpdate, onLogout }: { 
  profile: UserProfile | null;
  onUpdate: (settings: Partial<UserProfile>) => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [notifications, setNotifications] = useState(profile?.notificationsEnabled ?? true);

  const toggleNotifications = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    try {
      await onUpdate({ notificationsEnabled: newValue });
    } catch (error) {
      console.error('Error updating notifications:', error);
      setNotifications(!newValue);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Paramètres de l'application
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Notifications</p>
                <p className="text-sm text-muted-foreground">Recevoir des alertes pour les timers</p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                notifications ? 'bg-primary' : 'bg-border'
              }`}
              data-testid="toggle-notifications"
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                notifications ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Thème</p>
                <p className="text-sm text-muted-foreground">Choisir le mode clair ou sombre</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Langue</p>
                <p className="text-sm text-muted-foreground">Français</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">🇫🇷 FR</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
