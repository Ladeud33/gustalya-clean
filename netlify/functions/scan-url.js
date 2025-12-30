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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this HTML content from a recipe webpage and extract the recipe information in JSON format:
{
  "title": "Recipe title",
  "description": "Brief description",
  "category": "Category (Entrée, Plat, Dessert, Boisson, etc.)",
  "prepTime": "Preparation time (e.g., 15 min)",
  "cookTime": "Cooking time (e.g., 30 min)",
  "servings": "Number of servings",
  "difficulty": "Difficulty level (Facile, Moyen, Difficile)",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "steps": [
    {"instruction": "Step 1 instruction", "duration": "optional duration"},
    {"instruction": "Step 2 instruction"}
  ]
}

HTML content:
${truncatedHtml}

Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to parse recipe data' })
      };
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify(recipeData)
    };
  } catch (error) {
    console.error('URL scan error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Failed to analyze URL' })
    };
  }
};
