
export const EVOLUTION_CONFIG = {
  baseUrl: import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || 'your-api-key-here',
};

console.log('Evolution API Config:', {
  baseUrl: EVOLUTION_CONFIG.baseUrl,
  hasApiKey: !!EVOLUTION_CONFIG.apiKey && EVOLUTION_CONFIG.apiKey !== 'your-api-key-here'
});
