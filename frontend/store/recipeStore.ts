import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Recipe } from './mealPlanStore';

interface RecipeState {
  userRecipes: Recipe[];
  recommendedRecipes: Recipe[];
  
  // Actions
  addUserRecipe: (recipe: Recipe) => void;
  addRecommendedRecipe: (recipe: Recipe) => void;
  removeRecipe: (recipeId: string) => void;
  getRecipeById: (recipeId: string) => Recipe | undefined;
}

// Generate a unique ID for recipes
const generateId = () => `recipe-${Math.random().toString(36).substring(2, 9)}`;

// Validation function for recipes
const validateRecipe = (recipe: Recipe): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check required fields
  if (!recipe.name || recipe.name.trim() === '') {
    issues.push('Recipe name is required');
  }
  
  if (!recipe.mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(recipe.mealType)) {
    issues.push('Valid meal type is required (breakfast, lunch, dinner, or snack)');
  }
  
  // Validate nutritional info
  const nutritionalInfo = recipe.nutritionalInfo || {};
  if (typeof nutritionalInfo.calories !== 'number') {
    issues.push('Calories should be a number');
  }
  
  // Validate ingredients
  if (!Array.isArray(recipe.ingredients)) {
    issues.push('Ingredients should be an array');
  } else {
    if (recipe.ingredients.length === 0) {
      issues.push('Recipe should have at least one ingredient');
    }
    
    recipe.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name || ingredient.name.trim() === '') {
        issues.push(`Ingredient #${index + 1} is missing a name`);
      }
    });
  }
  
  // Validate instructions
  if (!Array.isArray(recipe.instructions)) {
    issues.push('Instructions should be an array');
  } else {
    if (recipe.instructions.length === 0) {
      issues.push('Recipe should have at least one instruction');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      userRecipes: [],
      recommendedRecipes: [],
      
      addUserRecipe: (recipe) => {
        // Ensure recipe has an ID
        const recipeWithId = {
          ...recipe,
          id: recipe.id || generateId()
        };
        
        // Validate the recipe
        const validation = validateRecipe(recipeWithId);
        console.log('[DEBUG] Validating user recipe:', recipeWithId.name);
        
        if (!validation.valid) {
          console.error('[DEBUG] Invalid recipe:', validation.issues);
          // Create a more complete recipe if incomplete
          if (validation.issues.some(issue => 
              issue.includes('should be an array') || 
              issue.includes('at least one'))) {
            
            // Apply fixes
            recipeWithId.ingredients = Array.isArray(recipeWithId.ingredients) ? 
              recipeWithId.ingredients : [];
              
            recipeWithId.instructions = Array.isArray(recipeWithId.instructions) ? 
              recipeWithId.instructions : [];
              
            if (recipeWithId.ingredients.length === 0) {
              recipeWithId.ingredients.push({
                id: 'default-ing-1',
                name: 'Ingredients not specified',
                amount: 0,
                unit: ''
              });
            }
            
            if (recipeWithId.instructions.length === 0) {
              recipeWithId.instructions.push('Instructions not provided');
            }
            
            console.log('[DEBUG] Applied fixes to recipe');
          } else {
            // If there are issues we can't fix, log the error but still proceed
            console.warn('[DEBUG] Proceeding with invalid recipe - issues:', validation.issues);
          }
        }
        
        set(state => ({
          userRecipes: [...state.userRecipes.filter(r => r.id !== recipeWithId.id), recipeWithId]
        }));
        
        console.log('[DEBUG] Recipe added to user recipes:', recipeWithId.name);
      },
      
      addRecommendedRecipe: (recipe) => {
        // Ensure recipe has an ID
        const recipeWithId = {
          ...recipe,
          id: recipe.id || generateId()
        };
        
        // Validate the recipe
        const validation = validateRecipe(recipeWithId);
        console.log('[DEBUG] Validating recommended recipe:', recipeWithId.name);
        
        if (!validation.valid) {
          console.error('[DEBUG] Invalid recommended recipe:', validation.issues);
          
          // Apply fixes for common issues
          if (validation.issues.some(issue => 
              issue.includes('should be an array') || 
              issue.includes('at least one'))) {
            
            // Apply fixes
            recipeWithId.ingredients = Array.isArray(recipeWithId.ingredients) ? 
              recipeWithId.ingredients : [];
              
            recipeWithId.instructions = Array.isArray(recipeWithId.instructions) ? 
              recipeWithId.instructions : [];
              
            if (recipeWithId.ingredients.length === 0) {
              recipeWithId.ingredients.push({
                id: 'default-ing-1',
                name: 'Ingredients not specified',
                amount: 0,
                unit: ''
              });
            }
            
            if (recipeWithId.instructions.length === 0) {
              recipeWithId.instructions.push('Instructions not provided');
            }
            
            console.log('[DEBUG] Applied fixes to recommended recipe');
          }
        }
        
        set(state => ({
          recommendedRecipes: [...state.recommendedRecipes.filter(r => r.id !== recipeWithId.id), recipeWithId]
        }));
        
        console.log('[DEBUG] Recipe added to recommended recipes:', recipeWithId.name);
      },
      
      removeRecipe: (recipeId) => {
        set(state => ({
          userRecipes: state.userRecipes.filter(recipe => recipe.id !== recipeId),
          recommendedRecipes: state.recommendedRecipes.filter(recipe => recipe.id !== recipeId)
        }));
      },
      
      getRecipeById: (recipeId) => {
        const { userRecipes, recommendedRecipes } = get();
        return [...userRecipes, ...recommendedRecipes].find(recipe => recipe.id === recipeId);
      }
    }),
    {
      name: 'recipe-storage',
      partialize: (state) => ({
        userRecipes: state.userRecipes,
        recommendedRecipes: state.recommendedRecipes
      }),
    }
  )
); 