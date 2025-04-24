import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmail, saveUser } from '../../../utils/db';

// Mock default user profile
const defaultProfile = {
  id: "default-user",
  name: "Default User",
  email: "user@example.com",
  dietaryGoals: {
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 70
  },
  dietType: "none",
  allergies: [],
  preferences: {
    cuisinePreferences: ["italian", "mexican", "asian"],
    useFrozenIngredients: true,
    seasonalIngredientsOnly: false
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET requests - return profile
  if (req.method === 'GET') {
    try {
      // Get default user
      const user = getUserByEmail("user@example.com") || defaultProfile;
      
      // Return the user profile without the password
      return res.status(200).json({
        ...user,
        password: undefined
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Handle PUT requests - update profile
  if (req.method === 'PUT') {
    try {
      // Get existing user or use default
      let user = getUserByEmail("user@example.com") || defaultProfile;
      
      // Update user with request body
      user = {
        ...user,
        ...req.body,
        // Preserve ID and email
        id: user.id,
        email: user.email
      };
      
      // Save the updated user
      saveUser(user);
      
      // Return the updated profile without the password
      return res.status(200).json({
        ...user,
        password: undefined
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}