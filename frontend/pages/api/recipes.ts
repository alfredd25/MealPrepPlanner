import type { NextApiRequest, NextApiResponse } from 'next';
import { getSampleRecipes, getUserRecipes } from '../../utils/db';
import { withAuth } from '../../utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the request (added by withAuth middleware)
    const { email } = req.user;
    
    // Get sample recipes
    const sampleRecipes = getSampleRecipes();
    
    // Get user-specific recipes
    const userRecipes = getUserRecipes(email);
    
    // Combine and return all recipes
    return res.status(200).json([...sampleRecipes, ...userRecipes]);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Wrap handler with authentication middleware
export default withAuth(handler); 