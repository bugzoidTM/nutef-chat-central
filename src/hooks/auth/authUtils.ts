
import { supabase } from '@/integrations/supabase/client';

// Limpar estado de autenticação quando necessário
export const cleanupAuthState = async () => {
  try {
    // Limpar qualquer sessão local corrompida
    await supabase.auth.signOut();
    
    // Reload para garantir estado limpo
    window.location.reload();
  } catch (error) {
    console.error('Error cleaning auth state:', error);
  }
};

// Verificar se o usuário tem um perfil válido
export const checkUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error checking user profile:', error);
    return null;
  }
};

// Criar perfil inicial para novos usuários
export const createInitialProfile = async (user: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        phone: user.user_metadata?.phone || '',
        role: 'attendant',
        is_active: true,
        setup_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating initial profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating initial profile:', error);
    throw error;
  }
};

// Verificar se o primeiro usuário deve ser admin
export const shouldBeFirstAdmin = async () => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking profile count:', error);
      return false;
    }

    // Se não há usuários, o primeiro deve ser admin
    return count === 0;
  } catch (error) {
    console.error('Error checking if should be first admin:', error);
    return false;
  }
};
