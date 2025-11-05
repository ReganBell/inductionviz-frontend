// API Configuration
// For production, set VITE_API_URL environment variable to your backend URL
// For local development, it uses the vite proxy (empty string means relative to current origin)

// src/config.ts
export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.MODE === 'production' ? 'https://api.reganbell.com' : '');