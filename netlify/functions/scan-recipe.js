const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' })
    };
  }

  try {
    const { imageData, mimeType } = JSON.parse(event.body);

    if (!imageData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image data required' })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analyze this image of a recipe and extract the following information in JSON format:
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

If you cannot identify some fields, make reasonable guesses based on the recipe type.
Return ONLY the JSON object, no additional text.`;

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
        body: JSON.stringify({ error: 'Failed to parse recipe data' })
      };
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(recipeData)
    };
  } catch (error) {
    console.error('Scan error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to analyze image' })
    };
  }
};
