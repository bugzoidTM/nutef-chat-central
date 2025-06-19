

export const EVOLUTION_CONFIG = {
  baseUrl: import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution.nutef.com',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || '5be0fd0304550ebb6027dcce02ae4ab1',
};

console.log('Evolution API Config:', {
  baseUrl: EVOLUTION_CONFIG.baseUrl,
  hasApiKey: !!EVOLUTION_CONFIG.apiKey && EVOLUTION_CONFIG.apiKey !== 'your-api-key-here'
});

