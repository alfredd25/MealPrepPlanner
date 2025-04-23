import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../utils/auth';
import { getUserByEmail, saveUser } from '../../../utils/db';

// Define interface to extend NextApiRequest
interface ExtendedRequest extends NextApiRequest {
  user?: { email: string; [key: string]: any };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the user from the request (added by withAuth middleware)
  const extReq = req as ExtendedRequest;
  const email = extReq.user?.email;
  
  if (!email) {
    return res.status(401).json({ message: 'Unauthorized: User not found' });
  }
  
  // Get user data
  const user = getUserByEmail(email);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Handle GET request - return user profile
  if (req.method === 'GET') {
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      dietaryGoals: user.dietaryGoals || {},
      dietType: user.dietType || 'none',
      allergies: user.allergies || [],
      preferences: user.preferences || {}
    });
  }
  
  // Handle PUT request - update user profile
  if (req.method === 'PUT') {
    const { name, dietaryGoals, dietType, allergies, preferences } = req.body;
    
    // Update user fields (if provided)
    if (name) user.name = name;
    if (dietaryGoals) user.dietaryGoals = dietaryGoals;
    if (dietType) user.dietType = dietType;
    if (allergies) user.allergies = allergies;
    if (preferences) user.preferences = preferences;
    
    // Save updated user
    saveUser(user);
    
    // Return updated user profile
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      dietaryGoals: user.dietaryGoals || {},
      dietType: user.dietType || 'none',
      allergies: user.allergies || [],
      preferences: user.preferences || {}
    });
  }
  
  // If method is not GET or PUT, return 405 Method Not Allowed
  return res.status(405).json({ message: 'Method not allowed' });
}

// Wrap handler with authentication middleware
export default withAuth(handler); 