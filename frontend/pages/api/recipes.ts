import type { NextApiRequest, NextApiResponse } from 'next';
import { getSampleRecipes, getUserRecipes, saveUserRecipe, deleteUserRecipe } from '../../utils/db';
import { v4 as uuidv4 } from 'uuid';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Use a default user ID for simplicity
    const userId = "default-user";
    
    // Handle different HTTP methods
    switch(req.method) {
      case 'GET':
        // Get sample recipes
        const sampleRecipes = getSampleRecipes();
        
        // Get user-specific recipes
        const userRecipes = getUserRecipes(userId);
        
        // Combine and return all recipes
        return res.status(200).json([...sampleRecipes, ...userRecipes]);
        
      case 'POST':
        // Create a new recipe
        const newRecipe = {
          ...req.body,
          id: uuidv4(), // Generate unique ID
          userId: userId,
          createdAt: new Date().toISOString()
        };
        
        saveUserRecipe(newRecipe);
        return res.status(201).json(newRecipe);
        
      case 'PUT':
        // Update an existing recipe
        const { id } = req.body;
        if (!id) {
          return res.status(400).json({ message: 'Recipe ID is required' });
        }
        
        const updatedRecipe = {
          ...req.body,
          userId: userId,
          updatedAt: new Date().toISOString()
        };
        
        saveUserRecipe(updatedRecipe);
        return res.status(200).json(updatedRecipe);
        
      case 'DELETE':
        // Delete a recipe
        const recipeId = req.query.id as string;
        if (!recipeId) {
          return res.status(400).json({ message: 'Recipe ID is required' });
        }
        
        const deleted = deleteUserRecipe(recipeId, userId);
        
        if (deleted) {
          return res.status(200).json({ message: 'Recipe deleted successfully' });
        } else {
          return res.status(404).json({ message: 'Recipe not found' });
        }
        
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling recipe request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default handler;