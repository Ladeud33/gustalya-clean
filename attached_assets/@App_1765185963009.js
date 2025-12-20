import { useState, useRef, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import Auth from './components/Auth';
import CookingInterface from './components/CookingInterface';
import CookingGuidePage from './pages/CookingGuidePage';
import CookingGuide from './components/CookingGuide';
import { GustalayaCookingGuide as RecipeCookingGuide } from './components/GustalayaIntegration';
import emailjs from '@emailjs/browser';

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';
import ProfilePage from './pages/ProfilePage';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import CreateRecipeModal from './modals/CreateRecipeModal';
import InviteModal from './modals/InviteModal';

function App() {
  // =====================================
  // HOOKS ET CONTEXTE
  // =====================================
  const { currentUser } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // =====================================
  // GÉNÉRATION DE CODE FAMILLE UNIQUE
  // =====================================
  const generateFamilyCode = (email) => {
    if (!email) return 'FAM000';
    const hash = email.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const code = Math.abs(hash).toString().slice(0, 3).padStart(3, '0');
    return `FAM${code}`;
  };

  // =====================================
  // ÉTATS PRINCIPAUX
  // =====================================
  
  // Authentification
  const [showAuth, setShowAuth] = useState(false);
  
  // Navigation
  const [currentView, setCurrentView] = useState('home');
  
  // Recettes
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [showRecipeSuccess, setShowRecipeSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [savedRecipeTitle, setSavedRecipeTitle] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [showShareResult, setShowShareResult] = useState(false);
  // Ajout : édition de recette
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [familyRecipes, setFamilyRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  
  // NOUVELLES FONCTIONNALITÉS AJOUTÉES - Codes
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  // Initialisation du code famille persistante
  const [familyCode, setFamilyCode] = useState(() => {
    const email = currentUser?.email;
    if (email) {
      return localStorage.getItem(`familyCode_${email}`) || generateFamilyCode(email);
    }
    return '';
  });
  const [isFamilyMember, setIsFamilyMember] = useState(true);
  
  // Email et invitation
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [inviteData, setInviteData] = useState({
    email: '',
    message: 'Rejoignez-moi sur Gustalya pour partager nos recettes favorites !'
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("");
  
  // SYSTÈME DE PARTAGE FAMILIAL - Likes et commentaires partagés
  const [familyLikes, setFamilyLikes] = useState({});
  const [familyComments, setFamilyComments] = useState({});
  const [userLikes, setUserLikes] = useState(new Set());
  const [newComment, setNewComment] = useState('');
  
  // SYSTÈME DE PHOTOS
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState(null);
  const cameraRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Formulaire de création de recette
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'facile',
    category: 'plat-principal',
    ingredients: [{ name: '', quantity: '', unit: 'g' }],
    seasonings: [{ name: '', quantity: '', unit: 'pincée' }],
    instructions: [''],
    tips: '',
    owner: '',
    author: '',
    shareCode: '',
    family: 'Ma création'
  });
  
  // Références
  const formRef = useRef();
  
  // =====================================
  // DONNÉES RÉINITIALISÉES POUR NOUVEAUX UTILISATEURS
  // =====================================
  
  // État pour les recettes familiales (chargées depuis Firebase)
  const [recipes, setRecipes] = useState([]);
  
  // État pour les recettes populaires (statiques)
  const [popularRecipes, setPopularRecipes] = useState([
    // TOP 12 RECETTES POPULAIRES 2024 - GUSTALYA
    {
      id: 3,
      title: 'Mojito Classique',
      category: 'Boisson',
      time: '5min',
      difficulty: 'Facile',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/kjib3gidmj1mw7i4rd6c2/mojito.jpg?rlkey=lj0mo3f11kwfxwogypgjptgge&st=tzd87jey&dl=1',
      emoji: '🍸',
      description: 'Le cocktail cubain par excellence, rafraîchissant et parfaitement équilibré 🍃✨',
      author: 'Gustalya',
      serves: 1,
      shareCode: 'MOJO001',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '50 ml de rhum blanc cubain',
        '12 feuilles de menthe fraîche',
        '1/2 citron vert (6 quartiers)',
        '2 cuillères à café de sucre de canne roux',
        '120 ml d\'eau gazeuse',
        'Glaçons pilés',
        '1 brin de menthe pour décoration'
      ],
      instructions: [
        'Préparation du verre : Utiliser un verre highball de 350ml',
        'Muddle : Déposer les feuilles de menthe et les quartiers de citron vert dans le verre',
        'Écrasement : Ajouter le sucre et écraser délicatement avec un pilon pour libérer les huiles essentielles',
        'Ajout du rhum : Verser le rhum blanc et mélanger',
        'Glaçons : Remplir le verre de glace pilée jusqu\'aux 3/4',
        'Compléter : Ajouter l\'eau gazeuse en remuant délicatement',
        'Dressage : Garnir avec un brin de menthe et une paille en bambou'
      ],
      tips: 'Utiliser de la menthe bien fraîche, ne pas sur-écraser pour éviter l\'amertume. La glace pilée est essentielle pour la texture authentique.'
    },
    {
      id: 4,
      title: 'Negroni Parfait',
      category: 'Boisson',
      time: '3min',
      difficulty: 'Facile',
      likes: '0',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      emoji: '🍸',
      description: 'Le cocktail italien emblématique, équilibré et sophistiqué 🇮🇹',
      author: 'Gustalya',
      serves: 1,
      shareCode: 'NEGR002',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '30 ml de gin Londres Dry',
        '30 ml de Campari',
        '30 ml de vermouth rouge italien (Martini Rosso)',
        '1 zeste d\'orange',
        '1 gros glaçon sphérique ou 3-4 glaçons'
      ],
      instructions: [
        'Préparation : Utiliser un verre old fashioned (rocks glass)',
        'Mélange : Dans un verre à mélange, verser le gin, le Campari et le vermouth',
        'Remuer : Ajouter les glaçons et remuer pendant 20-30 secondes',
        'Filtrage : Verser dans le verre de service avec un gros glaçon',
        'Garnir : Exprimer les huiles du zeste d\'orange au-dessus du verre, puis le déposer',
        'Service : Servir immédiatement'
      ],
      tips: 'Respecter impérativement les proportions 1:1:1. Utiliser un gin de qualité pour l\'équilibre. Le zeste d\'orange doit être fraîchement exprimé.'
    },
    {
      id: 5,
      title: 'Aperol Spritz',
      category: 'Boisson',
      time: '2min',
      difficulty: 'Très facile',
      likes: '0',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      emoji: '🍸',
      description: 'L\'apéritif italien parfait, léger et rafraîchissant 🧡',
      author: 'Gustalya',
      serves: 1,
      shareCode: 'APRL003',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '60 ml d\'Aperol',
        '90 ml de prosecco',
        '30 ml d\'eau gazeuse (Perrier ou San Pellegrino)',
        'Glaçons',
        '1 rondelle d\'orange',
        '1 olive verte (optionnel)'
      ],
      instructions: [
        'Préparation du verre : Utiliser un verre à vin blanc ou un gobelet (300ml)',
        'Glaçons : Remplir le verre de glaçons',
        'Aperol : Verser l\'Aperol en premier',
        'Prosecco : Ajouter délicatement le prosecco',
        'Eau gazeuse : Compléter avec l\'eau gazeuse',
        'Mélange : Remuer très délicatement une fois',
        'Garnir : Ajouter la rondelle d\'orange et l\'olive'
      ],
      tips: 'Respecter la proportion 3-2-1 (prosecco-aperol-eau gazeuse). Servir très frais, idéalement entre 6-8°C. Utiliser un prosecco de qualité.'
    },
    {
      id: 6,
      title: 'Tartare de Saumon Professionnel',
      category: 'Entrée',
      time: '20min',
      difficulty: 'Moyen',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/fc05z8ha0bj0zagz9ig0v/tartare-de-saumon.jpg?rlkey=jhez69spyfntrfth0rnjnlbsf&st=f4glbvep&dl=1',
      emoji: '🐟',
      description: 'Un tartare raffiné et frais, parfait pour débuter un repas gastronomique 🍣',
      author: 'Gustalya',
      serves: 4,
      shareCode: 'TARS004',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '600 g de filet de saumon frais (qualité sashimi)',
        '2 échalotes françaises',
        '2 cuillères à soupe de câpres',
        '1 citron vert (zeste + jus)',
        '2 cuillères à soupe d\'huile d\'olive extra vierge',
        '1 cuillère à café de moutarde de Dijon',
        '1 avocat mûr',
        '15 g d\'aneth frais',
        'Fleur de sel',
        'Poivre noir du moulin',
        'Pain grillé ou blinis pour accompagner'
      ],
      instructions: [
        'Préparation du saumon : Retirer la peau et les arêtes. Découper en brunoise fine (dés de 3mm)',
        'Échalotes : Ciseler finement les échalotes',
        'Assaisonnement : Dans un bol, mélanger le saumon, échalotes, câpres hachées',
        'Sauce : Ajouter le jus de citron vert, l\'huile d\'olive, la moutarde',
        'Mélange : Incorporer délicatement, assaisonner avec fleur de sel et poivre',
        'Repos : Réfrigérer 15 minutes pour que les saveurs se mélangent',
        'Avocat : Découper l\'avocat en brunoise au dernier moment',
        'Dressage : Mélanger l\'avocat, dresser à l\'aide d\'un cercle, garnir d\'aneth et zeste de citron'
      ],
      tips: 'Choisir un saumon très frais, idéalement chez un poissonnier de confiance. Garder tous les ustensiles et ingrédients bien froids. Servir immédiatement après dressage.'
    },
    {
      id: 7,
      title: 'Salade César Authentique',
      category: 'Entrée',
      time: '25min',
      difficulty: 'Moyen',
      likes: '0',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      emoji: '🥗',
      description: 'La salade César originale, avec sa sauce crémeuse et ses croûtons dorés 🥬',
      author: 'Gustalya',
      serves: 4,
      shareCode: 'CAES005',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '2 cœurs de romaine',
        '150 g de parmesan reggiano',
        '100 g de lardons fumés',
        '2 tranches de pain de mie',
        '2 cuillères à soupe d\'huile d\'olive',
        '2 jaunes d\'œufs frais',
        '4 filets d\'anchois à l\'huile',
        '2 gousses d\'ail',
        '1 cuillère à café de moutarde de Dijon',
        '120 ml d\'huile d\'olive extra vierge',
        '2 cuillères à soupe de jus de citron',
        '1 cuillère à café de sauce Worcestershire',
        'Poivre noir fraîchement moulu'
      ],
      instructions: [
        'Préparation de la sauce : Écraser l\'ail et les anchois au mortier',
        'Émulsion : Ajouter les jaunes d\'œufs et la moutarde, fouetter',
        'Huile : Incorporer l\'huile en filet en fouettant constamment',
        'Assaisonnement : Ajouter jus de citron, Worcestershire, poivre',
        'Croûtons : Découper le pain en cubes, faire dorer à la poêle avec huile d\'olive',
        'Lardons : Faire griller les lardons jusqu\'à obtenir une texture croustillante',
        'Salade : Laver et essorer la romaine, déchirer en gros morceaux',
        'Assemblage : Mélanger la salade avec la sauce',
        'Dressage : Ajouter croûtons, lardons, copeaux de parmesan'
      ],
      tips: 'La sauce doit être préparée à la dernière minute. Utiliser des œufs très frais pour la sécurité alimentaire. Le parmesan doit être râpé au moment du service.'
    },
    {
      id: 8,
      title: 'Tapas de la Mer Assortis',
      category: 'Entrée',
      time: '30min',
      difficulty: 'Moyen',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/g0jub1qujs3d4diltlfwj/tapas-de-la-mer.jpg?rlkey=s9w0xhz3het2np4aw6omxdebh&st=ghn6pca5&dl=1',
      emoji: '🦐',
      description: 'Un assortiment de tapas marins, parfait pour partager en apéritif 🌊',
      author: 'Gustalya',
      serves: 6,
      shareCode: 'TAPA006',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '200 g de crevettes roses décortiquées',
        '100 g de farine de tempura',
        '120 ml d\'eau glacée',
        'Huile de friture',
        '150 g de saumon fumé',
        '100 g de fromage frais (type Philadelphia)',
        '1 citron (zeste)',
        'Aneth frais',
        '8 toasts de pain de seigle',
        '300 g de poulpe cuit',
        '2 cuillères à soupe d\'huile d\'olive',
        '1 citron',
        'Paprika fumé',
        'Fleur de sel'
      ],
      instructions: [
        'Crevettes tempura : Mélanger farine et eau glacée sans trop travailler',
        'Trempage : Enrober les crevettes de pâte',
        'Friture : Frire 2-3 minutes à 180°C jusqu\'à coloration dorée',
        'Tartinables de saumon : Effilocher le saumon, mélanger avec le fromage frais',
        'Assaisonnement : Ajouter zeste de citron et aneth ciselé',
        'Tartinage : Étaler sur les toasts',
        'Poulpe grillé : Trancher le poulpe en morceaux de 2cm',
        'Marinade : Mélanger avec huile, jus de citron, paprika',
        'Cuisson : Griller 2-3 minutes de chaque côté',
        'Finition : Saupoudrer de fleur de sel'
      ],
      tips: 'Pâte à tempura très froide, huile à température constante. Poulpe déjà cuit, juste réchauffage et coloration. Dresser sur une grande planche en bois.'
    },
    {
      id: 9,
      title: 'Pizza Napolitaine Authentique',
      category: 'Plat principal',
      time: '24h',
      difficulty: 'Difficile',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/cz4lxrxhmpw2aaxv2vj11/pizza-napolitaine.jpg?rlkey=gdsbc1xp52hyoefkk5f5b0j6k&st=cgbevxy6&dl=1',
      emoji: '🍕',
      description: 'La vraie pizza napolitaine, avec sa pâte fermentée 24h et sa cuisson au feu de bois 🇮🇹',
      author: 'Gustalya',
      serves: 4,
      shareCode: 'PIZZ007',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '1 kg de farine type 00 (Caputo Pizzeria)',
        '650 ml d\'eau tiède',
        '20 g de sel fin',
        '3 g de levure fraîche',
        '400 g de sauce tomate San Marzano',
        '400 g de mozzarella di bufala',
        'Basilic frais',
        'Huile d\'olive extra vierge',
        'Fleur de sel'
      ],
      instructions: [
        'Pâte (J-1) : Mélanger farine et eau, laisser reposer 30 minutes',
        'Pétrissage : Ajouter levure dissoute et sel, pétrir 10 minutes',
        'Pointage : Laisser lever 2h à température ambiante',
        'Boulage : Former 4 boules, réfrigérer 24h',
        'Tempérage : Sortir la pâte 2h avant utilisation',
        'Étalage : Étaler à la main sans rouleau (épaisseur 2-3mm)',
        'Garniture : Napper de sauce, ajouter mozzarella égouttée',
        'Cuisson : Four à 450°C pendant 90 secondes',
        'Finition : Basilic frais, huile d\'olive, fleur de sel'
      ],
      tips: 'La pâte ne doit jamais être travaillée au rouleau. Four le plus chaud possible (idéal 450°C). Mozzarella bien égouttée pour éviter l\'excès d\'eau.'
    },
    {
      id: 10,
      title: 'Magret de Canard aux Figues',
      category: 'Plat principal',
      time: '35min',
      difficulty: 'Moyen',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/0vpp1xdmzh67ad9m5w6h7/magret-de-canrd.jpg?rlkey=wkr5ho8z1a70z4xnl8d0ky8ba&st=gb0wjhum&dl=1',
      emoji: '🦆',
      description: 'Un magret parfaitement cuit avec une sauce aux figues caramélisées 🍯',
      author: 'Gustalya',
      serves: 4,
      shareCode: 'MAGR008',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '2 magrets de canard de 400g chacun',
        '8 figues fraîches',
        '200 ml de porto rouge',
        '2 cuillères à soupe de miel d\'acacia',
        '1 cuillère à soupe de vinaigre balsamique',
        '2 échalotes',
        '30 g de beurre',
        'Thym frais',
        'Sel, poivre du moulin'
      ],
      instructions: [
        'Préparation : Quadriller la peau du magret en losanges (2mm de profondeur)',
        'Assaisonnement : Saler et poivrer côté chair uniquement',
        'Cuisson côté peau : Démarrer à froid, peau côté poêle, 8 minutes',
        'Retournement : Cuire côté chair 4-6 minutes selon cuisson désirée',
        'Repos : Emballer dans du papier alu, laisser reposer 5 minutes',
        'Sauce : Dans la même poêle, faire suer les échalotes',
        'Déglaçage : Ajouter porto, réduire de moitié',
        'Figues : Ajouter figues coupées en quartiers, miel, vinaigre',
        'Finition : Monter au beurre, thym, rectifier l\'assaisonnement',
        'Dressage : Trancher le magret en biais, napper de sauce'
      ],
      tips: 'Démarrer cuisson à froid pour faire fondre la graisse uniformément. Température à cœur : 54°C pour une cuisson rosée. Laisser impérativement reposer pour une viande tendre.'
    },
    {
      id: 11,
      title: 'Ramen Carbonara Fusion',
      category: 'Plat principal',
      time: '15min',
      difficulty: 'Facile',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/1pfff4hplk1wa8im7cwbe/ramen.jpg?rlkey=uyiijz6ltp8e71zqsf375ahue&st=gipp2tzy&dl=1',
      emoji: '🍜',
      description: 'Une fusion audacieuse entre la carbonara italienne et les ramen japonais 🍝',
      author: 'Gustalya',
      serves: 4,
      shareCode: 'RAME009',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '4 paquets de nouilles ramen (sans assaisonnement)',
        '200 g de lardons fumés ou pancetta',
        '4 jaunes d\'œufs + 1 œuf entier',
        '100 g de parmesan reggiano râpé',
        '100 g de pecorino romano râpé',
        'Poivre noir fraîchement moulu',
        '2 cuillères à soupe d\'huile d\'olive',
        'Persil plat pour garnir'
      ],
      instructions: [
        'Préparation des œufs : Battre jaunes, œuf entier et fromages dans un grand bol',
        'Poivre : Ajouter généreusement du poivre noir moulu',
        'Lardons : Faire revenir à sec jusqu\'à coloration dorée',
        'Nouilles : Cuire les ramen selon instructions (généralement 3 minutes)',
        'Égouttage : Réserver 200ml d\'eau de cuisson avant égouttage',
        'Mélange : Ajouter nouilles chaudes dans le bol d\'œufs en remuant vivement',
        'Texture : Ajouter eau de cuisson petit à petit pour obtenir une crème onctueuse',
        'Finition : Incorporer lardons chauds, persil ciselé',
        'Service : Servir immédiatement avec parmesan supplémentaire'
      ],
      tips: 'Les œufs ne doivent jamais cuire (technique de liaison à froid). Remuer énergiquement pour éviter la coagulation. L\'eau de cuisson amidonnée est essentielle pour la texture.'
    },
    {
      id: 12,
      title: 'Crêpes Françaises Parfaites',
      category: 'Dessert',
      time: '1h15',
      difficulty: 'Facile',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/tgcfvp3ol58y9bjpimg1l/crepes.jpg?rlkey=hk4ruh0yw8qa3qoenvpajf4fc&st=w858gvfh&dl=1',
      emoji: '🥞',
      description: 'Les vraies crêpes françaises, fines et délicates, parfaites pour le dessert 🥞',
      author: 'Gustalya',
      serves: 8,
      shareCode: 'CREP010',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '250 g de farine type 45',
        '500 ml de lait entier',
        '3 œufs entiers',
        '50 g de beurre fondu',
        '2 cuillères à soupe de sucre',
        '1 pincée de sel',
        '1 cuillère à soupe de rhum ou vanille (optionnel)',
        'Beurre pour la cuisson'
      ],
      instructions: [
        'Pâte : Mélanger farine, sucre et sel dans un saladier',
        'Liquides : Creuser un puits, ajouter œufs battus',
        'Mélange : Incorporer le lait petit à petit en fouettant',
        'Beurre : Ajouter le beurre fondu et l\'arôme',
        'Repos : Laisser reposer 1h au réfrigérateur',
        'Cuisson : Chauffer une poêle antiadhésive ou crêpière',
        'Première crêpe : Badigeonner de beurre, verser une louche de pâte',
        'Technique : Étaler en inclinant la poêle, cuire 1-2 minutes',
        'Retournement : Retourner quand les bords se décollent',
        'Finition : Cuire 30 secondes côté face'
      ],
      tips: 'La consistance doit être fluide (texture crème liquide). Première crêpe souvent ratée (test de température). Empiler les crêpes avec du papier sulfurisé.'
    },
    {
      id: 13,
      title: 'Mousse au Chocolat Classique',
      category: 'Dessert',
      time: '4h25',
      difficulty: 'Moyen',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/oryxrojvzh9xzwv18hfkw/mousse-au-chocolat.jpg?rlkey=1v08xq1303b9a06uiso93z36r&st=rqkth4ec&dl=1',
      emoji: '🍫',
      description: 'La mousse au chocolat traditionnelle, légère et onctueuse 🍫',
      author: 'Gustalya',
      serves: 6,
      shareCode: 'MOUS011',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '200 g de chocolat noir 70%',
        '6 œufs très frais (séparés)',
        '30 g de sucre',
        '1 pincée de sel',
        'Copeaux de chocolat pour décoration'
      ],
      instructions: [
        'Chocolat : Faire fondre au bain-marie avec 2 cuillères à soupe d\'eau',
        'Tempérage : Laisser tiédir hors du feu',
        'Jaunes : Incorporer les jaunes d\'œufs un par un dans le chocolat tiède',
        'Blancs : Monter les blancs en neige avec le sel',
        'Fermeté : Ajouter le sucre, continuer jusqu\'à obtention de pics fermes',
        'Mélange : Incorporer 1/3 des blancs dans le chocolat (assouplir)',
        'Incorporation : Ajouter délicatement le reste des blancs en 2 fois',
        'Répartition : Verser dans des verrines individuelles',
        'Prise : Réfrigérer minimum 4 heures',
        'Service : Décorer de copeaux de chocolat'
      ],
      tips: 'Chocolat de qualité indispensable (Valrhona recommandé). Blancs bien fermes mais pas secs. Mélange délicat pour préserver l\'aération.'
    },
    {
      id: 14,
      title: 'Tiramisu',
      category: 'Dessert',
      time: '12h30',
      difficulty: 'Facile',
      likes: '0',
      image: 'https://www.dropbox.com/scl/fi/emjt3z4ainnx2kb87kvi7/tiramisu.jpg?rlkey=sq41del2n9ved28hi2hqwb8pl&st=q9lqma5w&dl=1',
      emoji: '☕',
      description: 'Le tiramisu traditionnel italien, crémeux et parfumé au café 🇮🇹',
      author: 'Gustalya',
      serves: 8,
      shareCode: 'TIRA012',
      isFamilyRecipe: false,
      family: 'Recettes Populaires 2024',
      ingredients: [
        '500 g de mascarpone',
        '6 jaunes d\'œufs',
        '150 g de sucre',
        '400 ml de café espresso fort (refroidi)',
        '60 ml de Marsala ou Amaretto',
        '2 paquets de biscuits à la cuillère (Savoiardi)',
        'Cacao amer en poudre',
        'Copeaux de chocolat noir (optionnel)'
      ],
      instructions: [
        'Sabayon : Fouetter jaunes et sucre jusqu\'à blanchiment (5 minutes)',
        'Mascarpone : Incorporer délicatement au sabayon',
        'Café : Mélanger café refroidi et alcool dans un plat creux',
        'Trempage : Tremper rapidement chaque biscuit dans le café',
        'Premier étage : Disposer une couche de biscuits dans le plat',
        'Crème : Étaler la moitié de la crème mascarpone',
        'Répétition : Nouvelle couche de biscuits trempés',
        'Finition : Terminer par la crème restante',
        'Repos : Réfrigérer 12 heures minimum',
        'Service : Saupoudrer généreusement de cacao avant service'
      ],
      tips: 'Mascarpone à température ambiante pour éviter les grumeaux. Biscuits rapidement trempés (ne pas détremper). Repos indispensable pour que les saveurs se mélangent.'
    }
  ]);

  // Debug: Afficher les familles de recettes dans un useEffect
  useEffect(() => {
    console.log('Familles de recettes disponibles:', [...new Set(recipes.map(r => r.family))]);
    console.log('Recettes populaires trouvées:', popularRecipes.length);
  }, [recipes, popularRecipes]);

  // =====================================
  // MISE À JOUR DU CODE FAMILLE À LA CONNEXION
  // =====================================
  useEffect(() => {
    if (currentUser?.email) {
      const stored = localStorage.getItem(`familyCode_${currentUser.email}`);
      setFamilyCode(stored || generateFamilyCode(currentUser.email));
    }
  }, [currentUser]);

  // =====================================
  // NOUVEAU : RECHARGER LES RECETTES À CHAQUE CHANGEMENT DE FAMILLE OU UTILISATEUR
  // =====================================
  useEffect(() => {
    if (familyCode && currentUser) {
      if (currentView === 'my-recipes') {
        loadMyRecipes();
      } else {
        loadFamilyRecipes();
      }
    }
  }, [familyCode, currentUser, popularRecipes, currentView]);

  // =====================================
  // MISE À JOUR DES CHAMPS UTILISATEUR DANS NEWRECIPE
  // =====================================
  useEffect(() => {
    if (currentUser) {
      setNewRecipe(prev => ({
        ...prev,
        owner: currentUser.uid || '',
        author: currentUser.email?.split('@')[0] || 'Utilisateur'
      }));
    }
  }, [currentUser]);

  // =====================================
  // FONCTIONS UTILITAIRES
  // =====================================
  
  const generateShareCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 7; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const copyGeneratedCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      alert('📋 Code copié dans le presse-papiers avec amour !');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(familyCode);
    alert('Code famille copié ! 👨‍👩‍👧‍👦');
  };

  // Fonction pour copier le code de partage d'une recette
  const copyRecipeShareCode = async (recipe) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(recipe.shareCode);
        alert(`📋 Code de partage "${recipe.shareCode}" copié !\n\nPartagez ce code avec votre famille pour qu'ils puissent découvrir votre recette "${recipe.title}" ! 💝`);
      } else {
        // Fallback pour les environnements non-sécurisés
        const textArea = document.createElement('textarea');
        textArea.value = recipe.shareCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`📋 Code de partage "${recipe.shareCode}" copié !\n\nPartagez ce code avec votre famille pour qu'ils puissent découvrir votre recette "${recipe.title}" ! 💝`);
      }
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      alert(`❌ Impossible de copier le code. Code: ${recipe.shareCode}`);
    }
  };

  // NOUVELLES FONCTIONS POUR LES CODES
  const handleCodeSubmit = async () => {
    setCodeError('');
    if (!codeInput.trim()) {
      setCodeError('Veuillez saisir un code');
      return;
    }
    if (codeInput.startsWith('FAM')) {
      if (codeInput.length === 6) {
        setIsFamilyMember(true);
        setShowCodeInput(false);
        setCodeInput('');
        setCurrentView('family');
        setFamilyCode(codeInput);
        if (currentUser?.email) {
          localStorage.setItem(`familyCode_${currentUser.email}`, codeInput);
        }
        await loadFamilyRecipes();
        alert('🎉 Bienvenue dans notre famille culinaire !');
      } else {
        setCodeError('Code famille invalide (format: FAM123)');
      }
      return;
    }
    // Recherche de recette dans Firestore
    try {
      const q = query(collection(db, "recipes"), where("shareCode", "==", codeInput));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const recipeDoc = querySnapshot.docs[0];
        const recipeData = { id: recipeDoc.id, ...recipeDoc.data() };
        setSelectedRecipe(recipeData);
        setShowCodeInput(false);
        setCodeInput('');
        
        // Demander à l'utilisateur s'il veut sauvegarder la recette
        const shouldSave = window.confirm(
          `✨ Recette "${recipeData.title}" trouvée !\n\nVoulez-vous la sauvegarder dans votre profil ?`
        );
        
        if (shouldSave) {
          await saveSharedRecipe(recipeData);
        } else {
          alert(`✨ Recette "${recipeData.title}" affichée !`);
        }
      } else {
        setCodeError('Code non trouvé. Vérifiez le code.');
      }
    } catch (error) {
      console.error("Erreur de recherche:", error);
      setCodeError('Erreur lors de la recherche');
    }
  };

  // Nouvelle fonction pour sauvegarder une recette partagée
  const saveSharedRecipe = async (sharedRecipe) => {
    try {
      // Vérifier si la recette n'est pas déjà dans le profil
      const existingRecipe = familyRecipes.find(r => r.shareCode === sharedRecipe.shareCode);
      if (existingRecipe) {
        alert('💝 Cette recette est déjà dans votre profil !');
        return;
      }

      // Créer une copie de la recette pour l'utilisateur
      const recipeToSave = {
        ...sharedRecipe,
        id: Date.now().toString(), // Nouvel ID pour éviter les conflits
        familyCode: familyCode,
        family: 'Recette partagée',
        isFamilyRecipe: true,
        savedAt: new Date(),
        originalAuthor: sharedRecipe.author || sharedRecipe.originalAuthor,
        originalShareCode: sharedRecipe.shareCode,
        owner: currentUser?.uid || '' // Ajout du champ owner
      };

      // Sauvegarder dans Firestore
      await addDoc(collection(db, "recipes"), recipeToSave);
      
      // Recharger les recettes
      if (currentView === 'my-recipes') {
        await loadMyRecipes();
      } else {
        await loadFamilyRecipes();
      }
      
      // Fermer le modal de la recette
      setSelectedRecipe(null);
      
      alert(`💝 Recette "${sharedRecipe.title}" sauvegardée dans votre profil !`);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la recette partagée:", error);
      alert("❌ Erreur lors de la sauvegarde de la recette partagée");
    }
  };

  const getAllFamilyRecipes = () => {
    return familyRecipes;
  };

  // =====================================
  // SYSTÈME DE PARTAGE FAMILIAL
  // =====================================
  
  // Charger les données familiales partagées
  const loadFamilyData = () => {
    try {
      // Charger les likes familiaux (global, pas lié au code famille)
      const storedLikes = localStorage.getItem('global_family_likes');
      if (storedLikes) {
        setFamilyLikes(JSON.parse(storedLikes));
      }
      
      // Charger les commentaires familiaux (global, pas lié au code famille)
      const storedComments = localStorage.getItem('global_family_comments');
      if (storedComments) {
        setFamilyComments(JSON.parse(storedComments));
      }
      
      // Charger les likes de l'utilisateur (global, pas lié au code famille)
      const userLikesKey = `global_user_likes_${currentUser?.email}`;
      const storedUserLikes = localStorage.getItem(userLikesKey);
      if (storedUserLikes) {
        setUserLikes(new Set(JSON.parse(storedUserLikes)));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données familiales:', error);
    }
  };

  // Sauvegarder les données familiales
  const saveFamilyData = (likes, comments, userLikesSet) => {
    try {
      localStorage.setItem('global_family_likes', JSON.stringify(likes));
      localStorage.setItem('global_family_comments', JSON.stringify(comments));
      
      const userLikesKey = `global_user_likes_${currentUser?.email}`;
      localStorage.setItem(userLikesKey, JSON.stringify([...userLikesSet]));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données familiales:', error);
    }
  };

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    if (currentUser?.email) {
      loadFamilyData();
    }
  }, [currentUser?.email]);

  // Fonction pour liker/unliker une recette
  const toggleLike = (recipeId) => {
    const newUserLikes = new Set(userLikes);
    let newFamilyLikes = { ...familyLikes };
    
    if (newUserLikes.has(recipeId)) {
      // Retirer le like
      newUserLikes.delete(recipeId);
      newFamilyLikes[recipeId] = Math.max(0, (newFamilyLikes[recipeId] || 0) - 1);
    } else {
      // Ajouter le like
      newUserLikes.add(recipeId);
      newFamilyLikes[recipeId] = (newFamilyLikes[recipeId] || 0) + 1;
      
      // Feedback visuel pour ajouter un like
      setTimeout(() => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) {
          alert(`💕 Vous avez aimé "${recipe.title}" ! Votre famille peut maintenant voir votre amour pour cette recette ❤️`);
        }
      }, 100);
    }
    
    setUserLikes(newUserLikes);
    setFamilyLikes(newFamilyLikes);
    saveFamilyData(newFamilyLikes, familyComments, newUserLikes);
  };

  // Fonction pour obtenir le nombre de likes d'une recette
  const getRecipeLikes = (recipeId) => {
    return familyLikes[recipeId] || 0;
  };

  // Fonction pour vérifier si l'utilisateur a liké une recette
  const hasUserLiked = (recipeId) => {
    return userLikes.has(recipeId);
  };

  // =====================================
  // FONCTIONS COMMENTAIRES FAMILIAUX PARTAGÉS
  // =====================================
  
  const getRandomFamilyEmoji = () => {
    const emojis = ['👵', '👨‍🍳', '👩‍🍳', '👧', '👦', '❤️', '😋', '🥰', '😍', '🤤'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  const getRandomHeartColor = () => {
    const colors = ['#dc2626', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addComment = (recipeId) => {
    if (!newComment.trim()) {
      alert('💕 Écrivez votre petit mot avec amour !');
      return;
    }

    const comment = {
      id: Date.now(),
      text: newComment,
      author: currentUser?.email?.split('@')[0] || 'Famille',
      authorEmail: currentUser?.email || '',
      date: 'À l\'instant',
      emoji: getRandomFamilyEmoji(),
      heartColor: getRandomHeartColor(),
      timestamp: new Date().toISOString()
    };

    const newFamilyComments = { ...familyComments };
    if (!newFamilyComments[recipeId]) {
      newFamilyComments[recipeId] = [];
    }
    newFamilyComments[recipeId] = [...newFamilyComments[recipeId], comment];
    
    setFamilyComments(newFamilyComments);
    saveFamilyData(familyLikes, newFamilyComments, userLikes);
    setNewComment('');
    
    // Animation de succès familiale
    setTimeout(() => {
      alert('💝 Votre petit mot a été partagé avec toute la famille !');
    }, 100);
  };

  const getCommentsForRecipe = (recipeId) => {
    return familyComments[recipeId] || [];
  };

  // =====================================
  // RENDU SÉCURISÉ DES INGRÉDIENTS
  // =====================================
  
  const renderIngredient = (ing, index) => {
    if (!ing) return null;
    
    if (typeof ing === 'string') {
      return <li key={index} style={{ marginBottom: '8px', color: '#92400e', fontSize: '14px' }}>{ing}</li>;
    }
    
    if (typeof ing === 'object' && ing.name) {
      const name = String(ing.name || '[Ingrédient]');
      const quantity = ing.quantity ? String(ing.quantity) : '';
      const unit = ing.unit ? String(ing.unit) : '';
      
      return (
        <li key={index} style={{ marginBottom: '8px', color: '#92400e', fontSize: '14px' }}>
          {name}{quantity ? ` ${quantity}` : ''}{unit ? ` ${unit}` : ''}
        </li>
      );
    }
    
    return <li key={index} style={{ color: '#dc2626', marginBottom: '8px', fontSize: '14px' }}>[Ingrédient invalide]</li>;
  };

  // =====================================
  // FONCTIONS DE GESTION DES PHOTOS
  // =====================================
  
  // Ouvrir la caméra
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Caméra arrière par défaut
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setShowCamera(true);
      setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      alert('❌ Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès ou utiliser l\'upload de fichier.');
    }
  };

  // Prendre une photo
  const capturePhoto = () => {
    if (cameraRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = cameraRef.current.videoWidth;
      canvas.height = cameraRef.current.videoHeight;
      
      context.drawImage(cameraRef.current, 0, 0);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);
      closeCamera();
    }
  };

  // Fermer la caméra
  const closeCamera = () => {
    if (cameraRef.current && cameraRef.current.srcObject) {
      const tracks = cameraRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      cameraRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  // Upload de fichier image
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedPhoto(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('⚠️ Veuillez sélectionner un fichier image valide.');
    }
    // Reset input
    event.target.value = '';
  };

  // Ouvrir la visionneuse de photos
  const openPhotoViewer = (photo) => {
    setViewerPhoto(photo);
    setShowPhotoViewer(true);
  };

  // Fermer la visionneuse de photos
  const closePhotoViewer = () => {
    setShowPhotoViewer(false);
    setViewerPhoto(null);
  };

  // Supprimer la photo capturée
  const removePhoto = () => {
    setCapturedPhoto(null);
  };

  // =====================================
  // FONCTIONS DE GESTION DES RECETTES (MISES À JOUR)
  // =====================================
  
  const openRecipe = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const closeRecipe = () => {
    setSelectedRecipe(null);
  };

  const addIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { name: '', quantity: '', unit: 'g' }]
    });
  };

  const removeIngredient = (index) => {
    const ingredients = newRecipe.ingredients.filter((_, i) => i !== index);
    setNewRecipe({ ...newRecipe, ingredients });
  };

  const updateIngredient = (index, field, value) => {
    const ingredients = [...newRecipe.ingredients];
    ingredients[index][field] = value;
    setNewRecipe({ ...newRecipe, ingredients });
  };

  const addSeasoning = () => {
    setNewRecipe({
      ...newRecipe,
      seasonings: [...newRecipe.seasonings, { name: '', quantity: '', unit: 'pincée' }]
    });
  };

  const removeSeasoning = (index) => {
    const seasonings = newRecipe.seasonings.filter((_, i) => i !== index);
    setNewRecipe({ ...newRecipe, seasonings });
  };

  const updateSeasoning = (index, field, value) => {
    const seasonings = [...newRecipe.seasonings];
    seasonings[index][field] = value;
    setNewRecipe({ ...newRecipe, seasonings });
  };

  const addInstruction = () => {
    setNewRecipe({
      ...newRecipe,
      instructions: [...newRecipe.instructions, '']
    });
  };

  const removeInstruction = (index) => {
    const instructions = newRecipe.instructions.filter((_, i) => i !== index);
    setNewRecipe({ ...newRecipe, instructions });
  };

  const updateInstruction = (index, value) => {
    const instructions = [...newRecipe.instructions];
    instructions[index] = value;
    setNewRecipe({ ...newRecipe, instructions });
  };

  // Charger les recettes de la famille depuis Firestore
  const loadFamilyRecipes = async () => {
    if (!currentUser) return;
    setLoadingRecipes(true);
    try {
      // Charger les recettes familiales (avec familyCode)
      const familyQuery = query(collection(db, "recipes"), where("familyCode", "==", familyCode));
      const familySnapshot = await getDocs(familyQuery);
      const familyRecipesArray = [];
      familySnapshot.forEach((doc) => {
        familyRecipesArray.push({ id: doc.id, ...doc.data() });
      });
      
      // Charger les recettes privées de l'utilisateur (avec owner)
      const ownerQuery = query(collection(db, "recipes"), where("owner", "==", currentUser.uid));
      const ownerSnapshot = await getDocs(ownerQuery);
      const ownerRecipesArray = [];
      ownerSnapshot.forEach((doc) => {
        const recipe = { id: doc.id, ...doc.data() };
        // Ne pas ajouter les recettes qui ont déjà un familyCode (elles sont déjà dans familyRecipesArray)
        if (!recipe.familyCode) {
          ownerRecipesArray.push(recipe);
        }
      });
      
      // Fusionner les recettes familiales et privées
      const allFamilyRecipes = [...familyRecipesArray, ...ownerRecipesArray];
      setFamilyRecipes(allFamilyRecipes);
      
      // --- Fusion intelligente ---
      // 1. On sépare les recettes populaires modifiées (Firestore) des autres recettes familiales
      const firestorePopular = allFamilyRecipes.filter(r => r.family === 'Recettes Populaires 2024');
      const firestorePopularCodes = firestorePopular.map(r => r.shareCode || r.title);
      // 2. On retire les recettes statiques qui ont été modifiées en Firestore
      const staticPopularFiltered = popularRecipes.filter(
        r => !firestorePopularCodes.includes(r.shareCode || r.title)
      );
      // 3. On fusionne : recettes familiales + recettes populaires modifiées (Firestore) + recettes populaires statiques restantes
      const allRecipes = [
        ...allFamilyRecipes.filter(r => r.family !== 'Recettes Populaires 2024'),
        ...firestorePopular,
        ...staticPopularFiltered
      ];
      setRecipes(allRecipes);
      
      console.log(`${familyRecipesArray.length} recettes familiales + ${ownerRecipesArray.length} recettes privées + ${popularRecipes.length} recettes populaires = ${allRecipes.length} recettes total (fusion intelligente)`);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      alert("❌ Erreur de chargement des recettes");
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Nouvelle fonction pour charger uniquement les recettes créées par l'utilisateur
  const loadMyRecipes = async () => {
    if (!currentUser) return;
    setLoadingRecipes(true);
    try {
      // Charger uniquement les recettes privées de l'utilisateur
      const ownerQuery = query(collection(db, "recipes"), where("owner", "==", currentUser.uid));
      const ownerSnapshot = await getDocs(ownerQuery);
      const myRecipesArray = [];
      
      console.log('🔍 Debug loadMyRecipes - Recettes trouvées avec owner:', ownerSnapshot.size);
      console.log('🔍 User ID actuel:', currentUser.uid);
      
      for (const docSnapshot of ownerSnapshot.docs) {
        const recipe = { id: docSnapshot.id, ...docSnapshot.data() };
        console.log('🔍 Recette trouvée:', {
          id: recipe.id,
          title: recipe.title,
          family: recipe.family,
          familyCode: recipe.familyCode,
          owner: recipe.owner,
          author: recipe.author,
          shareCode: recipe.shareCode
        });
        
        // Vérifier que le document existe réellement dans Firestore
        // const recipeRef = doc(db, "recipes", recipe.id);
        // const docSnap = await getDoc(recipeRef);
        
        // if (!docSnap.exists()) {
        //   console.log('❌ Recette supprimée de Firestore, ignorée:', recipe.title);
        //   continue;
        // }
        
        // Inclure les recettes créées ET les recettes partagées sauvegardées par l'utilisateur
        const isMyCreation = recipe.family === 'Ma création' || 
                           recipe.family === undefined || 
                           recipe.family === null ||
                           (recipe.owner === currentUser.uid && !recipe.familyCode);
        
        const isMySavedSharedRecipe = recipe.family === 'Recette partagée' && 
                                     recipe.owner === currentUser.uid;
        
        if (isMyCreation || isMySavedSharedRecipe) {
          myRecipesArray.push(recipe);
          console.log('✅ Recette ajoutée à mes recettes:', recipe.title, {
            type: isMyCreation ? 'création' : 'partagée sauvegardée',
            family: recipe.family
          });
        } else {
          console.log('❌ Recette filtrée:', recipe.title, {
            hasFamilyCode: !!recipe.familyCode,
            familyValue: recipe.family,
            familyMatch: recipe.family === 'Ma création',
            isSharedRecipe: recipe.family === 'Recette partagée',
            ownerMatch: recipe.owner === currentUser?.uid
          });
        }
      }
      
      setFamilyRecipes(myRecipesArray);
      setRecipes(myRecipesArray);
      
      console.log(`${myRecipesArray.length} recettes créées par l'utilisateur`);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      alert("❌ Erreur de chargement des recettes");
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Fonction de correction avancée du champ owner
  const fixMyRecipesOwner = async () => {
    if (!currentUser) {
      alert("Utilisateur non connecté !");
      return;
    }
    const myAuthor = currentUser.email?.split('@')[0];
    const myEmail = currentUser.email;
    const myUid = currentUser.uid;
    const recipesRef = collection(db, "recipes");
    const allRecipesSnap = await getDocs(recipesRef);
    let count = 0;
    let notFixed = [];
    for (const docSnap of allRecipesSnap.docs) {
      const data = docSnap.data();
      // Correction si author = pseudo, email, UID, ou contient le pseudo
      // ET si owner est manquant ou différent de l'utilisateur actuel
      if (
        (data.author === myAuthor ||
         data.author === myEmail ||
         data.author === myUid ||
         (typeof data.author === 'string' && data.author.includes(myAuthor))
        ) &&
        (!data.owner || data.owner !== currentUser.uid)
      ) {
        await updateDoc(doc(db, "recipes", docSnap.id), { owner: currentUser.uid });
        console.log(`✅ Correction du owner pour la recette "${data.title}" (${docSnap.id})`);
        count++;
      } else if (!data.owner || data.owner !== currentUser.uid) {
        notFixed.push({ id: docSnap.id, title: data.title, author: data.author, owner: data.owner });
      }
    }
    alert(`Correction terminée ! ${count} recette(s) mises à jour.`);
    if (notFixed.length > 0) {
      console.log("Recettes non corrigées (author différent) :", notFixed);
    }
  };

  // Handler pour éditer une recette
  const handleEditRecipe = (recipe, e) => {
    if (e) e.stopPropagation();
    
    console.log('🔍 Debug handleEditRecipe:', {
      recipeFamily: recipe.family,
      recipeOwner: recipe.owner,
      currentUser: currentUser?.uid,
      familyCode: recipe.familyCode,
      isFamilyRecipe: recipe.isFamilyRecipe
    });
    
    // ✅ NOUVELLE LOGIQUE DE PERMISSIONS
    // Vérifier si l'utilisateur est propriétaire de la recette
    if (recipe.owner !== currentUser?.uid) {
      alert("⛔️ Vous ne pouvez modifier que vos propres recettes.");
      return;
    }
    
    // ✅ Permettre la modification de TOUTES les recettes dont l'utilisateur est propriétaire
    console.log('✅ Modification autorisée - utilisateur propriétaire');
    
    setEditingRecipe(recipe);
    setNewRecipe({
      title: recipe.title || '',
      description: recipe.description || '',
      prepTime: recipe.time ? recipe.time.replace('min', '') : '',
      cookTime: recipe.cookTime || '',
      servings: recipe.serves || '',
      difficulty: recipe.difficulty || 'facile',
      category: recipe.category || 'plat-principal',
      ingredients: (recipe.ingredients || []).map(ing => {
        if (typeof ing === 'string') {
          const match = ing.match(/^(\d+)?\s?(\w+)?\s?de\s(.+)$/);
          if (match) {
            return { quantity: match[1] || '', unit: match[2] || '', name: match[3] || '' };
          }
          return { name: ing, quantity: '', unit: '' };
        }
        return ing;
      }),
      seasonings: recipe.seasonings || [{ name: '', quantity: '', unit: 'pincée' }],
      instructions: recipe.instructions || [''],
      tips: recipe.tips || ''
    });
    setCapturedPhoto(recipe.image || null);
    console.log('🚀 Ouverture du modal de création/édition');
    setSelectedRecipe(null);
    setShowCreateRecipe(true);
  };

  // Handler pour ouvrir le modal de nouvelle recette (réinitialise tout)
  const handleNewRecipe = () => {
    setNewRecipe({
      title: '',
      description: '',
      prepTime: '',
      cookTime: '',
      servings: '',
      difficulty: 'facile',
      category: 'plat-principal',
      ingredients: [{ name: '', quantity: '', unit: 'g' }],
      seasonings: [{ name: '', quantity: '', unit: 'pincée' }],
      instructions: [''],
      tips: '',
      owner: currentUser?.uid || '',
      author: currentUser?.email?.split('@')[0] || 'Utilisateur',
      shareCode: '',
      family: 'Ma création'
    });
    setCapturedPhoto(null);
    setEditingRecipe(null);
    setShowCreateRecipe(true);
  };

  // Handler pour supprimer une recette
  const handleDeleteRecipe = async (recipe, e) => {
    if (e) e.stopPropagation();
    
    console.log('🔍 Debug handleDeleteRecipe:', {
      recipeFamily: recipe.family,
      recipeOwner: recipe.owner,
      currentUser: currentUser?.uid,
      familyCode: recipe.familyCode,
      isFamilyRecipe: recipe.isFamilyRecipe,
      isAuthenticated: !!currentUser,
      authUid: currentUser?.uid
    });
    // ✅ NOUVELLE LOGIQUE SIMPLIFIÉE
    // Seul le propriétaire peut supprimer sa propre recette
    if (recipe.owner !== currentUser?.uid) {
      alert("⛔️ Vous ne pouvez supprimer que vos propres recettes.");
      return;
    }
    if (!window.confirm(`Voulez-vous vraiment supprimer la recette "${recipe.title}" ?`)) return;
    
    try {
      console.log('🗑️ Tentative de suppression de la recette:', recipe.id);
      console.log('🔍 Détails de la recette à supprimer:', {
        id: recipe.id,
        title: recipe.title,
        owner: recipe.owner,
        family: recipe.family,
        familyCode: recipe.familyCode
      });
      
      // Vérifier que l'utilisateur est bien authentifié
      if (!currentUser?.uid) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Vérifier l'état d'authentification Firebase
      const currentAuthUser = auth.currentUser;
      console.log('🔍 État d\'authentification Firebase:', {
        currentUser: currentUser?.uid,
        authCurrentUser: currentAuthUser?.uid,
        isAuthenticated: !!currentAuthUser,
        email: currentAuthUser?.email
      });
      
      // Créer une référence explicite au document
      const recipeRef = doc(db, "recipes", recipe.id);
      console.log('🔍 Référence du document:', recipeRef.path);
      
      // Vérifier que le document existe avant de le supprimer
      const docSnap = await getDoc(recipeRef);
      console.log('🔍 Résultat de getDoc:', {
        exists: docSnap.exists(),
        id: docSnap.id,
        data: docSnap.exists() ? docSnap.data() : null
      });
      
      if (!docSnap.exists()) {
        console.log('❌ Document introuvable avec getDoc direct');
        console.log('🔍 Tentative de recherche avec une requête...');
        
        // Essayer de trouver le document avec une requête
        const recipeQuery = query(
          collection(db, "recipes"),
          where("__name__", "==", recipeRef)
        );
        const querySnap = await getDocs(recipeQuery);
        console.log('🔍 Résultat de la requête:', {
          size: querySnap.size,
          docs: querySnap.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        });
        
        // Lister toutes les recettes pour voir ce qui existe
        const allRecipesQuery = query(collection(db, "recipes"));
        const allRecipesSnap = await getDocs(allRecipesQuery);
        console.log('🔍 Toutes les recettes dans Firestore:', allRecipesSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          owner: doc.data().owner,
          family: doc.data().family
        })));
        
        // Si le document n'existe toujours pas, essayer la suppression directe
        console.log('🔍 Tentative de suppression directe sans vérification...');
        try {
          await deleteDoc(recipeRef);
          console.log('✅ Suppression directe réussie');
          
          // Recharger les recettes
          if (currentView === 'my-recipes') {
            await loadMyRecipes();
          } else {
            await loadFamilyRecipes();
          }
          return;
        } catch (directError) {
          console.error('❌ Erreur lors de la suppression directe:', directError);
          throw new Error('Document introuvable et suppression directe échouée');
        }
      }
      console.log('🔍 Document trouvé:', docSnap.data());
      
      // Tenter la suppression
      await deleteDoc(recipeRef);
      console.log('✅ Recette supprimée avec succès');
      
      // Recharger les recettes
      if (currentView === 'my-recipes') {
        await loadMyRecipes();
      } else {
        await loadFamilyRecipes();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      console.error('❌ Code d\'erreur:', error.code);
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Détails complets de l\'erreur:', error);
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = "Erreur lors de la suppression";
      if (error.code === 'permission-denied') {
        errorMessage = "Permission refusée. Vérifiez les règles Firestore.";
      } else if (error.code === 'not-found') {
        errorMessage = "Recette introuvable.";
      } else {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  // Remplacement de saveRecipe
  const saveRecipe = async () => {
    // Validation des champs
    if (!newRecipe.title.trim()) {
      alert('💕 Veuillez saisir un titre');
      return;
    }
    const validIngredients = newRecipe.ingredients.filter(i => i.name && i.name.trim() !== '');
    if (validIngredients.length === 0) {
      alert('🥕 Veuillez ajouter au moins un ingrédient');
      return;
    }
    const validInstructions = newRecipe.instructions.filter(i => i.trim() !== '');
    if (validInstructions.length === 0) {
      alert('📝 Veuillez ajouter au moins une instruction');
      return;
    }
    try {
      if (editingRecipe) {
        // Mode édition : mettre à jour la recette existante
        const recipeToUpdate = {
          ...newRecipe,
          owner: currentUser?.uid || '',
          author: currentUser?.email?.split('@')[0] || 'Utilisateur',
          image: capturedPhoto || '',
          family: 'Ma création',
        };
        delete recipeToUpdate.familyCode;
        delete recipeToUpdate.shareCode;
        delete recipeToUpdate.id; // <-- Correction ici
        await updateDoc(doc(db, "recipes", editingRecipe.id), recipeToUpdate);
        alert("✅ Recette modifiée avec succès !");
      } else {
        // Mode création : créer une nouvelle recette
        const recipeToSave = {
          ...newRecipe,
          owner: currentUser?.uid || '',
          author: currentUser?.email?.split('@')[0] || 'Utilisateur',
          image: capturedPhoto || '',
          shareCode: generateShareCode(),
          family: 'Ma création',
        };
        delete recipeToSave.familyCode;
        delete recipeToSave.id; // <-- Correction ici
        await addDoc(collection(db, "recipes"), recipeToSave);
        alert("✅ Recette créée avec succès !");
      }
      
      if (currentView === 'my-recipes') {
        await loadMyRecipes();
      } else {
        await loadFamilyRecipes();
      }
      setShowCreateRecipe(false); // Fermer seulement après succès
      setEditingRecipe(null);
      setCapturedPhoto(null);
      setNewRecipe({
        title: '',
        description: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        difficulty: 'facile',
        category: 'plat-principal',
        ingredients: [{ name: '', quantity: '', unit: 'g' }],
        seasonings: [{ name: '', quantity: '', unit: 'pincée' }],
        instructions: [''],
        tips: '',
        owner: currentUser?.uid || '',
        author: currentUser?.email?.split('@')[0] || 'Utilisateur',
        shareCode: '',
        family: 'Ma création',
      });
    } catch (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
      // NE PAS fermer la fenêtre si erreur
    }
  };

  const closeSuccessModal = () => {
    setShowRecipeSuccess(false);
  };

  const handleShareCode = () => {
    if (shareCode.length >= 6) {
      // Simulation de recherche de recette
      if (shareCode === generatedCode) {
        setShowShareResult(true);
        setSelectedRecipe({
          title: savedRecipeTitle,
          description: 'Recette partagée avec amour via code',
          ingredients: ['Ingrédient 1', 'Ingrédient 2'],
          instructions: ['Étape 1', 'Étape 2']
        });
      } else {
        alert("Aucune recette trouvée pour ce code. 🤔");
      }
    }
  };

  // =====================================
  // FONCTIONS EMAIL CORRIGÉES
  // =====================================
  
  const openInviteModal = () => {
    setShowInviteModal(true);
    setEmailStatus(null);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteData({
      email: '',
      message: 'Rejoignez-moi sur Gustalya pour partager nos recettes favorites !'
    });
    setEmailSending(false);
    setEmailStatus(null);
  };

  const sendInvitation = async () => {
    if (!inviteData.email) {
      setEmailStatus({ type: 'error', message: 'Veuillez saisir une adresse email valide.' });
      return;
    }

    setEmailSending(true);
    setEmailStatus(null);

    try {
      // Debug - Vérifier les variables d'environnement
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

      console.log('🔍 Debug EmailJS Variables:');
      console.log('Service ID:', serviceId);
      console.log('Template ID:', templateId);
      console.log('Public Key:', publicKey);

      if (!serviceId || !templateId || !publicKey) {
        console.error('❌ Variables manquantes');
        setEmailStatus({ 
          type: 'error', 
          message: 'Configuration EmailJS incomplète. Vérifiez le fichier .env' 
        });
        return;
      }

      // Initialiser EmailJS avec la clé publique uniquement
      try {
        emailjs.init(publicKey);
        console.log('✅ EmailJS initialisé avec succès');
      } catch (initError) {
        console.error('❌ Erreur initialisation EmailJS:', initError);
      }

      // Paramètres pour le template (SEULEMENT les variables du template)
      const templateParams = {
        from_name: currentUser?.email?.split('@')[0] || "Famille Gustalya",
        message: inviteData.message,
        family_code: familyCode,
        email: inviteData.email
      };

      console.log('📧 Template Params envoyés:', templateParams);

      // Tentative d'envoi
      console.log('🚀 Démarrage envoi EmailJS...');
      
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams
      );

      console.log('✅ Réponse EmailJS complète:', response);
      console.log('✅ Status:', response.status);
      console.log('✅ Text:', response.text);

      if (response.status === 200 || response.text === 'OK') {
        setEmailStatus({ type: 'success', message: 'Invitation envoyée avec amour ! 💌' });
        console.log('🎉 Email envoyé avec succès !');
      } else {
        throw new Error(`Statut imprévu: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ ERREUR DÉTAILLÉE:');
      console.error('Type:', typeof error);
      console.error('Name:', error.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Erreur complète:', error);

      let errorMessage = "Erreur lors de l'envoi de l'email";
      
      // Messages d'erreur spécifiques EmailJS
      if (error.message) {
        console.error('Message d\'erreur exact:', error.message);
        errorMessage += `: ${error.message}`;
      }
      
      if (error.status) {
        console.error('Status HTTP:', error.status);
        errorMessage += ` (Code: ${error.status})`;
      }
      
      if (error.text) {
        console.error('Texte de réponse:', error.text);
      }

      // Messages d'erreur spécifiques
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "❌ Erreur réseau. Vérifiez votre connexion internet.";
      } else if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
        errorMessage = "❌ Clés d'API incorrectes. Vérifiez votre configuration EmailJS.";
      } else if (error.message?.includes('template') || error.message?.includes('404')) {
        errorMessage = "❌ Template non trouvé. Vérifiez l'ID du template.";
      } else if (error.message?.includes('service')) {
        errorMessage = "❌ Service non trouvé. Vérifiez l'ID du service.";
      }

      setEmailStatus({ type: 'error', message: errorMessage });
    } finally {
      setEmailSending(false);
    }
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction de gestion des mises à jour du timer
  const handleTimerUpdate = (status, duration) => {
    if (status === 'finished') {
      // Notification que le timer est terminé
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Timer terminé !', {
          body: `Votre temps de cuisson de ${Math.floor(duration / 60)} minutes est écoulé.`,
          icon: '/favicon.ico'
        });
      } else {
        // Fallback : alert si les notifications ne sont pas disponibles
        alert(`⏰ Timer terminé ! Votre temps de cuisson de ${Math.floor(duration / 60)} minutes est écoulé.`);
      }
    }
  };

  // =====================================
  // DETECTER SI ON EST SUR MOBILE
  // =====================================
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =====================================
  // EXPOSER LES FONCTIONS UTILITAIRES SUR WINDOW
  // =====================================
  useEffect(() => {
    // Exposer la fonction de correction des recettes sur window
    window.fixMyRecipesOwner = fixMyRecipesOwner;
    
    return () => {
      // Nettoyer lors du démontage du composant
      delete window.fixMyRecipesOwner;
    };
  }, []);

  // =====================================
  // RENDU PRINCIPAL
  // =====================================
  
  // Si l'utilisateur n'est pas connecté, afficher l'écran d'authentification
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5F3E7 0%, #8A9A5B 100%)',
        padding: isMobile ? '16px' : '20px'
      }}>
        <div style={{
          maxWidth: isMobile ? '100%' : '500px',
          width: '100%',
          backgroundColor: 'rgba(245, 243, 231, 0.95)',
          borderRadius: '20px',
          padding: isMobile ? '24px' : '40px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          border: '2px solid rgba(138, 154, 91, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Décorations familiales */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            fontSize: isMobile ? '20px' : '24px',
            opacity: 0.6,
            animation: 'gentle-float 4s ease-in-out infinite'
          }}>
            🏠
          </div>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontSize: isMobile ? '20px' : '24px',
            opacity: 0.6,
            animation: 'gentle-float 3s ease-in-out infinite reverse'
          }}>
            ❤️
          </div>
          
          <div style={{ fontSize: isMobile ? '40px' : '48px', marginBottom: '16px' }}>
            <img src="/logo-gustalya.png" alt="Logo Gustalya" style={{ height: isMobile ? 40 : 48, width: isMobile ? 40 : 48, borderRadius: '50%', background: '#e6e6d6', border: '2px solid #a3b18a', objectFit: 'cover', display: 'block', margin: '0 auto' }} />
          </div>
          <h1 style={{ 
            fontSize: isMobile ? '24px' : '32px', 
            marginBottom: '16px', 
            color: '#4E2E1E',
            lineHeight: '1.3'
          }}>
            Bienvenue dans Notre Famille Gustalya
          </h1>
          <p style={{ 
            fontSize: isMobile ? '16px' : '18px', 
            color: '#8A9A5B', 
            marginBottom: '32px', 
            fontStyle: 'italic',
            lineHeight: '1.4'
          }}>
            Connectez-vous pour rejoindre notre table familiale et découvrir nos recettes transmises avec amour 💕
          </p>
          
          <button 
            onClick={() => setShowAuth(true)}
            style={{
              padding: isMobile ? '16px 24px' : '12px 24px',
              fontSize: isMobile ? '18px' : '16px',
              background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'transform 0.2s ease',
              width: isMobile ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🔑 Se connecter / Rejoindre la famille
          </button>
        </div>
        
        {showAuth && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '16px' : '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '24px',
              width: isMobile ? '100%' : '400px',
              maxWidth: '100%',
              position: 'relative',
              border: '2px solid rgba(138, 154, 91, 0.3)'
            }}>
              <button 
                onClick={() => setShowAuth(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#4E2E1E'
                }}
              >
                ✕
              </button>
              <Auth onLogin={() => setShowAuth(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher l'application
  return (
    <>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #F5F3E7 0%, #8A9A5B 100%)',
        fontFamily: 'system-ui, sans-serif',
        paddingBottom: isMobile ? '80px' : '0'
      }}>
        
        {/* Header avec logo Gustalya */}
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fef7ed',
          borderBottom: '2px solid #a3b18a',
          padding: '32px 48px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(146, 64, 14, 0.05)',
          flexWrap: 'wrap',
        }}>
          <img src="/logo-gustalya.png" alt="Logo Gustalya" style={{ height: 180, width: 180, borderRadius: '50%', background: '#e6e6d6', border: '3px solid #a3b18a', objectFit: 'cover', boxShadow: '0 4px 16px rgba(146, 64, 14, 0.08)', marginBottom: 16 }} />
          <span style={{ fontSize: 24, color: '#222', fontStyle: 'italic', fontWeight: 700, textAlign: 'center' }}>
            Partageons ce qu'on aime
          </span>
        </header>
        
        {/* Header Mobile ou Desktop */}
        {isMobile ? (
          // Header Mobile Compact
          <header style={{
            backgroundColor: 'rgba(245, 243, 231, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '2px solid rgba(138, 154, 91, 0.3)',
            padding: '12px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {/* SUPPRESSION DU LOGO ET DU TEXTE */}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowCodeInput(true)}
                  style={{
                    background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  🔑
                </button>
                
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '8px',
                    backgroundColor: 'rgba(78, 46, 30, 0.1)',
                    color: '#782e1e',
                    border: '1px solid rgba(78, 46, 30, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🚪
                </button>
              </div>
            </div>
          </header>
        ) : (
          // Header Desktop
          <nav style={{ 
            backgroundColor: 'rgba(245, 243, 231, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '2px solid rgba(138, 154, 91, 0.3)', 
            padding: '0 24px' 
          }}>
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              height: '64px' 
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {/* SUPPRESSION DU LOGO ET DU TEXTE */}
              </div>
              
              <div style={{ display: 'flex', gap: '32px' }}>
                {[
                  { id: 'home', label: 'Notre Table', icon: '🏠' },
                  { id: 'share', label: 'Partage', icon: '📤' },
                  { id: 'my-recipes', label: 'Mes Recettes', icon: '✨' },
                  { id: 'cooking', label: 'Guide Cuisson', icon: '🍳' },
                  { id: 'profile', label: 'Profil', icon: '👤' },
                  { id: 'help', label: 'Aide', icon: '❓' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: currentView === item.id ? '#4E2E1E' : '#8A9A5B',
                      fontSize: '14px',
                      fontWeight: currentView === item.id ? '600' : '400',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 0',
                      borderBottom: currentView === item.id ? '2px solid #8A9A5B' : '2px solid transparent'
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setShowCodeInput(true)}
                  style={{
                    background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🔑 Saisir un code
                </button>
                
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(78, 46, 30, 0.1)',
                    color: '#782e1e',
                    border: '1px solid rgba(78, 46, 30, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🚪</span>
                  Déconnexion
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* Navigation Bottom Mobile */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(245, 243, 231, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '2px solid rgba(138, 154, 91, 0.3)',
            padding: '8px 0',
            zIndex: 100
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '4px',
              maxWidth: '100%',
              margin: '0 auto'
            }}>
              {[
                { id: 'home', label: 'Table', icon: '🏠' },
                { id: 'share', label: 'Créer', icon: '📤' },
                { id: 'my-recipes', label: 'Mes Recettes', icon: '✨' },
                { id: 'cooking', label: 'Cuisson', icon: '🍳' },
                { id: 'profile', label: 'Profil', icon: '👤' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentView === item.id ? '#4E2E1E' : '#8A9A5B',
                    fontSize: '10px',
                    fontWeight: currentView === item.id ? '600' : '400',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    backgroundColor: currentView === item.id ? 'rgba(138, 154, 91, 0.1)' : 'transparent'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contenu principal avec adaptations mobiles */}
        <main style={{ 
          maxWidth: isMobile ? '100%' : '1200px', 
          margin: '0 auto', 
          padding: isMobile ? '16px' : '32px 24px' 
        }}>

          {/* INTERFACE DE CUISSON EXISTANTE */}
          {currentView === 'cooking' && <CookingGuidePage />}

          {/* PAGE D'ACCUEIL */}
          {currentView === 'home' && (
            <div>
              {/* Hero Section familial */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(138, 154, 91, 0.1) 0%, rgba(154, 114, 55, 0.1) 50%, rgba(122, 82, 35, 0.05) 100%)',
                borderRadius: '16px',
                padding: isMobile ? '24px 16px' : '48px 32px',
                textAlign: 'center',
                marginBottom: isMobile ? '24px' : '40px',
                border: '2px solid rgba(138, 154, 91, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  fontSize: isMobile ? '16px' : '24px',
                  opacity: 0.6,
                  animation: 'gentle-float 4s ease-in-out infinite'
                }}>
                  🏠
                </div>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: isMobile ? '16px' : '24px',
                  opacity: 0.6,
                  animation: 'gentle-float 3s ease-in-out infinite reverse'
                }}>
                  ❤️
                </div>

                <div style={{
                  fontSize: isMobile ? '48px' : '64px',
                  marginBottom: '12px',
                  animation: 'gentle-float 3s ease-in-out infinite'
                }}>
                  🍽️
                </div>
                <h1 style={{
                  fontSize: isMobile ? '24px' : '36px',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#4E2E1E',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  lineHeight: '1.2'
                }}>
                  Bienvenue à Notre Table, {profile?.pseudo || currentUser.email?.split('@')[0] || 'Cher Membre'} !
                </h1>
                <p style={{
                  fontSize: isMobile ? '14px' : '18px',
                  color: '#8A9A5B',
                  margin: 0,
                  maxWidth: '600px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  lineHeight: '1.4',
                  fontStyle: 'italic'
                }}>
                  Où chaque recette raconte une histoire, où chaque plat rassemble les cœurs 💕
                </p>
              </div>

              {/* Statistiques familiales */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? '12px' : '24px',
                marginBottom: isMobile ? '24px' : '32px'
              }}>
                {[
                  { 
                    label: 'Mes recettes', 
                    value: recipes.filter(r => r.author === (currentUser?.email?.split('@')[0] || 'Utilisateur')).length.toString(), 
                    emoji: '✨', 
                    color: 'rgba(138, 154, 91, 0.1)' 
                  },
                  { 
                    label: 'Likes familiaux', 
                    value: Object.values(familyLikes).reduce((total, likes) => total + likes, 0).toString(), 
                    emoji: '❤️', 
                    color: 'rgba(78, 46, 30, 0.1)' 
                  },
                  { 
                    label: 'Messages famille', 
                    value: Object.values(familyComments).reduce((total, comments) => total + comments.length, 0).toString(), 
                    emoji: '💬', 
                    color: 'rgba(117, 130, 77, 0.1)' 
                  },
                  { 
                    label: 'Code famille', 
                    value: familyCode, 
                    emoji: '👨‍👩‍👧‍👦', 
                    color: 'rgba(154, 114, 55, 0.1)' 
                  }
                ].map((stat, index) => (
                  <div key={index} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: isMobile ? '12px' : '20px',
                    borderRadius: '16px',
                    border: '2px solid rgba(138, 154, 91, 0.2)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: stat.color,
                      opacity: 0.3
                    }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '8px' }}>{stat.emoji}</div>
                      <div style={{
                        fontSize: isMobile ? '18px' : '24px',
                        fontWeight: '600',
                        color: '#4E2E1E',
                        marginBottom: '4px'
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '10px' : '12px',
                        color: '#8A9A5B',
                        lineHeight: '1.2'
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guide de cuisine Gustalya */}
              <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                <h2 style={{ 
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '600',
                  color: '#4E2E1E',
                  margin: '0 0 16px 0',
                  textAlign: 'center'
                }}>
                  🍳 Guide de Cuisine Interactif
                </h2>
                <RecipeCookingGuide 
                  recipe={recipes[0]} 
                  onTimerUpdate={handleTimerUpdate} 
                />
              </div>

              {/* Actions rapides pour mobile */}
              {isMobile && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <button
                    onClick={() => setCurrentView('share')}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>✨</span>
                    Créer une recette
                  </button>
                  
                  <button
                    onClick={() => setShowCodeInput(true)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid rgba(138, 154, 91, 0.3)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      color: '#4E2E1E',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🔑</span>
                    Saisir un code
                  </button>
                </div>
              )}

              {/* Recettes Populaires 2024 */}
              <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                <h2 style={{ 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: '600', 
                  color: '#4E2E1E', 
                  marginBottom: isMobile ? '16px' : '24px',
                  textAlign: 'center'
                }}>
                  🌟 Recettes Populaires 2024 ({recipes.filter(recipe => recipe.family === 'Recettes Populaires 2024').length} recettes)
                </h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: isMobile ? '16px' : '24px'
                }}>
                  {(recipes.filter(recipe => recipe.family === 'Recettes Populaires 2024').length > 0 
                    ? recipes.filter(recipe => recipe.family === 'Recettes Populaires 2024')
                    : recipes
                  ).map(recipe => (
                    <div 
                      key={recipe.id} 
                      onClick={() => openRecipe(recipe)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        border: '3px solid rgba(154, 114, 55, 0.3)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        boxShadow: '0 4px 12px rgba(154, 114, 55, 0.1)'
                      }}
                    >
                      <div style={{
                        height: isMobile ? '120px' : '200px',
                        backgroundImage: `url(${recipe.userPhoto || recipe.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '36px' : '48px',
                        position: 'relative',
                        borderRadius: '16px 16px 0 0',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                        {/* Emoji supprimé */}
                        </div>
                        
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(154, 114, 55, 0.9)',
                          borderRadius: '12px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ⭐ Populaire 2024
                        </div>
                        
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '16px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: '500',
                          color: '#4E2E1E',
                          border: '1px solid rgba(154, 114, 55, 0.3)'
                        }}>
                          {recipe.category}
                        </div>
                        
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(78, 46, 30, 0.9)',
                          borderRadius: '12px',
                          padding: '4px 6px',
                          fontSize: '9px',
                          fontWeight: '600',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          ❤️ {recipe.family}
                        </div>
                      </div>
                      <div style={{ padding: isMobile ? '12px' : '20px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'start', 
                          marginBottom: '8px' 
                        }}>
                          <h3 style={{ 
                            fontSize: isMobile ? '15px' : '18px', 
                            fontWeight: '600', 
                            color: '#4E2E1E', 
                            margin: 0,
                            lineHeight: '1.2'
                          }}>
                            {recipe.title}
                          </h3>
                          <span style={{
                            backgroundColor: recipe.difficulty === 'Très facile' || recipe.difficulty === 'Facile' ? '#8A9A5B' : '#4E2E1E',
                            color: 'white',
                            padding: '3px 6px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            {recipe.difficulty}
                          </span>
                        </div>
                        
                        <p style={{ 
                          color: '#8A9A5B', 
                          marginBottom: '8px', 
                          fontSize: isMobile ? '12px' : '14px', 
                          fontStyle: 'italic',
                          lineHeight: '1.3'
                        }}>
                          {recipe.description}
                        </p>
                        
                        <div style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          marginBottom: '8px', 
                          fontSize: isMobile ? '11px' : '14px', 
                          color: '#8A9A5B',
                          flexWrap: 'wrap'
                        }}>
                          <span>⏱️ {recipe.time}</span>
                          <span>👥 {recipe.serves} pers.</span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '4px'
                        }}>
                          <span style={{ 
                            fontSize: isMobile ? '11px' : '14px', 
                            color: '#4E2E1E', 
                            fontWeight: '500' 
                          }}>
                            Par {recipe.author} 👨‍🍳
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(recipe.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '2px 4px',
                                borderRadius: '6px',
                                backgroundColor: hasUserLiked(recipe.id) ? 'rgba(78, 46, 30, 0.1)' : 'rgba(154, 114, 55, 0.1)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <span style={{ fontSize: '12px', color: hasUserLiked(recipe.id) ? '#782e1e' : '#9A7237' }}>
                                {hasUserLiked(recipe.id) ? '❤️' : '🤍'}
                              </span>
                              <span style={{ fontSize: '11px', color: hasUserLiked(recipe.id) ? '#782e1e' : '#9A7237' }}>
                                {getRecipeLikes(recipe.id)}
                              </span>
                            </button>
                            {currentUser?.email === 'benjamin.dedieu34@gmail.com' && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditRecipe(recipe, e); }}
                                  style={{
                                    background: 'rgba(138, 154, 91, 0.1)',
                                    color: '#4E2E1E',
                                    border: '1px solid rgba(138, 154, 91, 0.3)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    marginLeft: '4px'
                                  }}
                                  title="Modifier la recette"
                                >
                                  ✏️ Modifier
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe, e); }}
                                  style={{
                                    background: 'rgba(220, 38, 38, 0.1)',
                                    color: '#dc2626',
                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    marginLeft: '4px'
                                  }}
                                  title="Supprimer la recette"
                                >
                                  🗑️ Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PAGE PARTAGE/CRÉER RECETTE */}
          {currentView === 'share' && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              border: '2px solid rgba(138, 154, 91, 0.2)'
            }}>
              <h2 style={{ 
                fontSize: isMobile ? '20px' : '24px', 
                fontWeight: '600', 
                color: '#4E2E1E', 
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                ✨ Créer une Nouvelle Recette
              </h2>
              
              <div style={{ display: 'flex', gap: isMobile ? '8px' : '16px', marginBottom: '20px' }}>
                <button
                  onClick={handleNewRecipe}
                  style={{
                    flex: 1,
                    padding: isMobile ? '12px' : '16px',
                    background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600'
                  }}
                >
                  📝 Nouvelle Recette
                </button>
                
                <button
                  onClick={() => setShowCodeInput(true)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '12px' : '16px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: '#4E2E1E',
                    border: '2px solid rgba(138, 154, 91, 0.3)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600'
                  }}
                >
                  🔑 Utiliser un Code
                </button>
              </div>
              
              <div style={{ textAlign: 'center', color: '#8A9A5B', fontStyle: 'italic' }}>
                Partagez vos recettes préférées avec votre famille ! 👨‍👩‍👧‍👦
              </div>
            </div>
          )}

          {/* PAGE MES RECETTES */}
          {currentView === 'my-recipes' && (
            <div>
              <h2 style={{ 
                fontSize: isMobile ? '20px' : '24px', 
                fontWeight: '600', 
                color: '#4E2E1E', 
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                ✨ Mes Recettes Personnelles
              </h2>

              {/* BOUTON HISTORIQUE */}
              <div style={{ textAlign: 'center', marginBottom: isMobile ? '16px' : '24px' }}>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  style={{
                    padding: isMobile ? '12px 20px' : '14px 32px',
                    background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600',
                    margin: '0 auto',
                    boxShadow: '0 2px 8px rgba(138, 154, 91, 0.10)'
                  }}
                >
                  🕑 Historique
                </button>
              </div>

              {/* Grille de recettes */}
              <h3 style={{ 
                fontSize: isMobile ? '16px' : '18px', 
                fontWeight: '600', 
                color: '#4E2E1E', 
                marginBottom: isMobile ? '16px' : '24px'
              }}>
                📚 Notre Collection de Recettes ({recipes.length} recettes • {Object.values(familyLikes).reduce((total, likes) => total + likes, 0)} likes • {Object.values(familyComments).reduce((total, comments) => total + comments.length, 0)} commentaires)
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: isMobile ? '16px' : '24px'
              }}>
                {recipes.map(recipe => (
                  <div 
                    key={recipe.id} 
                    onClick={() => openRecipe(recipe)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '16px',
                      border: '2px solid rgba(138, 154, 91, 0.2)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      height: isMobile ? '120px' : '200px',
                      backgroundImage: `url(${recipe.userPhoto || recipe.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '36px' : '48px',
                      position: 'relative',
                      borderRadius: '16px 16px 0 0',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ 
                          fontSize: isMobile ? '32px' : '40px',
                          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                        }}>
                          {recipe.emoji}
                        </span>
                      </div>
                      {recipe.userPhoto && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(117, 130, 77, 0.9)',
                          borderRadius: '12px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          📸 Photo maison
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: '500',
                        color: '#4E2E1E',
                        border: '1px solid rgba(138, 154, 91, 0.3)'
                      }}>
                        {recipe.category}
                      </div>
                      {recipe.family && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(78, 46, 30, 0.9)',
                          borderRadius: '12px',
                          padding: '4px 6px',
                          fontSize: '9px',
                          fontWeight: '600',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          ❤️ {recipe.family}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: isMobile ? '12px' : '20px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'start', 
                        marginBottom: '8px' 
                      }}>
                        <h3 style={{ 
                          fontSize: isMobile ? '15px' : '18px', 
                          fontWeight: '600', 
                          color: '#4E2E1E', 
                          margin: 0,
                          lineHeight: '1.2'
                        }}>
                          {recipe.title}
                        </h3>
                        <span style={{
                          backgroundColor: recipe.difficulty === 'Très facile' || recipe.difficulty === 'Facile' ? '#8A9A5B' : '#4E2E1E',
                          color: 'white',
                          padding: '3px 6px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          {recipe.difficulty}
                        </span>
                      </div>
                      <p style={{ 
                        color: '#8A9A5B', 
                        marginBottom: '8px', 
                        fontSize: isMobile ? '12px' : '14px', 
                        fontStyle: 'italic',
                        lineHeight: '1.3'
                      }}>
                        {recipe.description}
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        marginBottom: '8px', 
                        fontSize: isMobile ? '11px' : '14px', 
                        color: '#8A9A5B',
                        flexWrap: 'wrap'
                      }}>
                        <span>⏱️ {recipe.time}</span>
                        <span>👥 {recipe.serves} pers.</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '4px'
                      }}>
                        <span style={{ 
                          fontSize: isMobile ? '11px' : '14px', 
                          color: '#4E2E1E', 
                          fontWeight: '500' 
                        }}>
                          Par {recipe.author} 👨‍🍳
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(recipe.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              padding: '2px 4px',
                              borderRadius: '6px',
                              backgroundColor: hasUserLiked(recipe.id) ? 'rgba(78, 46, 30, 0.1)' : 'rgba(138, 154, 91, 0.1)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span style={{ 
                              fontSize: '12px',
                              color: hasUserLiked(recipe.id) ? '#782e1e' : '#8A9A5B'
                            }}>
                              {hasUserLiked(recipe.id) ? '❤️' : '🤍'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#4E2E1E', fontWeight: '600' }}>
                              {getRecipeLikes(recipe.id)}
                            </span>
                          </button>
                          
                          {getCommentsForRecipe(recipe.id).length > 0 && (
                            <span style={{
                              backgroundColor: 'rgba(117, 130, 77, 0.2)',
                              color: '#16a34a',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '9px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              💬 {getCommentsForRecipe(recipe.id).length}
                            </span>
                          )}
                          <span style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            color: '#8A9A5B',
                            backgroundColor: 'rgba(138, 154, 91, 0.2)',
                            padding: '2px 4px',
                            borderRadius: '4px'
                          }}>
                            {recipe.shareCode}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyRecipeShareCode(recipe);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #8A9A5B 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              boxShadow: '0 1px 3px rgba(138, 154, 91, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            title="Copier le code de partage"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      
                      {/* Boutons d'édition et suppression seulement pour les recettes de famille */}
                      {recipe.isFamilyRecipe && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            onClick={(e) => handleEditRecipe(recipe, e)}
                            style={{
                              background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={(e) => handleDeleteRecipe(recipe, e)}
                            style={{
                              background: 'linear-gradient(135deg, #dc2626 0%, #92400e 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Statistiques personnelles */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px',
                border: '2px solid rgba(138, 154, 91, 0.2)',
                marginBottom: '20px',
                marginTop: '20px'
              }}>
                <h3 style={{ color: '#4E2E1E', fontSize: '18px', marginBottom: '16px' }}>
                  📊 Mes Statistiques
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(138, 154, 91, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>✨</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#4E2E1E' }}>
                      {familyRecipes.length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8A9A5B' }}>
                      Recettes créées
                    </div>
                  </div>
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(78, 46, 30, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>❤️</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#4E2E1E' }}>
                      {Object.values(familyLikes).reduce((total, likes) => total + likes, 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8A9A5B' }}>
                      Likes reçus
                    </div>
                  </div>
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(117, 130, 77, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>💬</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#4E2E1E' }}>
                      {Object.values(familyComments).reduce((total, comments) => total + comments.length, 0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8A9A5B' }}>
                      Commentaires
                    </div>
                  </div>
                </div>
              </div>
                
              {/* Bouton créer nouvelle recette */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px',
                border: '2px solid rgba(138, 154, 91, 0.2)',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <button
                  onClick={handleNewRecipe}
                  style={{
                    background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  ✨ Créer une nouvelle recette
                </button>
              </div>

              {/* Liste des recettes personnelles */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px',
                border: '2px solid rgba(138, 154, 91, 0.2)'
              }}>
                <h3 style={{ color: '#4E2E1E', fontSize: '18px', marginBottom: '16px' }}>
                  🍳 Mes Recettes ({familyRecipes.length})
                </h3>
                
                {familyRecipes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#8A9A5B' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>Aucune recette créée</p>
                    <p style={{ fontSize: '14px' }}>Commencez par créer votre première recette !</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                  }}>
                    {familyRecipes.map(recipe => (
                      <div key={recipe.id} style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid rgba(138, 154, 91, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }} onClick={() => openRecipe(recipe)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '24px' }}>{recipe.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ color: '#4E2E1E', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                              {recipe.title}
                            </h4>
                            <p style={{ color: '#8A9A5B', fontSize: '12px', margin: 0 }}>
                              {recipe.category} • {recipe.time}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Bouton de partage pour toutes les recettes créées */}
                            <button
                              onClick={(e) => { e.stopPropagation(); copyRecipeShareCode(recipe); }}
                              style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #8A9A5B 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(138, 154, 91, 0.3)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                              title="Copier le code de partage"
                            >
                              📋 Partager
                            </button>
                            {/* Affichage conditionnel des boutons Modifier/Supprimer */}
                            {(recipe.owner === currentUser?.uid) && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditRecipe(recipe, e); }}
                                  style={{
                                    background: 'rgba(138, 154, 91, 0.1)',
                                    color: '#4E2E1E',
                                    border: '1px solid rgba(138, 154, 91, 0.3)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    marginLeft: '4px'
                                  }}
                                  title="Modifier la recette"
                                >
                                  ✏️ Modifier
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe, e); }}
                                  style={{
                                    background: 'rgba(220, 38, 38, 0.1)',
                                    color: '#dc2626',
                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    marginLeft: '4px'
                                  }}
                                  title="Supprimer la recette"
                                >
                                  🗑️ Supprimer
                                </button>
                              </>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#8A9A5B' }}>❤️</span>
                            <span style={{ fontSize: '12px', color: '#4E2E1E', fontWeight: '600' }}>
                              {getRecipeLikes(recipe.id)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MODAL HISTORIQUE (étape suivante) */}
              {showHistoryModal && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '16px'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    width: isMobile ? '100%' : '600px',
                    maxWidth: '100%',
                    position: 'relative',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#4E2E1E'
                      }}
                    >
                      ✕
                    </button>
                    <h3 style={{ color: '#4E2E1E', fontSize: '20px', marginBottom: '16px' }}>
                      🕑 Historique de mes recettes
                    </h3>
                    {/* Filtre par catégorie */}
                    <div style={{ marginBottom: '16px' }}>
                      <label htmlFor="history-category" style={{ color: '#4E2E1E', fontWeight: 600, marginRight: 8 }}>Catégorie :</label>
                      <select
                        id="history-category"
                        value={historyCategoryFilter}
                        onChange={e => setHistoryCategoryFilter(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #8A9A5B', fontSize: '14px' }}
                      >
                        <option value="">Toutes</option>
                        {[...new Set(familyRecipes.map(r => r.category).filter(Boolean))].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    {/* Liste des recettes triées et filtrées */}
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', textAlign: 'left' }}>
                      {familyRecipes
                        .filter(r => !historyCategoryFilter || r.category === historyCategoryFilter)
                        .sort((a, b) => {
                          // Tri par date décroissante (plus récentes en haut)
                          const dateA = new Date(a.savedAt || a.createdAt || 0);
                          const dateB = new Date(b.savedAt || b.createdAt || 0);
                          return dateB - dateA;
                        })
                        .map(recipe => (
                          <div key={recipe.id} style={{
                            borderBottom: '1px solid #eee',
                            padding: '12px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: '#4E2E1E', fontSize: '15px' }}>
                                {recipe.title}
                                <span style={{ color: '#8A9A5B', fontWeight: 400, fontSize: '13px', marginLeft: 8 }}>
                                  • {(() => {
                                    const dateRaw = recipe.savedAt || recipe.createdAt;
                                    if (!dateRaw) return '(date inconnue)';
                                    let dateObj = null;
                                    if (typeof dateRaw === 'object' && dateRaw.seconds) {
                                      dateObj = new Date(dateRaw.seconds * 1000);
                                    } else if (typeof dateRaw === 'string' || typeof dateRaw === 'number') {
                                      dateObj = new Date(dateRaw);
                                    }
                                    return (dateObj && !isNaN(dateObj.getTime()))
                                      ? dateObj.toLocaleDateString()
                                      : '(date inconnue)';
                                  })()}
                                </span>
                              </div>
                              <div style={{ color: '#8A9A5B', fontSize: '12px' }}>
                                {recipe.category}
                                {(() => {
                                  const dateRaw = recipe.savedAt || recipe.createdAt;
                                  if (!dateRaw) return '';
                                  let dateObj = null;
                                  if (typeof dateRaw === 'object' && dateRaw.seconds) {
                                    dateObj = new Date(dateRaw.seconds * 1000);
                                  } else if (typeof dateRaw === 'string' || typeof dateRaw === 'number') {
                                    dateObj = new Date(dateRaw);
                                  }
                                  return (dateObj && !isNaN(dateObj.getTime()))
                                    ? ' • ' + dateObj.toLocaleDateString()
                                    : '';
                                })()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => {
                                      setShowHistoryModal(false);
                                      handleEditRecipe(recipe);
                                    }}
                                    style={{
                                      background: 'rgba(138, 154, 91, 0.1)',
                                      color: '#4E2E1E',
                                      border: '1px solid rgba(138, 154, 91, 0.3)',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      fontWeight: '600'
                                    }}
                                    title="Modifier la recette"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Voulez-vous vraiment supprimer la recette "${recipe.title}" ?`)) {
                                        await handleDeleteRecipe(recipe);
                                      }
                                    }}
                                    style={{
                                      background: 'rgba(220, 38, 38, 0.1)',
                                      color: '#dc2626',
                                      border: '1px solid rgba(220, 38, 38, 0.3)',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      fontWeight: '600'
                                    }}
                                    title="Supprimer la recette"
                                  >
                                    🗑️
                                  </button>
                                </div>
                                {familyRecipes.filter(r => !historyCategoryFilter || r.category === historyCategoryFilter).length === 0 && (
                                  <div style={{ color: '#8A9A5B', textAlign: 'center', marginTop: '32px' }}>
                                    Aucune recette trouvée pour ce filtre.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAGE PROFIL */}
          {currentView === 'profile' && (
            <ProfilePage
              recipes={recipes}
              comments={Object.values(familyComments).flat()}
              familyMembers={2}
              familyCode={familyCode}
              onCopyCode={copyCode}
              onInviteMember={() => setShowInviteModal(true)}
            />
          )}

          {/* PAGE AIDE */}
          {currentView === 'help' && (
            <div>
              <h2 style={{ 
                fontSize: isMobile ? '20px' : '24px', 
                fontWeight: '600', 
                color: '#4E2E1E', 
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                ❓ Aide & Guide
              </h2>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px',
                border: '2px solid rgba(138, 154, 91, 0.2)',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#4E2E1E', fontSize: '18px', marginBottom: '16px' }}>
                  🚀 Comment utiliser Gustalya ?
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#4E2E1E', fontSize: '16px', marginBottom: '8px' }}>
                    📝 Créer une recette
                  </h4>
                  <p style={{ color: '#8A9A5B', fontSize: '14px', lineHeight: '1.5' }}>
                    Cliquez sur "Partage" puis "Nouvelle Recette" pour créer et partager vos recettes préférées avec votre famille.
                  </p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#4E2E1E', fontSize: '16px', marginBottom: '8px' }}>
                    🔑 Utiliser un code
                  </h4>
                  <p style={{ color: '#8A9A5B', fontSize: '14px', lineHeight: '1.5' }}>
                    Chaque recette a un code unique. Partagez ce code avec votre famille pour qu'ils puissent découvrir vos recettes !
                  </p>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#4E2E1E', fontSize: '16px', marginBottom: '8px' }}>
                    👨‍👩‍👧‍👦 Code famille
                  </h4>
                  <p style={{ color: '#8A9A5B', fontSize: '14px', lineHeight: '1.5' }}>
                    Votre code famille permet à vos proches de rejoindre votre espace et de voir toutes vos recettes partagées.
                  </p>
                </div>
                
                <div>
                  <h4 style={{ color: '#4E2E1E', fontSize: '16px', marginBottom: '8px' }}>
                    ❤️ Interactions
                  </h4>
                  <p style={{ color: '#8A9A5B', fontSize: '14px', lineHeight: '1.5' }}>
                    Likez et commentez les recettes de votre famille pour créer des souvenirs culinaires partagés !
                  </p>
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: isMobile ? '16px' : '24px',
                border: '2px solid rgba(138, 154, 91, 0.2)'
              }}>
                <h3 style={{ color: '#4E2E1E', fontSize: '18px', marginBottom: '16px' }}>
                  💡 Astuces
                </h3>
                <ul style={{ color: '#8A9A5B', fontSize: '14px', lineHeight: '1.5' }}>
                  <li>Prenez des photos de vos plats pour rendre vos recettes plus attrayantes</li>
                  <li>Utilisez des descriptions détaillées pour aider votre famille à réussir vos recettes</li>
                  <li>N'hésitez pas à laisser des commentaires affectueux sur les recettes de votre famille</li>
                  <li>Partagez vos astuces et modifications dans la section conseils</li>
                </ul>
              </div>
            </div>
          )}
          
        </main>

        {/* MODAL SAISIE CODE */}
        {showCodeInput && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: isMobile ? '100%' : '400px',
              maxWidth: '100%',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowCodeInput(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#4E2E1E'
                }}
              >
                ✕
              </button>
              
              <h3 style={{ color: '#4E2E1E', fontSize: '18px', marginBottom: '16px' }}>
                🔑 Saisir un Code
              </h3>
              
              <input
                type="text"
                placeholder="Entrez le code recette ou famille"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid rgba(138, 154, 91, 0.3)',
                  fontSize: '16px',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  textTransform: 'uppercase'
                }}
              />
              
              {codeError && (
                <p style={{ color: '#782e1e', fontSize: '12px', marginBottom: '8px' }}>
                  {codeError}
                </p>
              )}
              
              <button
                onClick={handleCodeSubmit}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Valider
              </button>
            </div>
          </div>
        )}

        {/* MODAL INVITATION EMAIL */}
        {showInviteModal && (
          <InviteModal 
            open={showInviteModal} 
            onClose={closeInviteModal} 
            onInvite={sendInvitation}
            inviteData={inviteData}
            setInviteData={setInviteData}
            emailSending={emailSending}
            emailStatus={emailStatus}
          />
        )}

        {/* MODAL CRÉATION RECETTE COMPLÈTE */}
        {showCreateRecipe && (
          <CreateRecipeModal 
            open={showCreateRecipe} 
            onClose={() => {
              setShowCreateRecipe(false);
              setEditingRecipe(null);
            }} 
            newRecipe={newRecipe}
            setNewRecipe={setNewRecipe}
            saveRecipe={saveRecipe}
            editingRecipe={editingRecipe}
            capturedPhoto={capturedPhoto}
            setCapturedPhoto={setCapturedPhoto}
            addIngredient={addIngredient}
            removeIngredient={removeIngredient}
            updateIngredient={updateIngredient}
            addInstruction={addInstruction}
            removeInstruction={removeInstruction}
            updateInstruction={updateInstruction}
            openCamera={openCamera}
            handleFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            isMobile={isMobile}
          />
        )}

        {/* MODAL FICHE RECETTE DÉTAILLÉE */}
        {selectedRecipe && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: isMobile ? '100%' : '600px',
              maxWidth: '100%',
              position: 'relative',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  background: 'rgba(78,46,30,0.85)',
                  border: 'none',
                  borderRadius: '50%',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s, color 0.2s',
                  zIndex: 10
                }}
                onMouseOver={e => e.currentTarget.style.background = '#4E2E1E'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(78,46,30,0.85)'}
              >
                ✕
              </button>

              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  height: '200px',
                  backgroundImage: `url(${selectedRecipe.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '24px'
                  }}>
                    {selectedRecipe.emoji}
                  </div>
                </div>

                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: '600', 
                  color: '#4E2E1E', 
                  marginBottom: '8px' 
                }}>
                  {selectedRecipe.title}
                </h2>
                
                <p style={{ 
                  color: '#8A9A5B', 
                  fontSize: '16px', 
                  fontStyle: 'italic',
                  marginBottom: '16px' 
                }}>
                  {selectedRecipe.description}
                </p>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(138, 154, 91, 0.1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>⏱️</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#4E2E1E' }}>{selectedRecipe.time}</div>
                    <div style={{ fontSize: '12px', color: '#8A9A5B' }}>Temps</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(138, 154, 91, 0.1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>👥</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#4E2E1E' }}>{selectedRecipe.serves}</div>
                    <div style={{ fontSize: '12px', color: '#8A9A5B' }}>Portions</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'rgba(138, 154, 91, 0.1)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>📊</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#4E2E1E' }}>{selectedRecipe.difficulty}</div>
                    <div style={{ fontSize: '12px', color: '#8A9A5B' }}>Niveau</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4E2E1E', marginBottom: '12px' }}>
                  🛒 Ingrédients
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {selectedRecipe.ingredients?.map((ingredient, index) => 
                    renderIngredient(ingredient, index)
                  )}
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4E2E1E', marginBottom: '12px' }}>
                  👨‍🍳 Instructions
                </h3>
                <ol style={{ paddingLeft: '20px', margin: 0 }}>
                  {selectedRecipe.instructions?.map((instruction, index) => (
                    <li key={index} style={{ 
                      marginBottom: '12px', 
                      color: '#4E2E1E', 
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>

              {selectedRecipe.tips && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4E2E1E', marginBottom: '12px' }}>
                    💡 Conseils
                  </h3>
                  <p style={{ 
                    color: '#8A9A5B', 
                    fontSize: '14px',
                    lineHeight: '1.5',
                    backgroundColor: 'rgba(138, 154, 91, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontStyle: 'italic'
                  }}>
                    {selectedRecipe.tips}
                  </p>
                </div>
              )}

              {/* Guide de cuisson intégré */}
              <RecipeCookingGuide 
                recipe={selectedRecipe} 
                onTimerUpdate={handleTimerUpdate}
              />

              {/* Bouton de sauvegarde pour les recettes partagées */}
              {selectedRecipe && !familyRecipes.find(r => r.shareCode === selectedRecipe.shareCode) && (
                <div style={{ 
                  borderTop: '2px solid rgba(138, 154, 91, 0.2)', 
                  paddingTop: '20px',
                  marginTop: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      color: '#8A9A5B', 
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}>
                      💝 Cette recette vous a été partagée par {selectedRecipe.originalAuthor || 'un membre de la famille'}
                    </p>
                    <button
                      onClick={() => saveSharedRecipe(selectedRecipe)}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #8A9A5B 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(138, 154, 91, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      💾 Sauvegarder dans mon profil
                    </button>
                  </div>
                </div>
              )}

              {/* Bouton de partage pour les recettes créées */}
              {selectedRecipe && familyRecipes.find(r => r.shareCode === selectedRecipe.shareCode) && (
                <div style={{ 
                  borderTop: '2px solid rgba(138, 154, 91, 0.2)', 
                  paddingTop: '20px',
                  marginTop: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      color: '#8A9A5B', 
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}>
                      💝 Partagez cette recette avec votre famille !
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => copyRecipeShareCode(selectedRecipe)}
                        style={{
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #8A9A5B 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '600',
                          boxShadow: '0 4px 12px rgba(138, 154, 91, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        📋 Copier le code
                      </button>
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(138, 154, 91, 0.1)',
                        border: '2px solid rgba(138, 154, 91, 0.3)',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#4E2E1E',
                        fontFamily: 'monospace'
                      }}>
                        {selectedRecipe.shareCode}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section interactions familiales */}
              <div style={{ 
                borderTop: '2px solid rgba(138, 154, 91, 0.2)', 
                paddingTop: '20px',
                marginTop: '20px'
              }}>
                {/* Boutons Modifier/Supprimer conditionnels */}
                {(selectedRecipe.owner === currentUser?.uid) && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditRecipe(selectedRecipe, e); }}
                      style={{
                        background: 'rgba(138, 154, 91, 0.1)',
                        color: '#4E2E1E',
                        border: '1px solid rgba(138, 154, 91, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                      title="Modifier la recette"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(selectedRecipe, e); }}
                      style={{
                        background: 'rgba(220, 38, 38, 0.1)',
                        color: '#dc2626',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                      title="Supprimer la recette"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4E2E1E', margin: 0 }}>
                    💕 Avis de la famille
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => toggleLike(selectedRecipe.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: hasUserLiked(selectedRecipe.id) ? 'rgba(78, 46, 30, 0.1)' : 'rgba(138, 154, 91, 0.1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ 
                        fontSize: '18px',
                        color: hasUserLiked(selectedRecipe.id) ? '#782e1e' : '#8A9A5B'
                      }}>
                        {hasUserLiked(selectedRecipe.id) ? '❤️' : '🤍'}
                      </span>
                      <span style={{ 
                        fontSize: '14px',
                        color: hasUserLiked(selectedRecipe.id) ? '#782e1e' : '#8A9A5B',
                        fontWeight: '600'
                      }}>
                        {getRecipeLikes(selectedRecipe.id)} likes
                      </span>
                    </button>
                  </div>
                </div>

                {/* Commentaires familiaux */}
                {getCommentsForRecipe(selectedRecipe.id).length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    {getCommentsForRecipe(selectedRecipe.id).map(comment => (
                      <div key={comment.id} style={{
                        backgroundColor: 'rgba(138, 154, 91, 0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid rgba(138, 154, 91, 0.2)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '16px' }}>{comment.emoji}</span>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            color: '#4E2E1E' 
                          }}>
                            {comment.author}
                          </span>
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#8A9A5B' 
                          }}>
                            {comment.date}
                          </span>
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '14px', 
                          color: '#4E2E1E',
                          lineHeight: '1.4'
                        }}>
                          {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajouter un commentaire */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Laissez un petit mot avec amour..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid rgba(138, 154, 91, 0.3)',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={() => addComment(selectedRecipe.id)}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    💕 Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SUCCÈS RECETTE */}
        {showRecipeSuccess && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              width: isMobile ? '100%' : '400px',
              maxWidth: '100%',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#4E2E1E', marginBottom: '12px' }}>
                Recette sauvegardée avec amour !
              </h3>
              <p style={{ color: '#8A9A5B', fontSize: '14px', marginBottom: '16px' }}>
                Votre recette "{savedRecipeTitle}" a été ajoutée à votre collection familiale.
              </p>
              
              <div style={{
                backgroundColor: 'rgba(138, 154, 91, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ fontSize: '12px', color: '#4E2E1E', marginBottom: '8px' }}>
                  Code de partage :
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '18px',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    color: '#4E2E1E'
                  }}>
                    {generatedCode}
                  </span>
                  <button
                    onClick={copyGeneratedCode}
                    style={{
                      padding: '4px 8px',
                      background: '#8A9A5B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📋
                  </button>
                </div>
              </div>

              <button
                onClick={closeSuccessModal}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                ❤️ Parfait !
              </button>
            </div>
          </div>
        )}

        {/* MODAL CAMÉRA */}
        {showCamera && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <video
              ref={cameraRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                borderRadius: '12px'
              }}
            />
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginTop: '20px' 
            }}>
              <button
                onClick={capturePhoto}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #8A9A5B 0%, #4E2E1E 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                📸 Capturer
              </button>
              <button
                onClick={closeCamera}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(156, 163, 175, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {showShareToast && (
          <div style={{
            position: 'fixed', 
            bottom: 32, 
            left: '50%', 
            transform: 'translateX(-50%)',
            background: '#a3b18a', 
            color: 'white', 
            borderRadius: 12, 
            padding: '12px 32px', 
            fontWeight: 600, 
            fontSize: 16,
            boxShadow: '0 2px 8px rgba(146,64,14,0.10)', 
            zIndex: 2000
          }}>
            Lien du profil copié !
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        /* Media queries pour responsive */
        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}

export default function AppWithProfileProvider() {
  return (
    <ProfileProvider>
      <App />
    </ProfileProvider>
  );
}


