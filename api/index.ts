import { app, initDatabase } from '../backend/src/index';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize DB once (Supabase, not SQLite)
let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureInit();
  // Hand off to the Express app
  return new Promise<void>((resolve, reject) => {
    (app as any)(req, res, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
