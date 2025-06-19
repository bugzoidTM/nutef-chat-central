
import { EVOLUTION_CONFIG } from '@/config/evolution';

export const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${EVOLUTION_CONFIG.baseUrl}${endpoint}`;
  
  console.log('Evolution API Request:', {
    url,
    method: options.method || 'GET',
    hasApiKey: !!EVOLUTION_CONFIG.apiKey,
    endpoint
  });
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_CONFIG.apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Evolution API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      url
    });
    throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Evolution API Response:', data);
  return data;
};
