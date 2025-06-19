
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
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        .single();
      
      if (error) {
        console.error('useAuth - Profile fetch error:', error);
        // Se não encontrar o perfil, retorna null em vez de dar erro
        if (error.code === 'PGRST116') {
          console.log('useAuth - Profile not found, returning null');
          return null;
        }
        throw error;
      }
      
      console.log('useAuth - Profile fetched:', data);
      return data;
    },
    enabled: !!user?.id,
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for erro de recursão ou perfil não encontrado
      if (error?.code === '42P17' || error?.code === 'PGRST116') {
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (!error && data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          name: userData.name,
          email: email,
          phone: userData.phone,
          role: userData.role || 'admin',
          sector: userData.sector,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    signIn,
    signUp,
    signOut,
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
