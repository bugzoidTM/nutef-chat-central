
import { supabase } from '@/integrations/supabase/client';

// Cliente HTTP do bridge whatsai (mesma origem). Autentica com o access token
// da sessão Supabase do usuário logado.
export const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ WhatsApp bridge error:', { status: response.status, errorText, url: endpoint });
    throw new Error(`WhatsApp API Error: ${JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      errorText,
      url: endpoint,
    })}`);
  }

  return response.json();
};
