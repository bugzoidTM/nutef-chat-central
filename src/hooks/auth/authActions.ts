
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from './authUtils';

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
        console.log('useAuth - Global signout completed');
      } catch (signOutError) {
        console.log('useAuth - Global signout failed (continuing anyway):', signOutError);
      }
      
      // Aguardar um pouco para garantir que o logout foi processado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error('useAuth - Signup error:', error);
        
        // Se o usuário já existe, tentar fazer login
        if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
          console.log('useAuth - User already exists, attempting sign in');
          return await signIn(email, password);
        }
        
        return { error };
      }

      if (data.user) {
        console.log('useAuth - User created successfully, creating profile');
        
        // Aguardar um pouco antes de criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create profile with better error handling
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            name: userData.name || '',
            email: email,
            phone: userData.phone || '',
            role: userData.role || 'admin',
            sector: userData.sector || null,
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
          console.log('useAuth - Profile created successfully');
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
