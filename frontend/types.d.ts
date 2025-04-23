import { NextApiRequest } from 'next';

declare module 'next' {
  interface NextApiRequest {
    user?: {
      id: string;
      email: string;
      name: string;
      [key: string]: any;
    };
  }
} 