export interface RecipeStep {
  instruction: string;
  duration?: string;
}

export interface GustalyaRecipe {
  id: number;
  title: string;
  category: string;
  time: string;
  difficulty: string;
  likes: number;
  image: string;
  emoji: string;
  description: string;
  author: string;
  servings: number | string;
  featured?: boolean;
  ingredients: string[];
  steps: RecipeStep[] | string[];
  isUserRecipe?: boolean;
  firebaseId?: string;
}

export const GUSTALYA_RECIPES: GustalyaRecipe[] = [
  {
    id: 1,
    title: 'Mojito Classique',
    category: 'Boisson',
    time: '5min',
    difficulty: 'Facile',
    likes: 120,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
    emoji: '🍸',
    description: 'Le cocktail cubain par excellence, rafraîchissant et parfaitement équilibré',
    author: 'Gustalya',
    servings: 1,
    featured: true,
    ingredients: ['50ml de rhum blanc', '20ml de jus de citron vert', '2 cuillères de sucre', '6-8 feuilles de menthe', 'Eau gazeuse', 'Glace pilée'],
    steps: [
      { instruction: 'Mettre les feuilles de menthe et le sucre dans un verre' },
      { instruction: 'Écraser délicatement pour libérer les arômes', duration: '30 secondes' },
      { instruction: 'Ajouter le jus de citron vert et le rhum' },
      { instruction: 'Remplir de glace pilée' },
      { instruction: 'Compléter avec de l\'eau gazeuse' },
      { instruction: 'Mélanger et décorer avec de la menthe' }
    ]
  },
  {
    id: 2,
    title: 'Negroni Parfait',
    category: 'Boisson',
    time: '3min',
    difficulty: 'Facile',
    likes: 85,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    emoji: '🍸',
    description: 'Le cocktail italien emblématique, équilibré et sophistiqué',
    author: 'Gustalya',
    servings: 1,
    ingredients: ['30ml de gin', '30ml de Campari', '30ml de vermouth rouge', 'Zeste d\'orange'],
    steps: [
      { instruction: 'Remplir un verre old-fashioned de glaçons' },
      { instruction: 'Verser le gin, le Campari et le vermouth' },
      { instruction: 'Remuer pendant 30 secondes', duration: '30 secondes' },
      { instruction: 'Garnir avec un zeste d\'orange' }
    ]
  },
  {
    id: 3,
    title: 'Aperol Spritz',
    category: 'Boisson',
    time: '2min',
    difficulty: 'Très facile',
    likes: 240,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    emoji: '🍹',
    description: 'L\'apéritif italien parfait, léger et rafraîchissant',
    author: 'Gustalya',
    servings: 1,
    ingredients: ['90ml de Prosecco', '60ml d\'Aperol', 'Un trait d\'eau gazeuse', 'Tranche d\'orange', 'Glaçons'],
    steps: [
      { instruction: 'Remplir un grand verre à vin de glaçons' },
      { instruction: 'Verser le Prosecco puis l\'Aperol' },
      { instruction: 'Ajouter un trait d\'eau gazeuse' },
      { instruction: 'Garnir avec une tranche d\'orange' }
    ]
  },
  {
    id: 4,
    title: 'Tartare de Saumon',
    category: 'Entrée',
    time: '20min',
    difficulty: 'Moyen',
    likes: 156,
    image: 'https://images.unsplash.com/photo-1548029960-695d127f4543?q=80&w=1000&auto=format&fit=crop',
    emoji: '🐟',
    description: 'Un tartare raffiné et frais, parfait pour débuter un repas gastronomique',
    author: 'Gustalya',
    servings: 4,
    ingredients: ['400g de saumon frais', '2 échalotes', 'Ciboulette', '2 cuillères de câpres', 'Jus de citron', 'Huile d\'olive', 'Sel et poivre'],
    steps: [
      { instruction: 'Couper le saumon en petits dés' },
      { instruction: 'Ciseler finement les échalotes et la ciboulette' },
      { instruction: 'Mélanger tous les ingrédients dans un bol' },
      { instruction: 'Assaisonner avec citron, huile, sel et poivre' },
      { instruction: 'Réserver au frais 15 minutes', duration: '15 minutes' },
      { instruction: 'Dresser à l\'aide d\'un emporte-pièce' }
    ]
  },
  {
    id: 5,
    title: 'Salade César',
    category: 'Entrée',
    time: '25min',
    difficulty: 'Moyen',
    likes: 98,
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1000&auto=format&fit=crop',
    emoji: '🥗',
    description: 'La salade César originale, avec sa sauce crémeuse et ses croûtons dorés',
    author: 'Gustalya',
    servings: 4,
    ingredients: ['1 laitue romaine', '100g de parmesan', '150g de poulet grillé', 'Croûtons', 'Sauce César', 'Anchois (optionnel)'],
    steps: [
      { instruction: 'Laver et sécher la laitue' },
      { instruction: 'Griller le poulet et le couper en tranches' },
      { instruction: 'Préparer la sauce César' },
      { instruction: 'Assembler la salade avec les croûtons' },
      { instruction: 'Râper le parmesan par-dessus' },
      { instruction: 'Servir immédiatement' }
    ]
  },
  {
    id: 6,
    title: 'Risotto aux Champignons',
    category: 'Plat',
    time: '45min',
    difficulty: 'Moyen',
    likes: 187,
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=1000&auto=format&fit=crop',
    emoji: '🍚',
    description: 'Un risotto crémeux aux champignons de saison, réconfortant à souhait',
    author: 'Gustalya',
    servings: 4,
    ingredients: ['300g de riz arborio', '200g de champignons', '1L de bouillon de légumes', '1 oignon', '100ml de vin blanc', '50g de parmesan', 'Beurre'],
    steps: [
      { instruction: 'Faire revenir l\'oignon dans le beurre' },
      { instruction: 'Ajouter les champignons et cuire 5 min', duration: '5 min' },
      { instruction: 'Incorporer le riz et le nacrer' },
      { instruction: 'Déglacer au vin blanc' },
      { instruction: 'Ajouter le bouillon louche par louche en remuant', duration: '20 min' },
      { instruction: 'Terminer avec le parmesan et un peu de beurre' }
    ]
  },
  {
    id: 7,
    title: 'Boeuf Bourguignon',
    category: 'Plat',
    time: '3h',
    difficulty: 'Difficile',
    likes: 312,
    image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=1000&auto=format&fit=crop',
    emoji: '🥩',
    description: 'Le grand classique de la cuisine française, mijoté dans du vin rouge de Bourgogne',
    author: 'Gustalya',
    servings: 6,
    ingredients: ['1.5kg de boeuf à braiser', '1 bouteille de vin rouge', '200g de lardons', '300g de champignons', 'Petits oignons', 'Carottes', 'Bouquet garni'],
    steps: [
      { instruction: 'Faire mariner le boeuf dans le vin la veille' },
      { instruction: 'Faire revenir les lardons puis réserver' },
      { instruction: 'Saisir les morceaux de boeuf' },
      { instruction: 'Ajouter les légumes et le vin' },
      { instruction: 'Mijoter à feu doux pendant 3 heures', duration: '3 heures' },
      { instruction: 'Servir avec des pommes de terre' }
    ]
  },
  {
    id: 8,
    title: 'Tiramisu Italien',
    category: 'Dessert',
    time: '30min',
    difficulty: 'Moyen',
    likes: 445,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=1000&auto=format&fit=crop',
    emoji: '🍰',
    description: 'Le dessert italien par excellence, onctueux et parfumé au café',
    author: 'Gustalya',
    servings: 8,
    featured: true,
    ingredients: ['500g de mascarpone', '4 oeufs', '100g de sucre', 'Biscuits cuillère', 'Café espresso refroidi', 'Cacao en poudre'],
    steps: [
      { instruction: 'Séparer les blancs des jaunes' },
      { instruction: 'Battre les jaunes avec le sucre' },
      { instruction: 'Incorporer le mascarpone' },
      { instruction: 'Monter les blancs en neige et les incorporer' },
      { instruction: 'Tremper les biscuits dans le café' },
      { instruction: 'Alterner couches de crème et biscuits' },
      { instruction: 'Réfrigérer 4h minimum', duration: '4 heures' }
    ]
  },
  {
    id: 9,
    title: 'Tarte au Citron Meringuée',
    category: 'Dessert',
    time: '1h30',
    difficulty: 'Difficile',
    likes: 267,
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=1000&auto=format&fit=crop',
    emoji: '🍋',
    description: 'Une tarte acidulée avec une meringue légère et dorée',
    author: 'Gustalya',
    servings: 8,
    ingredients: ['Pâte sablée', '4 citrons jaunes', '200g de sucre', '4 oeufs', '100g de beurre', 'Blancs d\'oeufs pour meringue'],
    steps: [
      { instruction: 'Précuire le fond de tarte', duration: '15 min' },
      { instruction: 'Préparer la crème au citron' },
      { instruction: 'Garnir le fond de tarte' },
      { instruction: 'Préparer la meringue italienne' },
      { instruction: 'Dresser la meringue sur la tarte' },
      { instruction: 'Caraméliser au chalumeau ou au four' }
    ]
  },
  {
    id: 10,
    title: 'Pad Thaï',
    category: 'Plat',
    time: '30min',
    difficulty: 'Moyen',
    likes: 234,
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=1000&auto=format&fit=crop',
    emoji: '🍜',
    description: 'Le plat thaïlandais le plus célèbre, sucré-salé et épicé',
    author: 'Gustalya',
    servings: 2,
    ingredients: ['200g de nouilles de riz', '200g de crevettes', '2 oeufs', 'Pousses de soja', 'Cacahuètes', 'Sauce pad thai', 'Citron vert'],
    steps: [
      { instruction: 'Tremper les nouilles dans l\'eau chaude', duration: '10 min' },
      { instruction: 'Faire sauter les crevettes', duration: '3 min' },
      { instruction: 'Pousser sur le côté et cuire les oeufs' },
      { instruction: 'Ajouter les nouilles et la sauce' },
      { instruction: 'Incorporer les pousses de soja' },
      { instruction: 'Servir avec cacahuètes et citron' }
    ]
  },
  {
    id: 11,
    title: 'Crêpes Suzette',
    category: 'Dessert',
    time: '40min',
    difficulty: 'Moyen',
    likes: 178,
    image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=1000&auto=format&fit=crop',
    emoji: '🥞',
    description: 'Les célèbres crêpes flambées au Grand Marnier',
    author: 'Gustalya',
    servings: 4,
    ingredients: ['8 crêpes fines', '100g de beurre', '100g de sucre', 'Jus de 2 oranges', 'Zeste d\'orange', 'Grand Marnier'],
    steps: [
      { instruction: 'Préparer le beurre d\'orange' },
      { instruction: 'Faire caraméliser légèrement le sucre', duration: '2 min' },
      { instruction: 'Ajouter le jus et le zeste d\'orange' },
      { instruction: 'Plier les crêpes en quatre' },
      { instruction: 'Les réchauffer dans la sauce', duration: '1 min' },
      { instruction: 'Flamber avec le Grand Marnier' }
    ]
  },
  {
    id: 12,
    title: 'Poke Bowl au Saumon',
    category: 'Plat',
    time: '25min',
    difficulty: 'Facile',
    likes: 289,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
    emoji: '🥗',
    description: 'Un bowl hawaïen frais et coloré, parfait pour l\'été',
    author: 'Gustalya',
    servings: 2,
    ingredients: ['300g de saumon frais', 'Riz à sushi', 'Edamame', 'Avocat', 'Mangue', 'Sauce soja', 'Sésame'],
    steps: [
      { instruction: 'Cuire le riz à sushi et laisser refroidir', duration: '15 min' },
      { instruction: 'Couper le saumon en dés' },
      { instruction: 'Préparer tous les toppings' },
      { instruction: 'Dresser le riz dans des bols' },
      { instruction: 'Disposer harmonieusement les garnitures' },
      { instruction: 'Arroser de sauce et parsemer de sésame' }
    ]
  },
  {
    id: 13,
    title: 'Quiche Lorraine',
    category: 'Plat',
    time: '1h',
    difficulty: 'Facile',
    likes: 167,
    image: '/stock_images/quiche_lorraine_trad_ad3086da.jpg',
    emoji: '🥧',
    description: 'La quiche traditionnelle aux lardons et à la crème',
    author: 'Gustalya',
    servings: 6,
    ingredients: ['1 pâte brisée', '200g de lardons', '3 oeufs', '200ml de crème fraîche', '100g de gruyère râpé', 'Muscade'],
    steps: [
      { instruction: 'Préchauffer le four à 180°C' },
      { instruction: 'Foncer un moule avec la pâte' },
      { instruction: 'Faire revenir les lardons' },
      { instruction: 'Mélanger oeufs, crème et muscade' },
      { instruction: 'Répartir lardons et fromage' },
      { instruction: 'Verser l\'appareil et cuire 40 min', duration: '40 min' }
    ]
  },
  {
    id: 14,
    title: 'Curry de Poulet',
    category: 'Plat',
    time: '45min',
    difficulty: 'Facile',
    likes: 298,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop',
    emoji: '🍛',
    description: 'Un curry doux et parfumé, servi avec du riz basmati',
    author: 'Gustalya',
    servings: 4,
    ingredients: ['600g de poulet', '400ml de lait de coco', '2 cuillères de pâte de curry', 'Oignon', 'Ail', 'Gingembre', 'Coriandre fraîche'],
    steps: [
      { instruction: 'Couper le poulet en morceaux' },
      { instruction: 'Faire revenir oignon, ail et gingembre' },
      { instruction: 'Ajouter la pâte de curry' },
      { instruction: 'Incorporer le poulet et le saisir' },
      { instruction: 'Verser le lait de coco' },
      { instruction: 'Mijoter 25 min et servir avec du riz', duration: '25 min' }
    ]
  },
  {
    id: 15,
    title: 'Bruschetta Tomate Basilic',
    category: 'Entrée',
    time: '15min',
    difficulty: 'Très facile',
    likes: 145,
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?q=80&w=1000&auto=format&fit=crop',
    emoji: '🍅',
    description: 'L\'antipasti italien simple et savoureux',
    author: 'Gustalya',
    servings: 4,
    ingredients: ['Baguette ou pain ciabatta', 'Tomates mûres', 'Basilic frais', 'Ail', 'Huile d\'olive', 'Sel et poivre'],
    steps: [
      { instruction: 'Couper et griller les tranches de pain', duration: '2 min' },
      { instruction: 'Couper les tomates en petits dés' },
      { instruction: 'Mélanger avec basilic ciselé et huile' },
      { instruction: 'Frotter le pain avec de l\'ail' },
      { instruction: 'Garnir généreusement de tomates' },
      { instruction: 'Servir immédiatement' }
    ]
  }
];
