import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  type Timestamp
} from "firebase/firestore";

import { getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export interface Family {
  id?: string;
  name: string;
  ownerUserId: string;
  inviteCode: string;
  createdAt: Timestamp;
}

export interface FamilyMember {
  id?: string;
  familyId: string;
  userId: string;
  username: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
}

export interface RecipeStep {
  order: number;
  instruction: string;
  duration?: string;
}

export interface Recipe {
  id?: string;
  authorUserId: string;
  authorName: string;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  difficulty?: string;
  emoji?: string;
  ingredients?: string[];
  steps?: RecipeStep[];
  isPublic?: boolean;
  createdAt: Timestamp;
}

export interface FamilyRecipe {
  id?: string;
  familyId: string;
  recipeId: string;
  sharedByUserId: string;
  sharedByName: string;
  sharedAt: Timestamp;
}

export interface FamilyMessage {
  id?: string;
  familyId: string;
  authorUserId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createFamily(name: string, user: User): Promise<Family> {
  const inviteCode = generateInviteCode();
  const familyData = {
    name,
    ownerUserId: user.uid,
    inviteCode,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "families"), familyData);
  
  await addDoc(collection(db, "familyMembers"), {
    familyId: docRef.id,
    userId: user.uid,
    username: user.displayName || user.email || 'Utilisateur',
    role: 'owner',
    joinedAt: serverTimestamp(),
  });
  
  return { id: docRef.id, ...familyData } as Family;
}

export async function getFamilyByCode(code: string): Promise<Family | null> {
  const q = query(collection(db, "families"), where("inviteCode", "==", code.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Family;
}

export async function joinFamily(familyId: string, user: User): Promise<FamilyMember> {
  const q = query(
    collection(db, "familyMembers"),
    where("familyId", "==", familyId),
    where("userId", "==", user.uid)
  );
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    const doc = existing.docs[0];
    return { id: doc.id, ...doc.data() } as FamilyMember;
  }
  
  const memberData = {
    familyId,
    userId: user.uid,
    username: user.displayName || user.email || 'Utilisateur',
    role: 'member' as const,
    joinedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "familyMembers"), memberData);
  return { id: docRef.id, ...memberData } as FamilyMember;
}

export async function getUserFamily(userId: string): Promise<{ family: Family; member: FamilyMember } | null> {
  const q = query(collection(db, "familyMembers"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const memberDoc = snapshot.docs[0];
  const member = { id: memberDoc.id, ...memberDoc.data() } as FamilyMember;
  
  const familyDoc = await getDoc(doc(db, "families", member.familyId));
  if (!familyDoc.exists()) return null;
  
  const family = { id: familyDoc.id, ...familyDoc.data() } as Family;
  return { family, member };
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const q = query(collection(db, "familyMembers"), where("familyId", "==", familyId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember));
}

// Helper to remove undefined fields (Firestore rejects undefined values)
function cleanUndefined<T extends object>(obj: T): T {
  const cleaned = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (cleaned as any)[key] = value;
    }
  }
  return cleaned;
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
  const recipeData = cleanUndefined({
    ...recipe,
    isPublic: recipe.isPublic ?? false,
    prepTime: recipe.prepTime || '',
    cookTime: recipe.cookTime || '',
    imageUrl: recipe.imageUrl || '',
    createdAt: serverTimestamp(),
  });
  
  const docRef = await addDoc(collection(db, "recipes"), recipeData);
  return { id: docRef.id, ...recipeData } as Recipe;
}

export async function getUserRecipes(userId: string): Promise<Recipe[]> {
  const q = query(
    collection(db, "recipes"),
    where("authorUserId", "==", userId)
  );
  const snapshot = await getDocs(q);
  
  const recipes = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Recipe));
  return recipes.sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() || 0;
    const dateB = b.createdAt?.toMillis?.() || 0;
    return dateB - dateA;
  });
}

export async function updateRecipe(recipeId: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt' | 'authorUserId' | 'authorName'>>): Promise<void> {
  const recipeRef = doc(db, "recipes", recipeId);
  await updateDoc(recipeRef, cleanUndefined(updates));
}

export async function toggleRecipePublic(recipeId: string, isPublic: boolean): Promise<void> {
  const recipeRef = doc(db, "recipes", recipeId);
  await updateDoc(recipeRef, { isPublic });
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const recipeRef = doc(db, "recipes", recipeId);
  await deleteDoc(recipeRef);
  
  const familyRecipesQuery = query(collection(db, "familyRecipes"), where("recipeId", "==", recipeId));
  const familyRecipes = await getDocs(familyRecipesQuery);
  for (const docSnap of familyRecipes.docs) {
    await deleteDoc(docSnap.ref);
  }
}

export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  const recipeRef = doc(db, "recipes", recipeId);
  const recipeDoc = await getDoc(recipeRef);
  
  if (!recipeDoc.exists()) return null;
  return { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
}

export async function shareRecipeToFamily(familyId: string, recipeId: string, user: User): Promise<FamilyRecipe> {
  const shareData = {
    familyId,
    recipeId,
    sharedByUserId: user.uid,
    sharedByName: user.displayName || user.email || 'Utilisateur',
    sharedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "familyRecipes"), shareData);
  return { id: docRef.id, ...shareData } as FamilyRecipe;
}

export async function getFamilyRecipes(familyId: string): Promise<(Recipe & { sharedBy: string })[]> {
  const q = query(
    collection(db, "familyRecipes"),
    where("familyId", "==", familyId)
  );
  const snapshot = await getDocs(q);
  
  const recipes: (Recipe & { sharedBy: string })[] = [];
  
  for (const shareDoc of snapshot.docs) {
    const share = shareDoc.data() as FamilyRecipe;
    const recipeDoc = await getDoc(doc(db, "recipes", share.recipeId));
    
    if (recipeDoc.exists()) {
      const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
      recipes.push({ ...recipe, sharedBy: share.sharedByName });
    }
  }
  
  return recipes;
}

export async function sendFamilyMessage(familyId: string, content: string, user: User): Promise<FamilyMessage> {
  const messageData = {
    familyId,
    authorUserId: user.uid,
    authorName: user.displayName || user.email || 'Utilisateur',
    content,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, "familyMessages"), messageData);
  return { id: docRef.id, ...messageData } as FamilyMessage;
}

export async function getFamilyMessages(familyId: string): Promise<FamilyMessage[]> {
  const q = query(
    collection(db, "familyMessages"),
    where("familyId", "==", familyId)
  );
  const snapshot = await getDocs(q);
  
  const messages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as FamilyMessage));
  return messages.sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() || 0;
    const dateB = b.createdAt?.toMillis?.() || 0;
    return dateB - dateA;
  });
}

export async function getFamilyStats(familyId: string): Promise<{ memberCount: number; recipeCount: number; messageCount: number }> {
  const [members, recipes, messages] = await Promise.all([
    getDocs(query(collection(db, "familyMembers"), where("familyId", "==", familyId))),
    getDocs(query(collection(db, "familyRecipes"), where("familyId", "==", familyId))),
    getDocs(query(collection(db, "familyMessages"), where("familyId", "==", familyId))),
  ]);
  
  return {
    memberCount: members.size,
    recipeCount: recipes.size,
    messageCount: messages.size,
  };
}

// ============ USER PROFILE ============

export interface UserProfile {
  id?: string;
  userId: string;
  displayName: string;
  bio: string;
  photoUrl: string;
  cookingLevel: 'debutant' | 'intermediaire' | 'avance' | 'expert';
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteIngredients: string[];
  avoidedIngredients: string[];
  language: string;
  notificationsEnabled: boolean;
  stats: {
    recipesCreated: number;
    recipesCooked: number;
    totalCookingTime: number;
    favoriteRecipeId: string | null;
  };
  achievements: Achievement[];
  recentActivity: ActivityEntry[];
  savedRecipes: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Timestamp | null;
  progress: number;
  target: number;
}

export interface ActivityEntry {
  id: string;
  type: 'cooked' | 'created' | 'shared' | 'saved';
  recipeId: string;
  recipeTitle: string;
  timestamp: Timestamp;
}

export const ACHIEVEMENTS_CATALOG: Omit<Achievement, 'earnedAt' | 'progress'>[] = [
  { id: 'first_recipe', name: 'Première Recette', description: 'Créez votre première recette', icon: '🎉', target: 1 },
  { id: 'chef_5', name: 'Chef Débutant', description: 'Créez 5 recettes', icon: '👨‍🍳', target: 5 },
  { id: 'chef_10', name: 'Chef Confirmé', description: 'Créez 10 recettes', icon: '🧑‍🍳', target: 10 },
  { id: 'chef_25', name: 'Chef Expert', description: 'Créez 25 recettes', icon: '👩‍🍳', target: 25 },
  { id: 'cook_10', name: 'Cuisinier Actif', description: 'Cuisinez 10 recettes', icon: '🍳', target: 10 },
  { id: 'cook_50', name: 'Passionné de Cuisine', description: 'Cuisinez 50 recettes', icon: '🔥', target: 50 },
  { id: 'timer_master', name: 'Maître du Timing', description: 'Utilisez les timers 20 fois', icon: '⏱️', target: 20 },
  { id: 'family_member', name: 'Membre de Famille', description: 'Rejoignez une famille', icon: '👨‍👩‍👧‍👦', target: 1 },
  { id: 'share_5', name: 'Partageur', description: 'Partagez 5 recettes avec votre famille', icon: '🤝', target: 5 },
  { id: 'collector', name: 'Collectionneur', description: 'Sauvegardez 10 recettes', icon: '📚', target: 10 },
];

export const COOKING_LEVELS = [
  { value: 'debutant', label: 'Débutant', icon: '🥄', description: 'Je commence à cuisiner' },
  { value: 'intermediaire', label: 'Intermédiaire', icon: '🍳', description: 'Je maîtrise les bases' },
  { value: 'avance', label: 'Avancé', icon: '👨‍🍳', description: 'Je cuisine régulièrement' },
  { value: 'expert', label: 'Expert', icon: '⭐', description: 'La cuisine n\'a plus de secrets' },
];

export const DIETARY_OPTIONS = [
  'Végétarien', 'Végétalien', 'Sans gluten', 'Sans lactose', 
  'Halal', 'Casher', 'Pescétarien', 'Flexitarien', 'Keto', 'Paléo'
];

export const COMMON_ALLERGIES = [
  'Arachides', 'Fruits à coque', 'Lait', 'Œufs', 'Poisson', 
  'Crustacés', 'Soja', 'Blé', 'Sésame', 'Moutarde', 'Céleri', 'Sulfites'
];

function getDefaultProfile(userId: string, user: User): Omit<UserProfile, 'id'> {
  const achievements: Achievement[] = ACHIEVEMENTS_CATALOG.map(a => ({
    ...a,
    earnedAt: null,
    progress: 0,
  }));

  return {
    userId,
    displayName: user.displayName || 'Chef Anonyme',
    bio: '',
    photoUrl: user.photoURL || '',
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
    achievements,
    recentActivity: [],
    savedRecipes: [],
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const profileRef = doc(db, "userProfiles", userId);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) return null;
  return { id: profileDoc.id, ...profileDoc.data() } as UserProfile;
}

export async function createUserProfile(user: User): Promise<UserProfile> {
  const profileRef = doc(db, "userProfiles", user.uid);
  const existingProfile = await getDoc(profileRef);
  
  if (existingProfile.exists()) {
    return { id: existingProfile.id, ...existingProfile.data() } as UserProfile;
  }
  
  const profileData = getDefaultProfile(user.uid, user);
  await updateDoc(profileRef, profileData).catch(async () => {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(profileRef, profileData);
  });
  
  return { id: user.uid, ...profileData } as UserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const profileRef = doc(db, "userProfiles", userId);
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function updateProfileStats(userId: string, statUpdates: Partial<UserProfile['stats']>): Promise<void> {
  const profile = await getUserProfile(userId);
  if (!profile) return;
  
  const newStats = { ...profile.stats, ...statUpdates };
  await updateUserProfile(userId, { stats: newStats });
  
  await checkAndAwardAchievements(userId, newStats);
}

export async function addActivityEntry(userId: string, entry: Omit<ActivityEntry, 'id' | 'timestamp'>): Promise<void> {
  const profile = await getUserProfile(userId);
  if (!profile) return;
  
  const newEntry: ActivityEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: serverTimestamp() as Timestamp,
  };
  
  const recentActivity = [newEntry, ...(profile.recentActivity || [])].slice(0, 20);
  await updateUserProfile(userId, { recentActivity });
}

export async function toggleSavedRecipe(userId: string, recipeId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  if (!profile) return false;
  
  const savedRecipes = profile.savedRecipes || [];
  const isSaved = savedRecipes.includes(recipeId);
  
  const newSavedRecipes = isSaved
    ? savedRecipes.filter(id => id !== recipeId)
    : [...savedRecipes, recipeId];
  
  await updateUserProfile(userId, { savedRecipes: newSavedRecipes });
  
  if (!isSaved) {
    await checkAchievementProgress(userId, 'collector', newSavedRecipes.length);
  }
  
  return !isSaved;
}

async function checkAndAwardAchievements(userId: string, stats: UserProfile['stats']): Promise<void> {
  await checkAchievementProgress(userId, 'first_recipe', stats.recipesCreated);
  await checkAchievementProgress(userId, 'chef_5', stats.recipesCreated);
  await checkAchievementProgress(userId, 'chef_10', stats.recipesCreated);
  await checkAchievementProgress(userId, 'chef_25', stats.recipesCreated);
  await checkAchievementProgress(userId, 'cook_10', stats.recipesCooked);
  await checkAchievementProgress(userId, 'cook_50', stats.recipesCooked);
}

async function checkAchievementProgress(userId: string, achievementId: string, currentProgress: number): Promise<void> {
  const profile = await getUserProfile(userId);
  if (!profile) return;
  
  const achievements = [...(profile.achievements || [])];
  const achievementIndex = achievements.findIndex(a => a.id === achievementId);
  
  if (achievementIndex === -1) return;
  
  const achievement = achievements[achievementIndex];
  if (achievement.earnedAt) return;
  
  achievement.progress = currentProgress;
  
  if (currentProgress >= achievement.target) {
    achievement.earnedAt = serverTimestamp() as Timestamp;
  }
  
  achievements[achievementIndex] = achievement;
  await updateUserProfile(userId, { achievements });
}

export async function recordRecipeCooked(userId: string, recipeId: string, recipeTitle: string, cookingTime: number): Promise<void> {
  const profile = await getUserProfile(userId);
  if (!profile) return;
  
  const newStats = {
    recipesCooked: (profile.stats.recipesCooked || 0) + 1,
    totalCookingTime: (profile.stats.totalCookingTime || 0) + cookingTime,
  };
  
  await updateProfileStats(userId, newStats);
  await addActivityEntry(userId, { type: 'cooked', recipeId, recipeTitle });
}

export async function recordRecipeCreated(userId: string, recipeId: string, recipeTitle: string): Promise<void> {
  const profile = await getUserProfile(userId);
  if (!profile) return;
  
  const newStats = {
    recipesCreated: (profile.stats.recipesCreated || 0) + 1,
  };
  
  await updateProfileStats(userId, newStats);
  await addActivityEntry(userId, { type: 'created', recipeId, recipeTitle });
}

export async function getPublicRecipes(limitCount: number = 20): Promise<Recipe[]> {
  try {
    const q = query(
      collection(db, "recipes"),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    const recipes = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Recipe));
    return recipes.slice(0, limitCount);
  } catch (error: any) {
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.warn('Firestore index required for public recipes query. Falling back to unordered query.');
      const q = query(
        collection(db, "recipes"),
        where("isPublic", "==", true)
      );
      const snapshot = await getDocs(q);
      const recipes = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Recipe));
      return recipes
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .slice(0, limitCount);
    }
    throw error;
  }
}

// ============ MEMORY CAPSULES (Capsules Mémoire Gustatives) ============

export interface MemoryCapsule {
  id?: string;
  familyId: string;
  authorId: string;
  authorName: string;
  recipeId?: string;
  recipeTitle?: string;
  title: string;
  story: string;
  images: string[];
  participants: string[];
  eventDate?: Timestamp;
  unlockDate?: Timestamp;
  isLocked: boolean;
  ritual?: {
    frequency: 'weekly' | 'monthly' | 'yearly' | 'special';
    description: string;
    lastPerformed?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function createMemoryCapsule(capsule: Omit<MemoryCapsule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, "memoryCapsules"), {
    ...capsule,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getMemoryCapsulesByFamily(familyId: string): Promise<MemoryCapsule[]> {
  try {
    const q = query(
      collection(db, "memoryCapsules"),
      where("familyId", "==", familyId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MemoryCapsule));
  } catch (error: any) {
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.warn('Firestore index required for memoryCapsules query. Falling back to unordered query.');
      const q = query(
        collection(db, "memoryCapsules"),
        where("familyId", "==", familyId)
      );
      const snapshot = await getDocs(q);
      const capsules = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MemoryCapsule));
      return capsules.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
    }
    throw error;
  }
}

export async function getMemoryCapsulesByUser(userId: string): Promise<MemoryCapsule[]> {
  try {
    const q = query(
      collection(db, "memoryCapsules"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MemoryCapsule));
  } catch (error: any) {
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      const q = query(collection(db, "memoryCapsules"), where("authorId", "==", userId));
      const snapshot = await getDocs(q);
      const capsules = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MemoryCapsule));
      return capsules.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    }
    throw error;
  }
}

export async function getMemoryCapsulesByRecipe(recipeId: string): Promise<MemoryCapsule[]> {
  try {
    const q = query(
      collection(db, "memoryCapsules"),
      where("recipeId", "==", recipeId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MemoryCapsule));
  } catch (error: any) {
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      const q = query(collection(db, "memoryCapsules"), where("recipeId", "==", recipeId));
      const snapshot = await getDocs(q);
      const capsules = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MemoryCapsule));
      return capsules.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    }
    throw error;
  }
}

export async function updateMemoryCapsule(capsuleId: string, updates: Partial<MemoryCapsule>): Promise<void> {
  const docRef = doc(db, "memoryCapsules", capsuleId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMemoryCapsule(capsuleId: string): Promise<void> {
  const docRef = doc(db, "memoryCapsules", capsuleId);
  await deleteDoc(docRef);
}

export function isCapsuleLocked(capsule: MemoryCapsule): boolean {
  if (!capsule.isLocked || !capsule.unlockDate) return false;
  const now = new Date();
  const unlockTime = capsule.unlockDate.toDate ? capsule.unlockDate.toDate() : new Date(capsule.unlockDate as any);
  return now < unlockTime;
}
