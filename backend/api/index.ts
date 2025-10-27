// Vercel Serverless Function Handler
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/index';

// Handler para Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
