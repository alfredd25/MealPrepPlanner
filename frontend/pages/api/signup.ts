import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmail, createUser, signToken } from '../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validate request data
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await createUser(name, email, password);

    // Generate JWT token
    const token = signToken({ email: user.email });

    // Return user data and token
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dietaryGoals: user.dietaryGoals || {},
        dietType: user.dietType || 'none',
        allergies: user.allergies || [],
        preferences: user.preferences || {}
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific errors
    if (error instanceof Error && error.message === 'User already exists') {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
} 