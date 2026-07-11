import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from './authUtils';
import { invokeFn } from '@/lib/invokeFn';

export const createAuthActions = () => {
  const signIn = async (email: string, password: string) => {
    try {
      // Limpar estado antes de fazer login
      cleanupAuthState();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('signIn error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('useAuth - Starting signup process for:', email);

      // Limpar estado antes de fazer signup
      cleanupAuthState();

      // Tentar fazer logout global primeiro
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        console.log('useAuth - Global signout failed (continuing anyway):', signOutError);
      }

      // O signup público do GoTrue compartilhado está desabilitado; o cadastro
      // é feito pelo bridge via admin API (usuário já confirmado).
      const { error: signupError } = await invokeFn('signup', { email, password });

      if (signupError && !signupError.message?.includes('already registered')) {
        console.error('useAuth - Signup error:', signupError);
        return { error: signupError };
      }

      // Login para obter a sessão (necessária para criar o perfil com RLS)
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        return { error: signInError };
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('useAuth - User created successfully, creating profile');

        // Buscar o setor "Suporte" para atribuir como padrão
        const { data: supportSector, error: sectorError } = await supabase
          .from('sectors')
          .select('id')
          .eq('name', 'Suporte')
          .eq('is_active', true)
          .single();

        if (sectorError) {
          console.error('useAuth - Error finding support sector:', sectorError);
        }

        // Create profile with better error handling
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            name: userData.name || '',
            email: email,
            phone: userData.phone || '',
            role: userData.role || 'admin',
            sector: 'support', // Setor enum padrão
            sector_id: supportSector?.id || null, // ID do setor dinâmico
            setup_completed: false,
            whatsapp_connected: false,
            is_active: true,
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('useAuth - Profile creation error:', profileError);
          // Não retornar erro aqui pois o usuário foi criado com sucesso
        } else {
          console.log('useAuth - Profile created successfully with default support sector');
        }
      }

      return { error: null };
    } catch (error) {
      console.error('useAuth - Unexpected signup error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      // Forçar recarregamento da página para estado limpo
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('signOut error:', error);
      // Mesmo com erro, forçar limpeza e recarregamento
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  return { signIn, signUp, signOut };
};
