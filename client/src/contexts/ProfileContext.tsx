import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserProfile, 
  createUserProfile, 
  updateUserProfile,
  type UserProfile,
  ACHIEVEMENTS_CATALOG
} from '../lib/firebase';

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    favoriteIngredients?: string[];
    avoidedIngredients?: string[];
  }) => Promise<void>;
  updateSettings: (settings: {
    language?: string;
    notificationsEnabled?: boolean;
  }) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    return {
      profile: null,
      loading: false,
      error: null,
      refreshProfile: async () => {},
      updateProfile: async () => {},
      updatePreferences: async () => {},
      updateSettings: async () => {},
    };
  }
  return context;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let userProfile = await getUserProfile(currentUser.uid);
      
      if (!userProfile) {
        userProfile = await createUserProfile(currentUser);
      }
      
      if (userProfile && (!userProfile.achievements || userProfile.achievements.length === 0)) {
        userProfile.achievements = ACHIEVEMENTS_CATALOG.map(a => ({
          ...a,
          earnedAt: null,
          progress: 0,
        }));
      }
      
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Impossible de charger le profil');
      setProfile({
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Chef Anonyme',
        bio: '',
        photoUrl: currentUser.photoURL || '',
        cookingLevel: 'debutant',
        dietaryRestrictions: [],
        allergies: [],
        favoriteIngredients: [],
        avoidedIngredients: [],
        language: 'fr',
        notificationsEnabled: true,
        stats: {
          recipesCreated: 0,
          recipesCooked: 0,
          totalCookingTime: 0,
          favoriteRecipeId: null,
        },
        achievements: ACHIEVEMENTS_CATALOG.map(a => ({
          ...a,
          earnedAt: null,
          progress: 0,
        })),
        recentActivity: [],
        savedRecipes: [],
        createdAt: null as any,
        updatedAt: null as any,
      } as UserProfile);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !profile) return;

    try {
      await updateUserProfile(currentUser.uid, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const handleUpdatePreferences = async (preferences: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    favoriteIngredients?: string[];
    avoidedIngredients?: string[];
  }) => {
    await handleUpdateProfile(preferences);
  };

  const handleUpdateSettings = async (settings: {
    language?: string;
    notificationsEnabled?: boolean;
  }) => {
    await handleUpdateProfile(settings);
  };

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    refreshProfile: fetchProfile,
    updateProfile: handleUpdateProfile,
    updatePreferences: handleUpdatePreferences,
    updateSettings: handleUpdateSettings,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
