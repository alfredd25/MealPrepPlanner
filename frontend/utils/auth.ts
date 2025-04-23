import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory user database for demo purposes
// In production, you'd use a real database
const users: Record<string, any> = {};

// JWT Secret - in production, use an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Sign a JWT token
export function signToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Verify and decode a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify a password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Get user by email
export function getUserByEmail(email: string): any {
  return users[email] || null;
}

// Create a new user
export async function createUser(name: string, email: string, password: string): Promise<any> {
  if (users[email]) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    dietaryGoals: {},
    dietType: 'none',
    allergies: [],
    preferences: {}
  };

  users[email] = user;
  return { ...user, password: undefined };
}

// Authentication middleware for API routes
export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
      
      // Add the user to the request object
      req.user = decoded;
      
      // Call the original handler
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized: Authentication failed' });
    }
  };
} 