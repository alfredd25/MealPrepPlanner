import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  nutritionalInfo?: Partial<NutritionalInfo>;
  purchased?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutritionalInfo: NutritionalInfo;
  cuisine: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  tags: string[];
  rawNutritionalInfo?: string;
}

export interface MealPlanDay {
  date: string;
  breakfast: Recipe | null;
  lunch: Recipe | null;
  dinner: Recipe | null;
  snacks: Recipe[];
}

export type MealPlanWeek = MealPlanDay[];

interface MealPlanState {
  currentPlan: MealPlanWeek | null;
  savedRecipes: Recipe[];
  groceryList: Ingredient[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  generateMealPlan: (filters: {
    startDate: string;
    cuisinePreferences?: string[];
    maxPrepTime?: number;
    seasonalOnly?: boolean;
  }) => Promise<void>;
  swapMeal: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', recipeId?: string) => Promise<void>;
  addRecipeToSaved: (recipe: Recipe) => void;
  removeRecipeFromSaved: (recipeId: string) => void;
  addRecipeToMealPlan: (recipe: Recipe, dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  generateGroceryList: () => void;
  markIngredientAsPurchased: (ingredientId: string, purchased: boolean) => void;
  clearGroceryList: () => void;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      savedRecipes: [],
      groceryList: [],
      isLoading: false,
      error: null,
      
      generateMealPlan: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, you'd make an API call here
          const response = await fetch('/api/meal-plan/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(filters),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to generate meal plan');
          }

          const data: MealPlanWeek = await response.json();
          set({ 
            currentPlan: data,
            isLoading: false 
          });
          
          // Automatically generate grocery list
          get().generateGroceryList();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to generate meal plan' 
          });
        }
      },
      
      swapMeal: async (dayIndex, mealType, recipeId) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, you'd make an API call here
          const response = await fetch('/api/meal-plan/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dayIndex,
              mealType,
              currentPlan: get().currentPlan,
              recipeId,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to swap meal');
          }

          const newRecipe: Recipe = await response.json();
          
          set(state => {
            if (!state.currentPlan) return state;
            
            const newPlan = [...state.currentPlan];
            const day = { ...newPlan[dayIndex] };
            
            if (mealType === 'snack') {
              // This is a simplified version - in a real app, you'd handle specific snack replacement
              if (newRecipe) {
                day.snacks = [...day.snacks, newRecipe];
              }
            } else {
              day[mealType] = newRecipe;
            }
            
            newPlan[dayIndex] = day;
            
            return { 
              currentPlan: newPlan,
              isLoading: false
            };
          });
          
          // Regenerate grocery list
          get().generateGroceryList();
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to swap meal' 
          });
        }
      },
      
      addRecipeToSaved: (recipe) => {
        set(state => ({
          savedRecipes: [...state.savedRecipes.filter(r => r.id !== recipe.id), recipe]
        }));
      },
      
      removeRecipeFromSaved: (recipeId) => {
        set(state => ({
          savedRecipes: state.savedRecipes.filter(recipe => recipe.id !== recipeId)
        }));
      },
      
      addRecipeToMealPlan: (recipe, dayIndex, mealType) => {
        set(state => {
          if (!state.currentPlan) return state;
          
          const newPlan = [...state.currentPlan];
          const day = { ...newPlan[dayIndex] };
          
          if (mealType === 'snack') {
            day.snacks = [...day.snacks, recipe];
          } else {
            day[mealType] = recipe;
          }
          
          newPlan[dayIndex] = day;
          
          return { currentPlan: newPlan };
        });
        
        // Update grocery list
        get().generateGroceryList();
      },
      
      generateGroceryList: () => {
        const { currentPlan } = get();
        if (!currentPlan) return;
        
        // Collect all ingredients from the current meal plan
        const allIngredients: Ingredient[] = [];
        
        currentPlan.forEach(day => {
          [day.breakfast, day.lunch, day.dinner, ...day.snacks]
            .filter((meal): meal is Recipe => meal !== null)
            .forEach(meal => {
              meal.ingredients.forEach(ingredient => {
                const existingIndex = allIngredients.findIndex(
                  i => i.name.toLowerCase() === ingredient.name.toLowerCase() && i.unit === ingredient.unit
                );
                
                if (existingIndex >= 0) {
                  // Combine quantities for same ingredient
                  allIngredients[existingIndex] = {
                    ...allIngredients[existingIndex],
                    amount: allIngredients[existingIndex].amount + ingredient.amount
                  };
                } else {
                  // Add new ingredient
                  allIngredients.push({
                    ...ingredient,
                    purchased: false
                  });
                }
              });
            });
        });
        
        set({ groceryList: allIngredients });
      },
      
      markIngredientAsPurchased: (ingredientId, purchased) => {
        set(state => ({
          groceryList: state.groceryList.map(item => 
            item.id === ingredientId ? { ...item, purchased } : item
          )
        }));
      },
      
      clearGroceryList: () => {
        set({ groceryList: [] });
      }
    }),
    {
      name: 'meal-plan-storage',
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        savedRecipes: state.savedRecipes,
        groceryList: state.groceryList,
      }),
    }
  )
); 