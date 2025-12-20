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
    const { imageData, mimeType } = JSON.parse(event.body);

    if (!imageData) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Image data required' })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analyse cette image de recette et extrais les informations suivantes en JSON. TOUT DOIT ÊTRE EN FRANÇAIS :
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

Si tu ne peux pas identifier certains champs, fais des suppositions raisonnables basées sur le type de recette.
Retourne UNIQUEMENT l'objet JSON, pas de texte supplémentaire.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Data
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

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
    console.error('Scan error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Failed to analyze image' })
    };
  }
};
