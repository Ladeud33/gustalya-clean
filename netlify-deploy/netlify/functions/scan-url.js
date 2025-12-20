const { GoogleGenerativeAI } = require("@google/generative-ai");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' })
    };
  }

  try {
    const { url } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'URL required' })
      };
    }

    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid URL protocol' })
      };
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to fetch URL' })
      };
    }

    const html = await response.text();
    const truncatedHtml = html.substring(0, 50000);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyse ce contenu HTML d'une page de recette et extrais les informations en JSON. TOUT DOIT ÊTRE EN FRANÇAIS :
{
  "title": "Titre de la recette",
  "description": "Brève description de la recette",
  "category": "Catégorie (Entrée, Plat, Dessert, Boisson, Sauce, Soupe, Salade, etc.)",
  "prepTime": "Temps de préparation (ex: 15 min)",
  "cookTime": "Temps de cuisson (ex: 30 min)",
  "servings": "Nombre de portions (ex: 4 personnes)",
  "difficulty": "Niveau de difficulté (Facile, Moyen, Difficile)",
  "ingredients": ["ingrédient 1 avec quantité", "ingrédient 2 avec quantité", ...],
  "steps": [
    {"instruction": "Instruction étape 1 en français", "duration": "durée optionnelle"},
    {"instruction": "Instruction étape 2 en français"}
  ]
}

Contenu HTML :
${truncatedHtml}

Retourne UNIQUEMENT l'objet JSON, pas de texte supplémentaire.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to parse recipe data' })
      };
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(recipeData)
    };
  } catch (error) {
    console.error('URL scan error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Failed to analyze URL' })
    };
  }
};
