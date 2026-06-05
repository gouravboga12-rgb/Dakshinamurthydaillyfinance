import { app, initDatabase } from '../backend/src/index';

// Initialize the database connection (Supabase) before handling requests
let isDbInit = false;

app.use(async (req, res, next) => {
  if (!isDbInit) {
    try {
      await initDatabase();
      isDbInit = true;
    } catch (e) {
      console.error('Failed to initialize database in serverless environment:', e);
    }
  }
  next();
});

export default app;
