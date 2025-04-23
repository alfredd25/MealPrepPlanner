import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useMealPlanStore } from '../store/mealPlanStore';

export default function ShoppingList() {
  const { groceryList, markIngredientAsPurchased, clearGroceryList } = useMealPlanStore();
  const [filter, setFilter] = useState<'all' | 'purchased' | 'unpurchased'>('all');
  
  const filteredItems = groceryList.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'purchased') return item.purchased;
    if (filter === 'unpurchased') return !item.purchased;
    return true;
  });
  
  // Group items by category
  const itemsByCategory: Record<string, typeof groceryList> = {};
  filteredItems.forEach(item => {
    const category = item.name.charAt(0).toUpperCase();
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });
  
  // Sort categories
  const sortedCategories = Object.keys(itemsByCategory).sort();
  
  const purchasedCount = groceryList.filter(item => item.purchased).length;
  const progress = groceryList.length > 0 
    ? Math.round((purchasedCount / groceryList.length) * 100) 
    : 0;
  
  return (
    <>
      <Head>
        <title>Shopping List | Meal Prep Planner</title>
        <meta name="description" content="Your shopping list for meal prep" />
      </Head>
      
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Shopping List</h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => clearGroceryList()}
                className="btn btn-outline text-sm"
                disabled={groceryList.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          {groceryList.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>{purchasedCount} of {groceryList.length} items purchased</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              className={`py-2 px-4 font-medium ${
                filter === 'all' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('all')}
            >
              All ({groceryList.length})
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                filter === 'unpurchased' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('unpurchased')}
            >
              To Buy ({groceryList.length - purchasedCount})
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                filter === 'purchased' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setFilter('purchased')}
            >
              Purchased ({purchasedCount})
            </button>
          </div>
          
          {/* Empty state */}
          {groceryList.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Your shopping list is empty. Generate a meal plan to populate your list.
              </p>
              {/* Button to go to meal plan page to be added later */}
            </div>
          )}
          
          {/* Shopping list */}
          {groceryList.length > 0 && (
            <div className="space-y-6">
              {sortedCategories.map(category => (
                <div key={category}>
                  <h2 className="font-semibold text-lg mb-2">{category}</h2>
                  <ul className="space-y-2">
                    {itemsByCategory[category].map(item => (
                      <li 
                        key={item.id} 
                        className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                      >
                        <input
                          type="checkbox"
                          checked={!!item.purchased}
                          onChange={e => markIngredientAsPurchased(item.id, e.target.checked)}
                          className="w-5 h-5 text-primary mr-3"
                        />
                        <div className={`flex-1 ${item.purchased ? 'line-through text-gray-400' : ''}`}>
                          <span className="font-medium">{item.name}</span>
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            {item.amount} {item.unit}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
} 