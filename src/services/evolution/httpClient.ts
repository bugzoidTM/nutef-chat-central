
import { EVOLUTION_API_CONFIG } from '@/config/evolution';

export const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${EVOLUTION_API_CONFIG.BASE_URL}${endpoint}`;
  
  console.log('🌐 Making Evolution API request:', {
    url,
    method: options.method || 'GET',
    headers: options.headers
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_CONFIG.API_KEY,
      ...options.headers,
    },
  });

  console.log('📡 Evolution API response:', {
    status: response.status,
    statusText: response.statusText,
    url: response.url
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Evolution API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      url: response.url
    });
    
    throw new Error(`Evolution API Error: ${JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      errorText,
      url: response.url
    })}`);
  }

  const data = await response.json();
  console.log('✅ Evolution API success:', data);
  return data;
};
