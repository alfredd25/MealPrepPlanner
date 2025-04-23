import fs from 'fs';
import path from 'path';
import { Recipe } from '../store/mealPlanStore';

// Mock database using JSON files - in production, use a real database
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Get sample recipes
export function getSampleRecipes(): Recipe[] {
  try {
    const filePath = path.join(DATA_DIR, 'sample_recipes.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading sample recipes:', error);
    return [];
  }
}

// User-related functions
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  dietaryGoals?: Record<string, any>;
  dietType?: string;
  allergies?: string[];
  preferences?: Record<string, any>;
}

// Get users from JSON file or create empty array
export function getUsers(): Record<string, User> {
  try {
    const filePath = path.join(DATA_DIR, 'users.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error reading users:', error);
    return {};
  }
}

// Save users to JSON file
export function saveUsers(users: Record<string, User>): void {
  try {
    const filePath = path.join(DATA_DIR, 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Get user by email
export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users[email] || null;
}

// Save a user
export function saveUser(user: User): void {
  const users = getUsers();
  users[user.email] = user;
  saveUsers(users);
}

// Recipe-related functions
export interface UserRecipe extends Recipe {
  userId: string;
}

// Get user recipes
export function getUserRecipes(userId: string): UserRecipe[] {
  try {
    const filePath = path.join(DATA_DIR, 'user_recipes.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const recipes: UserRecipe[] = JSON.parse(data);
      return recipes.filter(recipe => recipe.userId === userId);
    }
    return [];
  } catch (error) {
    console.error('Error reading user recipes:', error);
    return [];
  }
}

// Save user recipe
export function saveUserRecipe(recipe: UserRecipe): void {
  try {
    const filePath = path.join(DATA_DIR, 'user_recipes.json');
    let recipes: UserRecipe[] = [];
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      recipes = JSON.parse(data);
    }
    
    // Check if recipe already exists
    const index = recipes.findIndex(r => r.id === recipe.id);
    if (index !== -1) {
      recipes[index] = recipe;
    } else {
      recipes.push(recipe);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(recipes, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving user recipe:', error);
  }
}

// Delete user recipe
export function deleteUserRecipe(recipeId: string, userId: string): boolean {
  try {
    const filePath = path.join(DATA_DIR, 'user_recipes.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      let recipes: UserRecipe[] = JSON.parse(data);
      
      // Filter out the recipe to delete
      const newRecipes = recipes.filter(r => !(r.id === recipeId && r.userId === userId));
      
      // Save the updated recipes
      fs.writeFileSync(filePath, JSON.stringify(newRecipes, null, 2), 'utf8');
      
      return newRecipes.length !== recipes.length;
    }
    return false;
  } catch (error) {
    console.error('Error deleting user recipe:', error);
    return false;
  }
} 