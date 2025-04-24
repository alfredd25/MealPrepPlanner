import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getSampleRecipes } from '../../utils/db';

// Check if Google API key is available
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
console.log('API Key available:', GOOGLE_API_KEY ? 'Yes' : 'No');
const hasApiKey = GOOGLE_API_KEY && GOOGLE_API_KEY.length > 10;

// Define a system prompt to guide the AI to provide meal planning advice
const SYSTEM_PROMPT = `You are a helpful meal planning assistant. Your name is Chef Prep. 
You help users plan their meals, find recipes, and provide nutritional advice.
Always provide concise, helpful, and friendly responses related to meal planning, cooking, and nutrition.
If asked for a recipe, provide detailed ingredients and instructions.
If asked for meal planning advice, consider balanced nutrition and practicality.
Do not discuss topics unrelated to food, cooking, or nutrition.`;

// Fallback responses when API key is not available
const fallbackResponses = [
  "To use the chatbot feature, you'll need to set up a Google Gemini API key in your environment variables. You can get an API key from https://ai.google.dev/",
  "I'd love to help with your meal planning needs! To activate this feature, please add your Google Gemini API key to the environment variables.",
  "Your meal planning assistant is almost ready! Just add your Google Gemini API key to environment variables to start chatting.",
  "Chef Prep is waiting to help you! Please add a Google Gemini API key to enable the chat feature."
];

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the message from the request body
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // If API key is missing, return a fallback response
    if (!hasApiKey) {
      console.log('API key missing, returning fallback response');
      const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
      return res.status(200).json({
        response: fallbackResponses[randomIndex],
        suggestedRecipes: []
      });
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    console.log('Sending message to Google Generative AI:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));

    // Format chat history for Gemini API if provided
    let formattedHistory = [];
    if (Array.isArray(history) && history.length > 0) {
      formattedHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    }

    // Use history if available, otherwise create a new chat
    const chat = model.startChat({
      history: formattedHistory.length > 0 ? formattedHistory : [
        {
          role: 'user',
          parts: [{ text: 'Hello, I need help with meal planning.' }],
        },
        {
          role: 'model',
          parts: [{ text: "Hi! I'm Chef Prep, your meal planning assistant. I'd be happy to help you with meal planning, recipe ideas, or nutritional advice. What specific aspect of meal planning can I assist you with today?" }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    // Send the message to Gemini
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    console.log('Received response from AI, length:', text.length);

    // Post-process the response to ensure formatting
    let formattedText = text.replace(/- /g, "* "); // Replace bullet points
    
    // Ensure proper paragraph breaks
    formattedText = formattedText.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
    
    // Convert any bullet points with • to standard markdown asterisk bullets
    formattedText = formattedText.replace(/• /g, "* ");
    
    // Ensure numbered lists use proper markdown format
    formattedText = formattedText.replace(/(?<!\n)(\d+)\)\s/g, '$1. ');
    
    // If response is too long, truncate it
    if (formattedText.length > 1500) {
      const lastParagraph = formattedText.substring(0, 1500).lastIndexOf('\n\n');
      if (lastParagraph > 0) {
        formattedText = formattedText.substring(0, lastParagraph) + "\n\n*[Response truncated for brevity]*";
      } else {
        formattedText = formattedText.substring(0, 1500) + "...\n\n*[Response truncated for brevity]*";
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
      response: formattedText,
      suggestedRecipes
    });
  } catch (error) {
    console.error('Error from Gemini API:', error);
    return res.status(500).json({ 
      message: 'Error from AI service', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}