import { supabase } from '@/integrations/supabase/client';

// Substitui supabase.functions.invoke: os edge functions do projeto cloud
// (deletado) foram portados para o bridge deste app em /api/fn/*.
export async function invokeFn<T = any>(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/fn/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { data: null, error: new Error(data?.error || `Erro ${res.status}`) };
    }
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
}
