import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenAI, Type } from "@google/genai";
import { optionalFirebaseAuth, type AuthenticatedRequest } from "./firebase-admin";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "",
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/recipes/scan", optionalFirebaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { imageData, mimeType = "image/jpeg" } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { 
              text: `Analyse cette image de recette et extrais les informations suivantes au format JSON:
              - title: le nom de la recette
              - description: une courte description (1-2 phrases)
              - ingredients: liste des ingrédients avec quantités
              - steps: liste des étapes de préparation avec { instruction: string, duration?: string }
              - prepTime: temps de préparation (ex: "30 min")
              - cookTime: temps de cuisson (ex: "1 heure")
              - servings: nombre de portions (ex: "4 personnes")
              - difficulty: "facile", "moyen" ou "difficile"
              - category: "entree", "plat", "dessert", "soupe", "salade", "aperitif", "boisson" ou "autre"
              
              Si tu ne trouves pas certaines informations, laisse le champ vide ou utilise une valeur par défaut.
              Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`
            },
            { 
              inlineData: { 
                mimeType, 
                data: base64Data 
              } 
            }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              steps: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    instruction: { type: Type.STRING },
                    duration: { type: Type.STRING }
                  },
                  required: ["instruction"]
                }
              },
              prepTime: { type: Type.STRING },
              cookTime: { type: Type.STRING },
              servings: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "ingredients", "steps"]
          }
        }
      });

      let responseText: string | undefined;
      
      if (typeof response.text === 'string') {
        responseText = response.text;
      } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.candidates[0].content.parts[0].text;
      }
      
      if (!responseText) {
        console.error("Gemini response structure:", JSON.stringify(response, null, 2));
        throw new Error("No valid response from AI");
      }
      
      let recipeData;
      try {
        recipeData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse recipe JSON:", responseText);
        throw new Error("AI returned invalid JSON format");
      }
      
      res.json(recipeData);
    } catch (error: any) {
      console.error("Recipe scan error:", error);
      res.status(500).json({ 
        error: "Failed to analyze recipe image",
        details: error.message 
      });
    }
  });

  app.post("/api/recipes/scan-url", optionalFirebaseAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      if (parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ error: "Seules les URLs HTTPS sont autorisées" });
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', 'internal', 'intranet', 'local'];
      if (blockedHosts.some(h => hostname === h || hostname.endsWith(`.${h}`))) {
        return res.status(400).json({ error: "URL non autorisée" });
      }

      const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const ipMatch = hostname.match(ipPattern);
      if (ipMatch) {
        const [, a, b] = ipMatch.map(Number);
        if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || 
            (a === 192 && b === 168) || (a === 169 && b === 254)) {
          return res.status(400).json({ error: "URL non autorisée" });
        }
      }

      let pageContent: string;
      const MAX_BODY_SIZE = 2 * 1024 * 1024;
      const MAX_REDIRECTS = 3;
      
      try {
        let currentUrl = url;
        let redirectCount = 0;
        let fetchResponse: Response | null = null;
        
        while (redirectCount <= MAX_REDIRECTS) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          fetchResponse = await fetch(currentUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; GustalyaBot/1.0; +https://gustalya.app)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: controller.signal,
            redirect: 'manual',
          });
          
          clearTimeout(timeoutId);
          
          if (fetchResponse.status >= 300 && fetchResponse.status < 400) {
            const location = fetchResponse.headers.get('location');
            if (!location) break;
            
            redirectCount++;
            if (redirectCount > MAX_REDIRECTS) {
              throw new Error("Too many redirects");
            }
            
            try {
              const redirectUrl = new URL(location, currentUrl);
              if (redirectUrl.protocol !== 'https:') {
                throw new Error("Redirect to non-HTTPS URL blocked");
              }
              currentUrl = redirectUrl.href;
            } catch {
              throw new Error("Invalid redirect URL");
            }
            continue;
          }
          
          break;
        }
        
        if (!fetchResponse || !fetchResponse.ok) {
          throw new Error(`Failed to fetch: ${fetchResponse?.status || 'unknown'}`);
        }
        
        const reader = fetchResponse.body?.getReader();
        if (!reader) {
          throw new Error("Cannot read response");
        }
        
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          totalBytes += value.length;
          if (totalBytes > MAX_BODY_SIZE) {
            reader.cancel();
            throw new Error("Page trop volumineuse");
          }
          chunks.push(value);
        }
        
        const decoder = new TextDecoder();
        pageContent = chunks.map(chunk => decoder.decode(chunk, { stream: true })).join('') + decoder.decode();
        
      } catch (fetchError: any) {
        return res.status(400).json({ 
          error: "Impossible d'accéder à cette page",
          details: fetchError.message 
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [
            { 
              text: `Analyse ce contenu HTML d'une page de recette et extrais les informations suivantes au format JSON:
              - title: le nom de la recette
              - description: une courte description (1-2 phrases)
              - ingredients: liste des ingrédients avec quantités
              - steps: liste des étapes de préparation avec { instruction: string, duration?: string }
              - prepTime: temps de préparation (ex: "30 min")
              - cookTime: temps de cuisson (ex: "1 heure")
              - servings: nombre de portions (ex: "4 personnes")
              - difficulty: "facile", "moyen" ou "difficile"
              - category: "entree", "plat", "dessert", "soupe", "salade", "aperitif", "boisson" ou "autre"
              
              Si tu ne trouves pas certaines informations, laisse le champ vide ou utilise une valeur par défaut.
              Ignore tout le contenu qui n'est pas lié à la recette (publicités, navigation, etc.).
              Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.

              Contenu HTML:
              ${pageContent.substring(0, 100000)}`
            }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              steps: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    instruction: { type: Type.STRING },
                    duration: { type: Type.STRING }
                  },
                  required: ["instruction"]
                }
              },
              prepTime: { type: Type.STRING },
              cookTime: { type: Type.STRING },
              servings: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "ingredients", "steps"]
          }
        }
      });

      let responseText: string | undefined;
      
      if (typeof response.text === 'string') {
        responseText = response.text;
      } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.candidates[0].content.parts[0].text;
      }
      
      if (!responseText) {
        throw new Error("No valid response from AI");
      }
      
      let recipeData;
      try {
        recipeData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse recipe JSON:", responseText);
        throw new Error("AI returned invalid JSON format");
      }
      
      res.json(recipeData);
    } catch (error: any) {
      console.error("Recipe URL scan error:", error);
      res.status(500).json({ 
        error: "Échec de l'analyse de la page",
        details: error.message 
      });
    }
  });

  return httpServer;
}
