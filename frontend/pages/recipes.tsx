import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useRecipeStore } from '../store/recipeStore';
import { Recipe } from '../store/mealPlanStore';

export default function Recipes() {
  const { userRecipes, recommendedRecipes, removeRecipe } = useRecipeStore();
  const [apiRecipes, setApiRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recipes from the API
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/recipes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        
        const data = await response.json();
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setApiRecipes(data);
        } else if (data && typeof data === 'object') {
          // Handle case where API returns { recipes: [...] } or similar structure
          const recipeArray = data.recipes || data.data || [];
          setApiRecipes(Array.isArray(recipeArray) ? recipeArray : []);
        } else {
          // Set empty array if data is not in expected format
          console.error('Unexpected API response format:', data);
          setApiRecipes([]);
          setError('Received unexpected data format from API');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError('Failed to load recipes. Please try again later.');
        setLoading(false);
        // Ensure recipes is an empty array on error
        setApiRecipes([]);
      }
    };
    
    fetchRecipes();
  }, []);

  // Add debug output
  useEffect(() => {
    setDebugInfo(`User Recipes: ${userRecipes.length}, Recommended Recipes: ${recommendedRecipes.length}, API Recipes: ${apiRecipes.length}`);
  }, [userRecipes, recommendedRecipes, apiRecipes]);

  // Combine API recipes with user added and recommended recipes
  const allRecipes = [...apiRecipes, ...userRecipes, ...recommendedRecipes];

  // Filter recipes by meal type with improved error handling and type safety
  const filteredRecipes = filter === 'all' 
    ? allRecipes 
    : allRecipes.filter(recipe => {
        // Make sure recipe has a mealType property
        if (!recipe || !recipe.mealType) {
          return false;
        }
        // Case-insensitive comparison
        return recipe.mealType.toLowerCase() === filter.toLowerCase();
      });

  // Toggle recipe expansion
  const toggleRecipeExpansion = (recipeId: string) => {
    if (expandedRecipe === recipeId) {
      setExpandedRecipe(null);
    } else {
      setExpandedRecipe(recipeId);
    }
  };

  // Get recipe by ID for expanded view
  const getRecipeById = (recipeId: string): Recipe | undefined => {
    return allRecipes.find(r => r.id === recipeId);
  };

  // Handle recipe deletion
  const handleDeleteRecipe = (recipeId: string) => {
    setRecipeToDelete(recipeId);
    setShowDeleteConfirm(true);
  };

  // Confirm and process recipe deletion
  const confirmDeleteRecipe = () => {
    if (recipeToDelete) {
      removeRecipe(recipeToDelete);
      setShowDeleteConfirm(false);
      setExpandedRecipe(null); // Close the modal
      setRecipeToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDeleteRecipe = () => {
    setShowDeleteConfirm(false);
    setRecipeToDelete(null);
  };

  return (
    <>
      <Head>
        <title>Recipes | Meal Prep Planner</title>
        <meta name="description" content="Browse and discover recipes for your meal plan" />
      </Head>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Recipe</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to delete this recipe? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={cancelDeleteRecipe}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteRecipe}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Recipe detail modal */}
      {expandedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Recipe Details</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleDeleteRecipe(expandedRecipe)}
                  className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                  aria-label="Delete recipe"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button 
                  onClick={() => setExpandedRecipe(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {(() => {
              const recipe = getRecipeById(expandedRecipe);
              if (!recipe) return <div className="p-4">Recipe not found</div>;
              
              return (
                <div className="p-4">
                  {recipe.imageUrl && (
                    <div className="h-64 overflow-hidden rounded-lg mb-4">
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold mb-2">{recipe.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{recipe.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="font-semibold">{recipe.prepTime + recipe.cookTime} min</div>
                      <div className="text-gray-500 dark:text-gray-400">Total Time</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="font-semibold">{recipe.nutritionalInfo.calories}</div>
                      <div className="text-gray-500 dark:text-gray-400">Calories</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="font-semibold">{recipe.servings}</div>
                      <div className="text-gray-500 dark:text-gray-400">Servings</div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Ingredients</h4>
                    {recipe.ingredients && recipe.ingredients.length > 0 ? (
                      <>
                        {/* Display ingredients without conditional check */}
                        <ul className="list-disc list-inside space-y-1 mb-2">
                          {recipe.ingredients.map((ingredient, index) => (
                            <li key={ingredient.id || index} className="text-gray-600 dark:text-gray-300">
                              {ingredient.amount > 0 ? `${ingredient.amount} ${ingredient.unit} ` : ''}{ingredient.name}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">No ingredients available.</p>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Instructions</h4>
                    {recipe.instructions && recipe.instructions.length > 0 ? (
                      <>
                        {/* Only show numbered instructions, remove the conditional for "See recipe text for instructions" */}
                        <ol className="list-decimal list-inside space-y-2 mb-2">
                          {recipe.instructions.map((instruction, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300">
                              {instruction}
                            </li>
                          ))}
                        </ol>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">
                        No instructions available. You can ask the AI for detailed preparation steps.
                      </p>
                    )}
                  </div>
                  
                  {recipe.nutritionalInfo && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Nutrition Information</h4>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center">
                          <div className="font-semibold">{recipe.nutritionalInfo.calories}</div>
                          <div className="text-gray-500 dark:text-gray-400">Calories</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center">
                          <div className="font-semibold">{recipe.nutritionalInfo.protein}g</div>
                          <div className="text-gray-500 dark:text-gray-400">Protein</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center">
                          <div className="font-semibold">{recipe.nutritionalInfo.carbs}g</div>
                          <div className="text-gray-500 dark:text-gray-400">Carbs</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center">
                          <div className="font-semibold">{recipe.nutritionalInfo.fat}g</div>
                          <div className="text-gray-500 dark:text-gray-400">Fat</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-center">
                          <div className="font-semibold">{recipe.nutritionalInfo.fiber}g</div>
                          <div className="text-gray-500 dark:text-gray-400">Fiber</div>
                        </div>
                      </div>
                      
                      {/* Show raw nutritional info if available */}
                      {recipe.rawNutritionalInfo && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">Original nutritional information:</p>
                          <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                            {recipe.rawNutritionalInfo}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
      
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Recipes</h1>
            {/* Add debug information */}
            <div className="text-xs text-gray-500">{debugInfo}</div>
          </div>
          
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto pb-1">
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                filter === 'all' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('all')}
            >
              All Recipes
            </button>
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                filter === 'breakfast' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('breakfast')}
            >
              Breakfast
            </button>
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                filter === 'lunch' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('lunch')}
            >
              Lunch
            </button>
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                filter === 'dinner' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('dinner')}
            >
              Dinner
            </button>
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${
                filter === 'snack' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('snack')}
            >
              Snacks
            </button>
          </div>
          
          {/* Loading state */}
          {loading && filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading recipes...</p>
            </div>
          )}
          
          {/* Error state */}
          {error && !loading && filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && !error && filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No recipes found. Try a different filter or check back later.
              </p>
            </div>
          )}
          
          {/* Recipe grid */}
          {filteredRecipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <div 
                  key={recipe.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => toggleRecipeExpansion(recipe.id)}
                >
                  {recipe.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">No image</span>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h2 className="text-lg font-semibold mb-1">{recipe.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="font-semibold">{recipe.prepTime + recipe.cookTime}</span> min
                      </div>
                      <div>
                        <span className="font-semibold">{recipe.nutritionalInfo.calories}</span> cal
                      </div>
                      <div className="capitalize">
                        {recipe.mealType}
                      </div>
                    </div>
                    
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

  