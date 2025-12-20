# 📖 DEVBOOK - GUSTALYA
## Application de Partage de Recettes Familiales et Assistant de Cuisine Intelligent

**Version:** 1.0.0  
**Date:** Décembre 2024  
**Domaine cible:** gustalya.app

---

## 🎯 1. VISION DU PROJET

### 1.1 Objectif Principal
Gustalya est une plateforme de partage de recettes familiales avec un assistant de cuisine intelligent. Elle permet aux familles de créer, partager et cuisiner ensemble grâce à des outils modernes : minuteurs intelligents, contrôle vocal mains libres, reconnaissance OCR de recettes, et une bibliothèque de 167+ ingrédients illustrés.

### 1.2 Fonctionnalités Clés
| Fonctionnalité | Description |
|----------------|-------------|
| **Partage Familial** | Créer/rejoindre une famille, partager recettes, likes, messages |
| **RecipeWizard** | Création de recettes en 5 étapes guidées |
| **OCR + IA Gemini** | Scan et extraction automatique de recettes via caméra |
| **Mode Cuisine Mains Libres** | Contrôle vocal en français pour navigation étapes |
| **Système de Minuteurs** | Timers multiples simultanés avec notifications |
| **Assistant de Cuisson** | 167 ingrédients avec temps de cuisson calculés |
| **Mode Sombre/Clair** | Thème adaptatif |

---

## 🏗️ 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack Technologique

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 19)                     │
├─────────────────────────────────────────────────────────────┤
│  Vite 7.1 │ TailwindCSS v4 │ Wouter │ TanStack Query        │
│  Radix UI │ Framer Motion │ Lucide Icons │ Shadcn/ui        │
├─────────────────────────────────────────────────────────────┤
│                    FIREBASE (Auth + Firestore)               │
├─────────────────────────────────────────────────────────────┤
│  Authentication │ Firestore Database │ User Profiles        │
│  Families │ Recipes │ Messages │ Reactions                  │
├─────────────────────────────────────────────────────────────┤
│                      BACKEND (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│  Node.js │ TypeScript │ Firebase Admin │ Gemini API         │
│  OCR Scan │ URL Extraction │ Token Verification             │
├─────────────────────────────────────────────────────────────┤
│                      SERVICES EXTERNES                       │
├─────────────────────────────────────────────────────────────┤
│  Google Gemini 2.5 Flash (OCR/IA) │ Firebase Auth (Google)  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Structure des Dossiers

```
gustalya/
├── client/                          # Frontend React
│   ├── public/
│   │   ├── ingredients/             # 167 images HD ingrédients (47 Mo)
│   │   ├── favicon.png
│   │   ├── manifest.json
│   │   └── opengraph.jpg
│   └── src/
│       ├── components/              # Composants React
│       │   ├── ui/                  # Shadcn/ui (60+ composants)
│       │   ├── CookingAssistant.tsx # Assistant de cuisson
│       │   ├── RecipeWizard.jsx     # Wizard création recettes
│       │   ├── RecipeCookingMode.jsx# Mode cuisson mains libres
│       │   ├── RecipeScanner.jsx    # OCR Gemini
│       │   ├── TimerGrid.tsx        # Grille de minuteurs
│       │   └── ...
│       ├── contexts/                # Contextes React
│       │   ├── AuthContext.tsx      # Authentification
│       │   └── ProfileContext.tsx   # Profil utilisateur
│       ├── routes/                  # Pages
│       │   ├── HomePage.tsx
│       │   ├── RecipesPage.jsx
│       │   ├── FamilyPage.jsx
│       │   ├── ProfilePage.tsx
│       │   ├── CookingPage.tsx
│       │   ├── HelpPage.jsx
│       │   └── LegalPages.jsx
│       ├── data/
│       │   └── gustalya-recipes.ts  # Recettes prédéfinies
│       ├── lib/
│       │   ├── firebase.ts          # Config Firebase
│       │   ├── queryClient.ts       # TanStack Query
│       │   └── utils.ts             # Utilitaires
│       ├── hooks/                   # Hooks personnalisés
│       ├── data.ts                  # 167 ingrédients + temps
│       ├── App.jsx                  # App principale + TimerContext
│       └── index.css                # Styles Tailwind
├── server/                          # Backend Express (API OCR uniquement)
│   ├── index.ts                     # Point d'entrée
│   ├── routes.ts                    # Routes OCR Gemini (scan, scan-url)
│   ├── firebase-admin.ts            # Middleware vérification tokens
│   └── vite.ts                      # Middleware Vite
├── shared/
│   └── schema.ts                    # Types partagés (legacy PostgreSQL)
├── server/
│   ├── storage.ts                   # Interface stockage (legacy, non utilisé)
│   └── db.ts                        # Connexion PostgreSQL (legacy, non utilisé)
├── docs/
│   └── DEVBOOK.md                   # Cette documentation
├── package.json
├── vite.config.ts
├── tsconfig.json
└── drizzle.config.ts
```

---

## 🗄️ 3. MODÈLE DE DONNÉES (Firestore)

### 3.1 Collections Firestore

```typescript
// userProfiles/{userId}
interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  photoUrl: string;
  cookingLevel: 'debutant' | 'intermediaire' | 'avance' | 'expert';
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteIngredients: string[];
  avoidedIngredients: string[];
  stats: {
    recipesCreated: number;
    recipesCooked: number;
    totalCookingTime: number;
  };
  achievements: Achievement[];
  savedRecipes: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// families/{familyId}
interface Family {
  name: string;
  ownerUserId: string;
  inviteCode: string;  // 6 caractères uniques
  createdAt: Timestamp;
}

// familyMembers/{memberId}
interface FamilyMember {
  familyId: string;
  userId: string;
  username: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
}

// recipes/{recipeId}
interface Recipe {
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
  ingredients: string[];
  steps: RecipeStep[];
  createdAt: Timestamp;
}

// familyRecipes/{shareId}
interface FamilyRecipe {
  familyId: string;
  recipeId: string;
  sharedByUserId: string;
  sharedByName: string;
  sharedAt: Timestamp;
}

// familyMessages/{messageId}
interface FamilyMessage {
  familyId: string;
  authorUserId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}
```

### 3.2 Diagramme des Relations Firestore

```
userProfiles (1) ←──────→ (N) familyMembers ←──────→ (1) families
userProfiles (1) ←──────→ (N) recipes
families (1) ←──────→ (N) familyRecipes ←──────→ (1) recipes
families (1) ←──────→ (N) familyMessages
```

---

## 🔌 4. API & SERVICES

### 4.1 Backend API (Express.js)
Le backend expose uniquement les endpoints nécessitant le traitement côté serveur :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/recipes/scan` | OCR image via Gemini 2.5 Flash |
| POST | `/api/recipes/scan-url` | Extraction recette depuis URL |

### 4.2 Firebase SDK (Client-side)
Toutes les opérations CRUD sont effectuées directement depuis le frontend via Firebase SDK :

**Authentification (`firebase/auth`):**
- `signInWithGoogle()` - Connexion Google
- `signOut()` - Déconnexion
- `onAuthStateChanged()` - Listener état auth

**Firestore (`firebase/firestore`):**
- `createFamily()` - Créer une famille
- `joinFamily()` - Rejoindre via code
- `getUserFamily()` - Obtenir famille
- `getFamilyMembers()` - Liste membres
- `createRecipe()` - Créer recette
- `getUserRecipes()` - Mes recettes
- `shareRecipeToFamily()` - Partager
- `getFamilyRecipes()` - Recettes famille
- `sendFamilyMessage()` - Envoyer message
- `getFamilyMessages()` - Historique

### 4.3 Gemini AI Integration
Le scan de recettes utilise Gemini 2.5 Flash avec structured output :

```typescript
// Prompt structuré pour extraction
{
  title: string;
  description: string;
  ingredients: string[];
  steps: { instruction: string; duration?: string }[];
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  category: string;
}
```

---

## 🧩 5. COMPOSANTS FRONTEND CLÉS

### 5.1 CookingAssistant.tsx
**Rôle:** Assistant de cuisson avec 167 ingrédients illustrés

**Structure des ingrédients:**
```typescript
interface Ingredient {
  id: string;
  name: string;
  category: string;        // Viandes, Poissons, Légumes, Féculents, Oeufs, Fruits
  subcategory: string;     // Ex: Boeuf, Veau, Porc...
  defaultWeight: number;   // Poids par défaut en grammes
  baseTime: number;        // Temps de base en minutes
  timePer100g: number;     // Minutes additionnelles par 100g
  method: string;          // Four, Poêle, Vapeur, Cocotte, Cru...
  temp?: number;           // Température en °C
  tips: string[];          // Conseils de cuisson
  emoji: string;
  image_url?: string;      // Chemin vers image HD
}
```

**Catégories disponibles (6):**
- **Viandes** (Boeuf, Veau, Porc, Agneau, Volaille)
- **Poissons** (Poissons, Fruits de mer)
- **Légumes** (30+ légumes)
- **Féculents** (Riz, Pâtes, Céréales, Légumineuses)
- **Oeufs** (Cuisson, Préparations)
- **Fruits** (Crus, Cuits)

### 5.2 RecipeWizard.jsx
**Rôle:** Création de recettes en 5 étapes

**Étapes du wizard:**
1. **L'essentiel** - Nom, photo, description
2. **Détails** - Temps prep/cuisson, portions, difficulté
3. **Ingrédients** - Liste dynamique avec ajout/suppression
4. **Préparation** - Étapes avec durées optionnelles
5. **Finaliser** - Visibilité (privé/public), partage famille

**Format des étapes de recette:**
```typescript
interface Step {
  order: number;
  instruction: string;
  duration?: string;  // Ex: "5 min", "2 heures"
}
```

### 5.3 RecipeCookingMode.jsx
**Rôle:** Mode cuisson mains libres avec contrôle vocal

**Fonctionnalités:**
- Lecture vocale des étapes (voix française)
- Reconnaissance vocale (commandes: suivant, précédent, répéter, timer)
- Minuteurs par étape (détection automatique des durées)
- Wake Lock (écran toujours allumé)
- Choix voix masculine/féminine

**Commandes vocales supportées:**
| Commande | Action |
|----------|--------|
| "Suivant" / "Next" | Étape suivante |
| "Précédent" / "Back" | Étape précédente |
| "Répéter" / "Répète" | Relire l'étape |
| "Timer" / "Minuteur" | Lancer timer étape |
| "Stop" / "Arrête" | Arrêter timer |

### 5.4 RecipeScanner.jsx
**Rôle:** OCR et extraction de recettes via Gemini 2.0 Flash

**Flux de fonctionnement:**
1. Capture photo ou upload image
2. Compression image (< 1Mo)
3. Envoi à Gemini avec prompt structuré
4. Extraction: titre, description, catégorie, temps, ingrédients, étapes
5. Pré-remplissage du RecipeWizard

### 5.5 TimerGrid.tsx & TimerCard.tsx
**Rôle:** Gestion des minuteurs multiples

**Structure Timer:**
```typescript
interface Timer {
  id: number;
  ingredientId: string;
  name: string;
  totalTime: number;      // Secondes
  remainingTime: number;  // Secondes restantes
  isRunning: boolean;
  category: string;       // Pour code couleur
}
```

**Couleurs par catégorie:**
| Catégorie | Couleur |
|-----------|---------|
| Viandes | Rouge/Orange |
| Poissons | Bleu |
| Légumes | Vert |
| Féculents | Jaune |
| Oeufs | Orange clair |
| Fruits | Rose |

---

## 🎨 6. SYSTÈME DE DESIGN

### 6.1 Thème Gustalya (TailwindCSS v4)

**Palette Cuisson:**
```css
--cooking-red: #DC2626
--cooking-orange: #EA580C
--cooking-amber: #D97706
--cooking-green: #16A34A
--cooking-blue: #2563EB
--cooking-purple: #9333EA
```

**Mode Clair:**
```css
--background: #FEF7F0 (crème légère)
--foreground: #1C1917
--primary: #EA580C (orange cuisson)
--card: #FFFFFF
```

**Mode Sombre:**
```css
--background: #0C0A09
--foreground: #FAFAF9
--primary: #FB923C
--card: #1C1917
```

### 6.2 Composants UI (Shadcn/ui)
60+ composants Radix UI personnalisés:
- Boutons, Inputs, Cards, Dialogs, Sheets
- Toasts, Tooltips, Dropdowns
- Tabs, Accordions, Progress bars
- Et plus...

---

## 📱 7. RESPONSIVE DESIGN

### 7.1 Breakpoints
```css
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

### 7.2 Navigation
- **Mobile:** Bottom navigation bar fixe (5 onglets)
- **Desktop:** Top navbar horizontale avec logo

### 7.3 Adaptations Responsive
- Grilles d'ingrédients: 2 cols (mobile) → 4 cols (desktop)
- Cards recettes: Stack (mobile) → Grid (desktop)
- Modals: Fullscreen (mobile) → Centered dialog (desktop)

---

## 🔐 8. AUTHENTIFICATION (Firebase Only)

### 8.1 Architecture Firebase Auth
L'authentification est gérée **exclusivement par Firebase** :

- **Frontend** : Firebase SDK Client (signInWithGoogle, onAuthStateChanged)
- **Backend** : Firebase Admin SDK (vérification tokens optionnelle)
- **Base de données** : Firestore (profils, familles, recettes, messages)

### 8.2 Flux d'authentification
```
1. Utilisateur clique "Se connecter avec Google"
2. Firebase Auth popup → Token JWT généré
3. AuthContext stocke l'utilisateur (User Firebase)
4. Toutes les opérations utilisent user.uid
5. Firestore rules sécurisent les données par userId
```

### 8.3 Contexte Auth (React)
```typescript
interface AuthContextType {
  currentUser: User | null;  // Firebase User
  loading: boolean;
  login: () => Promise<void>;   // Google Sign-In
  logout: () => Promise<void>;
}
```

### 8.4 Collections Firestore
| Collection | Description |
|------------|-------------|
| `userProfiles` | Profils utilisateurs (stats, préférences, achievements) |
| `families` | Groupes familiaux avec code invitation |
| `familyMembers` | Membres de chaque famille |
| `recipes` | Recettes créées par les utilisateurs |
| `familyRecipes` | Recettes partagées en famille |
| `familyMessages` | Messages entre membres |

### 8.5 Backend API (Express)
Le backend ne gère que les endpoints nécessitant Gemini AI :

| Endpoint | Description |
|----------|-------------|
| `POST /api/recipes/scan` | OCR image → extraction recette |
| `POST /api/recipes/scan-url` | URL → extraction recette |

Ces endpoints utilisent un middleware optionnel Firebase Admin pour vérifier les tokens.

---

## 🖼️ 9. SYSTÈME D'IMAGES INGRÉDIENTS

### 9.1 Structure des fichiers
```
client/public/ingredients/
├── boeuf-rotis.jpg
├── boeuf-entrecote.jpg
├── ... (167 fichiers)
└── rhubarbe.jpg
```

### 9.2 Mapping dans data.ts
```typescript
const INGREDIENT_IMAGES: Record<string, string> = {
  "boeuf-rotis": "/ingredients/boeuf-rotis.jpg",
  "boeuf-entrecote": "/ingredients/boeuf-entrecote.jpg",
  // ... 167 entrées
};

// Application automatique aux ingrédients
INGREDIENTS.forEach(ing => {
  ing.image_url = INGREDIENT_IMAGES[ing.id];
});
```

### 9.3 Fallback
Si image non trouvée → Affichage emoji de l'ingrédient

---

## ⚙️ 10. VARIABLES D'ENVIRONNEMENT

```env
# Base de données
DATABASE_URL=postgresql://...

# Gemini IA (Replit AI Integrations)
AI_INTEGRATIONS_GEMINI_API_KEY=...
AI_INTEGRATIONS_GEMINI_BASE_URL=...

# Firebase (optionnel)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 🚀 11. SCRIPTS & COMMANDES

```bash
# Développement
npm run dev              # Lance serveur dev (port 5000)
npm run dev:client       # Frontend seul

# Production
npm run build            # Build optimisé
npm run start            # Lance production

# Base de données
npm run db:push          # Push schéma Drizzle
npm run db:push --force  # Force push (attention!)

# TypeScript
npm run check            # Vérification types
```

---

## 📊 12. MÉTRIQUES PROJET

| Métrique | Valeur |
|----------|--------|
| Lignes de code (estimé) | ~15,000 |
| Composants React | 30+ |
| Composants UI Shadcn | 60+ |
| Ingrédients | 167 |
| Tables DB | 8 |
| Endpoints API | 20+ |
| Taille images ingrédients | 47 Mo |
| Dépendances npm | 80+ |

---

## 🔄 13. FLUX UTILISATEUR

### 13.1 Création de Recette
```
1. Cliquer "Nouvelle Recette"
2. [Optionnel] Scanner recette papier via OCR
3. Remplir étapes du Wizard
4. Sauvegarder
5. [Optionnel] Partager en famille
```

### 13.2 Mode Cuisson
```
1. Ouvrir recette → "Cuisiner"
2. Activer mode mains libres
3. Suivre étapes vocalement
4. Lancer timers automatiques
5. Marquer étapes terminées
```

### 13.3 Assistant Cuisson
```
1. Aller "Guide Cuisson"
2. Sélectionner catégorie
3. Choisir ingrédient
4. Ajuster poids
5. [Optionnel] Choisir cuisson
6. Ajouter timer
```

---

## 🐛 14. PROBLÈMES CONNUS & TODO

| Problème | Status | Solution |
|----------|--------|----------|
| Images ingrédients mal matchées | En cours | Recherche avec termes anglais précis |
| Firebase Auth partiellement intégré | Migration | Passage vers PostgreSQL auth |
| Pas de hash mot de passe | À faire | Implémenter bcrypt |

---

## 📝 15. PROCHAINES ÉTAPES

1. **Correction images ingrédients** - Validation manuelle des 167 images
2. **Sécurisation mots de passe** - Bcrypt hashing
3. **PWA** - Service Worker pour mode offline
4. **Notifications push** - Timers en arrière-plan
5. **Import/Export recettes** - Format JSON/PDF
6. **Mode multi-langue** - EN/FR

---

## 📚 16. RESSOURCES

### Documentation
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS v4](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Radix UI](https://www.radix-ui.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Google Gemini](https://ai.google.dev/)

### Outils
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [TanStack Query](https://tanstack.com/query/)

---

**Fin du DEVBOOK Gustalya v1.0**

*Dernière mise à jour: Décembre 2024*
