import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../utils/auth';
import { getSampleRecipes } from '../../../utils/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { startDate, cuisinePreferences = [], maxPrepTime, seasonalOnly = false } = req.body;
    
    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required' });
    }
    
    // Get sample recipes
    let recipes = getSampleRecipes();
    
    // Filter recipes based on preferences
    if (cuisinePreferences.length > 0) {
      recipes = recipes.filter(r => cuisinePreferences.includes(r.cuisine));
    }
    
    if (maxPrepTime) {
      recipes = recipes.filter(r => (r.prepTime + r.cookTime) <= maxPrepTime);
    }
    
    // If no recipes match the criteria, revert to all recipes
    if (recipes.length === 0) {
      recipes = getSampleRecipes();
    }
    
    // Create a simple 7-day meal plan
    const mealPlan = [];
    const dateObj = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(dateObj);
      currentDate.setDate(dateObj.getDate() + i);
      
      // Filter recipes by meal type
      const breakfastRecipes = recipes.filter(r => r.mealType === 'breakfast');
      const lunchRecipes = recipes.filter(r => r.mealType === 'lunch');
      const dinnerRecipes = recipes.filter(r => r.mealType === 'dinner');
      const snackRecipes = recipes.filter(r => r.mealType === 'snack');
      
      // Pick random recipes for each meal type
      const dayPlan = {
        date: currentDate.toISOString().split('T')[0],
        breakfast: breakfastRecipes.length > 0 ? breakfastRecipes[Math.floor(Math.random() * breakfastRecipes.length)] : null,
        lunch: lunchRecipes.length > 0 ? lunchRecipes[Math.floor(Math.random() * lunchRecipes.length)] : null,
        dinner: dinnerRecipes.length > 0 ? dinnerRecipes[Math.floor(Math.random() * dinnerRecipes.length)] : null,
        snacks: snackRecipes.length > 0 
          ? [snackRecipes[Math.floor(Math.random() * snackRecipes.length)]]
          : []
      };
      
      mealPlan.push(dayPlan);
    }
    
    return res.status(200).json(mealPlan);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return res.status(500).json({ message: 'Failed to generate meal plan' });
  }
}

// Wrap handler with authentication middleware
export default withAuth(handler); 