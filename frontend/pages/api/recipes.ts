import type { NextApiRequest, NextApiResponse } from 'next';
import { getSampleRecipes, getUserRecipes } from '../../utils/db';
import { withAuth } from '../../utils/auth';

// Define interface to extend NextApiRequest
interface ExtendedRequest extends NextApiRequest {
  user?: { email: string; [key: string]: any };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the request (added by withAuth middleware)
    const extReq = req as ExtendedRequest;
    const email = extReq.user?.email;
    
    if (!email) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    
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