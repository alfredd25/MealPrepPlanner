import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSampleRecipes } from '../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, chatId, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Set up the system prompt
    const systemPrompt = `
    You are a helpful meal planning assistant that specializes in nutrition, recipes, and meal preparation.
    
    FOR SINGLE RECIPES, FORMAT YOUR RESPONSES LIKE THIS:
    
    # 🍗 [Recipe Name] ([nutrition highlight])
    
    ## 🍽️ Ingredients (Serves [number]):
    * [amount] [ingredient]
    * [amount] [ingredient]
    * [etc.]
    
    ## 📊 Nutritional Information (per serving):
    * Calories: [number] kcal
    * Protein: [number]g
    * Carbs: [number]g
    * Fat: [number]g
    * Fiber: [number]g
    
    ## 💡 Key Benefits:
    [Key nutrition insight or health benefit]
    
    ## 🔪 Instructions:
    1. [First step]
    2. [Second step]
    3. [Third step]
    4. [etc.]
    
    FOR MEAL PLANS, FORMAT YOUR RESPONSES LIKE THIS:
    
    # 📆 Meal Plan for [Day/Week]
    
    ## 🍳 Breakfast:
    [Recipe name] - Brief description with key nutrients
    
    ## 🥗 Lunch:
    [Recipe name] - Brief description with key nutrients
    
    ## 🍲 Dinner:
    [Recipe name] - Brief description with key nutrients
    
    ## 🥄 Snacks:
    [Recipe name] - Brief description
    
    ## 🛒 Ingredients List:
    * [Ingredient 1]
    * [Ingredient 2]
    * [etc.]
    
    When asked about meal plans, always ask if they have any dietary restrictions or preferences and provide a complete ingredients list for shopping.
    
    Keep responses concise and use emojis generously to add visual appeal. Always include complete nutritional information for each recipe.
    `;

    // For testing, return a static response if the API key is not working properly
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        message: "I'm a meal prep assistant. I can help you plan meals, suggest recipes, and provide nutritional information. What would you like to know?"
      });
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Format history for Gemini
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    try {
      // Create chat session
      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      // Prepare the prompt
      const formattedPrompt = `
      ${systemPrompt}
      
      Remember to always format your response following the guidelines above.
      
      User message: ${message}
      `;

      // Send message to Gemini
      const result = await chat.sendMessage(formattedPrompt);
      let responseText = result.response.text();

      // Post-process the response to ensure formatting
      responseText = responseText.replace(/- /g, "* "); // Replace bullet points
      
      // Ensure proper paragraph breaks
      responseText = responseText.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
      
      // Convert any bullet points with • to standard markdown asterisk bullets
      responseText = responseText.replace(/• /g, "* ");
      
      // Ensure numbered lists use proper markdown format
      responseText = responseText.replace(/(?<!\n)(\d+)\)\s/g, '$1. ');
      
      // If response is too long, truncate it
      if (responseText.length > 1500) {
        const lastParagraph = responseText.substring(0, 1500).lastIndexOf('\n\n');
        if (lastParagraph > 0) {
          responseText = responseText.substring(0, lastParagraph) + "\n\n*[Response truncated for brevity]*";
        } else {
          responseText = responseText.substring(0, 1500) + "...\n\n*[Response truncated for brevity]*";
        }
      }

      // Check if the message is about recipes to suggest some
      const recipeKeywords = ['recipe', 'meal', 'cook', 'prepare', 'breakfast', 'lunch', 'dinner', 'ingredients'];
      const isRecipeRelated = recipeKeywords.some(keyword => message.toLowerCase().includes(keyword));
      
      // Get sample recipes
      const recipes = getSampleRecipes();
      const suggestedRecipes = isRecipeRelated && recipes.length > 0 
        ? recipes.slice(0, 2) 
        : [];

      return res.status(200).json({
        message: responseText,
        suggestedRecipes
      });
    } catch (error) {
      console.error('Gemini API error:', error);
      return res.status(200).json({
        message: `
# Meal Planning Assistant

I'm having trouble connecting to my knowledge base right now. As a meal planning assistant, I can help with recipes, nutrition advice, and meal prep tips.

## What I Can Help With

* **Recipe suggestions** based on your preferences and dietary needs
* **Nutritional information** about various foods
* **Meal planning tips** to save time and eat healthier
* **Cooking techniques** to improve your meals

Could you try asking your question in a different way?
        `
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      message: "I'm sorry, I encountered an error while processing your request. Please try again later."
    });
  }
} 