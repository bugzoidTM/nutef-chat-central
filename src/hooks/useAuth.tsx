
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  cleanupAuthState: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para limpar completamente o estado de autenticação
const cleanupAuthState = () => {
  console.log('useAuth - Cleaning up auth state');
  
  // Limpar localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Limpar sessionStorage se existir
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: profile, error: profileError, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('useAuth - Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
      
      if (error) {
        console.error('useAuth - Profile fetch error:', error);
        throw error;
      }
      
      console.log('useAuth - Profile fetched:', data);
      return data;
    },
    enabled: !!user?.id,
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for erro de recursão
      if (error?.code === '42P17') {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    console.log('useAuth - Profile query state:', { 
      data: profile, 
      error: profileError, 
      isLoading: profileLoading 
    });
  }, [profile, profileError, profileLoading]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth - Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth - Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Refetch profile when user changes
        if (session?.user) {
          setTimeout(() => {
            refetchProfile();
          }, 100);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [refetchProfile]);

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

  const value = {
    user,
    session,
    profile,
    signIn,
    signUp,
    signOut,
    cleanupAuthState,
    loading: loading || profileLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
