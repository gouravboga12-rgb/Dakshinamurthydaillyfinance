import axios from 'axios';

/**
 * Central Axios instance for Admin Panel API calls.
 * 
 * In development: Vite proxies /api → localhost:8081 automatically.
 * In production (Vercel): VITE_API_BASE_URL must be set to the deployed
 *   backend URL (e.g. https://your-backend.onrender.com).
 * 
 * Set VITE_API_BASE_URL in Vercel → Project → Settings → Environment Variables.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export default api;
