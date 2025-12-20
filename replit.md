# Overview

Gustalya (gustalya.app) is a French family recipe sharing platform with intelligent cooking features. Built with React 19 + Firebase (Auth + Firestore), Express.js (OCR only), and Gemini 2.5 Flash AI. Features: RecipeWizard 5 étapes, OCR+IA scan de recettes, Mode Cuisine Mains Libres avec contrôle vocal, système de minuteurs multiples, assistant de cuisson avec 167 ingrédients HD. Security is handled exclusively by Firebase.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 19 with TypeScript
- Vite as the build tool and development server
- TailwindCSS v4 for styling with custom cooking-themed color palette
- Wouter for client-side routing
- TanStack Query for server state management
- Radix UI components for accessible UI primitives
- Framer Motion for animations

**Design Pattern:**
- Component-based architecture with clear separation between routes, components, and utilities
- Context providers for global state (AuthContext, ProfileContext, TimerContext)
- Custom hooks for reusable logic (use-mobile, use-toast)
- Shadcn/ui component library integrated with custom Gustalya theming

**Folder Structure (December 2024):**
```
client/src/
├── routes/           # Page components
│   ├── HomePage.tsx
│   ├── RecipesPage.jsx
│   ├── FamilyPage.jsx
│   ├── ProfilePage.tsx
│   └── CookingPage.tsx
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth, Profile)
├── lib/              # Utilities and Firebase config
├── hooks/            # Custom React hooks
└── App.jsx           # Main app with routing and TimerContext
```

**Key Features:**
- Cooking Assistant: Multi-step wizard for selecting ingredients and configuring timers
- Timer Management: Real-time countdown timers with category-based color coding
- Recipe browsing and discovery interface with integrated timers
- Recipe Cooking Mode: Step-by-step cooking with voice control, automatic timer detection from recipe steps
- Memory Capsules ("Capsules Mémoire Gustatives"): Preserve family culinary memories with stories, photos, linked recipes, and time-locked capsules
- Responsive design optimized for mobile and desktop

**Memory Capsules Feature (December 2024):**
- MemoryCapsuleModal.jsx: 3-step wizard for creating memory capsules
- Features: Story + title, recipe linking, image upload (base64), participant selection, event date, time lock (capsule temporelle), ritual/tradition settings
- Firestore collection: memoryCapsules with fallback queries for missing composite indexes
- Locked capsules display blur overlay with unlock date
- Ritual cards show frequency (weekly/monthly/yearly/special)

**Recipe Timer Integration (December 2024):**
- Recipe steps now use structured format: `{ instruction: string, duration?: string }`
- Duration badges automatically display on steps with timing info (e.g., "3 heures", "5 min")
- "Cuisiner" button launches RecipeCookingMode with step-by-step guidance
- RecipeCookingMode includes: voice control (French), per-step timers, global timer integration
- parseTimeFromText() detects durations in French text (heures, minutes, secondes)

## Backend Architecture (Minimal - OCR Only)

**Technology Stack:**
- Node.js with Express.js
- TypeScript for type safety
- Firebase Admin SDK for optional token verification
- Gemini 2.5 Flash for OCR and recipe extraction

**API Design (2 endpoints only):**
- `POST /api/recipes/scan` - OCR image → recipe extraction
- `POST /api/recipes/scan-url` - URL → recipe extraction

All other data operations (auth, families, recipes, messages) are handled client-side via Firebase SDK directly.

## Database: Firestore (Firebase)

**Collections:**
- `userProfiles`: User profiles with cooking level, stats, achievements
- `families`: Family groups with invite codes
- `familyMembers`: Membership relations
- `recipes`: User-created recipes
- `familyRecipes`: Recipes shared within families
- `familyMessages`: Family chat messages

**Key Design:**
- Firebase Auth handles all authentication (Google Sign-In)
- Firestore rules secure data by userId
- Real-time listeners for messages and recipe updates
- No backend database needed (PostgreSQL/Drizzle legacy code present but unused)

## External Dependencies

**Third-Party Services:**
- Firebase (primary data layer):
  - Firebase Authentication (Google Sign-In)
  - Firestore for all user data storage
  - Firebase Admin SDK for server-side token verification (optional)
- Google Gemini 2.5 Flash: OCR and AI recipe extraction

**NPM Packages:**
- `firebase` and `firebase-admin`: Firebase SDK (client + server)
- `@google/genai`: Gemini AI integration
- `@tanstack/react-query`: Data fetching and caching
- `@radix-ui/*`: Headless UI component primitives
- `lucide-react`: Icon library
- `zod` and `drizzle-zod`: Schema validation
- `date-fns`: Date manipulation utilities
- Replit-specific plugins: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner

**Build Tools:**
- Vite for frontend bundling and dev server
- esbuild for server-side bundling in production
- Custom build script that bundles selected dependencies to reduce cold start times

**Environment Variables Required:**
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_APP_ID`: Firebase app ID
- `NODE_ENV`: Development/production environment flag
- `DATABASE_URL`: PostgreSQL (legacy, not actively used)

**Notable Architectural Choices:**
- The application uses Firebase exclusively for auth and data (no PostgreSQL migration planned)
- Custom meta-images plugin for dynamic OpenGraph image URLs on Replit deployment
- Separation of development and production build processes with optimized bundling
- Path aliases configured for clean imports (@/, @shared/, @assets/)
- Middleware for request logging with formatted timestamps