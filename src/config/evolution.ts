
export const EVOLUTION_CONFIG = {
  baseUrl: import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution.nutef.com',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || '5be0fd0304550ebb6027dcce02ae4ab1',
};

console.log('Evolution API Config:', {
  baseUrl: EVOLUTION_CONFIG.baseUrl,
  hasApiKey: !!EVOLUTION_CONFIG.apiKey && EVOLUTION_CONFIG.apiKey !== 'your-api-key-here',
  apiKeyLength: EVOLUTION_CONFIG.apiKey?.length || 0
});

// Validação para alertar sobre configurações incorretas
if (!EVOLUTION_CONFIG.baseUrl || EVOLUTION_CONFIG.baseUrl === 'your-api-url-here') {
  console.warn('VITE_EVOLUTION_API_URL não configurada ou usando valor padrão');
}

if (!EVOLUTION_CONFIG.apiKey || EVOLUTION_CONFIG.apiKey === 'your-api-key-here') {
  console.warn('VITE_EVOLUTION_API_KEY não configurada ou usando valor padrão');
}
