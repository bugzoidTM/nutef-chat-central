
import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContextType } from './authTypes';
import { AuthContext } from './authContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Função para buscar perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthProvider - Fetching profile for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthProvider - Error fetching profile:', error);
        // Se for erro de política, não mostrar toast para não confundir o usuário
        if (!error.message?.includes('policy')) {
          toast({
            title: "Erro de Autenticação",
            description: "Erro ao carregar perfil do usuário.",
            variant: "destructive",
          });
        }
        return null;
      }

      if (!profile) {
        console.log('AuthProvider - No profile found, user needs setup');
        return null;
      }

      console.log('AuthProvider - Profile loaded successfully:', {
        role: profile.role,
        setup_completed: profile.setup_completed,
        whatsapp_connected: profile.whatsapp_connected
      });

      setProfile(profile);
      return profile;
    } catch (error) {
      console.error('AuthProvider - Error in fetchProfile:', error);
      return null;
    }
  };

  // Criar perfil inicial se não existir
  const createInitialProfile = async (user: User) => {
    try {
      console.log('AuthProvider - Creating initial profile for user:', user.id);
      
      // Verificar se é o primeiro usuário (deve ser admin)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const isFirstUser = count === 0;
      
      const profileData = {
        user_id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        phone: user.user_metadata?.phone || '',
        role: isFirstUser ? 'admin' : 'attendant',
        is_active: true,
        setup_completed: false,
        whatsapp_connected: false,
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('AuthProvider - Error creating profile:', error);
        throw error;
      }

      console.log('AuthProvider - Profile created successfully:', newProfile);
      setProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('AuthProvider - Error creating initial profile:', error);
      return null;
    }
  };

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider - Initializing auth...');
        
        // Obter sessão atual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider - Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (currentSession?.user && mounted) {
          console.log('AuthProvider - User found in session:', currentSession.user.id);
          setUser(currentSession.user);
          setSession(currentSession);
          
          // Tentar buscar perfil existente
          const existingProfile = await fetchProfile(currentSession.user.id);
          
          // Se não tem perfil, criar um novo
          if (!existingProfile) {
            await createInitialProfile(currentSession.user);
          }
        } else {
          console.log('AuthProvider - No user session found');
        }

        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('AuthProvider - Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('AuthProvider - Auth state changed:', event, newSession?.user?.id);

        if (!mounted) return;

        if (event === 'SIGNED_IN' && newSession?.user) {
          setUser(newSession.user);
          setSession(newSession);
          
          // Tentar buscar perfil existente
          const existingProfile = await fetchProfile(newSession.user.id);
          
          // Se não tem perfil, criar um novo
          if (!existingProfile) {
            await createInitialProfile(newSession.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('AuthProvider - Error signing out:', error);
      toast({
        title: "Erro ao sair",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isInitialized,
    signOut,
    refetchProfile: () => user ? fetchProfile(user.id) : Promise.resolve(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
